import { Menu, Search, Bell } from 'lucide-react';

export function Header({ onMenuClick }) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden text-blue-600 hover:text-blue-700">
          <Menu className="w-6 h-6" />
        </button>

        <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 w-80">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none flex-1 text-black placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="md:hidden text-blue-600 hover:text-blue-700">
          <Search className="w-5 h-5" />
        </button>

        <button className="relative text-blue-600 hover:text-blue-700">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full" />
        </div>
      </div>
    </header>
  );
}
