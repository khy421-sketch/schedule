import React from 'react';
import { User, Invitation } from '../types';
import {
  Calendar,
  FolderKanban,
  Bell,
  Shield,
  User as UserIcon,
  LogOut,
  Sparkles,
  Users
} from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  demoUsers: User[];
  invitations: Invitation[];
  onOpenSchedulers: () => void;
  onOpenInvitations: () => void;
  onOpenAdmin: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSwitchUser: (username: string) => void;
  currentTab: 'calendar' | 'schedulers' | 'invitations' | 'admin' | 'profile';
  setCurrentTab: (tab: 'calendar' | 'schedulers' | 'invitations' | 'admin' | 'profile') => void;
  dbConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  demoUsers,
  invitations,
  onOpenSchedulers,
  onOpenInvitations,
  onOpenAdmin,
  onOpenProfile,
  onOpenAuth,
  onLogout,
  onSwitchUser,
  currentTab,
  setCurrentTab,
  dbConnected = true,
}) => {
  const pendingCount = invitations.filter((i) => i.status === 'pending').length;

  return (
    <header className="sticky top-0 z-30 bg-[#F8FAF9]/90 backdrop-blur-md border-b-2 border-slate-200 shadow-sm px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div
            onClick={() => setCurrentTab('calendar')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-200 border-2 border-amber-300 shadow-[0_3px_0_0_#fcd34d] flex items-center justify-center text-xl transition-transform group-hover:scale-105">
              🌸
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xl font-extrabold tracking-tight text-slate-800">
                  Cozy<span className="text-pink-500">Schedule</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 border border-pink-200">
                  3D 파스텔
                </span>
                {dbConnected && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Cloud DB 연결됨</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                선택적 공유와 권한이 있는 포근한 멀티 캘린더
              </p>
            </div>
          </div>

          {/* Mobile Quick Action icons */}
          <div className="flex md:hidden items-center gap-2">
            {currentUser && (
              <button
                onClick={onOpenInvitations}
                className="relative p-2 rounded-xl bg-white border-2 border-slate-200 shadow-[0_3px_0_0_#e2e8f0] text-slate-600"
              >
                <Bell size={18} />
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}
            {currentUser?.role === 'admin' && (
              <button
                onClick={onOpenAdmin}
                className="p-2 rounded-xl bg-amber-100 border-2 border-amber-300 text-amber-800 shadow-[0_3px_0_0_#fcd34d]"
                title="관리자 페이지"
              >
                <Shield size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Demo Fast Account Switcher Bar */}
        <div className="flex items-center gap-1.5 bg-white/80 p-1.5 rounded-2xl border-2 border-slate-200 shadow-[0_2px_0_0_#e2e8f0] overflow-x-auto max-w-full">
          <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1 shrink-0">
            <Users size={12} /> 빠른 계정 전환:
          </span>
          {demoUsers.map((u) => {
            const isCurrent = currentUser?.username === u.username;
            return (
              <button
                key={u.id}
                onClick={() => onSwitchUser(u.username)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                  isCurrent
                    ? 'bg-amber-100 text-amber-900 border-2 border-amber-300 shadow-[0_2px_0_0_#fcd34d] font-black scale-102'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
                title={`클릭하여 ${u.name}(@${u.username}) 계정으로 전환`}
              >
                <span>{u.avatar}</span>
                <span>{u.name}</span>
                {u.role === 'admin' && <span className="text-[10px] text-amber-600">★</span>}
              </button>
            );
          })}
        </div>

        {/* Desktop Navigation & User Controls */}
        <div className="hidden md:flex items-center gap-2">
          {currentUser ? (
            <>
              {/* Schedulers button */}
              <button
                onClick={onOpenSchedulers}
                className={`px-3 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 border-2 btn-3d ${
                  currentTab === 'schedulers'
                    ? 'bg-sky-100 text-sky-800 border-sky-300 shadow-[0_3px_0_0_#7dd3fc]'
                    : 'bg-white text-slate-700 border-slate-200 shadow-[0_3px_0_0_#e2e8f0] hover:bg-slate-50'
                }`}
              >
                <FolderKanban size={15} className="text-sky-500" />
                <span>스케줄러 관리</span>
              </button>

              {/* Invitations button with badge */}
              <button
                onClick={onOpenInvitations}
                className="relative px-3 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 bg-white text-slate-700 border-2 border-slate-200 shadow-[0_3px_0_0_#e2e8f0] hover:bg-slate-50 btn-3d"
              >
                <Bell size={15} className="text-amber-500" />
                <span>초대함</span>
                {pendingCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </button>

              {/* Admin Portal Button (for Admin only) */}
              {currentUser.role === 'admin' && (
                <button
                  onClick={onOpenAdmin}
                  className={`px-3 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 border-2 btn-3d ${
                    currentTab === 'admin'
                      ? 'bg-amber-300 text-amber-950 border-amber-400 shadow-[0_3px_0_0_#f59e0b]'
                      : 'bg-amber-100 text-amber-900 border-amber-300 shadow-[0_3px_0_0_#fcd34d] hover:bg-amber-200'
                  }`}
                >
                  <Shield size={15} className="text-amber-700" />
                  <span>관리자 콘솔</span>
                </button>
              )}

              {/* User Profile */}
              <div
                onClick={onOpenProfile}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl bg-white border-2 border-slate-200 shadow-[0_3px_0_0_#e2e8f0] hover:bg-slate-50 cursor-pointer btn-3d"
                title="프로필 및 마이페이지"
              >
                <div className="w-7 h-7 rounded-xl bg-purple-100 flex items-center justify-center text-sm">
                  {currentUser.avatar}
                </div>
                <div className="text-left">
                  <div className="text-xs font-extrabold text-slate-800 leading-tight flex items-center gap-1">
                    {currentUser.name}
                    {currentUser.role === 'admin' && (
                      <span className="text-[9px] px-1 bg-amber-200 text-amber-800 rounded font-black">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">@{currentUser.username}</div>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={onLogout}
                className="p-2 rounded-2xl bg-white text-slate-400 hover:text-slate-600 border-2 border-slate-200 shadow-[0_3px_0_0_#e2e8f0] btn-3d"
                title="로그아웃"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-2xl font-black text-sm bg-amber-200 hover:bg-amber-300 text-amber-900 border-2 border-amber-400 shadow-[0_4px_0_0_#fbbf24] btn-3d flex items-center gap-1.5"
            >
              <Sparkles size={16} />
              <span>로그인 / 시작하기</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
