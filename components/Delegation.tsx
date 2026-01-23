
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, TaskStatus, TaskComplexity, Attachment, Document, Task } from '../types';
import { Send, Users, UserPlus, AlertCircle, ShieldAlert, Paperclip, X, Calendar, Clock, FileText, Search } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

const SmartDateTimeInput: React.FC<{
  label: string;
  value: string; 
  onChange: (val: string) => void;
}> = ({ label, value, onChange }) => {
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
        <input type="text" value={displayText} onChange={handleTextChange} placeholder="DD/MM/YYYY HH:mm:ss" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm" />
        <div className="absolute right-4 top-1/2 -translate-y-1/2"><Clock size={18} className="text-slate-300" /></div>
        <input type="datetime-local" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
      </div>
    </div>
  );
};

interface DelegationProps {
  currentUser: User;
  users: User[];
  documents: Document[];
  tasks: Task[];
  onAssign: (content: string, complexity: TaskComplexity, leadId: string, collaboratorIds: string[], attachments?: Attachment[], deadline?: number, documentId?: string) => void;
}

const Delegation: React.FC<DelegationProps> = ({ currentUser, users, documents, tasks, onAssign }) => {
  const [content, setContent] = useState('');
  const [complexity, setComplexity] = useState<TaskComplexity>(TaskComplexity.MEDIUM);
  const [deadline, setDeadline] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(currentUser.unit);
  const [leadId, setLeadId] = useState('');
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Logic lọc và sắp xếp văn bản
  const docOptions = useMemo(() => {
    // Chỉ lấy văn bản chưa có Task nào liên kết
    const assignedDocIds = new Set(tasks.map(t => t.documentId).filter(id => !!id));
    const unassignedDocs = documents.filter(d => !assignedDocIds.has(d.id));

    // Sắp xếp: có hạn hoàn thành gần nhất -> xa nhất -> không có hạn xử lý xếp cuối
    const sortedDocs = [...unassignedDocs].sort((a, b) => {
      // Trường hợp cả hai đều không có hạn
      if (!a.deadline && !b.deadline) return b.createdAt - a.createdAt;
      // Ưu tiên bản có hạn lên đầu
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      // So sánh ngày (YYYY-MM-DD)
      return a.deadline.localeCompare(b.deadline);
    });

    return sortedDocs.map(d => ({
      id: d.id,
      label: d.refCode || `Số đến: ${d.docNumber}`,
      subLabel: d.summary
    }));
  }, [documents, tasks]);

  const handleDocSelect = (docId: string) => {
    setSelectedDocId(docId);
    const doc = documents.find(d => d.id === docId);
    if (doc) {
      setContent(doc.summary);
      if (doc.deadline) {
        setDeadline(`${doc.deadline}T23:59`);
      }
    }
  };

  // 2. Logic sắp xếp nhân sự: Phó trưởng phòng lên trước
  const targetEmployees = useMemo(() => {
    const canDelegateTo = (targetLevel: string) => {
      const currRank = parseInt(currentUser.delegateLevel.replace(/\D/g, '')) || 99;
      const targetRank = parseInt(targetLevel.replace(/\D/g, '')) || 99;
      return targetRank > currRank;
    };
    
    const pool = users.filter(u => u.unit === selectedUnit && canDelegateTo(u.delegateLevel));
    
    return [...pool].sort((a, b) => {
      const isViceA = a.position.toLowerCase().includes('phó trưởng phòng');
      const isViceB = b.position.toLowerCase().includes('phó trưởng phòng');
      
      if (isViceA && !isViceB) return -1;
      if (!isViceA && isViceB) return 1;
      
      // Nếu cùng cấp thì xếp theo tên
      return a.name.localeCompare(b.name, 'vi');
    });
  }, [selectedUnit, users, currentUser.delegateLevel]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    // Explicitly cast to File to fix type 'unknown' errors
    const newAtts = await Promise.all(Array.from(files).map((file: File) => new Promise<Attachment>((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve({ name: file.name, type: file.type, data: ev.target?.result as string });
      reader.readAsDataURL(file);
    })));
    setAttachments([...attachments, ...newAtts]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !leadId) return;
    const deadlineTs = deadline ? new Date(deadline).getTime() : undefined;
    onAssign(content, complexity, leadId, collaboratorIds, attachments, deadlineTs, selectedDocId);
    alert('Đã giao nhiệm vụ thành công!');
    setContent(''); setLeadId(''); setDeadline(''); setCollaboratorIds([]); setAttachments([]); setSelectedDocId('');
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-10 bg-indigo-600 text-white"><h2 className="text-3xl font-black flex items-center space-x-4"><Send size={32} /> <span>Giao nhiệm vụ công tác</span></h2></div>
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="bg-indigo-50 p-6 rounded-[1.5rem] border border-indigo-100 space-y-4">
            <SearchableSelect 
              label="Căn cứ vào văn bản gốc (Chỉ hiển thị VB chưa giao)" 
              options={docOptions} 
              value={selectedDocId} 
              onChange={handleDocSelect} 
              placeholder="Chọn văn bản căn cứ..." 
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Nội dung công việc *</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} required rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-6 py-5 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-lg" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Mức độ</label>
              <select value={complexity} onChange={e => setComplexity(e.target.value as TaskComplexity)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-bold uppercase text-xs">
                {Object.values(TaskComplexity).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <SmartDateTimeInput label="Hạn chót" value={deadline} onChange={setDeadline} />
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Đơn vị nhận</label>
              <select value={selectedUnit} onChange={e => { setSelectedUnit(e.target.value); setLeadId(''); setCollaboratorIds([]); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-bold text-sm">
                {Array.from(new Set(users.map(u => u.unit))).map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3 ml-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tệp đính kèm</label>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-indigo-600 text-xs font-black uppercase flex items-center hover:underline"><Paperclip size={14} className="mr-1" /> Thêm tệp</button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                    <span className="truncate max-w-[120px]">{att.name}</span>
                    <button type="button" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-rose-500"><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <SearchableSelect label="Người chủ trì * (Ưu tiên PTP)" options={targetEmployees.map(u => ({ id: u.id, label: u.name, subLabel: u.position }))} value={leadId} onChange={setLeadId} placeholder="Chọn nhân sự..." />
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Phối hợp thực hiện</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {targetEmployees.filter(u => u.id !== leadId).map(u => (
                  <button key={u.id} type="button" onClick={() => setCollaboratorIds(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id])} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${collaboratorIds.includes(u.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}>
                    {u.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" disabled={!leadId} className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl transition-all ${leadId ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]' : 'bg-slate-200 text-slate-400'}`}>Xác nhận giao nhiệm vụ</button>
        </form>
      </div>
    </div>
  );
};

export default Delegation;
