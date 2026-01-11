import { useState } from 'react';
import { User, FileText, Upload, ChevronRight, ChevronLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { validateFormInput, sanitizeHtml, validateDateFormat } from '../utils/validation';
import { validateFiles, sanitizeFileName } from '../utils/fileUploadSecurity';
import { logComplaintSubmission, logValidationFailure } from '../utils/auditLog';
import { FILE_UPLOAD_CONFIG, VALIDATION_RULES } from '../utils/securityConfig';

export function NewComplaint() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    rank: '',
    department: '',
    location: '',
    complaintType: '',
    incidentDate: '',
    incidentTime: '',
    description: '',
    suspectedSource: '',
    evidenceFiles: [],
    confidentiality: 'internal',
    notifyCommandingOfficer: false,
    familyMemberComplaint: false
  });

  const complaintTypes = [
    { id: 'unknown', label: 'Unknown', icon: '❓' },
    { id: 'phishing', label: 'Phishing Attack', icon: '🎣' },
    { id: 'malware', label: 'Malware/Virus Detection', icon: '🦠' },
    { id: 'honeytrap', label: 'Honeytrap Scheme', icon: '🍯' },
    { id: 'espionage', label: 'Cyber Espionage', icon: '🕵️' },
    { id: 'opsec', label: 'OPSEC Violation', icon: '⚠️' },
    { id: 'breach', label: 'Data Breach', icon: '🔓' },
    { id: 'social', label: 'Social Engineering', icon: '👥' },
    { id: 'ransomware', label: 'Ransomware', icon: '🔐' },
    { id: 'ddos', label: 'DDoS Attack', icon: '⚡' },
    { id: 'other', label: 'Other', icon: '📋' }
  ];

  const steps = [
    { num: 1, label: 'Basic Info', icon: User },
    { num: 2, label: 'Incident Details', icon: FileText },
    { num: 3, label: 'Evidence', icon: Upload },
    { num: 4, label: 'Submit', icon: CheckCircle }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleStepClick = (stepNum) => {
    setCurrentStep(stepNum);
    const stepElement = document.getElementById(`step-${stepNum}`);
    if (stepElement) {
      stepElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);

      // Use secure file validation
      const validation = validateFiles(files, {
        maxFiles: FILE_UPLOAD_CONFIG.MAX_FILES_PER_UPLOAD,
        maxTotalSize: FILE_UPLOAD_CONFIG.MAX_TOTAL_SIZE_BYTES
      });

      if (!validation.valid) {
        // Log validation failures
        validation.invalidFiles.forEach(invalid => {
          invalid.errors.forEach(error => {
            logValidationFailure('file_upload', error, invalid.file);
          });
        });

        const errorMessages = validation.totalErrors.length > 0 
          ? validation.totalErrors.join('\n')
          : validation.invalidFiles.map(f => f.errors.join(', ')).join('\n');

        alert(`File validation failed:\n\n${errorMessages}`);
        e.target.value = '';
        return;
      }

      if (validation.validFiles.length === 0) {
        alert('No valid files to upload.');
        e.target.value = '';
        return;
      }

      setFormData({
        ...formData,
        evidenceFiles: validation.validFiles
      });
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const isFormValid = () => {
    // Enhanced validation with security checks
    const errors = [];

    // Validate full name
    if (!formData.fullName.trim()) {
      errors.push('Full name required');
    } else {
      const nameValidation = validateFormInput(formData.fullName, {
        minLength: 3,
        maxLength: 100,
        required: true
      });
      if (!nameValidation.isValid) {
        errors.push(...nameValidation.errors);
      }
    }

    // Validate rank
    if (!formData.rank.trim()) {
      errors.push('Rank required');
    }

    // Validate department
    if (!formData.department.trim()) {
      errors.push('Department required');
    }

    // Validate complaint type
    if (!formData.complaintType.trim()) {
      errors.push('Complaint type required');
    }

    // Validate incident date
    if (!formData.incidentDate.trim()) {
      errors.push('Incident date required');
    } else if (!validateDateFormat(formData.incidentDate)) {
      errors.push('Invalid incident date');
    }

    // Validate incident time
    if (!formData.incidentTime.trim()) {
      errors.push('Incident time required');
    } else if (!/^\d{2}:\d{2}$/.test(formData.incidentTime)) {
      errors.push('Invalid time format (use HH:MM)');
    }

    // Validate description
    if (!formData.description.trim()) {
      errors.push('Description required');
    } else {
      const descriptionValidation = validateFormInput(formData.description, {
        minLength: 20,
        maxLength: 5000,
        required: true
      });
      if (!descriptionValidation.isValid) {
        errors.push(...descriptionValidation.errors);
      }
    }

    // Validate suspected source
    if (!formData.suspectedSource.trim()) {
      errors.push('Suspected source required');
    }

    if (errors.length > 0) {
      errors.forEach(error => {
        logValidationFailure('complaint_form', error);
      });
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!isFormValid()) {
      return; // Errors already logged in isFormValid()
    }

    // Sanitize form data before submission
    const sanitizedFormData = {
      fullName: sanitizeHtml(formData.fullName),
      rank: sanitizeHtml(formData.rank),
      department: sanitizeHtml(formData.department),
      location: sanitizeHtml(formData.location),
      complaintType: formData.complaintType,
      incidentDate: formData.incidentDate,
      incidentTime: formData.incidentTime,
      description: sanitizeHtml(formData.description),
      suspectedSource: sanitizeHtml(formData.suspectedSource),
      confidentiality: formData.confidentiality,
      notifyCommandingOfficer: formData.notifyCommandingOfficer,
      familyMemberComplaint: formData.familyMemberComplaint
    };

    // Only store file names, not actual file objects
    const fileNames = formData.evidenceFiles.map((f) => sanitizeFileName(f.name));

    const complaintData = {
      ...sanitizedFormData,
      evidenceFiles: fileNames,
      submittedAt: new Date().toISOString()
    };

    // Log complaint submission for audit trail
    logComplaintSubmission(`COM-${Date.now()}`, 'USER_ID', formData.complaintType);

    // Show success without exposing details
    alert('Complaint submitted successfully! You will receive a confirmation email shortly.');

    window.dispatchEvent(new CustomEvent('add-complaint', { detail: complaintData }));
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'manage-complaints' }));
  };


  return (
    <div className="min-h-screen bg-gray-100 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Progress Stepper Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8 mb-8">
          <h1 className="text-blue-600 mb-8">Submission Progress</h1>
          
          <div className="relative">
            {/* Progress Line Background and Fill */}
            <div className="absolute left-0 right-0 top-7 h-1 bg-gray-300" style={{ left: '10%', right: '10%' }}></div>
            <div 
              className="absolute left-0 top-7 h-1 bg-blue-600 transition-all duration-300" 
              style={{ width: `calc(${((currentStep - 1) / 3) * 80}% + 10%)`, left: '10%' }}
            ></div>
            
            {/* Steps Container */}
            <div className="relative flex justify-between items-start px-4 py-8">
              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep >= step.num;
                const isCurrent = currentStep === step.num;
                
                return (
                  <div 
                    key={step.num} 
                    className="flex flex-col items-center cursor-pointer flex-1 relative"
                    onClick={() => handleStepClick(step.num)}
                    style={{ zIndex: 3 }}
                  >
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all flex-shrink-0 relative ${
                        isCurrent || isActive ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-300 text-gray-500'
                      } ${isCurrent ? 'ring-4 ring-blue-200' : ''} hover:shadow-md hover:scale-105`}
                    >
                      <Icon size={22} />
                    </div>
                    <div className="mt-3 text-center w-full">
                      <div className="text-gray-500">Step {step.num}</div>
                      <div className={`transition-colors ${isCurrent ? 'text-blue-600' : 'text-gray-700'}`}>
                        {step.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {currentStep >= 1 && (
          <div id="step-1" className="bg-white rounded-lg shadow-sm p-6 lg:p-8 mb-8 transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <User className="text-white" size={22} />
              </div>
              <div>
                <h2 className="text-blue-600">Basic Information</h2>
                <p className="text-gray-500">Personal and service details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fullName" className="block text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="rank" className="block text-gray-700 mb-2">
                  Rank <span className="text-red-500">*</span>
                </label>
                <select
                  id="rank"
                  name="rank"
                  value={formData.rank}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all text-gray-900"
                >
                  <option value="">Select rank</option>
                  <option value="officer">Officer</option>
                  <option value="sergeant">Sergeant</option>
                  <option value="lieutenant">Lieutenant</option>
                  <option value="captain">Captain</option>
                  <option value="retired officer">Retired Officer</option>
                  <option value="dependent">Dependent</option>
                </select>
              </div>

              <div>
                <label htmlFor="department" className="block text-gray-700 mb-2">
                  Department/Unit <span className="text-red-500">*</span>
                </label>
                <input
                  id="department"
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="Your department or unit"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
                />
              </div>


            </div>
          </div>
        )}

        {/* Step 2: Incident Details */}
        {currentStep >= 2 && (
          <div id="step-2" className="bg-white rounded-lg shadow-sm p-6 lg:p-8 mb-8 transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <AlertTriangle className="text-white" size={22} />
              </div>
              <div>
                <h2 className="text-blue-600">Incident Details</h2>
                <p className="text-gray-500">Describe the cybersecurity incident</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Complaint Type Selection - 5x2 Grid */}
              <div>
                <label className="block text-gray-700 mb-4">
                  Complaint Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {complaintTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, complaintType: type.id })}
                      className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md cursor-pointer ${
                        formData.complaintType === type.id
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{type.icon}</div>
                      <div className="text-gray-900 leading-tight">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Incident Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="incidentDate" className="block text-gray-700 mb-2">
                    Incident Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="incidentDate"
                    type="date"
                    name="incidentDate"
                    value={formData.incidentDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
                  />
                </div>
                <div>
                  <label htmlFor="incidentTime" className="block text-gray-700 mb-2">
                    Incident Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="incidentTime"
                    type="time"
                    name="incidentTime"
                    value={formData.incidentTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
                  />
                </div>
              </div>

              {/* Detailed Description */}
              <div>
                <label htmlFor="description" className="block text-gray-700 mb-2">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide a detailed description of the incident, including what happened, when you noticed it, and any suspicious activities..."
                  rows={6}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all text-gray-900"
                ></textarea>
                <p className="text-gray-500 mt-2">Be as specific as possible. Include URLs, email addresses, or phone numbers if applicable.</p>
              </div>

              {/* Suspected Source */}
              <div>
                <label htmlFor="suspectedSource" className="block text-gray-700 mb-2">
                  Suspected Source <span className="text-red-500">*</span>
                </label>
                <input
                  id="suspectedSource"
                  type="text"
                  name="suspectedSource"
                  value={formData.suspectedSource}
                  onChange={handleInputChange}
                  placeholder="Email address, phone number, website, or any identifying information"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Evidence Upload */}
        {currentStep >= 3 && (
          <div id="step-3" className="bg-white rounded-lg shadow-sm p-6 lg:p-8 mb-8 transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Upload className="text-white" size={22} />
              </div>
              <div>
                <h2 className="text-blue-600">Evidence Upload</h2>
                <p className="text-gray-500">Attach supporting files and documents</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Upload Zone */}
              <div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <Upload className="mx-auto mb-4 text-blue-400" size={48} />
                  <p className="text-gray-900 mb-1">Click to upload or drag and drop</p>
                  <p className="text-gray-600 mb-4">Screenshots, documents, videos, audio files, or chat transcripts</p>
                  <p className="text-blue-600 mb-4">Maximum 5 files • Total size limit: 50MB</p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    Choose Files
                  </label>
                </div>
              </div>

              {/* Supported File Types */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="text-blue-600" size={20} />
                  Supported File Types
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <span>📷</span>
                    <span className="text-gray-700"><strong>Images:</strong> JPG, PNG, WEBP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📄</span>
                    <span className="text-gray-700"><strong>Documents:</strong> PDF, DOC, TXT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🎥</span>
                    <span className="text-gray-700"><strong>Videos:</strong> MP4, AVI, MOV</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📦</span>
                    <span className="text-gray-700"><strong>Archives:</strong> ZIP, RAR</span>
                  </div>
                </div>
              </div>

              {/* Selected Files */}
              {formData.evidenceFiles.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700 mb-3">Selected files ({formData.evidenceFiles.length}):</p>
                  <div className="space-y-1">
                    {formData.evidenceFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-gray-600">
                        <span className="text-blue-500">•</span>
                        <span>{file.name}</span>
                        <span className="text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Summary and Submit */}
        {currentStep >= 4 && (
          <div id="step-4" className="bg-white rounded-lg shadow-sm p-6 lg:p-8 mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <CheckCircle className="text-white" size={22} />
              </div>
              <div>
                <h2 className="text-blue-600">Complaint Summary</h2>
                <p className="text-gray-500">Review your complaint details before submitting</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Summary Sections */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-blue-600 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">Full Name</p>
                    <p className="text-gray-900">{formData.fullName || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Rank</p>
                    <p className="text-gray-900">{formData.rank || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Department/Unit</p>
                    <p className="text-gray-900">{formData.department || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-red-600 mb-4">Incident Information</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600">Complaint Type</p>
                    <p className="text-gray-900">
                      {formData.complaintType 
                        ? complaintTypes.find(t => t.id === formData.complaintType)?.label 
                        : 'Not selected'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600">Incident Date</p>
                      <p className="text-gray-900">{formData.incidentDate || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Incident Time</p>
                      <p className="text-gray-900">{formData.incidentTime || 'Not provided'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600">Description</p>
                    <p className="text-gray-900">{formData.description || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Suspected Source</p>
                    <p className="text-gray-900">{formData.suspectedSource || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-gray-900 mb-4">Evidence Files</h3>
                {formData.evidenceFiles.length > 0 ? (
                  <div className="space-y-2">
                    {formData.evidenceFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="text-green-500" size={16} />
                        <span>{file.name}</span>
                        <span className="text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No files uploaded</p>
                )}
              </div>

              {/* What Happens After Submission */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="text-blue-600" size={20} />
                  What Happens After Submission?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white flex-shrink-0">1</div>
                    <div>
                      <div className="text-gray-900">Instant Confirmation</div>
                      <div className="text-gray-600 mt-1">Receive unique complaint ID</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0">2</div>
                    <div>
                      <div className="text-gray-900">CERT-Army Review</div>
                      <div className="text-gray-600 mt-1">Expert analysis within 24 hours</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-white flex-shrink-0">3</div>
                    <div>
                      <div className="text-gray-900">Status Updates</div>
                      <div className="text-gray-600 mt-1">Track progress in real-time</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
              currentStep === 1
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700 shadow-sm hover:shadow-md'
            }`}
          >
            <ChevronLeft size={20} />
            Previous
          </button>
          {currentStep === 4 ? (
            <button
              onClick={handleSubmit}
              disabled={!isFormValid()}
              className={`px-8 py-3 rounded-lg transition-all flex items-center gap-2 shadow-sm hover:shadow-md ${
                isFormValid()
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Submit Complaint
              <CheckCircle size={20} />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-8 py-3 rounded-lg transition-all flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md"
            >
              Next Step
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
