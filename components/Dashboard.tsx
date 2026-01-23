
import React, { useMemo, useState, useEffect } from 'react';
import { User, Task, TaskStatus, TaskComplexity } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Calendar, List, X, Trophy, Target, Clock, CheckCircle2, AlertCircle, User as UserIcon } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

const SmartDateInput: React.FC<{
  label: string;
  value: string; 
  onChange: (val: string) => void;
}> = ({ label, value, onChange }) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (value && value.includes('-')) {
      const [y, m, d] = value.split('-');
      setDisplayText(`${d}/${m}/${y}`);
    } else if (!value) {
      setDisplayText('');
    }
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, ''); 
    if (raw.length > 8) raw = raw.slice(0, 8);
    
    let formatted = raw;
    if (raw.length >= 3 && raw.length <= 4) {
      formatted = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    } else if (raw.length >= 5) {
      formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`;
    }
    
    setDisplayText(formatted);

    if (raw.length === 8) {
      const d = raw.slice(0, 2);
      const m = raw.slice(2, 4);
      const y = raw.slice(4, 8);
      const dateStr = `${y}-${m}-${d}`;
      if (!isNaN(new Date(dateStr).getTime())) {
        onChange(dateStr);
      }
    }
  };

  return (
    <div className="flex-1 w-full min-w-[140px]">
      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">{label}</label>
      <div className="relative group">
        <input
          type="text"
          value={displayText}
          onChange={handleTextChange}
          placeholder="DD/MM/YYYY"
          className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-12 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
        />
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3">
          <div className="relative h-6 w-6 flex items-center justify-center">
            <Calendar size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors pointer-events-none" />
            <input
              type="date"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Chọn ngày từ lịch"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface DashboardProps {
  users: User[];
  tasks: Task[];
  currentUser: User;
  onUserClick: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ users, tasks, currentUser, onUserClick }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; title: string; tasks: Task[] }>({
    isOpen: false,
    title: '',
    tasks: []
  });

  const isAD1 = currentUser.notes === 'AD1';
  const isAD2 = currentUser.notes === 'AD2';
  const isRegularUser = !isAD1 && !isAD2;

  const units = useMemo(() => Array.from(new Set(users.map(u => u.unit))), [users]);
  
  const accessibleUsers = useMemo(() => {
    if (isAD1) {
      return selectedUnit ? users.filter(u => u.unit === selectedUnit) : users;
    }
    if (isAD2) {
      return users.filter(u => u.unit === currentUser.unit);
    }
    return [currentUser];
  }, [users, currentUser, isAD1, isAD2, selectedUnit]);

  const getPoints = (task: Task) => {
    if (task.status === TaskStatus.COMPLETED && task.deadline && task.completedTime && task.completedTime > task.deadline) {
      return 0;
    }
    if (task.status !== TaskStatus.COMPLETED) return 0;

    switch (task.complexity) {
      case TaskComplexity.MEDIUM: return 1;
      case TaskComplexity.HARD: return 3;
      case TaskComplexity.VERY_HARD: return 5;
      default: return 0;
    }
  };

  const staffOptions = useMemo(() => {
    const opts = accessibleUsers.map(u => ({
      id: u.id,
      label: u.name,
      subLabel: u.unit
    }));
    return [{ id: '', label: 'Tất cả nhân sự' }, ...opts];
  }, [accessibleUsers]);

  const stats = useMemo(() => {
    const now = Date.now();
    const filtered = tasks.filter(t => {
      let hasAccess = false;
      if (isAD1) hasAccess = true;
      else if (isAD2) hasAccess = t.unit === currentUser.unit;
      else hasAccess = (t.userId === currentUser.id || t.leadId === currentUser.id || t.collaboratorIds.includes(currentUser.id));

      if (!hasAccess) return false;

      const matchesUnit = isAD1 && selectedUnit ? t.unit === selectedUnit : true;
      const matchesStaff = selectedStaffId 
        ? (t.userId === selectedStaffId || t.leadId === selectedStaffId || t.collaboratorIds.includes(selectedStaffId)) 
        : true;
      
      const taskTime = t.startTime;
      const matchesStart = startDate ? taskTime >= new Date(startDate).getTime() : true;
      const matchesEnd = endDate ? taskTime <= new Date(endDate).getTime() + 86400000 : true;

      return matchesUnit && matchesStaff && matchesStart && matchesEnd;
    });

    const todoTasks = filtered.filter(t => t.status === TaskStatus.TO_DO);
    const inProgressTasks = filtered.filter(t => t.status === TaskStatus.IN_PROGRESS);
    const completedTasks = filtered.filter(t => t.status === TaskStatus.COMPLETED);
    const overdueTasks = filtered.filter(t => t.status !== TaskStatus.COMPLETED && t.deadline && now > t.deadline);

    // Lọc bỏ Trưởng phòng và Phó trưởng phòng khỏi biểu đồ hiệu năng
    const performanceData = (isRegularUser ? [currentUser] : accessibleUsers)
      .filter(u => !u.position.toLowerCase().includes('trưởng phòng'))
      .map(u => {
        const leadTasks = filtered.filter(t => t.leadId === u.id);
        const score = leadTasks.reduce((acc, t) => acc + getPoints(t), 0);

        return {
          name: u.name,
          score: score,
          count: leadTasks.length
        };
      })
      .sort((a, b) => b.score - a.score);

    const complexityChartData = [
      { name: TaskComplexity.MEDIUM, value: filtered.filter(t => t.complexity === TaskComplexity.MEDIUM).length },
      { name: TaskComplexity.HARD, value: filtered.filter(t => t.complexity === TaskComplexity.HARD).length },
      { name: TaskComplexity.VERY_HARD, value: filtered.filter(t => t.complexity === TaskComplexity.VERY_HARD).length },
    ].filter(d => d.value > 0);

    return {
      total: filtered,
      todo: todoTasks,
      inProgress: inProgressTasks,
      completed: completedTasks,
      overdue: overdueTasks,
      complexityChartData,
      performanceData
    };
  }, [tasks, users, currentUser, isAD1, isAD2, isRegularUser, startDate, endDate, selectedUnit, selectedStaffId, accessibleUsers]);

  const COLORS = ['#6366f1', '#f59e0b', '#ef4444'];

  const openDetails = (title: string, taskList: Task[]) => {
    setDetailModal({ isOpen: true, title, tasks: taskList });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-end gap-4">
        
        {isAD1 && (
          <div className="w-full lg:w-64">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Lọc theo đơn vị</label>
            <select
              value={selectedUnit}
              onChange={(e) => { setSelectedUnit(e.target.value); setSelectedStaffId(''); }}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
            >
              <option value="">Tất cả đơn vị</option>
              {units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        )}

        {(isAD1 || isAD2) && (
          <div className="w-full lg:w-72">
            <SearchableSelect
              label="Lọc theo nhân sự"
              options={staffOptions}
              value={selectedStaffId}
              onChange={setSelectedStaffId}
              placeholder="Tất cả nhân sự"
            />
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:flex-1">
          <SmartDateInput label="Từ ngày" value={startDate} onChange={setStartDate} />
          <SmartDateInput label="Đến ngày" value={endDate} onChange={setEndDate} />
        </div>

        <button 
          onClick={() => { setStartDate(''); setEndDate(''); setSelectedStaffId(''); setSelectedUnit(''); }}
          className="w-full sm:w-auto bg-slate-50 text-slate-500 px-6 py-2.5 rounded-xl hover:bg-slate-100 transition-colors text-xs font-black uppercase tracking-widest border border-slate-200"
        >
          Xóa
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Tổng số', count: stats.total.length, icon: List, color: 'indigo', list: stats.total },
          { label: 'Cần làm', count: stats.todo.length, icon: Target, color: 'slate', list: stats.todo },
          { label: 'Đang làm', count: stats.inProgress.length, icon: Clock, color: 'amber', list: stats.inProgress },
          { label: 'Hoàn thành', count: stats.completed.length, icon: CheckCircle2, color: 'emerald', list: stats.completed },
          { label: 'Quá hạn', count: stats.overdue.length, icon: AlertCircle, color: 'rose', list: stats.overdue },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => openDetails(item.label, item.list)}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 bg-${item.color}-50 text-${item.color}-600 rounded-xl flex items-center justify-center`}>
                  <Icon size={20} />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
              </div>
              <p className="text-3xl font-black text-slate-800 tracking-tighter">{item.count}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[450px]">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center shrink-0">
            <Trophy className="mr-2 text-amber-500" size={18} /> Hiệu năng nhân sự
          </h3>
          <div className="flex-1 w-full overflow-y-auto custom-scrollbar pr-2">
            <div style={{ height: `${Math.max(stats.performanceData.length * 45, 300)}px`, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.performanceData} layout="vertical" margin={{ left: -10, right: 30, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    width={100} 
                    fontSize={10} 
                    fontWeight="700" 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Bar dataKey="score" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center">
            <Target className="mr-2 text-indigo-500" size={18} /> Phân loại mức độ
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.complexityChartData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value">
                  {stats.complexityChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {detailModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDetailModal({ ...detailModal, isOpen: false })}></div>
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{detailModal.title}</h2>
              <button onClick={() => setDetailModal({ ...detailModal, isOpen: false })} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {detailModal.tasks.map(task => {
                const lead = users.find(u => u.id === task.leadId);
                return (
                  <div key={task.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="font-bold text-slate-800 leading-relaxed mb-3">{task.content}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                        <UserIcon size={12} className="mr-1" /> {lead?.name || 'Không xác định'}
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-1 bg-white text-slate-600 rounded border border-slate-200">{task.complexity}</span>
                      <span className="text-[10px] font-black uppercase px-2 py-1 bg-white text-slate-600 rounded border border-slate-200">{task.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
