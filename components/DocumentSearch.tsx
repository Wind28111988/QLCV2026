
import React, { useState, useMemo } from 'react';
import { Document, Task, User, TaskStatus } from '../types';
import { Search, FileText, User as UserIcon, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const formatDate = (ds: string) => ds ? ds.split('-').reverse().join('/') : '-';

const DocumentSearch: React.FC<{ documents: Document[], tasks: Task[], users: User[] }> = ({ documents, tasks, users }) => {
  const [keyword, setKeyword] = useState('');

  const filteredDocs = useMemo(() => {
    return documents.filter(d => 
      d.refCode.toLowerCase().includes(keyword.toLowerCase()) || 
      d.summary.toLowerCase().includes(keyword.toLowerCase()) ||
      d.taxCode.toLowerCase().includes(keyword.toLowerCase())
    );
  }, [documents, keyword]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Tìm theo số ký hiệu, trích yếu hoặc mã số thuế..." 
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-100 uppercase font-black text-slate-400 tracking-widest">
            <tr>
              <th className="px-6 py-4">Ký hiệu/Số đến</th>
              <th className="px-6 py-4">Ngày VB/Đến</th>
              <th className="px-6 py-4">Đơn vị/MST</th>
              <th className="px-6 py-4">Trích yếu</th>
              <th className="px-6 py-4">Cán bộ xử lý</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4">Hạn/Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.map(doc => {
              const linkedTask = tasks.find(t => t.documentId === doc.id);
              const leadUser = linkedTask ? users.find(u => u.id === linkedTask.leadId) : null;
              
              return (
                <tr key={doc.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{doc.refCode}</div>
                    <div className="text-[10px] text-slate-400">Đến: {doc.docNumber}</div>
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
                    <p className="font-medium text-slate-600 line-clamp-2">{doc.summary}</p>
                  </td>
                  <td className="px-6 py-4">
                    {leadUser ? (
                      <div className="flex items-center space-x-2">
                        <UserIcon size={12} className="text-indigo-400" />
                        <span className="font-bold text-slate-700">{leadUser.name}</span>
                      </div>
                    ) : <span className="text-slate-300 italic">Chưa giao việc</span>}
                  </td>
                  <td className="px-6 py-4">
                    {linkedTask ? (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                        linkedTask.status === TaskStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        linkedTask.status === TaskStatus.IN_PROGRESS ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {linkedTask.status}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono font-bold text-rose-500">{formatDate(doc.deadline)}</div>
                    <div className="text-[10px] text-slate-400 italic">{doc.notes || '-'}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentSearch;
