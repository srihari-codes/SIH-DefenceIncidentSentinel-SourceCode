import { LayoutDashboard, MessageSquare, Settings, HelpCircle, X, FileText } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard', path: '/' },
  { icon: FileText, label: 'Manage Complaints', id: 'manage-complaints', path: '/manage-complaints' },
  { icon: MessageSquare, label: 'AI Assistant', id: 'chatbot', path: '/chatbot' },
  { icon: Settings, label: 'Settings', id: 'settings', path: '/settings' },
  { icon: HelpCircle, label: 'Help', id: 'help', path: '/help' },
];

export function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active page from current route
  const getActivePageId = () => {
    const currentPath = location.pathname;
    const activeItem = navItems.find(item => item.path === currentPath);
    return activeItem ? activeItem.id : 'dashboard';
  };

  const activePage = getActivePageId();

  const handleNavClick = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-blue-600 border-r border-blue-700">
        <div className="flex items-center justify-between h-16 px-6 border-b border-blue-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-xs">DIS</span>
            </div>
            <span className="text-white font-semibold text-sm">Defense Incident Sentinel</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activePage === item.id
                  ? 'bg-white text-blue-600 font-semibold shadow-sm'
                  : 'bg-transparent text-blue-100 hover:bg-blue-500 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-700">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 bg-blue-700 rounded-full" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">User</p>
              <p className="text-xs text-blue-200 truncate">user@example.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-blue-600 border-r border-blue-700 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-blue-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-xs">DIS</span>
            </div>
            <span className="text-white font-semibold text-sm">Defense Incident Sentinel</span>
          </div>
          <button 
            onClick={onClose}
            className="text-blue-200 hover:text-white lg:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activePage === item.id
                  ? 'bg-white text-blue-600 font-semibold shadow-sm'
                  : 'text-blue-100 hover:bg-blue-500 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-700">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 bg-blue-700 rounded-full" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">User</p>
              <p className="text-xs text-blue-200 truncate">user@example.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
