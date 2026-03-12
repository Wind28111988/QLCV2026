
import React, { useState, useEffect } from 'react';
import { User, Task, TaskStatus, TaskComplexity, TaskCategory, Attachment, Document as Doc } from './types';
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
import DocumentEntry from './components/DocumentEntry';
import DocumentSearch from './components/DocumentSearch';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [viewedUserId, setViewedUserId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        const [dbUsers, dbTasks, dbDocs] = await Promise.all([
          cloudStorage.getUsers(),
          cloudStorage.getTasks(),
          cloudStorage.getDocuments()
        ]);
        setUsers(dbUsers);
        setTasks(dbTasks);
        setDocuments(dbDocs);

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
    const result = await cloudStorage.upsertUser(updated);
    if (result.success) {
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
      setCurrentUser(updated);
      localStorage.setItem('tm_current_user', JSON.stringify(updated));
    }
    setIsSyncing(false);
  };

  const handleResetPassword = async (email: string, newPass: string) => {
    const target = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (target) {
      const updated = { ...target, password: newPass, mustChangePassword: true };
      setIsSyncing(true);
      await cloudStorage.upsertUser(updated);
      setUsers(prev => prev.map(u => u.id === target.id ? updated : u));
      setIsSyncing(false);
    }
  };

  const handleAddDocument = async (doc: Doc): Promise<boolean> => {
    setIsSyncing(true);
    const result = await cloudStorage.insertDocument(doc);
    if (result.success) {
      setDocuments(prev => [doc, ...prev]);
      setIsSyncing(false);
      return true;
    } else {
      console.error("Lỗi khi lưu văn bản:", result.error);
      setIsSyncing(false);
      return false;
    }
  };

  const addTask = async (content: string, complexity: TaskComplexity, leadId?: string, collaboratorIds?: string[], attachments?: Attachment[], deadline?: number, documentId?: string, targetUnit?: string, category?: TaskCategory, outDocNumber?: string) => {
    if (!currentUser) return;
    
    const finalUnit = targetUnit || currentUser.unit;
    // Mặc định là KHAC nếu không được truyền từ Delegation
    const finalCategory = category || TaskCategory.KHAC;

    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      content,
      startTime: Date.now(),
      deadline: deadline,
      status: TaskStatus.TO_DO, 
      complexity,
      category: finalCategory,
      leadId: leadId || currentUser.id,
      collaboratorIds: collaboratorIds || [],
      forwarderIds: [],
      unit: finalUnit,
      attachments: attachments || [],
      documentId,
      outDocNumber
    };
    
    setIsSyncing(true);
    const result = await cloudStorage.insertTask(newTask);
    if (result.success) {
      setTasks(prev => [newTask, ...prev]);
    } else {
      console.error("Lỗi lưu Task:", result.error);
      alert("Không thể lưu công việc vào Database. Vui lòng kiểm tra kết nối mạng hoặc cấu hình bảng tasks trên Supabase.");
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
    if (result.success) setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    setIsSyncing(false);
  };

  const handleForwardTask = async (taskId: string, newLeadId: string, newCollaboratorIds: string[], newUnit: string) => {
    if (!currentUser) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updates: Partial<Task> = {
      leadId: newLeadId,
      collaboratorIds: newCollaboratorIds,
      forwarderIds: [...(task.forwarderIds || []), currentUser.id],
      status: TaskStatus.IN_PROGRESS,
      startTime: task.status === TaskStatus.TO_DO ? Date.now() : task.startTime,
      unit: newUnit 
    };
    setIsSyncing(true);
    const result = await cloudStorage.updateTask(taskId, updates);
    if (result.success) setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    setIsSyncing(false);
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    setIsSyncing(true);
    const result = await cloudStorage.updateTask(taskId, updates);
    if (result.success) setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    setIsSyncing(false);
  };

  const deleteTask = async (taskId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
      setIsSyncing(true);
      const result = await cloudStorage.deleteTask(taskId);
      if (result.success) setTasks(prev => prev.filter(t => t.id !== taskId));
      setIsSyncing(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Đang tải dữ liệu Cloud...</p>
      </div>
    );
  }

  if (!currentUser) return <Login users={users} onLogin={handleLogin} onResetPassword={handleResetPassword} />;
  if (currentUser.mustChangePassword) return <ChangePassword onComplete={handleChangePassword} />;

  const isAdmin = currentUser.notes === 'AD1' || currentUser.notes === 'AD2';
  const isVT = currentUser.notes === 'VT';
  const isX1 = currentUser.delegateLevel === 'X1';
  const canDelegate = currentUser.delegateLevel === 'X1' || currentUser.delegateLevel === 'X2';

  const myRecentTasks = tasks.filter(t => {
    const isRelated = t.userId === currentUser.id || t.leadId === currentUser.id || t.collaboratorIds.includes(currentUser.id) || (t.forwarderIds && t.forwarderIds.includes(currentUser.id));
    const twoMonthsAgo = Date.now() - (60 * 24 * 60 * 60 * 1000);
    return isRelated && t.startTime >= twoMonthsAgo;
  });

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
      
      <main className="flex-1 min-w-0 p-4 md:p-8 lg:p-10">
        <header className="mb-6 flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Mở menu"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 uppercase flex-1">
            {activeTab === 'dashboard' && 'Tổng quan'}
            {activeTab === 'tasks' && 'Việc của tôi'}
            {activeTab === 'search' && 'Tra cứu & Báo cáo'}
            {activeTab === 'delegate' && 'Giao việc'}
            {activeTab === 'doc-entry' && 'Nhập văn bản'}
            {activeTab === 'doc-search' && 'Tra cứu văn bản'}
            {activeTab === 'profile' && 'Hồ sơ cá nhân'}
            {isSyncing && <RefreshCw className="text-indigo-400 animate-spin" size={24} />}
          </h1>
        </header>

        <div className="w-full">
          {activeTab === 'dashboard' && <Dashboard users={users} tasks={tasks} currentUser={currentUser} onUserClick={(uid) => { setViewedUserId(uid); setActiveTab('search'); }} />}
          {activeTab === 'tasks' && <TaskBoard tasks={myRecentTasks} documents={documents} onAddTask={addTask} onUpdateStatus={updateTaskStatus} onUpdateTask={updateTask} onDeleteTask={deleteTask} onForwardTask={handleForwardTask} currentUser={currentUser} allUsers={users} />}
          {activeTab === 'search' && <AdminSearch users={users} tasks={tasks} documents={documents} isAdmin={isAdmin} currentUser={currentUser} onUpdateTask={updateTask} onResetUserPassword={handleResetPassword} initialSelectedUserId={viewedUserId} />}
          {activeTab === 'delegate' && <Delegation currentUser={currentUser} users={users} documents={documents} tasks={tasks} onAssign={addTask} />}
          {activeTab === 'doc-entry' && isVT && <DocumentEntry onAdd={handleAddDocument} allDocuments={documents} />}
          {activeTab === 'doc-search' && (isVT || isX1) && <DocumentSearch documents={documents} tasks={tasks} users={users} />}
          {activeTab === 'profile' && <UserProfile user={currentUser} />}
        </div>
      </main>
    </div>
  );
};

export default App;
