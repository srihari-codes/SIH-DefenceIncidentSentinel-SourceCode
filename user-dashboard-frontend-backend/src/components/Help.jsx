import { Mail, Phone, MessageCircle, FileText, ExternalLink } from 'lucide-react';

export function Help() {
  const contactOptions = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get help via email',
      contact: 'support@cert-army.gov',
      action: 'mailto:support@cert-army.gov',
      color: 'blue'
    },
    {
      icon: Phone,
      title: 'Helpline',
      description: '24/7 emergency hotline',
      contact: '1-800-CERT-ARMY',
      action: 'tel:1800237827689',
      color: 'green'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team',
      contact: 'Available 9 AM - 6 PM',
      action: '#',
      color: 'purple'
    },
  ];

  const faqs = [
    {
      question: 'How do I file a complaint?',
      answer: 'Click on "File a Complaint" from the dashboard or navigate to "Manage Complaints" and click "New Complaint". Follow the step-by-step process to submit your cybersecurity incident report.'
    },
    {
      question: 'How long does it take to process a complaint?',
      answer: 'CERT-Army reviews all complaints within 24 hours. You will receive status updates via email and can track progress in the "Manage Complaints" section.'
    },
    {
      question: 'Can I submit anonymous complaints?',
      answer: 'For security and accountability purposes, all complaints require proper identification. However, your information is handled with strict confidentiality according to the selected security level.'
    },
    {
      question: 'What types of evidence can I upload?',
      answer: 'You can upload screenshots, documents (PDF, DOC), videos (MP4, AVI), images (JPG, PNG), and archives (ZIP). Maximum 5 files with a total size limit of 50MB.'
    },
    {
      question: 'How do I check my complaint status?',
      answer: 'Navigate to "Manage Complaints" to view all your complaints. Each complaint shows its current status: Open, In Progress, Resolved, or Closed.'
    },
  ];

  const resources = [
    {
      title: 'Cybersecurity Best Practices',
      description: 'Learn how to protect yourself from cyber threats',
      link: '#'
    },
    {
      title: 'Complaint Filing Guide',
      description: 'Step-by-step guide to filing complaints',
      link: '#'
    },
    {
      title: 'Security Policies',
      description: 'Read our security and privacy policies',
      link: '#'
    },
  ];

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-blue-600 mb-2">Help & Support</h1>
        <p className="text-gray-600">Get assistance and find answers to common questions</p>
      </div>

      {/* Contact Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {contactOptions.map((option) => {
          const Icon = option.icon;
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600 border-blue-200 hover:bg-blue-200',
            green: 'bg-green-100 text-green-600 border-green-200 hover:bg-green-200',
            purple: 'bg-purple-100 text-purple-600 border-purple-200 hover:bg-purple-200',
          };
          
          return (
            <a
              key={option.title}
              href={option.action}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-600 transition-colors"
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${colorClasses[option.color]}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-blue-600 mb-2">{option.title}</h3>
              <p className="text-gray-600 mb-2">{option.description}</p>
              <p className="text-gray-900">{option.contact}</p>
            </a>
          );
        })}
      </div>

      {/* Emergency Contact */}
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-red-600 mb-2">Emergency Cyber Incident</h2>
            <p className="text-gray-700 mb-4">
              If you're experiencing an active cyber attack or critical security breach, contact our emergency response team immediately.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="tel:1800EMERGENCY"
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Call Emergency Line
              </a>
              <a
                href="mailto:emergency@cert-army.gov"
                className="bg-white text-red-600 border-2 border-red-600 px-6 py-3 rounded-lg hover:bg-red-50 transition-colors inline-flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Email Emergency Team
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <h2 className="text-blue-600 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
              <h3 className="text-gray-900 mb-2">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Resources */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-blue-600 mb-6">Helpful Resources</h2>
        <div className="space-y-4">
          {resources.map((resource, index) => (
            <a
              key={index}
              href={resource.link}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-gray-900 group-hover:text-blue-600">{resource.title}</h3>
                  <p className="text-gray-600">{resource.description}</p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
            </a>
          ))}
        </div>
      </div>

      {/* Office Hours */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-blue-600 mb-4">Office Hours</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-700">Monday - Friday</p>
            <p className="text-gray-900">9:00 AM - 6:00 PM</p>
          </div>
          <div>
            <p className="text-gray-700">Emergency Line</p>
            <p className="text-gray-900">24/7 Available</p>
          </div>
        </div>
      </div>
    </div>
  );
}
