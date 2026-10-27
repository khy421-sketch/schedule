import React from 'react';
import { Calendar, FolderKanban, Bell, User as UserIcon } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: 'calendar' | 'schedulers' | 'invitations' | 'admin' | 'profile';
  pendingInvitationsCount: number;
  onSelectTab: (tab: 'calendar' | 'schedulers' | 'invitations' | 'admin' | 'profile') => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  pendingInvitationsCount,
  onSelectTab,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-slate-200 px-3 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
        {/* 📅 캘린더 */}
        <button
          onClick={() => onSelectTab('calendar')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all btn-3d ${
            currentTab === 'calendar'
              ? 'bg-amber-100 text-amber-900 border-2 border-amber-300 shadow-[0_2px_0_0_#fcd34d] font-black'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calendar size={18} className={currentTab === 'calendar' ? 'text-amber-600' : ''} />
          <span className="text-[10px] mt-0.5">캘린더</span>
        </button>

        {/* 📁 스케줄러 목록 */}
        <button
          onClick={() => onSelectTab('schedulers')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all btn-3d ${
            currentTab === 'schedulers'
              ? 'bg-sky-100 text-sky-900 border-2 border-sky-300 shadow-[0_2px_0_0_#7dd3fc] font-black'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FolderKanban size={18} className={currentTab === 'schedulers' ? 'text-sky-600' : ''} />
          <span className="text-[10px] mt-0.5">스케줄러</span>
        </button>

        {/* 🔔 초대함 */}
        <button
          onClick={() => onSelectTab('invitations')}
          className={`relative flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all btn-3d ${
            currentTab === 'invitations'
              ? 'bg-purple-100 text-purple-900 border-2 border-purple-300 shadow-[0_2px_0_0_#c084fc] font-black'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="relative">
            <Bell size={18} className={currentTab === 'invitations' ? 'text-purple-600' : ''} />
            {pendingInvitationsCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                {pendingInvitationsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5">초대함</span>
        </button>

        {/* 👤 마이페이지 */}
        <button
          onClick={() => onSelectTab('profile')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all btn-3d ${
            currentTab === 'profile'
              ? 'bg-pink-100 text-pink-900 border-2 border-pink-300 shadow-[0_2px_0_0_#f472b6] font-black'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserIcon size={18} className={currentTab === 'profile' ? 'text-pink-600' : ''} />
          <span className="text-[10px] mt-0.5">마이</span>
        </button>
      </div>
    </div>
  );
};
