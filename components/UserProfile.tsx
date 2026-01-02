
import React from 'react';
import { User } from '../types';
import { Mail, Phone, MapPin, Calendar, User as UserIcon, Briefcase } from 'lucide-react';

interface UserProfileProps {
  user: User;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const profileFields = [
    { label: 'Họ và tên', value: user.name, icon: UserIcon },
    { label: 'Chức vụ', value: user.position, icon: Briefcase },
    { label: 'Đơn vị', value: user.unit, icon: MapPin },
    { label: 'Email công vụ', value: user.email, icon: Mail },
    { label: 'Số điện thoại', value: user.phone, icon: Phone },
    { label: 'Ngày sinh', value: user.dob, icon: Calendar },
    { label: 'Giới tính', value: user.gender, icon: UserIcon },
    { label: 'Cấp độ giao việc', value: user.delegateLevel, icon: Briefcase },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-32 bg-indigo-600"></div>
        <div className="px-10 pb-10">
          <div className="relative -mt-16 mb-8">
            <div className="w-32 h-32 bg-white rounded-2xl border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
               <img src={`https://picsum.photos/seed/${user.id}/200`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="mt-4">
              <h2 className="text-2xl font-bold text-slate-800">{user.name}</h2>
              <p className="text-slate-500 font-medium">{user.position} | {user.unit}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {profileFields.map((field, idx) => {
              const Icon = field.icon;
              return (
                <div key={idx} className="flex items-start space-x-4">
                  <div className="mt-1 p-2 bg-slate-50 rounded-lg text-slate-400">
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{field.label}</p>
                    <p className="text-slate-800 font-medium mt-1">{field.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
