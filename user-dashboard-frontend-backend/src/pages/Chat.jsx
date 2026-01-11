import { useState, useRef, useEffect } from "react";
import { Shield, FileText, Activity, AlertTriangle, BookOpen, ChevronDown, ChevronUp, X, Send } from "lucide-react";
import ChatMessage from "../components/ChatMessage";
import QuickActionButton from "../components/QuickActionButton";
import MessageInput from "../components/MessageInput";
import { submitComplaint, fetchComplaintStatus } from "../api/complaint";

/**
 * FINAL MERGED App.jsx (priority: App.jsx)
 * - Includes ALL functionality from both original App.jsx and Chat.jsx
 * - File-report flow, evidence uploads, risk analysis, OLLAMA chat, quick actions
 * - Uses import paths exactly as App.jsx did (./components/...)
 */

/* ---------------- CONFIG ---------------- */
const OLLAMA_API_URL = "/api/chat";

const OLLAMA_MODEL_NAME = "phi3";

const PRAISE_MESSAGES = ["Great, thank you!", "Excellent.", "Got it.", "Perfect, thanks.", "Nice."];

/* Restore the full system prompt from original App.jsx (priority #1) */
const RISK_ANALYSIS_SYSTEM_PROMPT = `
You are a cybersecurity forensics and risk analysis engine.

Input will be a JSON report from file scanners, malware scanners, forensic tools or security modules.

Your job:
- Detect if there is any cyber threat or risky indicator.
- Identify the attack type (examples: malware, steganography, image tampering, unauthorized access, phishing, data exfiltration, benign/no threat).
- Generate a RISK SCORE between 0 and 100.
- Derive a RISK CATEGORY from the score:
  - 0–19    → "Informational"
  - 20–39   → "Low"
  - 40–59   → "Medium"
  - 60–79   → "High"
  - 80–100  → "Critical"
- Set PRIORITY: "LOW", "MEDIUM", "HIGH", or "CRITICAL".
- Decide if the user should be alerted (true / false).
- Provide a short bullet-point summary of findings.

Respond **ONLY in valid JSON** using exactly this schema:

{
  "risk_score": number,
  "risk_category": "Informational" | "Low" | "Medium" | "High" | "Critical",
  "attack_type": string,
  "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "should_alert_user": boolean,
  "summary": [string, ...]
}

Never add text outside JSON.
`.trim();
const PLAYBOOK_SYSTEM_PROMPT = `
You are a CERT (Computer Emergency Response Team) incident response expert.

Input: A JSON object with risk_score, risk_category, priority, attack_type, and summary.

Generate a CONCISE CERT incident response playbook. Keep it SHORT and SIMPLE.

Format EXACTLY like this (no extra text):

🚨 CERT Incident Response Playbook — {attack_type}
Priority: {priority} | Risk: {risk_category} ({risk_score}/100)

📋 INCIDENT OVERVIEW
• [Max 15 words - brief attack description]
• [Max 15 words - primary impact areas]
• [Max 15 words - affected systems/users]

🔍 DETECTION & VALIDATION
• [Max 15 words - indicators of compromise]
• [Max 15 words - log sources to check]
• [Max 15 words - validation steps]

🛡️ IMMEDIATE CONTAINMENT
• [Max 15 words - isolation actions]
• [Max 15 words - access restrictions]
• [Max 15 words - communication protocols]

🔬 INVESTIGATION
• [Max 15 words - evidence collection]
• [Max 15 words - forensic artifacts]
• [Max 15 words - key questions]

🧹 ERADICATION
• [Max 15 words - threat removal steps]
• [Max 15 words - vulnerability patching]
• [Max 15 words - security control updates]

♻️ RECOVERY
• [Max 15 words - system restoration]
• [Max 15 words - validation checks]
• [Max 15 words - monitoring requirements]

📢 REPORTING & COMPLIANCE
• [Max 15 words - internal notifications]
• [Max 15 words - external reporting]
• [Max 15 words - documentation needs]

🎯 PREVENTION
• [Max 15 words - security improvements]
• [Max 15 words - policy updates]
• [Max 15 words - training requirements]

IMPORTANT RULES:
- Each bullet MUST be max 15 words
- NO extra paragraphs or explanations
- EXACTLY 3 bullets per section
- Use technical but concise language
- Be direct and brief
- No padding or filler text
`.trim();
const USER_PLAYBOOK_SYSTEM_PROMPT = `
You are a friendly cybersecurity guide helping non-technical users.

Input: A JSON object with risk_score, risk_category, priority, attack_type, and summary.

Generate EXACTLY 10 simple action steps that anyone can understand and follow. Keep it SHORT and SIMPLE.

Format EXACTLY like this (no extra text):

👤 User's Action Guide — {attack_type}
Risk Level: {risk_category} | Priority: {priority}

🤔 What Happened?
[ONE simple sentence only - max 15 words]

✅ YOUR 10-STEP ACTION PLAN:

1. 🚨 [Max 10 words - immediate action]
2. 🔌 [Max 10 words - disconnect/stop]
3. 📸 [Max 10 words - save evidence]
4. 👥 [Max 10 words - tell someone]
5. 🔒 [Max 10 words - secure accounts]
6. 📝 [Max 10 words - gather info]
7. ⏳ [Max 10 words - monitor activity]
8. 🛡️ [Max 10 words - protection measure]
9. 📞 [Max 10 words - get help]
10. 💡 [Max 10 words - prevention tip]

⚠️ DON'T:
• [Max 10 words - one thing NOT to do]
• [Max 10 words - second thing NOT to do]
• [Max 10 words - third thing NOT to do]

IMPORTANT RULES:
- Each step must be SHORT (max 10-15 words)
- NO paragraphs or long explanations
- NO extra details or stories
- Use simple words only
- One action per step
- No jargon or technical terms
- Be brief and direct
`.trim();


/* ---------------- UTIL: simplify big scanner reports ---------------- */
function simplifyScannerReport(report) {
  if (!report || typeof report !== "object") return report;
  const cleaned = { ...report };

  if (cleaned.perceptual_embeddings) {
    cleaned.perceptual_embeddings = {
      vector_model: cleaned.perceptual_embeddings.vector_model || null,
    };
  }

  if (cleaned.feature_vector_summary) {
    cleaned.feature_vector_summary = {
      numeric_vector: cleaned.feature_vector_summary.numeric_vector?.slice(0, 8) || [],
      vector_description: cleaned.feature_vector_summary.vector_description || [],
    };
  }

  if (cleaned.ocr_and_text?.full_text) {
    cleaned.ocr_and_text = {
      full_text: cleaned.ocr_and_text.full_text.slice(0, 5000),
    };
  }

  if (cleaned.faces?.faces) {
    cleaned.faces = {
      face_count: cleaned.faces.face_count || cleaned.faces.faces.length,
      faces: cleaned.faces.faces.map((f) => ({ bbox: f.bbox })),
    };
  }

  return cleaned;
}

/* ---------------- FILE REPORT FIELD DEFINITIONS ---------------- */
const FILE_REPORT_FIELDS = [
  { key: "name", question: "What is your full name?", min: 3, max: 50 },
  { key: "designation", question: "Select your designation:", min: 5, max: 40 },
  { key: "department", question: "Enter your Department / Unit:", min: 2, max: 50 },
  { key: "location", question: "Enter your Location / Station:", min: 2, max: 50 },
  { key: "complaintType", question: "What is the complaint type?", min: 3, max: 50 },
  { key: "incidentDate", question: "Select the incident date:", min: 8, max: 10 },
  { key: "incidentTime", question: "Select the incident time:", min: 4, max: 5 },
  { key: "description", question: "Describe the incident in detail:", min: 20, max: 500 },
  {
    key: "suspectedSource",
    question: 'Who or what is the suspected source? (you can write "unknown")',
    min: 3,
    max: 100,
  },
];

/* ---------------- UTIL: Download text file ---------------- */
function downloadTextFile(content, filename) {
  const element = document.createElement("a");
  const file = new Blob([content], { type: "text/plain" });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/* =================== APP COMPONENT =================== */
function App() {
  /* ---------------- STATE ---------------- */
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Hello! I'm Cyber AI Assistant, your 24/7 cybersecurity support system.",
      sender: "ai",
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isFileReportActive, setIsFileReportActive] = useState(false);
  const [fileReportStep, setFileReportStep] = useState(0);
  const [isEvidenceStep, setIsEvidenceStep] = useState(false);
  const [isRiskAnalysisMode, setIsRiskAnalysisMode] = useState(false);
  const [isCheckStatusMode, setIsCheckStatusMode] = useState(false);
  // 👉 NEW: Playbook mode flag
  const [isPlaybookMode, setIsPlaybookMode] = useState(false);
  // 👉 NEW: Track latest user playbook for download
  const [latestUserPlaybook, setLatestUserPlaybook] = useState(null);
  const [latestAttackType, setLatestAttackType] = useState("");

  const [fileReportData, setFileReportData] = useState({
    name: "",
    designation: "",
    department: "",
    location: "",
    complaintType: "",
    incidentDate: "",
    incidentTime: "",
    description: "",
    suspectedSource: "",
    evidences: [],
  });

  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  const chatContainerRef = useRef(null);
  const lastTrackingIdRef = useRef("");
  

  /* ---------------- SCROLL ---------------- */
  const scrollToBottom = () => {
    if (!chatContainerRef.current) return;
    chatContainerRef.current.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /* ---------------- PUSH AI MESSAGE ---------------- */
  const pushAiMessage = (text) => {
    const msg = {
      id: `${Date.now()}-${Math.random()}`,
      text,
      sender: "ai",
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, msg]);
  };

  /* ---------------- PROCESS FILE REPORT ANSWER ---------------- */
  const processFileReportAnswer = async (userText) => {
    if (isEvidenceStep) {
      if (userText.toLowerCase() !== "done") {
        pushAiMessage("Please upload any evidence using the attachment button. When finished, type 'done'.");
        return;
      }

      // Finalize payload and submit to backend
      const finalPayload = {
        ...fileReportData,
        designation: fileReportData.designation || "",
        submittedAt: new Date().toISOString(),
      };

      pushAiMessage("⏳ Submitting your complaint. Please wait...");

      const response = await submitComplaint(finalPayload);

      if (response.success) {
        pushAiMessage(`✅ ${response.message}`);

        // Reset to normal chat mode
        setIsFileReportActive(false);
        setIsEvidenceStep(false);
        setFileReportStep(0);
        setFileReportData({
          name: "",
          designation: "",
          department: "",
          location: "",
          complaintType: "",
          incidentDate: "",
          incidentTime: "",
          description: "",
          suspectedSource: "",
          evidences: [],
        });

        setTimeout(() => {
          pushAiMessage(`Your complaint has been filed. Tracking ID: ${response.data.trackingId
}`);
        }, 500);
      } else {
        pushAiMessage(`❌ ${response.message}`);
      }

      return;
    }

    const field = FILE_REPORT_FIELDS[fileReportStep];
    if (!field) {
      // no more fields -> evidence step
      setIsEvidenceStep(true);
      pushAiMessage("Now please upload any evidence files (images/documents). When finished, type 'done'.");
      return;
    }

    const len = userText.length;
    if (field.min && len < field.min) {
      pushAiMessage(`Too short. Min ${field.min} characters.`);
      return;
    }
    if (field.max && len > field.max) {
      pushAiMessage(`Too long. Max ${field.max} characters.`);
      return;
    }

    if (field.key === "incidentDate" && !/^\d{4}-\d{2}-\d{2}$/.test(userText)) {
      pushAiMessage("Use date format YYYY-MM-DD.");
      return;
    }

    if (field.key === "incidentTime" && !/^\d{2}:\d{2}$/.test(userText)) {
      pushAiMessage("Use time format HH:MM.");
      return;
    }

    setFileReportData((prev) => ({ ...prev, [field.key]: userText }));

    if (field.key === "name") pushAiMessage(`Nice to meet you, ${userText}.`);
    else pushAiMessage(PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)]);

    const nextIndex = fileReportStep + 1;
    if (nextIndex < FILE_REPORT_FIELDS.length) {
      setFileReportStep(nextIndex);
      pushAiMessage(FILE_REPORT_FIELDS[nextIndex].question);
    } else {
      setIsEvidenceStep(true);
      pushAiMessage("Upload evidence now. Type 'done' when finished.");
    }
  };

  /* ---------------- FIELD SELECTION (designation/date/time quick pick) ---------------- */
  const handleFieldSelection = async (selectedValue) => {
    if (!selectedValue) return;
    // Add user message showing the selection
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        text: selectedValue,
        sender: "user",
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    await processFileReportAnswer(selectedValue);
  };

  /* ---------------- HANDLE FILES UPLOAD FROM INPUT ----------------
     - Store files temporarily in pendingFiles state
     - Only add to messages when user sends message
  */
  const handleSendFiles = (files) => {
    if (!files || files.length === 0) return;

    const attachments = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random()}-${file.name}`,
      type: file.type.startsWith("image/") ? "image" : "file",
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      mimeType: file.type,
    }));

    // Store in pending files (not yet sent)
    setPendingFiles((prev) => [...prev, ...attachments]);
  };

  /* Remove a pending file */
  const removePendingFile = (fileId) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  /* ---------------- SEND MESSAGE (text) ---------------- */
  const handleSendMessage = async () => {
    if (!inputValue.trim() && pendingFiles.length === 0) return;

    const userText = inputValue.trim();
    setInputValue("");

    const userMessage = {
      id: Date.now().toString(),
      text: userText || (pendingFiles.length === 1 ? `📎 ${pendingFiles[0].name}` : `📎 ${pendingFiles.length} files uploaded`),
      sender: "user",
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      attachments: pendingFiles.length > 0 ? [...pendingFiles] : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setPendingFiles([]);

    // --------------------------------------------------
    // 📘 PLAYBOOK MODE (BOTH CERT & USER)
    // --------------------------------------------------
    if (isPlaybookMode) {
      let parsed;

      // Validate JSON
      try {
        parsed = JSON.parse(userText);
      } catch {
        pushAiMessage("❌ Invalid JSON. Please paste valid JSON.");
        return;
      }

      // Required fields from Risk Analysis
      const required = ["risk_score", "risk_category", "priority", "attack_type", "summary"];
      const missing = required.filter(f => parsed[f] === undefined);

      if (missing.length > 0) {
        pushAiMessage(
          "⚠ Missing fields: " + missing.join(", ") +
          ".\nRun Risk Analysis first, then paste its JSON here."
        );
        return;
      }

      pushAiMessage("📘 Generating CERT's Playbook (technical version)...");

      try {
        // Generate CERT's Playbook (Technical)
        const certRes = await fetch(OLLAMA_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: OLLAMA_MODEL_NAME,
            messages: [
              { role: "system", content: PLAYBOOK_SYSTEM_PROMPT },
              { role: "user", content: JSON.stringify(parsed, null, 2) }
            ],
            stream: false
          })
        });

        const certData = await certRes.json();
        const certPlaybook =
          certData?.message?.content ||
          certData?.response ||
          "❌ Failed to generate CERT playbook.";

        pushAiMessage(certPlaybook);

        // Now generate User's Playbook (Simplified)
        pushAiMessage("👤 Generating User's Playbook (simplified version)...");

        const userRes = await fetch(OLLAMA_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: OLLAMA_MODEL_NAME,
            messages: [
              { role: "system", content: USER_PLAYBOOK_SYSTEM_PROMPT },
              { role: "user", content: JSON.stringify(parsed, null, 2) }
            ],
            stream: false
          })
        });

        const userData = await userRes.json();
        const userPlaybook =
          userData?.message?.content ||
          userData?.response ||
          "❌ Failed to generate User playbook.";

        // 👉 SAVE user playbook for download
        setLatestUserPlaybook(userPlaybook);
        setLatestAttackType(parsed.attack_type || "incident");

        pushAiMessage(userPlaybook);
        
        // Add download button message
        const downloadMsg = {
          id: `${Date.now()}-download`,
          text: "📥 Download User Playbook",
          sender: "ai",
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          isDownloadButton: true
        };
        setMessages((prev) => [...prev, downloadMsg]);
        
        // Reset to normal chat mode
        setIsPlaybookMode(false);
        setTimeout(() => {
          pushAiMessage("✅ Both playbooks generated! You can now ask me anything or start another quick action.");
        }, 500);
        
      } catch (err) {
        console.error("Playbook Error:", err);
        pushAiMessage("❌ Error while generating playbooks.");
        setIsPlaybookMode(false);
      }

      return;
    }

    // FILE REPORT MODE
    if (isFileReportActive) {
      if (userText) {
        await processFileReportAnswer(userText);
      }
      
      // Update fileReportData if files exist
      if (userMessage.attachments) {
        setFileReportData((prev) => ({
          ...prev,
          evidences: [
            ...prev.evidences,
            ...userMessage.attachments.map((a) => ({
              id: a.id,
              name: a.name,
              size: a.size,
              mimeType: a.mimeType,
              url: a.url,
            })),
          ],
        }));
        
        if (isEvidenceStep) {
          pushAiMessage("✅ Evidence received! Upload more files or type 'done' to submit.");
        }
      }
      return;
    }

    // CHECK STATUS MODE
    if (isCheckStatusMode) {
      const trackingId = userText.trim();
      if (!trackingId) {
        pushAiMessage("Please enter a valid tracking ID so I can proceed.");
        return;
      }

      lastTrackingIdRef.current = trackingId;
      pushAiMessage(`⏳ Checking status for Tracking ID ${trackingId}...`);
      setIsCheckStatusMode(false);

      const statusResponse = await fetchComplaintStatus(trackingId);
      if (statusResponse.success) {
        pushAiMessage(`📊 Current status for ${trackingId}: ${statusResponse.status}`);
      } else {
        pushAiMessage(`❌ ${statusResponse.message}`);
      }
      return;
    }

    // RISK ANALYSIS MODE
    if (isRiskAnalysisMode) {
      let parsed;
      try {
        parsed = JSON.parse(userText);
      } catch {
        pushAiMessage("❌ Invalid JSON. Please paste valid JSON only.");
        return;
      }

      const simplified = simplifyScannerReport(parsed);
      let jsonString = JSON.stringify(simplified, null, 2);

      const MAX_JSON_CHARS = 9000;
      if (jsonString.length > MAX_JSON_CHARS) {
        jsonString = jsonString.slice(0, MAX_JSON_CHARS) + "\n\n[⚠ Data truncated for safe processing]";
      }

      pushAiMessage("⏳ Analyzing report... please wait.");

      try {
        const res = await fetch(OLLAMA_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: OLLAMA_MODEL_NAME,
            messages: [
              { role: "system", content: RISK_ANALYSIS_SYSTEM_PROMPT },
              { role: "user", content: `Analyze this security report and respond ONLY with valid JSON:\n\n${jsonString}` },
            ],
            stream: false,
          }),
        });

        if (!res.ok) {
          pushAiMessage(`❌ Server error: ${res.status}`);
          setIsRiskAnalysisMode(false);
          return;
        }

        const data = await res.json();
        let aiText = data?.message?.content || "";

        if (!aiText.trim()) {
          pushAiMessage("❌ AI returned empty response.");
          setIsRiskAnalysisMode(false);
          return;
        }

        // attempt to extract JSON from assistant response
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          pushAiMessage("❌ AI response does not contain valid JSON.\n\nRaw response:\n" + aiText.substring(0, 500));
          setIsRiskAnalysisMode(false);
          return;
        }

        const jsonResponse = jsonMatch[0];
        try {
          const validated = JSON.parse(jsonResponse);
          const required = ["risk_score", "risk_category", "attack_type", "priority", "should_alert_user", "summary"];
          const missing = required.filter((f) => !(f in validated));
          if (missing.length > 0) {
            pushAiMessage(`⚠️ Missing fields in response: ${missing.join(", ")}`);
            setIsRiskAnalysisMode(false);
            return;
          }

          // Build complete report with all fields in JSON format
          // Push complete report as single message in JSON format
          // Pretty-print JSON even if AI returns one-line text
          let formattedJSON = "";
          try {
            formattedJSON = JSON.stringify(JSON.parse(jsonResponse), null, 2);
          } catch {
            formattedJSON = JSON.stringify(validated, null, 2);
          }

          // Push entire JSON as ONE single message
          pushAiMessage(formattedJSON);
          
          // Reset to normal chat mode
          setIsRiskAnalysisMode(false);
          setTimeout(() => {
            pushAiMessage("✅ Risk analysis complete! You can now ask me anything or start another quick action.");
          }, 500);
          
        } catch (parseErr) {
          pushAiMessage("❌ Invalid JSON in response: " + parseErr.message);
          setIsRiskAnalysisMode(false);
        }
      } catch (err) {
        console.error("Risk Analysis Error:", err);
        pushAiMessage(`❌ Connection failed:\n${err.message}`);
        setIsRiskAnalysisMode(false);
      }
      return;
    }

    // NORMAL CHAT MODE
    try {
      const lastMsgs = [...messages, userMessage]
        .slice(-8)
        .map((m) => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text }));

      const res = await fetch(OLLAMA_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: OLLAMA_MODEL_NAME, messages: lastMsgs, stream: false }),
      });

      const data = await res.json();
      const aiText = data?.message?.content || "Sorry, I couldn't generate a response.";
      pushAiMessage(aiText);
    } catch (err) {
      console.error("Chat error:", err);
      pushAiMessage("❌ Failed to reach AI server.");
    }
  };

  /* ---------------- QUICK ACTIONS ---------------- */
  const handleQuickAction = (action) => {
    if (action === "File Report") {
      // Reset all modes first
      setIsFileReportActive(true);
      setIsEvidenceStep(false);
      setFileReportStep(0);
      setIsRiskAnalysisMode(false);
      setIsPlaybookMode(false);
      setIsCheckStatusMode(false);
      lastTrackingIdRef.current = "";

      setFileReportData({
        name: "",
        designation: "",
        department: "",
        location: "",
        complaintType: "",
        incidentDate: "",
        incidentTime: "",
        description: "",
        suspectedSource: "",
        evidences: [],
      });

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: "📄 File Report initiated",
          sender: "user",
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      // ask first question after a short delay
      setTimeout(() => {
        pushAiMessage(FILE_REPORT_FIELDS[0].question);
      }, 200);
      return;
    }

    if (action === "Check Status") {
      setIsCheckStatusMode(true);
      setIsFileReportActive(false);
      setIsEvidenceStep(false);
      setFileReportStep(0);
      setIsRiskAnalysisMode(false);
      setIsPlaybookMode(false);
      lastTrackingIdRef.current = "";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: "📊 Check Status initiated",
          sender: "user",
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      setTimeout(() => {
        pushAiMessage("Please share your complaint tracking ID so I can look it up.");
      }, 200);

      return;
    }

    if (action === "Risk Analysis") {
      // Reset all modes first
      setIsRiskAnalysisMode(true);
      setIsFileReportActive(false);
      setIsEvidenceStep(false);
      setFileReportStep(0);
      setIsPlaybookMode(false);
      setIsCheckStatusMode(false);
      lastTrackingIdRef.current = "";
   setMessages(prev => [
  ...prev,
  {
    id: Date.now().toString(),
    text: "🛡 Risk Analysis activated. Paste the JSON incident report and press Send.",
    sender: "user",
    timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  },
]);

return;

    }
    
    if (action === "Playbooks") {
      // Reset all modes first
      setIsPlaybookMode(true);
      setIsRiskAnalysisMode(false);
      setIsFileReportActive(false);
      setIsEvidenceStep(false);
      setFileReportStep(0);
      setIsCheckStatusMode(false);
      lastTrackingIdRef.current = "";
setMessages(prev => [
  ...prev,
  {
    id: Date.now().toString(),
    text: "📘 Playbook mode activated. Please paste the JSON that already contains risk_score, risk_category, priority, attack_type, and summary. Then press Send.",
    sender: "user",
    timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  },
]);
return;

    }

    // fallback
    pushAiMessage(`${action} feature not implemented yet.`);
  };

  /* ---------------- DOWNLOAD PLAYBOOK ---------------- */
  const handleDownloadPlaybook = () => {
    if (!latestUserPlaybook) return;
    const filename = `user-playbook-${latestAttackType}-${new Date().getTime()}.txt`;
    downloadTextFile(latestUserPlaybook, filename);
  };

  /* ---------------- WHICH FIELD KEY IS CURRENT ---------------- */
  const currentFieldKey = isFileReportActive && !isEvidenceStep ? FILE_REPORT_FIELDS[fileReportStep]?.key : undefined;

  /* ---------------- RENDER JSX ---------------- */
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* HEADER */}
      <header className="border-b border-gray-100 py-3 sm:py-4 md:py-6 px-3 sm:px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 mb-0.5 sm:mb-1">AI Chatbot</h1>
          <p className="text-gray-500 text-xs sm:text-sm">Ask me anything</p>
        </div>
      </header>

      {/* MAIN CHAT AREA - FLEX GROW */}
      <main className="flex-1 flex flex-col w-full mx-auto overflow-hidden">
        <div
          ref={chatContainerRef}
          className="flex-1 px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 space-y-3 sm:space-y-4 md:space-y-6 overflow-y-scroll"
          style={{ maxHeight: "calc(100vh - 250px)" }}
        >
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} w-full`}>
              {message.isDownloadButton ? (
                <button
                  onClick={handleDownloadPlaybook}
                  className="flex gap-1.5 sm:gap-2 items-center bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors"
                >
                  <FileText className="w-3 sm:w-4 h-3 sm:h-4" />
                  <span className="hidden sm:inline">{message.text}</span>
                  <span className="sm:hidden">Download</span>
                </button>
              ) : message.sender === "ai" ? (
                <div className="flex gap-2 sm:gap-3 max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-3xl">
                  <div className="flex-shrink-0 w-6 sm:w-8 h-6 sm:h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Shield className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-gray-700 text-xs sm:text-sm leading-relaxed relative whitespace-pre-wrap break-words">
                    {message.text}
                    <div className="text-[8px] sm:text-[10px] text-gray-500 mt-1 text-right">
                      {message.timestamp}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-1.5 sm:gap-2 max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-3xl items-end">
                  <div className="bg-blue-500 text-white rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium leading-relaxed break-words relative whitespace-pre-wrap">
                    {message.text}
                    <div className="text-[8px] sm:text-[10px] text-blue-200 mt-1 text-right">
                      {message.timestamp}
                    </div>
                  </div>
                  <div className="w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs sm:text-sm font-semibold">👤</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* QUICK ACTIONS SECTION - FIXED */}
      <div className="border-t border-gray-100 bg-white">
        <div
          className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors"
          onClick={() => setQuickActionsOpen(!quickActionsOpen)}
        >
          <h3 className="text-gray-600 text-[10px] sm:text-xs md:text-xs font-bold uppercase tracking-wide">Quick Actions</h3>
          {quickActionsOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>

        {quickActionsOpen && (
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6 pt-2 border-b border-gray-100">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
              <button
                onClick={() => handleQuickAction("File Report")}
                className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg transition-colors group hover:bg-gray-100"
              >
                <FileText className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600 group-hover:text-blue-700" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 text-center line-clamp-2">File Report</span>
              </button>
              <button
                onClick={() => handleQuickAction("Check Status")}
                className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg transition-colors group hover:bg-gray-100"
              >
                <Activity className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600 group-hover:text-blue-700" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 text-center line-clamp-2">Check Status</span>
              </button>
              <button
                onClick={() => handleQuickAction("Risk Analysis")}
                className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg transition-colors group hover:bg-gray-100"
              >
                <AlertTriangle className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600 group-hover:text-blue-700" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 text-center line-clamp-2">Risk Analysis</span>
              </button>
              <button
                onClick={() => handleQuickAction("Playbooks")}
                className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg transition-colors group hover:bg-gray-100"
              >
                <BookOpen className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600 group-hover:text-blue-700" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 text-center line-clamp-2">Playbooks</span>
              </button>
            </div>
          </div>
        )}

        {/* FILE ATTACHMENTS DISPLAY - PENDING FILES */}
        {pendingFiles.length > 0 && (
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3 border-b border-gray-100">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {pendingFiles.map(file => (
                <div key={file.id} className="flex items-center gap-1.5 bg-blue-500 text-white rounded-full px-2 sm:px-3 py-1 sm:py-1.5">
                  <FileText className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs font-medium truncate max-w-[120px] sm:max-w-none">{file.name}</span>
                  <button
                    onClick={() => removePendingFile(file.id)}
                    className="text-blue-100 hover:text-white ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FILE ATTACHMENTS DISPLAY - SENT FILES (gray pills) */}
        {messages.some(m => m.attachments?.length > 0) && (
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3 border-b border-gray-100">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {messages.flatMap(m => m.attachments || []).map(attachment => (
                <div key={attachment.id} className="flex items-center gap-1.5 bg-gray-100 rounded-full px-2 sm:px-3 py-1 sm:py-1.5">
                  <FileText className="w-3 sm:w-4 h-3 sm:h-4 text-gray-600 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs text-gray-700 font-medium truncate max-w-[120px] sm:max-w-none">{attachment.name}</span>
                  <button className="text-gray-400 hover:text-gray-600 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* DESIGNATION DROPDOWN */}
{isFileReportActive && currentFieldKey === "designation" && (
  <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 mb-2 sm:mb-3">
    <select
      onChange={(e) => handleFieldSelection(e.target.value)}
      className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 bg-white text-gray-700 text-sm focus:outline-none focus:border-blue-500"
    >
      <option value="">-- Select Designation --</option>
      <option value="Officer">Officer</option>
      <option value="Sergeant">Sergeant</option>
      <option value="Lieutenant">Lieutenant</option>
      <option value="Captain">Captain</option>
      <option value="Retired Officer">Retired Officer</option>
      <option value="Dependent">Dependent</option>
    </select>
  </div>
)}

{/* DATE PICKER */}
{isFileReportActive && currentFieldKey === "incidentDate" && (
  <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 mb-2 sm:mb-3">
    <input
      type="date"
      onChange={(e) => handleFieldSelection(e.target.value)}
      className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 bg-white text-gray-700 text-sm focus:outline-none focus:border-blue-500"
    />
  </div>
)}

{/* TIME PICKER */}
{isFileReportActive && currentFieldKey === "incidentTime" && (
  <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 mb-2 sm:mb-3">
    <input
      type="time"
      onChange={(e) => handleFieldSelection(e.target.value)}
      className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 bg-white text-gray-700 text-sm focus:outline-none focus:border-blue-500"
    />
  </div>
)}


      {/* INPUT AREA - FIXED AT BOTTOM */}
      <div className="border-t border-gray-100 bg-white px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-3">
          <label className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
            <FileText className="w-4 sm:w-5 h-4 sm:h-5" />
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleSendFiles(e.target.files)}
            />
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-3 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:border-blue-300 focus:bg-white transition-colors"
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1.5 sm:p-2.5 transition-colors flex-shrink-0"
          >
            <Send className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;


