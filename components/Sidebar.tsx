
import React, { useMemo } from 'react';
import { User } from '../types';
import { 
  LayoutDashboard, 
  ListTodo, 
  Search, 
  Send, 
  UserCircle, 
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isAdmin: boolean;
  currentUser: User;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isAdmin, currentUser, onLogout, isOpen, onClose }) => {
  const menuItems = useMemo(() => {
    const items = [
      { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
      { id: 'tasks', label: 'Việc của tôi', icon: ListTodo },
      { id: 'search', label: 'Tra cứu & Báo cáo', icon: Search },
      { id: 'delegate', label: 'Giao việc', icon: Send },
      { id: 'profile', label: 'Hồ sơ cá nhân', icon: UserCircle },
    ];

    // Chỉ hiển thị "Giao việc" cho X1 và X2
    return items.filter(item => {
      if (item.id === 'delegate') {
        return currentUser.delegateLevel === 'X1' || currentUser.delegateLevel === 'X2';
      }
      return true;
    });
  }, [currentUser.delegateLevel]);

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 flex flex-col z-[60] transition-all duration-300 ease-in-out shadow-2xl md:shadow-none
        md:translate-x-0 md:static md:h-screen md:w-64 lg:w-72
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-indigo-600">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">Q</div>
            <span className="text-xl font-black tracking-tight text-slate-800 uppercase">Hệ quản trị</span>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100 translate-x-1' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="mb-4 p-4 bg-slate-50 rounded-2xl flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 font-black shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-800 truncate uppercase">{currentUser.name}</p>
              <div className="flex flex-col">
                <p className="text-[10px] text-slate-400 font-bold truncate uppercase mt-0.5 tracking-tighter">{currentUser.unit}</p>
                <span className="text-[9px] font-black text-indigo-500 mt-0.5">CẤP ĐỘ: {currentUser.delegateLevel}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all duration-200 font-bold text-sm"
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
