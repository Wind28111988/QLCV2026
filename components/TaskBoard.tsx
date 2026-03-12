
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, TaskStatus, TaskComplexity, Attachment, User, Document as Doc } from '../types';
import { Clock, CheckCircle2, PlayCircle, Plus, Edit2, Trash2, Search, X, Check, Paperclip, FileText, Image as ImageIcon, Eye, AlertTriangle, Calendar, Send, UserPlus } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

const pad = (n: number) => n.toString().padStart(2, '0');
const formatExplicit = (ts: number | undefined) => {
  if (!ts) return '-';
  const d = new Date(ts);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const SmartDateTimeInput: React.FC<{ label: string; value: string; onChange: (val: string) => void; }> = ({ label, value, onChange }) => {
  const [displayText, setDisplayText] = useState('');
  useEffect(() => {
    if (value) {
      const [datePart, timePart] = value.split('T');
      const [y, m, d] = datePart.split('-');
      setDisplayText(`${d}/${m}/${y} ${timePart || '00:00'}:00`);
    } else setDisplayText('');
  }, [value]);
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 14);
    let formatted = raw;
    if (raw.length >= 3 && raw.length <= 4) formatted = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    else if (raw.length >= 5 && raw.length <= 8) formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`;
    else if (raw.length >= 9) formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4, 8)} ${raw.slice(8, 10)}:${raw.slice(10, 12)}`;
    setDisplayText(formatted);
    if (raw.length >= 12) {
      const d = raw.slice(0, 2), m = raw.slice(2, 4), y = raw.slice(4, 8), hh = raw.slice(8, 10), min = raw.slice(10, 12);
      const ds = `${y}-${m}-${d}T${hh}:${min}`;
      if (!isNaN(new Date(ds).getTime())) onChange(ds);
    }
  };
  return (
    <div className="w-full">
      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">{label}</label>
      <div className="relative group">
        <input type="text" value={displayText} onChange={handleTextChange} placeholder="DD/MM/YYYY HH:mm:ss" className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" />
        <div className="absolute right-3 top-1/2 -translate-y-1/2"><Clock size={18} className="text-slate-300" /></div>
        <input type="datetime-local" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
      </div>
    </div>
  );
};

const ForwardModal: React.FC<{ isOpen: boolean; onClose: () => void; task: Task; currentUser: User; allUsers: User[]; onForward: (taskId: string, leadId: string, collaboratorIds: string[], unit: string) => void; }> = ({ isOpen, onClose, task, currentUser, allUsers, onForward }) => {
  const [leadId, setLeadId] = useState('');
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
  const [selectedUnit, setSelectedUnit] = useState(currentUser.unit);
  
  const targetEmployees = useMemo(() => {
    const canDelegateTo = (tl: string) => {
      const cr = parseInt(currentUser.delegateLevel.replace(/\D/g, '')) || 99, tr = parseInt(tl.replace(/\D/g, '')) || 99;
      return tr > cr;
    };
    const pool = allUsers.filter(u => u.unit === selectedUnit && canDelegateTo(u.delegateLevel));
    
    // Ưu tiên Phó trưởng phòng
    return [...pool].sort((a, b) => {
      const isViceA = a.position.toLowerCase().includes('phó trưởng phòng');
      const isViceB = b.position.toLowerCase().includes('phó trưởng phòng');
      if (isViceA && !isViceB) return -1;
      if (!isViceA && isViceB) return 1;
      return a.name.localeCompare(b.name, 'vi');
    });
  }, [selectedUnit, allUsers, currentUser.delegateLevel]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 bg-indigo-600 text-white flex justify-between items-center"><h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3"><Send size={24} /> Chuyển tiếp công việc</h2><button onClick={onClose}><X size={20} /></button></div>
        <form onSubmit={e => { e.preventDefault(); if(leadId) onForward(task.id, leadId, collaboratorIds, selectedUnit); onClose(); }} className="p-8 space-y-6 overflow-y-auto">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-600 text-sm">"{task.content}"</div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn vị tiếp nhận</label>
              <select value={selectedUnit} onChange={e => { setSelectedUnit(e.target.value); setLeadId(''); setCollaboratorIds([]); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-sm">
                {Array.from(new Set(allUsers.map(u => u.unit))).map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <SearchableSelect label="Người chủ trì mới" options={targetEmployees.map(u => ({ id: u.id, label: u.name, subLabel: u.position }))} value={leadId} onChange={setLeadId} placeholder="Chọn nhân sự..." />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Phối hợp mới</label>
            <div className="grid grid-cols-2 gap-2 p-4 bg-slate-50 rounded-2xl">
              {targetEmployees.filter(u => u.id !== leadId).map(u => (
                <button key={u.id} type="button" onClick={() => setCollaboratorIds(p => p.includes(u.id) ? p.filter(i => i !== u.id) : [...p, u.id])} className={`px-3 py-2 rounded-lg text-[10px] font-black border uppercase transition-all ${collaboratorIds.includes(u.id) ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500'}`}>{u.name}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 py-4 font-black uppercase text-[10px] tracking-widest text-slate-400">Hủy</button><button type="submit" disabled={!leadId} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all">Giao việc</button></div>
        </form>
      </div>
    </div>
  );
};

interface TaskBoardProps { tasks: Task[]; documents: Doc[]; onAddTask: any; onUpdateStatus: any; onUpdateTask: any; onDeleteTask: any; onForwardTask: any; currentUser: User; allUsers: User[]; }

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, documents, onAddTask, onUpdateStatus, onUpdateTask, onDeleteTask, onForwardTask, currentUser, allUsers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [content, setContent] = useState('');
  const [complexity, setComplexity] = useState<TaskComplexity>(TaskComplexity.MEDIUM);
  const [deadline, setDeadline] = useState('');
  const [outDocNumber, setOutDocNumber] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [forwardModal, setForwardModal] = useState<{ isOpen: boolean, task: Task | null }>({ isOpen: false, task: null });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nextOutDocNumber = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const tasksThisYear = tasks.filter(t => {
        const startTimeYear = new Date(t.startTime).getFullYear();
        return startTimeYear === currentYear && t.outDocNumber;
    });
    
    const maxNum = tasksThisYear.reduce((max, t) => {
        const num = parseInt(t.outDocNumber!, 10);
        return !isNaN(num) && num > max ? num : max;
    }, 0);
    
    return (maxNum + 1).toString();
  }, [tasks]);

  const filteredTasks = tasks.filter(t => t.content.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setContent(task.content);
    setComplexity(task.complexity);
    setDeadline(task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '');
    setOutDocNumber(task.outDocNumber || '');
    setAttachments(task.attachments || []);
    setIsModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return;
    const newAtts = await Promise.all(Array.from(files).map((file: File) => new Promise<Attachment>((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve({ name: file.name, type: file.type, data: ev.target?.result as string });
      reader.readAsDataURL(file);
    })));
    setAttachments([...attachments, ...newAtts]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const deadlineTs = deadline ? new Date(deadline).getTime() : undefined;
    if (editingTask) onUpdateTask(editingTask.id, { content, complexity, deadline: deadlineTs, attachments, outDocNumber });
    else onAddTask(content, complexity, undefined, [], attachments, deadlineTs, undefined, undefined, undefined, outDocNumber);
    setIsModalOpen(false); setEditingTask(null); setContent(''); setComplexity(TaskComplexity.MEDIUM); setDeadline(''); setOutDocNumber(''); setAttachments([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Tìm kiếm công việc..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm" />
        </div>
        <button onClick={() => { setEditingTask(null); setContent(''); setDeadline(''); setAttachments([]); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2 shadow-lg"><Plus size={18} /><span>Thêm việc</span></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[TaskStatus.TO_DO, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED].map(status => (
          <div key={status} className="flex flex-col h-full bg-slate-100/50 rounded-[2rem] border border-slate-200 p-2 min-h-[500px]">
            <div className="p-4 flex items-center justify-between"><h3 className="font-black text-slate-700 uppercase text-[10px] tracking-widest">{status}</h3><span className="bg-white px-2 py-0.5 rounded-lg text-[10px] font-black text-slate-400 border border-slate-200">{filteredTasks.filter(t => t.status === status).length}</span></div>
            <div className="flex-1 p-2 space-y-3 overflow-y-auto">
              {filteredTasks.filter(t => t.status === status).map(task => {
                const canForward = task.leadId === currentUser.id && task.status === TaskStatus.TO_DO;
                const lead = allUsers.find(u => u.id === task.leadId);
                const collaborators = allUsers.filter(u => task.collaboratorIds.includes(u.id));
                const linkedDoc = task.documentId ? documents.find(d => d.id === task.documentId) : null;
                
                const leadName = lead?.name || 'N/A';
                const collabNames = collaborators.map(c => c.name).join(', ');
                const inChargeText = collabNames ? `${leadName}, ${collabNames}` : leadName;

                return (
                  <div key={task.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group overflow-hidden">
                    <div className="flex justify-between items-start mb-3"><span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${task.complexity === TaskComplexity.VERY_HARD ? 'bg-rose-50 text-rose-600' : task.complexity === TaskComplexity.HARD ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>{task.complexity}</span><div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleOpenEdit(task)} className="p-1.5 text-slate-400 hover:text-indigo-600"><Edit2 size={14} /></button><button onClick={() => onDeleteTask(task.id)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button></div></div>
                    <p className="text-sm font-bold text-slate-800 mb-4 leading-relaxed">{task.content}</p>
                    
                    <div className="space-y-1.5 mb-4 text-[10px] text-slate-600">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-slate-400 min-w-[70px]">Phụ trách:</span>
                        <span className="font-medium">{inChargeText}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-slate-400 min-w-[70px]">Nhóm việc:</span>
                        <span className="font-medium bg-slate-100 px-1.5 py-0.5 rounded text-[9px] uppercase">{task.category}</span>
                      </div>
                      {task.outDocNumber && (
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-slate-400 min-w-[70px]">Số VB đi:</span>
                          <span className="font-medium text-indigo-600">{task.outDocNumber}</span>
                        </div>
                      )}
                      {linkedDoc && (
                        <>
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-slate-400 min-w-[70px]">KH/Số đến:</span>
                            <span className="font-medium">{linkedDoc.refCode} / {linkedDoc.docNumber}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-slate-400 min-w-[70px]">Ngày VB/Đến:</span>
                            <span className="font-medium">{linkedDoc.docDate ? linkedDoc.docDate.split('-').reverse().join('/') : '-'} / {linkedDoc.arrivalDate ? linkedDoc.arrivalDate.split('-').reverse().join('/') : '-'}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-slate-400 min-w-[70px]">Đơn vị/MST:</span>
                            <span className="font-medium">{linkedDoc.senderUnit || '-'} / {linkedDoc.taxCode || '-'}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-1 text-[9px] font-bold text-slate-400 uppercase tracking-tighter"><div><Calendar size={10} className="inline mr-1" /> Hạn: {formatExplicit(task.deadline)}</div>{task.completedTime && <div className="text-emerald-500"><Check size={10} className="inline mr-1" /> Xong: {formatExplicit(task.completedTime)}</div>}</div>
                    {task.attachments && task.attachments.length > 0 && <div className="mt-3 flex flex-wrap gap-1"><Paperclip size={10} className="text-slate-300" /> <span className="text-[9px] font-bold text-slate-400 italic">{task.attachments.length} tệp đính kèm</span></div>}
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex -space-x-2"><img src={`https://picsum.photos/seed/${task.userId}/100`} className="w-6 h-6 rounded-full border-2 border-white" alt="assigner" /><img src={`https://picsum.photos/seed/${task.leadId}/100`} className="w-6 h-6 rounded-full border-2 border-white" alt="lead" /></div>
                      <div className="flex items-center space-x-1">
                        {canForward && <button onClick={() => setForwardModal({ isOpen: true, task })} className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[8px] font-black uppercase hover:bg-amber-600 hover:text-white"><Send size={10} className="inline mr-1" /> Giao</button>}
                        {status !== TaskStatus.COMPLETED && <button onClick={() => onUpdateStatus(task.id, status === TaskStatus.TO_DO ? TaskStatus.IN_PROGRESS : TaskStatus.COMPLETED)} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase">{status === TaskStatus.TO_DO ? 'Bắt đầu' : 'Hoàn thành'}</button>}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between"><h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{editingTask ? 'Sửa công việc' : 'Thêm việc mới'}</h2><button onClick={() => setIsModalOpen(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <textarea required value={content} onChange={e => setContent(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm" rows={3} placeholder="Nội dung công việc..." />
              <div className="grid grid-cols-2 gap-4">
                <select value={complexity} onChange={e => setComplexity(e.target.value as TaskComplexity)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-xs uppercase">
                  {Object.values(TaskComplexity).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <SmartDateTimeInput label="Hạn chót" value={deadline} onChange={setDeadline} />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Số văn bản đi (Gợi ý: {nextOutDocNumber})</label>
                <input type="text" value={outDocNumber} onChange={e => setOutDocNumber(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm" placeholder={`VD: ${nextOutDocNumber}`} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tệp đính kèm</label><button type="button" onClick={() => fileInputRef.current?.click()} className="text-indigo-600 text-[10px] font-black uppercase"><Paperclip size={14} className="inline mr-1" /> Thêm tệp</button></div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
                {attachments.length > 0 && <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl max-h-24 overflow-y-auto">{attachments.map((a, i) => <div key={i} className="flex items-center space-x-1 bg-white px-2 py-1 rounded text-[9px] font-bold border"><span>{a.name}</span><button type="button" onClick={() => setAttachments(p => p.filter((_, idx) => idx !== i))} className="text-rose-500"><X size={10} /></button></div>)}</div>}
              </div>
              <div className="pt-4 flex gap-3"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400">Hủy</button><button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">Lưu</button></div>
            </form>
          </div>
        </div>
      )}
      {forwardModal.isOpen && forwardModal.task && <ForwardModal isOpen={forwardModal.isOpen} onClose={() => setForwardModal({ isOpen: false, task: null })} task={forwardModal.task} currentUser={currentUser} allUsers={allUsers} onForward={onForwardTask} />}
    </div>
  );
};

export default TaskBoard;
