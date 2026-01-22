
import React, { useState } from 'react';
import { Document } from '../types';
import { Calendar, Save, FileText } from 'lucide-react';

const SmartDateInput: React.FC<{
  label: string;
  value: string; 
  onChange: (val: string) => void;
  required?: boolean;
}> = ({ label, value, onChange, required }) => {
  const [displayText, setDisplayText] = useState('');
  
  React.useEffect(() => {
    if (value && value.includes('-')) {
      const [y, m, d] = value.split('-');
      setDisplayText(`${d}/${m}/${y}`);
    } else if (!value) {
      setDisplayText('');
    }
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 8);
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
      const ds = `${y}-${m}-${d}`;
      if (!isNaN(new Date(ds).getTime())) {
        onChange(ds);
      }
    } else if (raw.length === 0) {
      onChange('');
    }
  };

  return (
    <div className="w-full">
      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">
        {label} {required && '*'}
      </label>
      <div className="relative group">
        <input 
          type="text" 
          value={displayText} 
          onChange={handleTextChange} 
          placeholder="DD/MM/YYYY" 
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" 
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="relative h-8 w-8 flex items-center justify-center hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">
            <Calendar size={18} className="text-slate-400 pointer-events-none" />
            <input 
              type="date" 
              value={value} 
              onChange={(e) => onChange(e.target.value)} 
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const DocumentEntry: React.FC<{ onAdd: (doc) => void }> = ({ onAdd }) => {
  const [formData, setFormData] = useState<Partial<Document>>({
    refCode: '', 
    docNumber: '', 
    docDate: '', 
    arrivalDate: '', 
    senderUnit: '', 
    taxCode: '', 
    summary: '', 
    deadline: '', 
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.summary) {
        alert('Vui lòng nhập trích yếu văn bản!');
        return;
    }

    const doc: Document = {
      ...formData as Document,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      refCode: formData.refCode || '',
      docNumber: formData.docNumber || '',
      docDate: formData.docDate || '',
      arrivalDate: formData.arrivalDate || '',
      senderUnit: formData.senderUnit || '',
      taxCode: formData.taxCode || '',
      deadline: formData.deadline || '',
      notes: formData.notes || ''
    };
    onAdd(doc);
    alert('Đã lưu văn bản thành công!');
    setFormData({ 
      refCode: '', 
      docNumber: '', 
      docDate: '', 
      arrivalDate: '', 
      senderUnit: '', 
      taxCode: '', 
      summary: '', 
      deadline: '', 
      notes: '' 
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mb-12">
      <div className="p-8 bg-indigo-600 text-white flex items-center space-x-3">
        <FileText size={28} />
        <h2 className="text-2xl font-black uppercase tracking-tight">Tiếp nhận văn bản đến</h2>
      </div>
      <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Số ký hiệu</label>
          <input 
            type="text" 
            value={formData.refCode} 
            onChange={e => setFormData({...formData, refCode: e.target.value})} 
            placeholder="VD: 123/QD-TCT"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Số văn bản đến</label>
          <input 
            type="text" 
            value={formData.docNumber} 
            onChange={e => setFormData({...formData, docNumber: e.target.value})} 
            placeholder="VD: 456"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
          />
        </div>
        
        <SmartDateInput 
            label="Ngày văn bản" 
            value={formData.docDate || ''} 
            onChange={v => setFormData({...formData, docDate: v})} 
        />
        <SmartDateInput 
            label="Ngày đến" 
            value={formData.arrivalDate || ''} 
            onChange={v => setFormData({...formData, arrivalDate: v})} 
        />

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Đơn vị gửi</label>
          <input 
            type="text" 
            value={formData.senderUnit} 
            onChange={e => setFormData({...formData, senderUnit: e.target.value})} 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Mã số thuế</label>
          <input 
            type="text" 
            value={formData.taxCode} 
            onChange={e => setFormData({...formData, taxCode: e.target.value})} 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Trích yếu *</label>
          <textarea 
            required 
            value={formData.summary} 
            onChange={e => setFormData({...formData, summary: e.target.value})} 
            rows={3} 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
          />
        </div>

        <SmartDateInput 
            label="Hạn xử lý" 
            value={formData.deadline || ''} 
            onChange={v => setFormData({...formData, deadline: v})} 
        />
        
        <div className="md:col-span-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Ghi chú</label>
          <input 
            type="text" 
            value={formData.notes} 
            onChange={e => setFormData({...formData, notes: e.target.value})} 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
          />
        </div>

        <div className="md:col-span-2 pt-4">
          <button 
            type="submit" 
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 shadow-xl transition-all flex items-center justify-center space-x-2 active:scale-[0.98]"
          >
            <Save size={20} /> 
            <span>Lưu văn bản hệ thống</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentEntry;
