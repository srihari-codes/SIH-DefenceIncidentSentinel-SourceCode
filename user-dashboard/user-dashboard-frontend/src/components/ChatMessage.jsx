import { Calendar, Clock, Paperclip } from 'lucide-react';

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

const ChatMessage = ({
  message,
  showRoleDropdown,
  showDatePicker,
  showTimePicker,
  onQuickAnswer,   // main callback
  onFieldSelect    // secondary callback (merged support)
}) => {
  const isUser = message.sender === 'user';

  // unified callback handler
  const sendValue = (val) => {
    if (onQuickAnswer) onQuickAnswer(val);
    else if (onFieldSelect) onFieldSelect(val);
  };

  const handleRoleChange = (e) => {
    const val = e.target.value;
    if (val) sendValue(val);
    e.target.value = '';
  };

  const handleDateChange = (e) => {
    const val = e.target.value;
    if (val) sendValue(val);
  };

  const handleTimeChange = (e) => {
    const val = e.target.value;
    if (val) sendValue(val);
  };

  const roles = [
    "Defence personnel",
    "Ex veteran / retired officer",
    "Family member / dependent",
    "MoD authority"
  ];

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full px-2 sm:px-0`}>
      <div
        className={`
          max-w-[90vw] xs:max-w-[85vw] sm:max-w-sm md:max-w-md lg:max-w-lg px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-sm text-xs sm:text-sm
          ${isUser ? 'bg-[#0066CC] text-white rounded-br-sm' : 'bg-[#F2F4F7] text-gray-900 rounded-bl-sm'}
        `}
      >

        {/* ---------- DESIGNATION DROPDOWN ---------- */}
        {!isUser && showRoleDropdown && (
          <div className="mb-2 sm:mb-3">
            <select
              defaultValue=""
              onChange={handleRoleChange}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-full bg-white text-[10px] sm:text-xs focus:ring-2 focus:ring-[#0066CC]"
            >
              <option value="" disabled>Select your designation</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        )}

        {/* ---------- DATE PICKER ---------- */}
        {!isUser && showDatePicker && (
          <div className="mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
            <Calendar className="w-4 sm:w-5 h-4 sm:h-5 text-gray-600 flex-shrink-0" />
            <input
              type="date"
              onChange={handleDateChange}
              className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
            />
          </div>
        )}

        {/* ---------- TIME PICKER ---------- */}
        {!isUser && showTimePicker && (
          <div className="mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
            <Clock className="w-4 sm:w-5 h-4 sm:h-5 text-gray-600 flex-shrink-0" />
            <input
              type="time"
              onChange={handleTimeChange}
              className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
            />
          </div>
        )}

        {/* Inline hint */}
        {!isUser && (showRoleDropdown || showDatePicker || showTimePicker) && (
          <span className="text-[8px] sm:text-[10px] text-gray-500">
            You can also answer via the text box below.
          </span>
        )}

        {/* ---------- MESSAGE TEXT ---------- */}
        {message.text && (
          <p className="text-xs sm:text-sm whitespace-pre-wrap break-words mt-1.5 sm:mt-2">
            {message.text}
          </p>
        )}

        {/* ---------- ATTACHMENTS ---------- */}
        {message.attachments?.length > 0 && (
          <div className="mt-1.5 sm:mt-2 space-y-1.5 sm:space-y-2">
            {message.attachments.map(att =>
              att.type === 'image' ? (
                <div key={att.id} className="overflow-hidden rounded-xl border border-gray-200 bg-black/5">
                  <img
                    src={att.url}
                    alt={att.name}
                    className="max-h-60 sm:max-h-72 w-full object-contain"
                  />
                  <div className="px-2 py-1 text-[10px] sm:text-xs">
                    {att.name} · {formatFileSize(att.size)}
                  </div>
                </div>
              ) : (
                <a
                  key={att.id}
                  href={att.url}
                  download={att.name}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white/80 border border-gray-200 text-[10px] sm:text-xs hover:bg-gray-50"
                >
                  <Paperclip className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                  <span className="truncate">{att.name}</span>
                  <span className="text-gray-500 ml-auto flex-shrink-0">
                    {formatFileSize(att.size)}
                  </span>
                </a>
              )
            )}
          </div>
        )}

        {/* ---------- TIMESTAMP ---------- */}
        <div
          className={`mt-1 text-[7px] sm:text-[10px] ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          } text-right`}
        >
          {message.timestamp}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
