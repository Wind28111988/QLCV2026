
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, TaskStatus, TaskComplexity, Attachment } from '../types';
import { Clock, CheckCircle2, PlayCircle, Plus, Edit2, Trash2, Search, X, Check, Paperclip, FileText, Image as ImageIcon, Eye } from 'lucide-react';

interface TaskCardProps { 
  task: Task; 
  now: number;
  editingTaskId: string | null;
  editContent: string;
  editComplexity: TaskComplexity;
  setEditContent: (v: string) => void;
  setEditComplexity: (v: TaskComplexity) => void;
  handleSaveEdit: () => void;
  setEditingTaskId: (v: string | null) => void;
  handleStartEdit: (t: Task) => void;
  onDeleteTask: (id: string) => void;
  onUpdateStatus: (id: string, s: TaskStatus) => void;
  onViewAttachment: (att: Attachment) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, now, editingTaskId, editContent, editComplexity, 
  setEditContent, setEditComplexity, handleSaveEdit, 
  setEditingTaskId, handleStartEdit, onDeleteTask, onUpdateStatus, onViewAttachment,
  onDragStart
}) => {
  const [isDraggable, setIsDraggable] = useState(true);
  const isEditing = editingTaskId === task.id;

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getComplexityColor = (comp: TaskComplexity) => {
    switch (comp) {
      case TaskComplexity.VERY_HARD: return 'bg-rose-100 text-rose-700 border-rose-200';
      case TaskComplexity.HARD: return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-sky-100 text-sky-700 border-sky-200';
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white p-4 rounded-2xl shadow-xl border-2 border-indigo-500 mb-4 animate-in zoom-in-95 w-full">
        <textarea
          autoFocus
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] text-sm font-medium"
        />
        <div className="mt-3 flex items-center justify-between">
          <select
            value={editComplexity}
            onChange={(e) => setEditComplexity(e.target.value as TaskComplexity)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none text-xs font-bold"
          >
            {Object.values(TaskComplexity).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex space-x-2">
            <button onClick={handleSaveEdit} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-all active:scale-90"><Check size={16} /></button>
            <button onClick={() => setEditingTaskId(null)} className="bg-slate-100 text-slate-400 p-2 rounded-lg hover:bg-slate-200 transition-all"><X size={16} /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      draggable={isDraggable} 
      onDragStart={(e) => onDragStart(e, task.id)}
      className="bg-white p-4 md:p-5 shadow-sm border border-slate-200 rounded-[1.5rem] mb-4 group hover:border-indigo-300 transition-all hover:shadow-md cursor-grab active:cursor-grabbing relative w-full overflow-hidden"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="grid grid-cols-2 gap-0.5 opacity-20 group-hover:opacity-40 transition-opacity">
            {[...Array(6)].map((_, i) => <div key={i} className="w-1 h-1 bg-slate-900 rounded-full"></div>)}
          </div>
          <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase border tracking-wider ${getComplexityColor(task.complexity)}`}>
            {task.complexity}
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          <button 
            type="button"
            onMouseEnter={() => setIsDraggable(false)}
            onMouseLeave={() => setIsDraggable(true)}
            onClick={(e) => { e.stopPropagation(); handleStartEdit(task); }} 
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
          >
            <Edit2 size={16} />
          </button>
          <button 
            type="button"
            onMouseEnter={() => setIsDraggable(false)}
            onMouseLeave={() => setIsDraggable(true)}
            onClick={(e) => { 
              e.stopPropagation(); 
              onDeleteTask(task.id); 
            }} 
            className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 rounded-xl transition-all border border-rose-100/50"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      
      <div className="pl-1 mb-5">
        <p className="font-bold text-slate-700 leading-relaxed text-sm md:text-base whitespace-pre-wrap break-words">{task.content}</p>
      </div>
      
      {task.attachments && task.attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4 pl-1">
          {task.attachments.map((att, i) => (
            <button 
              key={i} 
              onMouseEnter={() => setIsDraggable(false)}
              onMouseLeave={() => setIsDraggable(true)}
              onClick={(e) => { e.stopPropagation(); onViewAttachment(att); }}
              className="p-2 bg-slate-50 border border-slate-100 rounded-xl hover:bg-indigo-50 transition-colors"
              title={att.name}
            >
              <Paperclip size={12} className="text-slate-400" />
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-100 pl-1">
        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <Clock size={14} className="mr-1.5 text-slate-300" />
          {task.status === TaskStatus.COMPLETED 
            ? formatDuration((task.completedTime || 0) - task.startTime) 
            : formatDuration(now - task.startTime)}
        </div>
        <div className="flex space-x-2">
          {task.status === TaskStatus.TO_DO && (
            <button 
              onMouseEnter={() => setIsDraggable(false)}
              onMouseLeave={() => setIsDraggable(true)}
              onClick={(e) => { e.stopPropagation(); onUpdateStatus(task.id, TaskStatus.IN_PROGRESS); }} 
              className="text-indigo-600 hover:scale-110 transition-transform"
            >
              <PlayCircle size={28} />
            </button>
          )}
          {task.status === TaskStatus.IN_PROGRESS && (
            <button 
              onMouseEnter={() => setIsDraggable(false)}
              onMouseLeave={() => setIsDraggable(true)}
              onClick={(e) => { e.stopPropagation(); onUpdateStatus(task.id, TaskStatus.COMPLETED); }} 
              className="text-emerald-600 hover:scale-110 transition-transform"
            >
              <CheckCircle2 size={28} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface TaskBoardProps {
  tasks: Task[];
  onAddTask: (content: string, complexity: TaskComplexity, leadId?: string, collaboratorIds?: string[], attachments?: Attachment[]) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onAddTask, onUpdateStatus, onUpdateTask, onDeleteTask }) => {
  const [newContent, setNewContent] = useState('');
  const [newComplexity, setNewComplexity] = useState<TaskComplexity>(TaskComplexity.MEDIUM);
  const [newAttachments, setNewAttachments] = useState<Attachment[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editComplexity, setEditComplexity] = useState<TaskComplexity>(TaskComplexity.MEDIUM);
  const [searchTerm, setSearchTerm] = useState('');
  const [now, setNow] = useState(Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewerAtt, setViewerAtt] = useState<Attachment | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredTasks = useMemo(() => 
    tasks.filter(t => t.content.toLowerCase().includes(searchTerm.toLowerCase())), 
    [tasks, searchTerm]
  );

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
    setNewAttachments([...newAttachments, ...newAtts]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newContent.trim()) {
      onAddTask(newContent.trim(), newComplexity, undefined, undefined, newAttachments);
      setNewContent('');
      setNewAttachments([]);
    }
  };

  const handleSaveEdit = () => {
    if (editingTaskId && editContent.trim()) {
      onUpdateTask(editingTaskId, { content: editContent.trim(), complexity: editComplexity });
      setEditingTaskId(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(status);
  };
  
  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onUpdateStatus(taskId, status);
    }
    setDragOverCol(null);
  };

  const columns = [
    { title: "Cần làm", status: TaskStatus.TO_DO, color: "text-slate-500" },
    { title: "Đang làm", status: TaskStatus.IN_PROGRESS, color: "text-indigo-600" },
    { title: "Hoàn thành", status: TaskStatus.COMPLETED, color: "text-emerald-600" }
  ];

  return (
    <div className="space-y-6 w-full">
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Nội dung nhiệm vụ mới..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 text-base font-bold shadow-inner"
            />
            <div className="flex gap-2">
              <select
                value={newComplexity}
                onChange={(e) => setNewComplexity(e.target.value as TaskComplexity)}
                className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 outline-none text-xs font-black uppercase tracking-widest"
              >
                {Object.values(TaskComplexity).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-100 text-slate-500 p-4 rounded-2xl border border-slate-200 hover:bg-slate-200 transition-all"
              >
                <Paperclip size={24} />
              </button>
              <button type="submit" className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
                <Plus size={28} />
              </button>
            </div>
          </div>
          {newAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {newAttachments.map((att, i) => (
                <div key={i} className="flex items-center space-x-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 text-indigo-700 text-xs font-bold">
                  <span className="truncate max-w-[150px]">{att.name}</span>
                  <button type="button" onClick={() => setNewAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-indigo-400 hover:text-indigo-600"><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
        </form>
        <div className="mt-6 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm nhanh công việc..."
            className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-14 pr-6 py-3.5 text-sm font-bold outline-none focus:bg-white transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-10 min-h-[600px] w-full items-start auto-cols-fr">
        {columns.map(col => (
          <div 
            key={col.status} 
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => handleDrop(e, col.status)}
            className={`rounded-[2.5rem] p-4 md:p-5 flex flex-col transition-all duration-300 border h-full min-w-0 ${
              dragOverCol === col.status ? 'bg-indigo-50 border-2 border-dashed border-indigo-400' : 'bg-slate-100/30 border-transparent shadow-inner'
            }`}
          >
            <div className="flex items-center justify-between mb-6 px-3">
              <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${col.color}`}>{col.title}</h3>
              <span className="bg-white px-3 py-1.5 rounded-xl text-[10px] font-black text-slate-400 border border-slate-100 shadow-sm">
                {filteredTasks.filter(t => t.status === col.status).length}
              </span>
            </div>
            <div className="flex-1 space-y-4 w-full overflow-y-auto hide-scrollbar max-h-[1200px]">
              {filteredTasks.filter(t => t.status === col.status).map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  now={now}
                  editingTaskId={editingTaskId}
                  editContent={editContent}
                  editComplexity={editComplexity}
                  setEditContent={setEditContent}
                  setEditComplexity={setEditComplexity}
                  handleSaveEdit={handleSaveEdit}
                  setEditingTaskId={setEditingTaskId}
                  handleStartEdit={(t) => { setEditingTaskId(t.id); setEditContent(t.content); setEditComplexity(t.complexity); }}
                  onDeleteTask={onDeleteTask}
                  onUpdateStatus={onUpdateStatus}
                  onViewAttachment={setViewerAtt}
                  onDragStart={handleDragStart}
                />
              ))}
              {filteredTasks.filter(t => t.status === col.status).length === 0 && (
                <div className="py-20 text-center opacity-10">
                  <Plus size={48} className="mx-auto" />
                  <p className="text-[10px] font-black uppercase tracking-widest mt-2">Trống</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {viewerAtt && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight truncate pr-8">{viewerAtt.name}</h2>
              <button type="button" onClick={() => setViewerAtt(null)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all"><X size={28} /></button>
            </div>
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-50/30">
              {viewerAtt.type.startsWith('image/') ? (
                <img src={viewerAtt.data} alt={viewerAtt.name} className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl border-8 border-white" />
              ) : (
                <div className="text-center py-20">
                  <FileText size={100} className="mx-auto text-indigo-100 mb-8" />
                  <p className="text-slate-400 font-bold mb-8">Không thể xem trực tiếp tệp này</p>
                  <a href={viewerAtt.data} download={viewerAtt.name} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-indigo-100 inline-block">Tải về máy</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
