import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Shield } from "lucide-react";
import heroVideo from "@/assets/cyber-illustration_sqr.mp4";

interface AuthLayoutProps {
  children: ReactNode;
  activeTab?: "login" | "register";
}

interface PreviewContextValue {
  setPreviewContent: (node: ReactNode | null) => void;
  setPreviewActive: (active: boolean) => void;
}

const PreviewContext = createContext<PreviewContextValue | undefined>(undefined);

export const useAuthPreview = () => {
  const context = useContext(PreviewContext);
  if (!context) {
    throw new Error("useAuthPreview must be used within AuthLayout");
  }
  return context;
};

const AuthLayout = ({ children, activeTab = "login" }: AuthLayoutProps) => {
  const [previewContent, setPreviewContent] = useState<ReactNode | null>(null);
  const [isPreviewActive, setPreviewActive] = useState(false);

  useEffect(() => {
    if (activeTab !== "register") {
      setPreviewActive(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "register" && !isPreviewActive && previewContent) {
      const timeout = setTimeout(() => setPreviewContent(null), 500);
      return () => clearTimeout(timeout);
    }
  }, [activeTab, isPreviewActive, previewContent]);

  const contextValue = useMemo(
    () => ({ setPreviewContent, setPreviewActive }),
    []
  );

  return (
    <PreviewContext.Provider value={contextValue}>
      <div className="min-h-screen w-full bg-gradient-to-br from-[#14e0ff] via-[#0f6bff] to-[#001b44] flex items-center justify-center p-4">
        <div className="w-full max-w-[1400px] bg-gradient-to-br from-white to-[hsl(210,40%,98%)] rounded-xl shadow-[0_20px_50px_-12px_rgb(0,0,0,0.25)] overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0 min-h-[600px]">
            {/* Left Column - Illustration & Preview */}
            <div className="bg-white p-8 lg:p-12 flex flex-col border-r border-[hsl(220,13%,91%)]">
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <Shield className="w-10 h-10 text-[#0f6bff]" />
                  <div>
                    <h1 className="text-2xl font-bold text-[hsl(213,100%,18%)]">Defence Cyber Portal</h1>
                    <p className="text-sm text-[hsl(0,0%,31%)]">Secure Access System</p>
                  </div>
                </div>

                <div className="relative flex items-center justify-center py-4 min-h-[340px] overflow-hidden">
                  <div
                    className={`w-full max-w-[475px] transition-all duration-500 ease-out ${
                      activeTab === "register" && isPreviewActive
                        ? "translate-y-full opacity-0"
                        : "translate-y-0 opacity-100"
                    }`}
                  >
                    <video
                      className="w-full h-auto rounded-xl object-cover"
                      src={heroVideo}
                      autoPlay
                      loop
                      muted
                      playsInline
                      aria-label="Cybersecurity operations overview"
                    />
                  </div>
                  <div
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${
                      activeTab === "register" && isPreviewActive && previewContent
                        ? "translate-y-0 opacity-100"
                        : "-translate-y-full opacity-0"
                    }`}
                    aria-live="polite"
                  >
                    <div className="w-full max-w-[520px]">
                      {previewContent}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Auth Forms */}
            <div className="p-8 lg:p-12 bg-gradient-to-br from-white to-[hsl(210,40%,98%)]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </PreviewContext.Provider>
  );
};

export default AuthLayout;
