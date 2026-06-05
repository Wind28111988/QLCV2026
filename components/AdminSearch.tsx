
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Task, TaskStatus, TaskComplexity, TaskCategory, Document as Doc } from '../types';
import { Search, FileSpreadsheet, Filter, Calendar, Clock, Timer, CheckCircle, KeyRound, ShieldAlert, AlertTriangle, RotateCcw, Edit2, X } from 'lucide-react';
import { DEFAULT_PASSWORD } from '../constants';
import SearchableSelect from './SearchableSelect';

declare const XLSX: any;

interface AdminSearchProps {
  users: User[];
  tasks: Task[];
  documents: Doc[];
  isAdmin: boolean;
  currentUser: User;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onResetUserPassword: (email: string, newPass: string) => void;
  initialSelectedUserId?: string | null;
}

const pad = (n: number) => n.toString().padStart(2, '0');

const formatFullDateTime = (timestamp: number | undefined) => {
  if (!timestamp) return '-';
  const d = new Date(timestamp);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

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
    <div className="relative flex-1">
      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">{label}</label>
      <div className="relative group">
        <input
          type="text"
          value={displayText}
          onChange={handleTextChange}
          placeholder="DD/MM/YYYY"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center h-full">
          <div className="relative flex items-center">
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
    </div>
  );
};

const AdminSearch: React.FC<AdminSearchProps> = ({ users, tasks, documents, isAdmin, currentUser, onUpdateTask, onResetUserPassword, initialSelectedUserId }) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(initialSelectedUserId || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    if (initialSelectedUserId) setSelectedUserId(initialSelectedUserId);
  }, [initialSelectedUserId]);

  const isFullAccess = currentUser.notes === 'AD1' || currentUser.notes === 'VT';
  const isAD = currentUser.notes === 'AD1' || currentUser.notes === 'AD2';
  const isManager = currentUser.delegateLevel === 'X1' || currentUser.position?.toLowerCase().includes('trưởng phòng') || isFullAccess;

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskData, setEditTaskData] = useState<Partial<Task>>({});

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setEditTaskData({
      content: task.content,
      leadId: task.leadId,
      collaboratorIds: task.collaboratorIds || [],
      deadline: task.deadline,
      complexity: task.complexity,
      category: task.category,
      outDocNumber: task.outDocNumber
    });
  };

  const handleSaveEdit = () => {
    if (editingTask) {
      if (!editTaskData.content) {
        alert('Vui lòng nhập nội dung công việc!');
        return;
      }
      onUpdateTask(editingTask.id, editTaskData);
      setEditingTask(null);
    }
  };

  const units = useMemo(() => Array.from(new Set(users.map(u => u.unit))), [users]);
  
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
    const now = Date.now();
    return tasks.filter(task => {
      const isMyTask = task.userId === currentUser.id || task.leadId === currentUser.id || task.collaboratorIds.includes(currentUser.id) || (task.forwarderIds && task.forwarderIds.includes(currentUser.id));
      
      if (!isFullAccess && !isMyTask) return false;

      const matchesUnit = (isFullAccess && selectedUnit) ? task.unit === selectedUnit : true;
      const matchesUser = (isFullAccess && selectedUserId) ? (task.userId === selectedUserId || task.leadId === selectedUserId || task.collaboratorIds.includes(selectedUserId)) : true;
      const matchesKeyword = searchKeyword ? task.content.toLowerCase().includes(searchKeyword.toLowerCase()) : true;
      const matchesComplexity = selectedComplexity ? task.complexity === selectedComplexity : true;
      const matchesCategory = selectedCategory ? task.category === selectedCategory : true;
      
      let matchesStatus = true;
      if (selectedStatus) {
        if (selectedStatus === 'QUÁ HẠN') {
          matchesStatus = task.status !== TaskStatus.COMPLETED && !!task.deadline && now > task.deadline;
        } else {
          matchesStatus = task.status === selectedStatus;
        }
      }
      
      const taskTime = task.startTime;
      const matchesStart = startDate ? taskTime >= new Date(startDate).getTime() : true;
      const matchesEnd = endDate ? taskTime <= new Date(endDate).getTime() + 86400000 : true;

      return matchesUnit && matchesUser && matchesKeyword && matchesStart && matchesEnd && matchesComplexity && matchesStatus && matchesCategory;
    });
  }, [tasks, users, selectedUnit, selectedUserId, searchKeyword, startDate, endDate, selectedComplexity, selectedStatus, selectedCategory, isFullAccess, currentUser]);

  const handleClearFilters = () => {
    setSearchKeyword('');
    setSelectedUnit('');
    setSelectedUserId('');
    setStartDate('');
    setEndDate('');
    setSelectedComplexity('');
    setSelectedStatus('');
    setSelectedCategory('');
  };

  const handleResetPass = (user: User) => {
    if (!isAD) return;
    if (window.confirm(`Xác nhận reset mật khẩu của nhân sự ${user.name} về mặc định (${DEFAULT_PASSWORD})?`)) {
      onResetUserPassword(user.email, DEFAULT_PASSWORD);
      alert('Đã reset mật khẩu thành công!');
    }
  };

  const exportToExcel = () => {
    const exportData = filteredTasks.map(t => {
      const creator = users.find(u => u.id === t.userId);
      const lead = users.find(u => u.id === t.leadId);
      const linkedDoc = t.documentId ? documents.find(d => d.id === t.documentId) : null;
      
      const forwarders = users.filter(u => t.forwarderIds?.includes(u.id));
      const collaborators = users.filter(u => t.collaboratorIds.includes(u.id));

      const chuTriText = forwarders.length > 0 ? forwarders.map(f => f.name).join(', ') : (lead?.name || 'N/A');
      const nguoiLamText = [lead?.name, ...collaborators.map(c => c.name)].filter(Boolean).join(', ') || 'N/A';

      return {
        'Người giao': creator?.name || 'N/A',
        'Người chủ trì': chuTriText,
        'Người làm': nguoiLamText,
        'Đơn vị': t.unit,
        'Nhóm công việc': t.category,
        'Số văn bản đi': t.outDocNumber || '-',
        'Ký hiệu/Số đến': linkedDoc ? `${linkedDoc.refCode} / ${linkedDoc.docNumber}` : '-',
        'Ngày VB/Đến': linkedDoc ? `${linkedDoc.docDate} / ${linkedDoc.arrivalDate}` : '-',
        'Đơn vị/MST': linkedDoc ? `${linkedDoc.senderUnit} / ${linkedDoc.taxCode}` : '-',
        'Nội dung': t.content,
        'Mức độ': t.complexity,
        'Trạng thái': t.status,
        'Hạn chót': t.deadline ? formatFullDateTime(t.deadline) : '-',
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Filter className="text-indigo-600" size={20} />
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Bộ lọc tra cứu</h2>
          </div>
          <button 
            onClick={handleClearFilters}
            className="flex items-center space-x-1.5 text-rose-500 hover:text-rose-700 text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            <RotateCcw size={14} />
            <span>Xóa bộ lọc</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
          <div className={`${isFullAccess ? 'lg:col-span-2' : 'lg:col-span-4'}`}>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Tìm theo nội dung công việc</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Nhập từ khóa nội dung..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
              />
            </div>
          </div>
          
          {isFullAccess && (
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="lg:col-span-2 flex gap-4">
            <SmartDateInput label="Thời gian từ" value={startDate} onChange={setStartDate} />
            <SmartDateInput label="Thời gian đến" value={endDate} onChange={setEndDate} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Nhóm công việc</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
            >
              <option value="">Tất cả nhóm</option>
              {Object.values(TaskCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Trạng thái công việc</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="QUÁ HẠN">🔴 Quá hạn</option>
              {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={exportToExcel} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-100 active:scale-95">
            <FileSpreadsheet size={18} /><span>Xuất báo cáo Excel</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-[0.2em]">Kết quả ({filteredTasks.length})</h3>
          {isAD && <span className="text-[10px] font-black text-amber-600 flex items-center bg-amber-50 px-3 py-1 rounded-full border border-amber-100 uppercase tracking-tighter"><ShieldAlert size={12} className="mr-1" /> Admin Panel</span>}
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs whitespace-nowrap table-auto">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest w-48 min-w-[185px]">Phụ trách</th>
                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest w-24 min-w-[100px]">Nhóm việc</th>
                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-center w-20 min-w-[85px]">Số VB đi</th>
                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest w-28 min-w-[110px]">Ký hiệu/Số đến</th>
                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest w-28 min-w-[110px]">Ngày VB/Đến</th>
                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest w-56 min-w-[200px] max-w-xs whitespace-normal">Đơn vị/MST</th>
                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest min-w-[380px] whitespace-normal">Nội dung</th>
                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-center w-24 min-w-[95px]">Trạng thái</th>
                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest w-36 min-w-[140px]">Hạn chót</th>
                {isAD && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-center w-16 min-w-[65px]">Pass</th>}
                {isManager && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-center w-16 min-w-[65px]">Sửa</th>}
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length > 0 ? filteredTasks.map(task => {
                const assigner = users.find(u => u.id === task.userId);
                const lead = users.find(u => u.id === task.leadId);
                // Loại bỏ người chủ trì khỏi danh sách phối hợp để tránh lặp tên trong danh sách hiển thị
                const collaborators = users.filter(u => task.collaboratorIds.includes(u.id) && u.id !== task.leadId);
                const forwarders = users.filter(u => task.forwarderIds?.includes(u.id));
                
                const isCompleted = task.status === TaskStatus.COMPLETED;
                const isOverdue = !isCompleted && task.deadline && Date.now() > task.deadline;
                const linkedDoc = task.documentId ? documents.find(d => d.id === task.documentId) : null;
                
                return (
                  <tr key={task.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${isOverdue ? 'bg-rose-50/30' : ''}`}>
                    <td className="px-6 py-4 w-48 min-w-[185px] whitespace-normal">
                      <div className="flex flex-col space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                           <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-400 font-black uppercase">Giao</span>
                           <span className="font-bold text-slate-700">{assigner?.name}</span>
                        </div>
                        
                        {forwarders.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[8px] bg-rose-50 px-1.5 py-0.5 rounded-md text-rose-400 font-black uppercase">Qua</span>
                            {forwarders.map(f => {
                              const isX2 = f.position.toLowerCase().includes('phó trưởng phòng');
                              return (
                                <span key={f.id} className={`font-black ${isX2 ? 'text-rose-600' : 'text-slate-500'}`}>{f.name}</span>
                              );
                            })}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-1">
                           <span className="text-[8px] bg-indigo-50 px-1.5 py-0.5 rounded-md text-indigo-400 font-black uppercase">Làm</span>
                           <span className="font-black text-indigo-600">{lead?.name}</span>
                           {collaborators.map(c => (
                             <span key={c.id} className="font-black text-indigo-400 text-[10px]">, {c.name}</span>
                           ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 w-24 min-w-[100px] whitespace-normal">
                      <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase border border-slate-200">{task.category}</span>
                    </td>
                    <td className="px-6 py-4 text-center w-20 min-w-[85px] whitespace-normal">
                      <div className="font-bold text-indigo-600">{task.outDocNumber || '-'}</div>
                    </td>
                    <td className="px-6 py-4 w-28 min-w-[110px] whitespace-normal">
                      {linkedDoc ? (
                        <>
                          <div className="font-bold text-slate-800">{linkedDoc.refCode}</div>
                          <div className="text-[10px] text-slate-400">Đến: {linkedDoc.docNumber}</div>
                        </>
                      ) : <span className="text-slate-300 italic text-[10px]">Không có</span>}
                    </td>
                    <td className="px-6 py-4 w-28 min-w-[110px] whitespace-normal">
                      {linkedDoc ? (
                        <>
                          <div className="font-medium text-slate-600">{linkedDoc.docDate ? linkedDoc.docDate.split('-').reverse().join('/') : '-'}</div>
                          <div className="text-[10px] text-slate-400">{linkedDoc.arrivalDate ? linkedDoc.arrivalDate.split('-').reverse().join('/') : '-'}</div>
                        </>
                      ) : <span className="text-slate-300 italic text-[10px]">-</span>}
                    </td>
                    <td className="px-6 py-4 w-56 min-w-[200px] max-w-xs whitespace-normal">
                      {linkedDoc ? (
                        <>
                          <div className="font-medium text-slate-700 leading-normal">{linkedDoc.senderUnit || '-'}</div>
                          <div className="text-[10px] font-black text-indigo-500 uppercase mt-1">{linkedDoc.taxCode || '-'}</div>
                        </>
                      ) : <span className="text-slate-300 italic text-[10px]">-</span>}
                    </td>
                    <td className="px-6 py-4 min-w-[380px] whitespace-normal">
                      <p className="font-medium text-slate-600 leading-relaxed text-sm">{task.content}</p>
                    </td>
                    <td className="px-6 py-4 text-center w-24 min-w-[95px] whitespace-normal">
                      <div className="flex flex-col items-center space-y-1">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                          isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          isOverdue ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>{isOverdue ? 'Quá hạn' : task.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 w-36 min-w-[140px] font-mono font-bold text-slate-400 whitespace-normal">
                      {task.deadline ? formatFullDateTime(task.deadline) : '-'}
                    </td>
                    {isAD && (
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => lead && handleResetPass(lead)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                          <KeyRound size={16} />
                        </button>
                      </td>
                    )}
                    {isManager && (
                      <td className="px-6 py-4 text-center">
                        {task.status !== TaskStatus.COMPLETED && (
                          <button 
                            onClick={() => handleEditClick(task)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                )
              }) : (
                <tr>
                   <td colSpan={isManager ? (isAD ? 11 : 10) : (isAD ? 10 : 9)} className="px-6 py-12 text-center text-slate-300 font-bold uppercase tracking-widest italic text-sm">Không tìm thấy kết quả</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in">
            <button onClick={() => setEditingTask(null)} className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors z-10"><X size={20} /></button>
            <div className="p-8 bg-indigo-600 text-white flex items-center space-x-3">
              <Edit2 size={28} />
              <h2 className="text-2xl font-black uppercase tracking-tight">Sửa thông tin giao việc</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Người chủ trì</label>
                <SearchableSelect 
                  label="Chọn người chủ trì"
                  options={unitEmployees.map(u => ({ id: u.id, label: u.name, subLabel: u.position }))}
                  value={editTaskData.leadId || ''}
                  onChange={v => setEditTaskData({...editTaskData, leadId: v})}
                  placeholder="Người chủ trì..."
                />
              </div>
              <div className="row-span-1 md:row-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Người phối hợp</label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl max-h-[140px] overflow-y-auto p-2">
                  {unitEmployees.filter(u => u.id !== editTaskData.leadId).map(u => (
                    <label key={u.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg cursor-pointer">
                      <input 
                        type="checkbox"
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        checked={(editTaskData.collaboratorIds || []).includes(u.id)}
                        onChange={(e) => {
                          const curr = editTaskData.collaboratorIds || [];
                          if (e.target.checked) setEditTaskData({...editTaskData, collaboratorIds: [...curr, u.id]});
                          else setEditTaskData({...editTaskData, collaboratorIds: curr.filter(id => id !== u.id)});
                        }}
                      />
                      <span className="text-sm font-medium text-slate-700">{u.name} <span className="text-slate-400 text-xs text-right">({u.position})</span></span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Nhóm việc</label>
                <select 
                  value={editTaskData.category || ''} 
                  onChange={e => setEditTaskData({...editTaskData, category: e.target.value as TaskCategory})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {Object.values(TaskCategory).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Số văn bản đi (nếu có)</label>
                <input 
                  type="text" 
                  value={editTaskData.outDocNumber || ''} 
                  onChange={e => setEditTaskData({...editTaskData, outDocNumber: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Mức độ</label>
                <select 
                  value={editTaskData.complexity || ''} 
                  onChange={e => setEditTaskData({...editTaskData, complexity: e.target.value as TaskComplexity})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {Object.values(TaskComplexity).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Nội dung công việc *</label>
                <textarea 
                  value={editTaskData.content || ''} 
                  onChange={e => setEditTaskData({...editTaskData, content: e.target.value})} 
                  rows={3} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium resize-none"
                ></textarea>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Hạn hoàn thành</label>
                <input 
                  type="datetime-local" 
                  value={editTaskData.deadline ? new Date(editTaskData.deadline - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} 
                  onChange={e => setEditTaskData({...editTaskData, deadline: e.target.value ? new Date(e.target.value).getTime() : undefined})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setEditingTask(null)} className="px-6 py-3 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-200 rounded-xl transition-colors">Hủy</button>
              <button onClick={handleSaveEdit} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-2">Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSearch;
