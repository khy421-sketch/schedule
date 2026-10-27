/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User, Scheduler, Schedule, Invitation } from './types';
import { api, getStoredToken, setStoredToken, clearStoredToken } from './utils/api';
import { Header } from './components/Header';
import { CalendarView } from './components/CalendarView';
import { ScheduleModal } from './components/ScheduleModal';
import { SchedulerManagerModal } from './components/SchedulerManagerModal';
import { InvitationNotificationModal } from './components/InvitationNotificationModal';
import { AdminPortal } from './components/AdminPortal';
import { AuthModal } from './components/AuthModal';
import { MyProfileModal } from './components/MyProfileModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { testFirestoreConnection } from './firebase';
import { Sparkles, Calendar, Shield, Users, CheckCircle2, AlertCircle, Database } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [schedulers, setSchedulers] = useState<Scheduler[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [selectedSchedulerIds, setSelectedSchedulerIds] = useState<string[]>([]);
  const [dbConnected, setDbConnected] = useState<boolean>(true);

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<
    'calendar' | 'schedulers' | 'invitations' | 'admin' | 'profile'
  >('calendar');

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [isSchedulerManagerOpen, setIsSchedulerManagerOpen] = useState<boolean>(false);
  const [isInvitationsModalOpen, setIsInvitationsModalOpen] = useState<boolean>(false);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Schedule modal state
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [scheduleInitialDate, setScheduleInitialDate] = useState<string | undefined>();

  // Feedback toast
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg(null);
    }, 3200);
  };

  // Load demo users list
  const loadDemoUsers = async () => {
    try {
      const res = await api.getDemoUsers();
      setDemoUsers(res.demoUsers);
    } catch (err) {
      console.error('Failed to load demo users', err);
    }
  };

  // Fetch all user-related data (schedulers, schedules, invitations)
  const refreshData = useCallback(async (customUser?: User) => {
    const token = getStoredToken();
    if (!token) return;

    try {
      const [schRes, invRes] = await Promise.all([
        api.getSchedulers(),
        api.getInvitations(),
      ]);

      setSchedulers(schRes.schedulers);
      setInvitations(invRes.invitations);

      // Default select all schedulers if none selected
      setSelectedSchedulerIds((prev) => {
        const availableIds = schRes.schedulers.map((s) => s.id);
        if (prev.length === 0) return availableIds;
        const valid = prev.filter((id) => availableIds.includes(id));
        return valid.length > 0 ? valid : availableIds;
      });

      // Fetch visible schedules
      const scRes = await api.getSchedules();
      setSchedules(scRes.schedules);

      // Auto-popup notification if pending invitations exist (PRD 4.2 Requirement!)
      const pending = invRes.invitations.filter((i) => i.status === 'pending');
      if (pending.length > 0) {
        setIsInvitationsModalOpen(true);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
    }
  }, []);

  // Initial authentication and database connection check
  useEffect(() => {
    loadDemoUsers();

    // Verify Firestore database connection
    testFirestoreConnection().then((connected) => {
      setDbConnected(connected);
    });

    const initAuth = async () => {
      const token = getStoredToken();
      if (token) {
        try {
          const res = await api.getMe();
          setCurrentUser(res.user);
          await refreshData(res.user);
        } catch (err) {
          clearStoredToken();
          // Fallback: auto demo login to 'soyeon' so the app is immediately alive and functional!
          await handleDemoLogin('soyeon');
        }
      } else {
        // Auto-login with default demo user so user sees immediate live data!
        await handleDemoLogin('soyeon');
      }
    };

    initAuth();
  }, [refreshData]);

  // Auth Handlers
  const handleLogin = async (username: string, pass: string) => {
    const res = await api.login(username, pass);
    if (res.token) setStoredToken(res.token);
    setCurrentUser(res.user);
    await refreshData(res.user);
    showToast(`반가워요, ${res.user.name}님!`);
  };

  const handleRegister = async (data: { username: string; password: string; name: string; avatar?: string }) => {
    const res = await api.register(data);
    if (res.token) setStoredToken(res.token);
    setCurrentUser(res.user);
    await loadDemoUsers();
    await refreshData(res.user);
    showToast(`가입을 환영합니다, ${res.user.name}님!`);
  };

  const handleDemoLogin = async (username: string) => {
    const res = await api.demoLogin(username);
    if (res.token) setStoredToken(res.token);
    setCurrentUser(res.user);
    await refreshData(res.user);
    showToast(`${res.user.name}(@${res.user.username}) 계정으로 전환되었습니다.`);
  };

  const handleLogout = () => {
    clearStoredToken();
    setCurrentUser(null);
    setSchedulers([]);
    setSchedules([]);
    setInvitations([]);
    setIsAuthOpen(true);
    showToast('로그아웃 되었습니다.');
  };

  const handleUpdateProfile = async (data: { name?: string; avatar?: string; password?: string }) => {
    const res = await api.updateProfile(data);
    setCurrentUser(res.user);
    await loadDemoUsers();
    await refreshData(res.user);
    showToast('프로필 정보가 수정되었습니다.');
  };

  // Schedule Filter Handlers
  const handleToggleSchedulerFilter = (schedulerId: string) => {
    setSelectedSchedulerIds((prev) => {
      if (prev.includes(schedulerId)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter((id) => id !== schedulerId);
      } else {
        return [...prev, schedulerId];
      }
    });
  };

  const handleSelectAllSchedulers = () => {
    setSelectedSchedulerIds(schedulers.map((s) => s.id));
    showToast('모든 스케줄러가 선택되었습니다.');
  };

  // Filtered schedules according to selected scheduler filters
  const displayedSchedules = schedules.filter((sc) =>
    selectedSchedulerIds.includes(sc.scheduler_id)
  );

  // Schedules CRUD Handlers
  const handleSaveSchedule = async (scheduleData: Partial<Schedule>) => {
    if (editingSchedule) {
      await api.updateSchedule(editingSchedule.id, scheduleData);
      showToast('일정이 수정되었습니다.');
    } else {
      await api.createSchedule(scheduleData);
      showToast('새 일정이 등록되었습니다!');
    }
    const scRes = await api.getSchedules();
    setSchedules(scRes.schedules);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await api.deleteSchedule(scheduleId);
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
      showToast('일정이 삭제되었습니다.');
    } catch (err: any) {
      showToast(err.message || '일정 삭제 실패', 'error');
    }
  };

  // Scheduler Management Handlers
  const handleCreateScheduler = async (data: { name: string; description?: string; icon?: string; color?: string }) => {
    const res = await api.createScheduler(data);
    await refreshData();
    showToast(`'${res.scheduler.name}' 스케줄러가 생성되었습니다!`);
  };

  const handleUpdateScheduler = async (id: string, data: { name?: string; description?: string; icon?: string; color?: string }) => {
    await api.updateScheduler(id, data);
    await refreshData();
    showToast('스케줄러 설정이 저장되었습니다.');
  };

  const handleDeleteScheduler = async (id: string) => {
    await api.deleteScheduler(id);
    await refreshData();
    showToast('스케줄러가 삭제되었습니다.');
  };

  const handleInviteMember = async (schedulerId: string, username: string, role: string) => {
    const res = await api.inviteMember(schedulerId, username, role);
    showToast(res.message);
  };

  const handleUpdateMemberRole = async (schedulerId: string, userId: string, role: string) => {
    await api.updateMemberRole(schedulerId, userId, role);
    await refreshData();
    showToast('멤버 권한 등급이 변경되었습니다.');
  };

  const handleRemoveMember = async (schedulerId: string, userId: string) => {
    const res = await api.removeMember(schedulerId, userId);
    await refreshData();
    showToast(res.message);
  };

  const handleSearchUsers = async (q: string) => {
    const res = await api.searchUsers(q);
    return res.users;
  };

  // Invitations Respond Handler
  const handleRespondInvitation = async (id: string, action: 'accept' | 'reject') => {
    try {
      const res = await api.respondInvitation(id, action);
      await refreshData();
      showToast(res.message);
      if (invitations.filter((i) => i.id !== id && i.status === 'pending').length === 0) {
        setIsInvitationsModalOpen(false);
      }
    } catch (err: any) {
      showToast(err.message || '초대 처리 실패', 'error');
    }
  };

  // Tab Selection
  const handleSelectTab = (tab: 'calendar' | 'schedulers' | 'invitations' | 'admin' | 'profile') => {
    setCurrentTab(tab);
    if (tab === 'schedulers') {
      setIsSchedulerManagerOpen(true);
    } else if (tab === 'invitations') {
      setIsInvitationsModalOpen(true);
    } else if (tab === 'admin') {
      setIsAdminPortalOpen(true);
    } else if (tab === 'profile') {
      setIsProfileOpen(true);
    }
  };

  const pendingInvitationsCount = invitations.filter((i) => i.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-slate-800 flex flex-col font-sans pb-20 md:pb-10 selection:bg-amber-200">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-70 animate-in slide-in-from-top duration-200">
          <div
            className={`px-4 py-3 rounded-2xl border-2 shadow-[0_6px_0_0_#cbd5e1] text-xs font-black flex items-center gap-2 ${
              toastMsg.type === 'success'
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                : 'bg-rose-100 text-rose-900 border-rose-300'
            }`}
          >
            {toastMsg.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600" />
            ) : (
              <AlertCircle size={16} className="text-rose-600" />
            )}
            <span>{toastMsg.text}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header
        currentUser={currentUser}
        demoUsers={demoUsers}
        invitations={invitations}
        onOpenSchedulers={() => setIsSchedulerManagerOpen(true)}
        onOpenInvitations={() => setIsInvitationsModalOpen(true)}
        onOpenAdmin={() => setIsAdminPortalOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onSwitchUser={handleDemoLogin}
        currentTab={currentTab}
        setCurrentTab={handleSelectTab}
        dbConnected={dbConnected}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Welcome & Info Bar */}
        <div className="mb-6 p-4 rounded-3xl bg-amber-50/70 border-2 border-amber-200 shadow-[0_4px_0_0_#fcd34d] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border-2 border-amber-300 shadow-sm flex items-center justify-center text-xl shrink-0">
              {currentUser?.avatar || '🐱'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-slate-800">
                  {currentUser ? `${currentUser.name}님의 CozySchedule` : '게스트 모드'}
                </span>
                {currentUser?.role === 'admin' ? (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                    👑 관리자 계정
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 text-slate-600 border border-slate-200">
                    일반 계정
                  </span>
                )}
                {dbConnected && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1">
                    <Database size={10} className="text-sky-600" />
                    <span>Cloud Firestore 연동</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                💡 개인 사생활 일정(🔒)은 나에게만 보이고, 공유 체크(👥)된 일정만 팀원에게 공개됩니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setIsAdminPortalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-black text-xs border-2 border-amber-400 shadow-[0_2px_0_0_#f59e0b] btn-3d flex items-center gap-1"
              >
                <Shield size={13} />
                <span>관리자 페이지</span>
              </button>
            )}
            <button
              onClick={() => {
                setEditingSchedule(null);
                setScheduleInitialDate(undefined);
                setIsScheduleModalOpen(true);
              }}
              className="px-4 py-2 rounded-2xl bg-pink-200 hover:bg-pink-300 text-pink-950 font-black text-xs border-2 border-pink-400 shadow-[0_3px_0_0_#f472b6] btn-3d flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>+ 새 일정 작성</span>
            </button>
          </div>
        </div>

        {/* Calendar View Component */}
        <CalendarView
          currentUser={currentUser}
          schedulers={schedulers}
          schedules={displayedSchedules}
          selectedSchedulerIds={selectedSchedulerIds}
          onToggleSchedulerFilter={handleToggleSchedulerFilter}
          onSelectAllSchedulers={handleSelectAllSchedulers}
          onOpenCreateSchedule={(dateStr) => {
            setEditingSchedule(null);
            setScheduleInitialDate(dateStr);
            setIsScheduleModalOpen(true);
          }}
          onOpenEditSchedule={(schedule) => {
            setEditingSchedule(schedule);
            setIsScheduleModalOpen(true);
          }}
          onDeleteSchedule={handleDeleteSchedule}
        />
      </main>

      {/* Mobile Responsive Bottom Navigation */}
      <MobileBottomNav
        currentTab={currentTab}
        pendingInvitationsCount={pendingInvitationsCount}
        onSelectTab={handleSelectTab}
      />

      {/* Modals */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setEditingSchedule(null);
        }}
        onSubmit={handleSaveSchedule}
        editingSchedule={editingSchedule}
        initialDate={scheduleInitialDate}
        schedulers={schedulers}
      />

      <SchedulerManagerModal
        isOpen={isSchedulerManagerOpen}
        onClose={() => setIsSchedulerManagerOpen(false)}
        currentUser={currentUser}
        schedulers={schedulers}
        onCreateScheduler={handleCreateScheduler}
        onUpdateScheduler={handleUpdateScheduler}
        onDeleteScheduler={handleDeleteScheduler}
        onInviteMember={handleInviteMember}
        onUpdateMemberRole={handleUpdateMemberRole}
        onRemoveMember={handleRemoveMember}
        onSearchUsers={handleSearchUsers}
      />

      <InvitationNotificationModal
        isOpen={isInvitationsModalOpen}
        onClose={() => setIsInvitationsModalOpen(false)}
        invitations={invitations}
        onRespond={handleRespondInvitation}
      />

      <AdminPortal
        isOpen={isAdminPortalOpen}
        onClose={() => setIsAdminPortalOpen(false)}
        currentUser={currentUser}
        onRefreshAllData={refreshData}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        demoUsers={demoUsers}
        onDemoLogin={handleDemoLogin}
      />

      <MyProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onUpdateProfile={handleUpdateProfile}
        onOpenAdmin={() => setIsAdminPortalOpen(true)}
      />
    </div>
  );
}
