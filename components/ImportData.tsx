
import React, { useState } from 'react';
import { User, Gender } from '../types';
import { ADMIN_EMAIL_IMPORT, DEFAULT_PASSWORD } from '../constants';
import { Upload, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

declare const XLSX: any;

interface ImportDataProps {
  currentUser: any;
  onImport: (users: User[]) => void;
}

const ImportData: React.FC<ImportDataProps> = ({ currentUser, onImport }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [importCount, setImportCount] = useState(0);

  if (currentUser.email !== ADMIN_EMAIL_IMPORT) {
    return (
      <div className="p-10 text-center">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 font-serif">Quyền truy cập bị hạn chế</h2>
        <p className="text-slate-500">Chỉ tài khoản Quản trị tối cao ({ADMIN_EMAIL_IMPORT}) mới có quyền thực hiện chức năng này.</p>
      </div>
    );
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setSuccess(false);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 'A' });

        const newUsers: User[] = jsonData.slice(1).map((row: any, index: number) => ({
          id: `u-${Date.now()}-${index}`,
          name: row.A || '',
          position: row.B || '',
          unit: row.C || '',
          gender: (row.D === 'Nữ' ? Gender.FEMALE : Gender.MALE),
          dob: row.E || '',
          phone: row.F || '',
          email: row.G || '',
          password: DEFAULT_PASSWORD,
          delegateLevel: row.H || 'X3',
          notes: row.I || '',
          mustChangePassword: true
        })).filter((u: User) => u.email);

        onImport(newUsers);
        setImportCount(newUsers.length);
        setSuccess(true);
      } catch (error) {
        alert('Lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng file.');
        console.error(error);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl text-center relative overflow-hidden">
        {success && (
          <div className="absolute inset-0 bg-emerald-600/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-white transition-all animate-in fade-in zoom-in duration-300">
            <CheckCircle2 size={80} className="mb-4" />
            <h2 className="text-3xl font-black uppercase tracking-tighter">Đồng bộ thành công!</h2>
            <p className="text-emerald-100 mt-2 font-medium">Hệ thống đã cập nhật dữ liệu của {importCount} nhân sự.</p>
            <button 
              onClick={() => setSuccess(false)}
              className="mt-8 bg-white text-emerald-700 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-50 transition-colors"
            >
              Tiếp tục cập nhật
            </button>
          </div>
        )}

        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Upload size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Cập nhật cơ sở dữ liệu</h2>
        <p className="text-slate-500 mb-10 max-w-md mx-auto font-medium">Tải lên file Excel mẫu chứa danh sách nhân sự mới. Hệ thống sẽ tự động đồng bộ dựa trên địa chỉ Email.</p>

        <div className="border-4 border-dashed border-slate-100 rounded-[2rem] p-12 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer relative group">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={isUploading}
          />
          <div className="space-y-4">
            <FileText size={64} className="mx-auto text-slate-200 group-hover:text-indigo-300 transition-colors" />
            <p className="text-lg font-bold text-slate-600">
              {isUploading ? 'Đang xử lý dữ liệu...' : 'Kéo thả file Excel vào đây'}
            </p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Định dạng hỗ trợ: .xlsx, .xls</p>
          </div>
        </div>

        <div className="mt-12 text-left bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-inner">
          <h3 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-[0.2em] flex items-center">
            <AlertCircle size={14} className="mr-2" /> Cấu trúc cột bắt buộc
          </h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs text-slate-500 font-bold">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 bg-white border border-slate-200 flex items-center justify-center rounded-md text-slate-800">A</span>
              <span>Họ tên</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 bg-white border border-slate-200 flex items-center justify-center rounded-md text-slate-800">F</span>
              <span>Số điện thoại</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 bg-white border border-slate-200 flex items-center justify-center rounded-md text-slate-800">B</span>
              <span>Chức vụ</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 bg-white border border-slate-200 flex items-center justify-center rounded-md text-slate-800">G</span>
              <span className="text-indigo-600 font-black">Email (Khóa chính)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 bg-white border border-slate-200 flex items-center justify-center rounded-md text-slate-800">C</span>
              <span>Đơn vị</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 bg-white border border-slate-200 flex items-center justify-center rounded-md text-slate-800">H</span>
              <span>Cấp giao việc (X1,X2...)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 bg-white border border-slate-200 flex items-center justify-center rounded-md text-slate-800">D</span>
              <span>Giới tính</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 bg-white border border-slate-200 flex items-center justify-center rounded-md text-slate-800">I</span>
              <span>Ghi chú (AD cho Admin)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 bg-white border border-slate-200 flex items-center justify-center rounded-md text-slate-800">E</span>
              <span>Ngày sinh</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportData;
