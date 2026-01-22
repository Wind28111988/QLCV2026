
import React, { useState, useMemo, useRef } from 'react';
import { User, TaskStatus, TaskComplexity, Attachment } from '../types';
import { Send, Users, UserPlus, AlertCircle, ShieldAlert, Paperclip, X } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

interface DelegationProps {
  currentUser: User;
  users: User[];
  onAssign: (content: string, complexity: TaskComplexity, leadId: string, collaboratorIds: string[], attachments?: Attachment[]) => void;
}

const Delegation: React.FC<DelegationProps> = ({ currentUser, users, onAssign }) => {
  const [content, setContent] = useState('');
  const [complexity, setComplexity] = useState<TaskComplexity>(TaskComplexity.MEDIUM);
  const [selectedUnit, setSelectedUnit] = useState(currentUser.unit);
  const [leadId, setLeadId] = useState('');
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canDelegateTo = (targetLevel: string) => {
    const currRank = parseInt(currentUser.delegateLevel.replace(/\D/g, '')) || 99;
    const targetRank = parseInt(targetLevel.replace(/\D/g, '')) || 99;
    return targetRank > currRank;
  };

  const units = useMemo(() => Array.from(new Set(users.map(u => u.unit))), [users]);
  
  const targetEmployees = useMemo(() => {
    return users.filter(u => u.unit === selectedUnit && canDelegateTo(u.delegateLevel));
  }, [selectedUnit, users, currentUser.delegateLevel]);

  const leadOptions = useMemo(() => {
    return targetEmployees.map(u => ({
      id: u.id,
      label: u.name,
      subLabel: `${u.position} - ${u.delegateLevel}`
    }));
  }, [targetEmployees]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const loaders = Array.from(files).map(file => {
      return new Promise<Attachment>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve({ name: file.name, type: file.type, data: ev.target?.result as string });
        reader.readAsDataURL(file);
      });
    });
    const newAtts = await Promise.all(loaders);
    setAttachments([...attachments, ...newAtts]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !leadId) {
      alert('Vui lòng nhập đầy đủ nội dung và chọn người chủ trì.');
      return;
    }
    onAssign(content, complexity, leadId, collaboratorIds, attachments);
    alert(`Đã giao việc thành công cho ${users.find(u => u.id === leadId)?.name}.`);
    setContent('');
    setLeadId('');
    setCollaboratorIds([]);
    setAttachments([]);
  };

  const toggleCollaborator = (id: string) => {
    setCollaboratorIds(prev => prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mb-10">
        <div className="p-10 bg-indigo-600 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-black flex items-center space-x-4">
              <Send size={32} />
              <span>Giao nhiệm vụ công tác</span>
            </h2>
            <div className="flex items-center space-x-4 mt-4">
              <span className="bg-white/20 px-4 py-1.5 rounded-full text-xs font-black backdrop-blur-md uppercase tracking-widest border border-white/10">
                Cấp bậc: {currentUser.delegateLevel}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Nội dung công việc</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập mô tả chi tiết nhiệm vụ..."
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-6 py-5 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner font-medium text-lg leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Mức độ phức tạp</label>
              <select
                value={complexity}
                onChange={(e) => setComplexity(e.target.value as TaskComplexity)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none font-bold uppercase text-xs"
              >
                {Object.values(TaskComplexity).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Đơn vị tiếp nhận</label>
              <select
                value={selectedUnit}
                onChange={(e) => { setSelectedUnit(e.target.value); setLeadId(''); setCollaboratorIds([]); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none font-bold text-sm"
              >
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3 ml-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tài liệu đính kèm</label>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-indigo-600 text-xs font-black uppercase flex items-center hover:underline">
                <Paperclip size={14} className="mr-1" /> Thêm tệp
              </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 shadow-sm">
                    <span className="truncate max-w-[150px]">{att.name}</span>
                    <button type="button" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-rose-400 hover:text-rose-600"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phân công nhân sự</label>
            {targetEmployees.length > 0 ? (
              <div className="space-y-6">
                <SearchableSelect label="Người chủ trì" options={leadOptions} value={leadId} onChange={setLeadId} placeholder="Chọn người chủ trì" />
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-1 tracking-widest">Người phối hợp</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
                    {targetEmployees.filter(u => u.id !== leadId).map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleCollaborator(u.id)}
                        className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-xs border font-black uppercase transition-all ${
                          collaboratorIds.includes(u.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-[1.02]' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                        }`}
                      >
                        <UserPlus size={14} />
                        <span className="truncate">{u.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-amber-50 border border-amber-100 rounded-[2rem] text-center">
                <ShieldAlert size={40} className="mx-auto text-amber-500 mb-3" />
                <h3 className="text-amber-800 font-bold uppercase text-xs tracking-widest">Không có nhân sự phù hợp</h3>
                <p className="text-amber-600 text-[10px] font-bold mt-1 uppercase">Đơn vị này không có cấp dưới của bạn.</p>
              </div>
            )}
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={!leadId}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-2xl transition-all flex items-center justify-center space-x-3 ${
                leadId ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 active:scale-[0.98]' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <Send size={20} />
              <span>Xác nhận giao nhiệm vụ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Delegation;
