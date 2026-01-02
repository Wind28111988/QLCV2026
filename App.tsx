
import React, { useState, useEffect } from 'react';
import { User, Task, TaskStatus, TaskComplexity, Attachment } from './types';
import { Menu, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { cloudStorage } from './storage';
import Login from './components/Login';
import ChangePassword from './components/ChangePassword';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TaskBoard from './components/TaskBoard';
import AdminSearch from './components/AdminSearch';
import Delegation from './components/Delegation';
import UserProfile from './components/UserProfile';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'search' | 'delegate' | 'profile'>('dashboard');
  const [viewedUserId, setViewedUserId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        const dbUsers = await cloudStorage.getUsers();
        setUsers(dbUsers);

        const dbTasks = await cloudStorage.getTasks();
        setTasks(dbTasks);

        const savedUserStr = localStorage.getItem('tm_current_user');
        if (savedUserStr) {
          const parsedUser = JSON.parse(savedUserStr);
          const stillExists = dbUsers.find(u => u.id === parsedUser.id);
          if (stillExists) {
            setCurrentUser(stillExists);
          } else {
            localStorage.removeItem('tm_current_user');
          }
        }
      } catch (err) {
        console.error("Initialization Error:", err);
        setSyncError("Lỗi kết nối cơ sở dữ liệu Cloud.");
      } finally {
        setIsInitialLoading(false);
      }
    };
    initData();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('tm_current_user', JSON.stringify(user));
    if (!user.mustChangePassword) setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tm_current_user');
    setActiveTab('dashboard');
    setIsSidebarOpen(false);
  };

  const handleChangePassword = async (newPass: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, password: newPass, mustChangePassword: false };
    setIsSyncing(true);
    setSyncError(null);
    const result = await cloudStorage.upsertUser(updated);
    if (result.success) {
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
      setCurrentUser(updated);
      localStorage.setItem('tm_current_user', JSON.stringify(updated));
    } else {
      setSyncError("Lỗi khi cập nhật mật khẩu mới.");
    }
    setIsSyncing(false);
  };

  const handleResetPassword = async (email: string, newPass: string) => {
    const target = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (target) {
      const updated = { ...target, password: newPass, mustChangePassword: true };
      setIsSyncing(true);
      const result = await cloudStorage.upsertUser(updated);
      if (result.success) {
        setUsers(prev => prev.map(u => u.id === target.id ? updated : u));
      }
      setIsSyncing(false);
    }
  };

  const addTask = async (content: string, complexity: TaskComplexity, leadId?: string, collaboratorIds?: string[], attachments?: Attachment[]) => {
    if (!currentUser) return;
    
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      content,
      startTime: Date.now(),
      status: TaskStatus.TO_DO, 
      complexity,
      leadId: leadId || currentUser.id,
      collaboratorIds: collaboratorIds || [],
      unit: currentUser.unit,
      attachments: attachments || []
    };
    
    setIsSyncing(true);
    setSyncError(null);
    const result = await cloudStorage.insertTask(newTask);
    if (result.success) {
      setTasks(prev => [newTask, ...prev]);
    } else {
      setSyncError("Lỗi khóa ngoại hoặc kết nối: " + (result.error?.message || ""));
    }
    setIsSyncing(false);
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const updates: Partial<Task> = {
      status: newStatus,
      completedTime: newStatus === TaskStatus.COMPLETED ? Date.now() : undefined,
      startTime: (newStatus === TaskStatus.IN_PROGRESS && task.status === TaskStatus.TO_DO) ? Date.now() : task.startTime
    };
    
    setIsSyncing(true);
    const result = await cloudStorage.updateTask(taskId, updates);
    if (result.success) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    }
    setIsSyncing(false);
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    setIsSyncing(true);
    const result = await cloudStorage.updateTask(taskId, updates);
    if (result.success) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    }
    setIsSyncing(false);
  };

  const deleteTask = async (taskId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
      setIsSyncing(true);
      const result = await cloudStorage.deleteTask(taskId);
      if (result.success) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
      }
      setIsSyncing(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Đang tải dữ liệu từ Cloud...</p>
      </div>
    );
  }

  if (!currentUser) return <Login users={users} onLogin={handleLogin} onResetPassword={handleResetPassword} />;
  if (currentUser.mustChangePassword) return <ChangePassword onComplete={handleChangePassword} />;

  const isAdmin = currentUser.notes === 'AD1' || currentUser.notes === 'AD2';
  const canDelegate = currentUser.delegateLevel === 'X1' || currentUser.delegateLevel === 'X2';
  const logoUrl = "https://drive.google.com/uc?export=view&id=1FUb404uLq8ton8azidI9UrR1DLs7Byds";

  return (
    <div className="flex min-h-screen bg-slate-50 flex-col md:flex-row overflow-x-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }} 
        isAdmin={isAdmin} 
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-400 shadow-sm bg-white shrink-0 p-0.5 flex items-center justify-center">
            <img 
              src={logoUrl}
              alt="Logo" 
              className="w-full h-full object-contain scale-110"
              onError={(e) => {
                e.currentTarget.src = "https://www.gdt.gov.vn/wps/themes/html/V_GDT_Theme/images/logo.png";
              }}
            />
          </div>
          <span className="font-black text-slate-800 uppercase tracking-tight text-xs">Quản lý công việc</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-500"><Menu size={24} /></button>
      </div>

      <main className="flex-1 min-w-0 p-4 md:p-8 lg:p-10">
        <header className="mb-6 md:mb-10 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              {activeTab === 'dashboard' && 'Tổng quan'}
              {activeTab === 'tasks' && 'Việc của tôi'}
              {activeTab === 'search' && 'Báo cáo & Tra cứu'}
              {activeTab === 'delegate' && 'Giao nhiệm vụ'}
              {activeTab === 'profile' && 'Cá nhân'}
              {isSyncing && <RefreshCw className="text-indigo-400 animate-spin" size={24} />}
            </h1>
            <div className="flex items-center mt-1 space-x-2">
               {syncError && (
                 <div className="flex items-center text-rose-500 text-[10px] font-black uppercase bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                   <AlertTriangle size={12} className="mr-1" /> {syncError}
                 </div>
               )}
            </div>
          </div>
        </header>

        <div className="w-full">
          {activeTab === 'dashboard' && <Dashboard users={users} tasks={tasks} currentUser={currentUser} onUserClick={(uid) => { setViewedUserId(uid); setActiveTab('search'); }} />}
          {activeTab === 'tasks' && <TaskBoard tasks={tasks.filter(t => t.userId === currentUser.id || t.leadId === currentUser.id || t.collaboratorIds.includes(currentUser.id))} onAddTask={addTask} onUpdateStatus={updateTaskStatus} onUpdateTask={updateTask} onDeleteTask={deleteTask} />}
          {activeTab === 'search' && <AdminSearch users={users} tasks={tasks} isAdmin={isAdmin} currentUser={currentUser} onUpdateTask={updateTask} onResetUserPassword={handleResetPassword} initialSelectedUserId={viewedUserId} />}
          {activeTab === 'delegate' && (canDelegate ? <Delegation currentUser={currentUser} users={users} onAssign={addTask} /> : <div className="p-10 text-center font-bold text-slate-400 uppercase tracking-widest bg-white rounded-3xl border border-slate-100 shadow-sm">Bạn không có quyền truy cập chức năng này.</div>)}
          {activeTab === 'profile' && <UserProfile user={currentUser} />}
        </div>
      </main>
    </div>
  );
};

export default App;
