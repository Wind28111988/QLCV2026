
import React, { useState, useMemo, useEffect } from 'react';
import { Document, Task, User, TaskStatus, TaskCategory } from '../types';
import { Search, FileText, User as UserIcon, CheckCircle, Clock, AlertCircle, Calendar, Filter, FileSpreadsheet } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

declare const XLSX: any;

const formatDate = (ds: string) => ds ? ds.split('-').reverse().join('/') : '-';

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
    let raw = e.target.value.replace(/\D/g, '').slice(0, 8);
    let formatted = raw;
    if (raw.length >= 3 && raw.length <= 4) formatted = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    else if (raw.length >= 5) formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`;
    setDisplayText(formatted);
    if (raw.length === 8) {
      const d = raw.slice(0, 2), m = raw.slice(2, 4), y = raw.slice(4, 8);
      const ds = `${y}-${m}-${d}`;
      if (!isNaN(new Date(ds).getTime())) onChange(ds);
    } else if (raw.length === 0) onChange('');
  };

  return (
    <div className="flex-1 min-w-[140px]">
      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">{label}</label>
      <div className="relative group">
        <input type="text" value={displayText} onChange={handleTextChange} placeholder="DD/MM/YYYY" className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all" />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center h-full">
          <div className="relative flex items-center justify-center">
            <Calendar size={16} className="text-slate-300 group-focus-within:text-indigo-500 pointer-events-none" />
            <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

const DocumentSearch: React.FC<{ documents: Document[], tasks: Task[], users: User[] }> = ({ documents, tasks, users }) => {
  const [keyword, setKeyword] = useState('');
  const [staffId, setStaffId] = useState('all');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const staffOptions = useMemo(() => {
    const opts = users.map(u => ({ id: u.id, label: u.name, subLabel: u.position }));
    return [
      { id: 'all', label: 'Tất cả cán bộ' },
      { id: 'unassigned', label: 'Chưa giao việc' },
      ...opts
    ];
  }, [users]);

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const linkedTask = tasks.find(t => t.documentId === doc.id);
      
      const matchesKeyword = !keyword || (
        doc.refCode.toLowerCase().includes(keyword.toLowerCase()) || 
        doc.summary.toLowerCase().includes(keyword.toLowerCase()) ||
        doc.taxCode.toLowerCase().includes(keyword.toLowerCase())
      );

      let matchesStaff = true;
      if (staffId === 'unassigned') matchesStaff = !linkedTask;
      else if (staffId !== 'all') matchesStaff = linkedTask?.leadId === staffId;

      let matchesStatus = true;
      if (status === 'unassigned') matchesStatus = !linkedTask;
      else if (status !== 'all') matchesStatus = linkedTask?.status === status;

      const matchesCategory = category === 'all' || doc.category === category;

      const arrivalTs = doc.arrivalDate ? new Date(doc.arrivalDate).getTime() : 0;
      const startTs = startDate ? new Date(startDate).getTime() : 0;
      const endTs = endDate ? new Date(endDate).getTime() : Infinity;
      const matchesDate = arrivalTs >= startTs && arrivalTs <= (endDate ? endTs + 86400000 : Infinity);

      return matchesKeyword && matchesStaff && matchesStatus && matchesDate && matchesCategory;
    });
  }, [documents, tasks, keyword, staffId, status, category, startDate, endDate]);

  const exportToExcel = () => {
    const data = filteredDocs.map(doc => {
      const linkedTask = tasks.find(t => t.documentId === doc.id);
      const leadUser = linkedTask ? users.find(u => u.id === linkedTask.leadId) : null;
      return {
        'Nhóm việc': doc.category,
        'Số ký hiệu': doc.refCode,
        'Số văn bản đến': doc.docNumber,
        'Số văn bản đi': linkedTask?.outDocNumber || '-',
        'Ngày văn bản': formatDate(doc.docDate),
        'Ngày đến': formatDate(doc.arrivalDate),
        'Đơn vị gửi': doc.senderUnit,
        'Mã số thuế': doc.taxCode,
        'Trích yếu': doc.summary,
        'Cán bộ xử lý': leadUser?.name || 'Chưa giao',
        'Trạng thái': linkedTask?.status || 'Chưa giao',
        'Hạn xử lý': formatDate(doc.deadline),
        'Ghi chú': doc.notes
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sach van ban");
    XLSX.writeFile(workbook, `Tra_cuu_van_ban_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center space-x-2 text-indigo-600 mb-2">
            <Filter size={20} />
            <h2 className="font-black uppercase tracking-widest text-sm">Bộ lọc nâng cao</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Từ khóa tra cứu</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input type="text" placeholder="Tìm theo số ký hiệu, trích yếu, mã số thuế..." value={keyword} onChange={e => setKeyword(e.target.value)} className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm" />
            </div>
          </div>
          <SearchableSelect label="Cán bộ xử lý" options={staffOptions} value={staffId} onChange={setStaffId} placeholder="Tất cả cán bộ" />
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Trạng thái xử lý</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium">
              <option value="all">Tất cả trạng thái</option>
              <option value="unassigned">Chưa giao việc</option>
              {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Nhóm công việc</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium">
              <option value="all">Tất cả nhóm</option>
              {Object.values(TaskCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-end gap-4">
          <div className="flex flex-1 gap-4 w-full">
            <SmartDateInput label="Văn bản đến từ ngày" value={startDate} onChange={setStartDate} />
            <SmartDateInput label="Đến ngày" value={endDate} onChange={setEndDate} />
          </div>
          <div className="flex gap-2 w-full lg:w-auto">
            <button onClick={() => { setKeyword(''); setStaffId('all'); setStatus('all'); setCategory('all'); setStartDate(''); setEndDate(''); }} className="flex-1 lg:flex-none px-6 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-colors">Xóa bộ lọc</button>
            <button onClick={exportToExcel} className="flex-1 lg:flex-none px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-100 active:scale-95">
                <FileSpreadsheet size={16} />
                <span>Xuất Excel</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-100 uppercase font-black text-slate-400 tracking-widest">
            <tr>
              <th className="px-6 py-4">Nhóm việc</th>
              <th className="px-6 py-4">Ký hiệu/Số đến/Số đi</th>
              <th className="px-6 py-4">Ngày VB/Đến</th>
              <th className="px-6 py-4">Đơn vị/MST</th>
              <th className="px-6 py-4">Trích yếu</th>
              <th className="px-6 py-4">Cán bộ xử lý</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4">Hạn/Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.length > 0 ? filteredDocs.map(doc => {
              const linkedTask = tasks.find(t => t.documentId === doc.id);
              const leadUser = linkedTask ? users.find(u => u.id === linkedTask.leadId) : null;
              
              return (
                <tr key={doc.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 uppercase">{doc.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{doc.refCode}</div>
                    <div className="text-[10px] text-slate-400">Đến: {doc.docNumber}</div>
                    <div className="text-[10px] text-indigo-500 font-bold">Đi: {linkedTask?.outDocNumber || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-600">{formatDate(doc.docDate)}</div>
                    <div className="text-[10px] text-slate-400">{formatDate(doc.arrivalDate)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-700">{doc.senderUnit || '-'}</div>
                    <div className="text-[10px] font-black text-indigo-500 uppercase">{doc.taxCode || '-'}</div>
                  </td>
                  <td className="px-6 py-4 max-w-xs whitespace-normal">
                    <p className="font-medium text-slate-600 line-clamp-2 leading-relaxed">{doc.summary}</p>
                  </td>
                  <td className="px-6 py-4">
                    {leadUser ? (
                      <div className="flex items-center space-x-2">
                        <UserIcon size={12} className="text-indigo-400" />
                        <span className="font-bold text-slate-700">{leadUser.name}</span>
                      </div>
                    ) : <span className="text-slate-300 italic">Chưa giao việc</span>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {linkedTask ? (
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                        linkedTask.status === TaskStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        linkedTask.status === TaskStatus.IN_PROGRESS ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500'
                      }`}>
                        {linkedTask.status}
                      </span>
                    ) : <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-slate-100 text-slate-400 border border-slate-200 italic">Chưa giao</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono font-bold text-rose-500">{formatDate(doc.deadline)}</div>
                    <div className="text-[10px] text-slate-400 italic max-w-[150px] truncate">{doc.notes || '-'}</div>
                  </td>
                </tr>
              );
            }) : (
                <tr>
                    <td colSpan={8} className="px-6 py-20 text-center text-slate-300 italic uppercase font-black tracking-widest">Không tìm thấy văn bản phù hợp</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentSearch;
