
import React, { useMemo, useState, useEffect } from 'react';
import { User, Task, TaskStatus, TaskComplexity } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Calendar, List, X, Trophy, Target, Clock, CheckCircle2 } from 'lucide-react';
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

  return (
    <div className="flex-1 w-full min-w-[140px]">
      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">{label}</label>
      <div className="relative group">
        <input
          type="text"
          value={displayText}
          readOnly
          placeholder="DD/MM/YYYY"
          className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium cursor-pointer"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
          <Calendar size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
        </div>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
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
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; title: string; tasks: Task[] }>({
    isOpen: false,
    title: '',
    tasks: []
  });

  const isGlobalAdmin = currentUser.notes === 'AD';
  
  const accessibleUsers = useMemo(() => {
    if (isGlobalAdmin) return users;
    return users.filter(u => u.unit === currentUser.unit);
  }, [users, currentUser.unit, isGlobalAdmin]);

  const getPoints = (complexity: TaskComplexity) => {
    switch (complexity) {
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
    const filtered = tasks.filter(t => {
      const canSee = isGlobalAdmin || (t.unit === currentUser.unit);
      if (!canSee) return false;

      const matchesStaff = selectedStaffId 
        ? (t.userId === selectedStaffId || t.leadId === selectedStaffId || t.collaboratorIds.includes(selectedStaffId)) 
        : true;
      
      const taskTime = t.startTime;
      const matchesStart = startDate ? taskTime >= new Date(startDate).getTime() : true;
      const matchesEnd = endDate ? taskTime <= new Date(endDate).getTime() + 86400000 : true;

      return matchesStaff && matchesStart && matchesEnd;
    });

    const todoTasks = filtered.filter(t => t.status === TaskStatus.TO_DO);
    const inProgressTasks = filtered.filter(t => t.status === TaskStatus.IN_PROGRESS);
    const completedTasks = filtered.filter(t => t.status === TaskStatus.COMPLETED);

    const performanceData = accessibleUsers
      .map(u => {
        const assignedCount = filtered.filter(t => t.userId === u.id).length;
        const leadTasks = filtered.filter(t => t.leadId === u.id && t.status === TaskStatus.COMPLETED);
        const score = leadTasks.reduce((acc, t) => acc + getPoints(t.complexity), 0);

        return {
          name: u.name,
          score: score,
          count: assignedCount
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

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
      complexityChartData,
      performanceData
    };
  }, [tasks, users, currentUser, isGlobalAdmin, startDate, endDate, selectedStaffId, accessibleUsers]);

  const COLORS = ['#6366f1', '#f59e0b', '#ef4444'];

  const openDetails = (title: string, taskList: Task[]) => {
    setDetailModal({ isOpen: true, title, tasks: taskList });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-end gap-4">
        <div className="w-full lg:w-72">
           <SearchableSelect
            label="Lọc theo nhân sự"
            options={staffOptions}
            value={selectedStaffId}
            onChange={setSelectedStaffId}
            placeholder="Tất cả nhân sự"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:flex-1">
          <SmartDateInput label="Từ ngày" value={startDate} onChange={setStartDate} />
          <SmartDateInput label="Đến ngày" value={endDate} onChange={setEndDate} />
        </div>

        <button 
          onClick={() => { setStartDate(''); setEndDate(''); setSelectedStaffId(''); }}
          className="w-full sm:w-auto bg-slate-50 text-slate-500 px-6 py-2.5 rounded-xl hover:bg-slate-100 transition-colors text-xs font-black uppercase tracking-widest border border-slate-200"
        >
          Xóa
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng số', count: stats.total.length, icon: List, color: 'indigo', list: stats.total },
          { label: 'Cần làm', count: stats.todo.length, icon: Target, color: 'slate', list: stats.todo },
          { label: 'Đang làm', count: stats.inProgress.length, icon: Clock, color: 'amber', list: stats.inProgress },
          { label: 'Hoàn thành', count: stats.completed.length, icon: CheckCircle2, color: 'emerald', list: stats.completed },
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
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center">
            <Trophy className="mr-2 text-amber-500" size={18} /> Hiệu năng nhân sự
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.performanceData} layout="vertical" margin={{ left: -10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} fontSize={10} fontWeight="700" />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="score" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center">
            <Target className="mr-2 text-indigo-500" size={18} /> Phân loại mức độ
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.complexityChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
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
              {detailModal.tasks.map(task => (
                <div key={task.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="font-bold text-slate-800">{task.content}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-md">{task.complexity}</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md">{task.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
