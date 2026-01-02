
import React, { useState } from 'react';
import { User } from '../types';
import { ADMIN_EMAIL_IMPORT, ADMIN_PASSWORD_2025, SYSTEM_RECOVERY_CODE, ADMIN_PREFIX } from '../constants';
import { ShieldAlert, X, CheckCircle2, KeyRound, Loader2 } from 'lucide-react';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
  onResetPassword: (email: string, newPass: string) => void;
}

const Login: React.FC<LoginProps> = ({ users, onLogin, onResetPassword }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();
    const fullEmail = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@gdt.gov.vn`;
    
    const user = users.find(u => 
      u.email.toLowerCase() === fullEmail && 
      u.password === cleanPassword
    );
    
    setTimeout(() => {
      if (user) {
        onLogin(user);
      } else {
        setError('Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.');
      }
      setIsLoggingIn(false);
    }, 500);
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = recoveryEmail.trim().toLowerCase();
    const fullEmail = email.includes('@') ? email : `${email}@gdt.gov.vn`;
    
    const userExists = users.some(u => u.email.toLowerCase() === fullEmail);
    
    if (!userExists) {
      setRecoveryMessage({ text: 'Địa chỉ email này không tồn tại trong hệ thống.', type: 'error' });
      return;
    }

    if (fullEmail === ADMIN_EMAIL_IMPORT.toLowerCase()) {
      if (recoveryCode === SYSTEM_RECOVERY_CODE) {
        onResetPassword(fullEmail, ADMIN_PASSWORD_2025);
        setRecoveryMessage({ 
          text: `Khôi phục thành công! Mật khẩu tài khoản Quản trị đã được reset về mặc định: ${ADMIN_PASSWORD_2025}`, 
          type: 'success' 
        });
      } else {
        setRecoveryMessage({ text: 'Mã khôi phục hệ thống không chính xác.', type: 'error' });
      }
    } else {
      setRecoveryMessage({ 
        text: 'Vui lòng liên hệ Quản trị viên (admin@gdt.gov.vn) để được cấp lại mật khẩu cho nhân sự.', 
        type: 'info' 
      });
    }
  };

  // Direct link format for Google Drive
  const logoUrl = "https://drive.google.com/uc?export=view&id=1FUb404uLq8ton8azidI9UrR1DLs7Byds";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
        <div className="p-10 md:p-14">
          <div className="text-center mb-10">
            <div className="w-32 h-32 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-amber-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-amber-400 shadow-xl bg-white p-1 flex items-center justify-center">
                <img 
                  src={logoUrl}
                  alt="Logo Thuế" 
                  className="w-full h-full object-contain scale-110"
                  onError={(e) => {
                    e.currentTarget.src = "https://www.gdt.gov.vn/wps/themes/html/V_GDT_Theme/images/logo.png";
                  }}
                />
              </div>
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-tight">Thuế TP Hải Phòng</h1>
            <p className="text-slate-500 mt-2 font-bold uppercase text-[10px] tracking-[0.2em]">Ứng dụng quản lý công việc</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-[11px] rounded-2xl border border-red-100 font-bold flex items-start animate-in fade-in slide-in-from-top-1">
                <ShieldAlert size={16} className="mr-2 shrink-0" />
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tài khoản công vụ</label>
              <div className="relative group">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="nhphong.hph"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700"
                />
                {!username.includes('@') && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs font-black uppercase pointer-events-none group-focus-within:text-indigo-300">
                    @gdt.gov.vn
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2 ml-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mật khẩu</label>
                <button 
                  type="button"
                  onClick={() => {
                    setIsRecoveryModalOpen(true);
                    setRecoveryMessage(null);
                    setRecoveryEmail(username);
                  }}
                  className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 transform active:scale-[0.98] transition-all flex items-center justify-center"
            >
              {isLoggingIn ? <Loader2 className="animate-spin" size={20} /> : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>

      {/* Modal Khôi phục */}
      {isRecoveryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden relative animate-in zoom-in duration-300">
            <button onClick={() => setIsRecoveryModalOpen(false)} className="absolute right-8 top-8 text-slate-400 hover:text-slate-800 transition-colors"><X size={24} /></button>
            <div className="p-12">
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6"><KeyRound size={32} /></div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Khôi phục mật khẩu</h2>
              {recoveryMessage && (
                <div className={`p-4 rounded-2xl mb-6 text-xs font-bold border flex items-start space-x-3 ${
                  recoveryMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                  recoveryMessage.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                }`}>
                  {recoveryMessage.type === 'success' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <ShieldAlert size={16} className="mt-0.5 shrink-0" />}
                  <span>{recoveryMessage.text}</span>
                </div>
              )}
              <form onSubmit={handleRecoverySubmit} className="space-y-5">
                <input
                  type="text"
                  required
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="Nhập email cần khôi phục..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                {(recoveryEmail.toLowerCase() === ADMIN_EMAIL_IMPORT.toLowerCase() || recoveryEmail.toLowerCase() === ADMIN_PREFIX) && (
                  <input
                    type="text"
                    required
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    placeholder="Mã bảo mật hệ thống..."
                    className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm font-mono font-black outline-none focus:ring-2 focus:ring-amber-500"
                  />
                )}
                <button type="submit" className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-900 shadow-xl">Xác nhận</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
