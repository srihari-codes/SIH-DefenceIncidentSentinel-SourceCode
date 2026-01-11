import { useRef } from 'react';
import { Send, Paperclip, Image as ImageIcon } from 'lucide-react';

export default function MessageInput({ value, onChange, onSend, onSendFiles }) {
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-resize logic
  const adjustHeight = () => {
    const ta = textareaRef.current;
    if (!ta) return;

    ta.style.height = "auto";
    ta.style.height = Math.min(150, ta.scrollHeight) + "px"; // limit expansion
  };

  const handleInput = (e) => {
    onChange(e.target.value);
    adjustHeight();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  // File pickers
  const handleImageClick = () => imageInputRef.current?.click();
  const handleFileClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) {
      onSendFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files?.length > 0) {
      onSendFiles(e.target.files);
      e.target.value = "";
    }
  };

  return (
    <div className="px-6 py-4 bg-[#F5F5F5] border-t border-[#D0D7DE]">
      <div className="flex items-end gap-3">

        {/* Hidden inputs */}
        <input
          type="file"
          accept="image/*"
          ref={imageInputRef}
          onChange={handleImageChange}
          className="hidden"
        />
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Image button */}
        <button
          type="button"
          onClick={handleImageClick}
          className="p-2 rounded-full hover:bg-gray-200 transition"
          title="Upload image"
        >
          <ImageIcon className="w-5 h-5 text-gray-600" />
        </button>

        {/* File button */}
        <button
          type="button"
          onClick={handleFileClick}
          className="p-2 rounded-full hover:bg-gray-200 transition"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5 text-gray-600" />
        </button>

        {/* ChatGPT-style auto-growing input */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="
              w-full px-4 py-2 border border-gray-300 rounded-full
              bg-white resize-none overflow-hidden
              focus:outline-none focus:ring-2 focus:ring-[#0066CC]
              text-sm leading-5
            "
            rows={1}
          />
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={onSend}
          className="px-4 py-2 bg-[#0066CC] hover:bg-[#0052A3] 
                     text-white rounded-full flex items-center gap-2 transition shadow-sm"
        >
          <Send className="w-5 h-5" />
          <span className="text-sm font-medium">Send</span>
        </button>
      </div>
    </div>
  );
}
