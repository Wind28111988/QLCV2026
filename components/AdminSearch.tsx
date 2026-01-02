
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Task, TaskStatus, TaskComplexity } from '../types';
import { Search, FileSpreadsheet, Filter, Calendar, Clock, Timer, CheckCircle, KeyRound, ShieldAlert } from 'lucide-react';
import { DEFAULT_PASSWORD } from '../constants';
import SearchableSelect from './SearchableSelect';

declare const XLSX: any;

interface AdminSearchProps {
  users: User[];
  tasks: Task[];
  isAdmin: boolean;
  currentUser: User;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onResetUserPassword: (email: string, newPass: string) => void;
  initialSelectedUserId?: string | null;
}

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
      const dateObj = new Date(`${y}-${m}-${d}`);
      if (!isNaN(dateObj.getTime())) {
        onChange(`${y}-${m}-${d}`);
      }
    }
  };

  return (
    <div className="relative">
      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">{label}</label>
      <div className="relative group">
        <input
          type="text"
          value={displayText}
          onChange={handleTextChange}
          placeholder="DD/MM/YYYY"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          <Calendar size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors pointer-events-none" />
          <input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

const AdminSearch: React.FC<AdminSearchProps> = ({ users, tasks, isAdmin, currentUser, onUpdateTask, onResetUserPassword, initialSelectedUserId }) => {
  const [searchName, setSearchName] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(initialSelectedUserId || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('');
  const [triggerSearch, setTriggerSearch] = useState(0);

  useEffect(() => {
    if (initialSelectedUserId) setSelectedUserId(initialSelectedUserId);
  }, [initialSelectedUserId]);

  const isAD = currentUser.notes === 'AD';
  const units = useMemo(() => Array.from(new Set(users.map(u => u.unit))), [users]);
  const isChief = currentUser.position.toLowerCase().includes('trưởng phòng') || isAD;
  
  const unitEmployees = useMemo(() => {
    if (!selectedUnit) return users;
    return users.filter(u => u.unit === selectedUnit);
  }, [selectedUnit, users]);

  const staffOptions = useMemo(() => {
    const opts = unitEmployees.map(u => ({
      id: u.id,
      label: u.name,
      subLabel: u.position
    }));
    return [{ id: '', label: 'Tất cả nhân viên' }, ...opts];
  }, [unitEmployees]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const creator = users.find(u => u.id === task.userId);
      const lead = users.find(u => u.id === task.leadId);
      if (!creator && !lead) return false;

      const canSee = isAD || (isChief && task.unit === currentUser.unit) || (task.userId === currentUser.id || task.leadId === currentUser.id || task.collaboratorIds.includes(currentUser.id));
      if (!canSee) return false;

      const matchesUnit = selectedUnit ? task.unit === selectedUnit : true;
      const matchesUser = selectedUserId ? (task.userId === selectedUserId || task.leadId === selectedUserId || task.collaboratorIds.includes(selectedUserId)) : true;
      const matchesName = searchName ? (creator?.name.toLowerCase().includes(searchName.toLowerCase()) || lead?.name.toLowerCase().includes(searchName.toLowerCase())) : true;
      const matchesComplexity = selectedComplexity ? task.complexity === selectedComplexity : true;
      
      const taskTime = task.startTime;
      const matchesStart = startDate ? taskTime >= new Date(startDate).getTime() : true;
      const matchesEnd = endDate ? taskTime <= new Date(endDate).getTime() + 86400000 : true;

      return matchesUnit && matchesUser && matchesName && matchesStart && matchesEnd && matchesComplexity;
    });
  }, [tasks, users, selectedUnit, selectedUserId, searchName, startDate, endDate, selectedComplexity, isAD, isChief, currentUser, triggerSearch]);

  const handleResetPass = (user: User) => {
    if (!isAD) return;
    if (window.confirm(`Xác nhận reset mật khẩu của nhân sự ${user.name} về mặc định (${DEFAULT_PASSWORD})?`)) {
      onResetUserPassword(user.email, DEFAULT_PASSWORD);
      alert('Đã reset mật khẩu thành công!');
    }
  };

  const formatFullDateTime = (timestamp: number | undefined) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const formatDurationDetailed = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const exportToExcel = () => {
    const exportData = filteredTasks.map(t => {
      const creator = users.find(u => u.id === t.userId);
      const lead = users.find(u => u.id === t.leadId);
      return {
        'Người giao': creator?.name || 'N/A',
        'Người chủ trì': lead?.name || 'N/A',
        'Đơn vị': t.unit,
        'Nội dung': t.content,
        'Mức độ': t.complexity,
        'Trạng thái': t.status,
        'Bắt đầu': formatFullDateTime(t.startTime),
        'Kết thúc': t.completedTime ? formatFullDateTime(t.completedTime) : '-'
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo");
    XLSX.writeFile(workbook, `Bao_cao_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-5 md:p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2 mb-6">
          <Filter className="text-indigo-600" size={20} />
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Bộ lọc tra cứu</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
          {(isChief || isAD) && (
            <>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Đơn vị công tác</label>
                <select
                  value={selectedUnit}
                  onChange={(e) => { setSelectedUnit(e.target.value); setSelectedUserId(''); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
                >
                  <option value="">Tất cả đơn vị</option>
                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <SearchableSelect
                label="Nhân viên liên quan"
                options={staffOptions}
                value={selectedUserId}
                onChange={setSelectedUserId}
                placeholder="Tất cả nhân viên"
              />
            </>
          )}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Mức độ phức tạp</label>
            <select
              value={selectedComplexity}
              onChange={(e) => setSelectedComplexity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
            >
              <option value="">Tất cả mức độ</option>
              {Object.values(TaskComplexity).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          <SmartDateInput label="Thời gian từ" value={startDate} onChange={setStartDate} />
          <SmartDateInput label="Thời gian đến" value={endDate} onChange={setEndDate} />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => setTriggerSearch(v => v+1)} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100">
            <Search size={18} /><span>Áp dụng tìm kiếm</span>
          </button>
          <button onClick={exportToExcel} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-100">
            <FileSpreadsheet size={18} /><span>Xuất báo cáo Excel</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-[0.2em]">Kết quả ({filteredTasks.length})</h3>
          {isAD && <span className="text-[10px] font-black text-amber-600 flex items-center bg-amber-50 px-3 py-1 rounded-full border border-amber-100 uppercase tracking-tighter"><ShieldAlert size={12} className="mr-1" /> Admin Root</span>}
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">Phụ trách</th>
                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">Nội dung</th>
                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">Hoàn thành</th>
                {isAD && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-center">Pass</th>}
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length > 0 ? filteredTasks.map(task => {
                const assigner = users.find(u => u.id === task.userId);
                const lead = users.find(u => u.id === task.leadId);
                const isCompleted = task.status === TaskStatus.COMPLETED;
                
                return (
                  <tr key={task.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2">
                           <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-400 font-black uppercase">Giao</span>
                           <span className="font-bold text-slate-700">{assigner?.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                           <span className="text-[8px] bg-indigo-50 px-1.5 py-0.5 rounded-md text-indigo-400 font-black uppercase">Làm</span>
                           <span className="font-black text-indigo-600">{lead?.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-md overflow-hidden text-ellipsis whitespace-normal">
                      <p className="font-medium text-slate-600 leading-relaxed text-sm">{task.content}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center space-y-1">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                          task.status === TaskStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>{task.status}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{task.complexity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-slate-500 font-bold">{isCompleted ? formatFullDateTime(task.completedTime) : '--:--'}</span>
                        {isCompleted && <span className="text-indigo-500 font-black text-[9px] mt-0.5 flex items-center uppercase"><Timer size={10} className="mr-1" /> {formatDurationDetailed(task.completedTime! - task.startTime)}</span>}
                      </div>
                    </td>
                    {isAD && (
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button 
                            onClick={() => lead && handleResetPass(lead)}
                            title={`Reset pass cho: ${lead?.name}`}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          >
                            <KeyRound size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              }) : (
                <tr>
                   <td colSpan={isAD ? 5 : 4} className="px-6 py-12 text-center text-slate-300 font-bold uppercase tracking-widest italic text-sm">Không tìm thấy kết quả</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSearch;
