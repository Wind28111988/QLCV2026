
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, TaskStatus, TaskComplexity, Attachment, User } from '../types';
import { Clock, CheckCircle2, PlayCircle, Plus, Edit2, Trash2, Search, X, Check, Paperclip, FileText, Image as ImageIcon, Eye, AlertTriangle, Calendar, Send, UserPlus } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

const pad = (n: number) => n.toString().padStart(2, '0');

const formatExplicit = (ts: number | undefined) => {
  if (!ts) return '-';
  const d = new Date(ts);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const SmartDateTimeInput: React.FC<{
  label: string;
  value: string; // ISO format: YYYY-MM-DDTHH:mm
  onChange: (val: string) => void;
}> = ({ label, value, onChange }) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (value) {
      const [datePart, timePart] = value.split('T');
      const [y, m, d] = datePart.split('-');
      const [hh, min] = timePart.split(':');
      setDisplayText(`${d}/${m}/${y} ${hh}:${min}:00`);
    } else {
      setDisplayText('');
    }
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.length > 14) raw = raw.slice(0, 14);

    let formatted = raw;
    if (raw.length >= 3 && raw.length <= 4) formatted = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    else if (raw.length >= 5 && raw.length <= 8) formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`;
    else if (raw.length >= 9 && raw.length <= 10) formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4, 8)} ${raw.slice(8)}`;
    else if (raw.length >= 11 && raw.length <= 12) formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4, 8)} ${raw.slice(8, 10)}:${raw.slice(10)}`;
    else if (raw.length >= 13) formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4, 8)} ${raw.slice(8, 10)}:${raw.slice(10, 12)}:${raw.slice(12)}`;

    setDisplayText(formatted);

    if (raw.length === 14 || raw.length === 12) {
      const d = raw.slice(0, 2);
      const m = raw.slice(2, 4);
      const y = raw.slice(4, 8);
      const hh = raw.slice(8, 10);
      const min = raw.slice(10, 12);
      
      const dateStr = `${y}-${m}-${d}T${hh}:${min}`;
      if (!isNaN(new Date(dateStr).getTime())) {
        onChange(dateStr);
      }
    }
  };

  return (
    <div className="w-full">
      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">{label}</label>
      <div className="relative group">
        <input
          type="text"
          value={displayText}
          onChange={handleTextChange}
          placeholder="DD/MM/YYYY HH:mm:ss"
          className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center h-full">
          <div className="relative flex items-center">
            <Clock size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors pointer-events-none" />
            <input
              type="datetime-local"
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

// Component Modal để chuyển tiếp công việc
const ForwardModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  currentUser: User;
  allUsers: User[];
  onForward: (taskId: string, leadId: string, collaboratorIds: string[]) => void;
}> = ({ isOpen, onClose, task, currentUser, allUsers, onForward }) => {
  const [leadId, setLeadId] = useState('');
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
  const [selectedUnit, setSelectedUnit] = useState(currentUser.unit);

  const canDelegateTo = (targetLevel: string) => {
    const currRank = parseInt(currentUser.delegateLevel.replace(/\D/g, '')) || 99;
    const targetRank = parseInt(targetLevel.replace(/\D/g, '')) || 99;
    return targetRank > currRank;
  };

  const units = useMemo(() => Array.from(new Set(allUsers.map(u => u.unit))), [allUsers]);
  
  const targetEmployees = useMemo(() => {
    return allUsers.filter(u => u.unit === selectedUnit && canDelegateTo(u.delegateLevel));
  }, [selectedUnit, allUsers, currentUser.delegateLevel]);

  const leadOptions = useMemo(() => {
    return targetEmployees.map(u => ({
      id: u.id,
      label: u.name,
      subLabel: `${u.position} - ${u.delegateLevel}`
    }));
  }, [targetEmployees]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) return;
    onForward(task.id, leadId, collaboratorIds);
    onClose();
  };

  const toggleCollaborator = (id: string) => {
    setCollaboratorIds(prev => prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
            <Send size={24} /> Chuyển tiếp công việc
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-600 text-sm">
            "{task.content}"
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Đơn vị tiếp nhận</label>
              <select
                value={selectedUnit}
                onChange={(e) => { setSelectedUnit(e.target.value); setLeadId(''); setCollaboratorIds([]); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-sm"
              >
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <SearchableSelect label="Người chủ trì mới" options={leadOptions} value={leadId} onChange={setLeadId} placeholder="Chọn người chủ trì" />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-1 tracking-widest">Người phối hợp</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 max-h-40 overflow-y-auto">
              {targetEmployees.filter(u => u.id !== leadId).map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleCollaborator(u.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-[10px] border font-black uppercase transition-all ${
                    collaboratorIds.includes(u.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                  }`}
                >
                  <UserPlus size={12} />
                  <span className="truncate">{u.name}</span>
                </button>
              ))}
              {targetEmployees.filter(u => u.id !== leadId).length === 0 && (
                <div className="col-span-2 text-center text-[10px] text-slate-400 py-4">Không có nhân sự phối hợp phù hợp</div>
              )}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 bg-slate-50 hover:bg-slate-100">Hủy</button>
             <button type="submit" disabled={!leadId} className={`flex-1 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${leadId ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Xác nhận giao việc</button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface TaskBoardProps {
  tasks: Task[];
  onAddTask: (content: string, complexity: TaskComplexity, leadId?: string, collaboratorIds?: string[], attachments?: Attachment[], deadline?: number) => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onForwardTask: (taskId: string, leadId: string, collaboratorIds: string[]) => void;
  currentUser: User;
  allUsers: User[];
}

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onAddTask, onUpdateStatus, onUpdateTask, onDeleteTask, onForwardTask, currentUser, allUsers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [content, setContent] = useState('');
  const [complexity, setComplexity] = useState<TaskComplexity>(TaskComplexity.MEDIUM);
  const [deadline, setDeadline] = useState('');

  const [forwardModal, setForwardModal] = useState<{ isOpen: boolean, task: Task | null }>({ isOpen: false, task: null });

  const filteredTasks = tasks.filter(t => t.content.toLowerCase().includes(searchTerm.toLowerCase()));

  const columns = [
    { status: TaskStatus.TO_DO, icon: PlayCircle, color: 'slate' },
    { status: TaskStatus.IN_PROGRESS, icon: Clock, color: 'amber' },
    { status: TaskStatus.COMPLETED, icon: CheckCircle2, color: 'emerald' },
  ];

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setContent(task.content);
    setComplexity(task.complexity);
    setDeadline(task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const deadlineTs = deadline ? new Date(deadline).getTime() : undefined;
    
    if (editingTask) {
      onUpdateTask(editingTask.id, { content, complexity, deadline: deadlineTs });
    } else {
      onAddTask(content, complexity, undefined, [], [], deadlineTs);
    }
    
    setIsModalOpen(false);
    setEditingTask(null);
    setContent('');
    setComplexity(TaskComplexity.MEDIUM);
    setDeadline('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm công việc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
          />
        </div>
        <button
          onClick={() => { setEditingTask(null); setContent(''); setDeadline(''); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100"
        >
          <Plus size={18} />
          <span>Thêm công việc</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map(({ status, icon: Icon, color }) => (
          <div key={status} className="flex flex-col h-full bg-slate-100/50 rounded-[2rem] border border-slate-200 p-2">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icon size={18} className={`text-${color}-500`} />
                <h3 className="font-black text-slate-700 uppercase text-[10px] tracking-widest">{status}</h3>
              </div>
              <span className="bg-white px-2 py-0.5 rounded-lg text-[10px] font-black text-slate-400 border border-slate-200">
                {filteredTasks.filter(t => t.status === status).length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-[500px] p-2 space-y-3 custom-scrollbar">
              {filteredTasks.filter(t => t.status === status).map(task => {
                const isLead = task.leadId === currentUser.id;
                const canForward = isLead && task.status === TaskStatus.TO_DO;

                return (
                  <div
                    key={task.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                  >
                    <div className={`absolute top-0 left-0 w-1 h-full bg-${color}-500`}></div>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                        task.complexity === TaskComplexity.VERY_HARD ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        task.complexity === TaskComplexity.HARD ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {task.complexity}
                      </span>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenEdit(task)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 size={14} /></button>
                        <button onClick={() => onDeleteTask(task.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    
                    <p className="text-sm font-bold text-slate-800 mb-4 leading-relaxed">{task.content}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        <Calendar size={12} className="mr-1" /> Hạn chót: {formatExplicit(task.deadline)}
                      </div>
                      {task.completedTime && (
                        <div className="flex items-center text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">
                          <Check size={12} className="mr-1" /> Xong: {formatExplicit(task.completedTime)}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex -space-x-2">
                        <img src={`https://picsum.photos/seed/${task.userId}/100`} className="w-6 h-6 rounded-full border-2 border-white" alt="assigner" title="Người giao" />
                        <img src={`https://picsum.photos/seed/${task.leadId}/100`} className="w-6 h-6 rounded-full border-2 border-white" alt="lead" title="Người chủ trì" />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {canForward && (
                          <button
                            onClick={() => setForwardModal({ isOpen: true, task })}
                            className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all flex items-center"
                          >
                            <Send size={12} className="mr-1" /> Giao việc
                          </button>
                        )}
                        {status !== TaskStatus.TO_DO && (
                          <button
                            onClick={() => onUpdateStatus(task.id, TaskStatus.TO_DO)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-lg transition-all"
                            title="Trở lại"
                          ><X size={14} /></button>
                        )}
                        {status !== TaskStatus.COMPLETED && (
                          <button
                            onClick={() => onUpdateStatus(task.id, status === TaskStatus.TO_DO ? TaskStatus.IN_PROGRESS : TaskStatus.COMPLETED)}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                          >
                            {status === TaskStatus.TO_DO ? 'Bắt đầu' : 'Hoàn thành'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{editingTask ? 'Cập nhật công việc' : 'Thêm công việc mới'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Nội dung công việc</label>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
                  rows={3}
                  placeholder="Nhập nội dung..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Mức độ</label>
                  <select
                    value={complexity}
                    onChange={(e) => setComplexity(e.target.value as TaskComplexity)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-xs uppercase"
                  >
                    {Object.values(TaskComplexity).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <SmartDateTimeInput
                  label="Hạn chót"
                  value={deadline}
                  onChange={setDeadline}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 bg-slate-50 hover:bg-slate-100 transition-all"
                >Hủy</button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                >{editingTask ? 'Lưu thay đổi' : 'Tạo mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {forwardModal.isOpen && forwardModal.task && (
        <ForwardModal
          isOpen={forwardModal.isOpen}
          onClose={() => setForwardModal({ isOpen: false, task: null })}
          task={forwardModal.task}
          currentUser={currentUser}
          allUsers={allUsers}
          onForward={onForwardTask}
        />
      )}
    </div>
  );
};

export default TaskBoard;
