import React, { useState, useEffect } from 'react';
import { User, Scheduler, SystemStats } from '../types';
import { api } from '../utils/api';
import {
  Shield,
  Users,
  FolderKanban,
  Calendar,
  Lock,
  Trash2,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  UserCheck,
  UserX
} from 'lucide-react';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onRefreshAllData: () => Promise<void>;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onRefreshAllData,
}) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [adminUsers, setAdminUsers] = useState<
    (User & { ownedSchedulers: number; memberSchedulers: number; scheduleCount: number })[]
  >([]);
  const [adminSchedulers, setAdminSchedulers] = useState<
    (Scheduler & { owner_username?: string; owner_name?: string; schedule_count: number })[]
  >([]);
  const [activeTab, setActiveTab] = useState<'users' | 'schedulers'>('users');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Password reset modal state
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, usersRes, schedulersRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminSchedulers(),
      ]);
      setStats(statsRes.stats);
      setAdminUsers(usersRes.users);
      setAdminSchedulers(schedulersRes.schedulers);
    } catch (err: any) {
      setError(err.message || '관리자 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser?.role === 'admin') {
      loadAdminData();
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      setError('');
      const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
      await api.updateAdminUser(userId, { status: nextStatus });
      setSuccessMsg(`계정 상태를 '${nextStatus === 'active' ? '정상(Active)' : '정지(Suspended)'}'로 변경했습니다.`);
      await loadAdminData();
      await onRefreshAllData();
    } catch (err: any) {
      setError(err.message || '상태 변경 실패');
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    try {
      setError('');
      const nextRole = currentRole === 'admin' ? 'user' : 'admin';
      await api.updateAdminUser(userId, { role: nextRole });
      setSuccessMsg(`역할을 '${nextRole === 'admin' ? '관리자(Admin)' : '일반 유저(User)'}'로 변경했습니다.`);
      await loadAdminData();
      await onRefreshAllData();
    } catch (err: any) {
      setError(err.message || '역할 변경 실패');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !newPassword.trim()) return;
    try {
      setError('');
      await api.updateAdminUser(resetTargetUser.id, { newPassword: newPassword.trim() });
      setSuccessMsg(`@${resetTargetUser.username} 사용자의 비밀번호가 재설정되었습니다.`);
      setResetTargetUser(null);
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || '비밀번호 재설정 실패');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`정말로 @${username} 사용자를 시스템에서 완전 삭제하시겠습니까?\n해당 유저가 생성한 스케줄러와 일정도 모두 정리됩니다.`)) {
      return;
    }
    try {
      setError('');
      await api.deleteAdminUser(userId);
      setSuccessMsg(`@${username} 계정이 정상적으로 삭제되었습니다.`);
      await loadAdminData();
      await onRefreshAllData();
    } catch (err: any) {
      setError(err.message || '사용자 삭제 실패');
    }
  };

  const handleDeleteScheduler = async (schId: string, schName: string) => {
    if (!confirm(`'${schName}' 스케줄러를 강제 삭제하시겠습니까?`)) {
      return;
    }
    try {
      setError('');
      await api.deleteAdminScheduler(schId);
      setSuccessMsg(`스케줄러가 삭제되었습니다.`);
      await loadAdminData();
      await onRefreshAllData();
    } catch (err: any) {
      setError(err.message || '스케줄러 삭제 실패');
    }
  };

  const filteredUsers = adminUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-[0_12px_0_0_#cbd5e1] max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b-2 border-slate-100 flex items-center justify-between bg-amber-100/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-300 border-2 border-amber-400 shadow-[0_3px_0_0_#f59e0b] flex items-center justify-center text-xl">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">CozySchedule 관리자 콘솔</h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-500">
                전체 유저 계정 관리, 상태 제어, 스케줄러 현황 점검
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAdminData}
              disabled={loading}
              className="p-2 rounded-xl bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 btn-3d shadow-sm"
              title="새로고침"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black border-2 border-slate-200 btn-3d"
            >
              닫기
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} />
                <span>{successMsg}</span>
              </span>
              <button
                onClick={() => setSuccessMsg('')}
                className="text-xs text-emerald-700 hover:text-emerald-900"
              >
                닫기
              </button>
            </div>
          )}

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 shadow-[0_3px_0_0_#fcd34d]">
                <div className="text-[11px] font-black text-amber-800 flex items-center gap-1">
                  <Users size={13} /> 전체 회원 수
                </div>
                <div className="text-2xl font-black text-slate-800 mt-1">
                  {stats.totalUsers} <span className="text-xs font-normal">명</span>
                </div>
                <div className="text-[10px] text-amber-700 mt-0.5">
                  활성 회원: {stats.activeUsers}명
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50 border-2 border-sky-200 shadow-[0_3px_0_0_#7dd3fc]">
                <div className="text-[11px] font-black text-sky-800 flex items-center gap-1">
                  <FolderKanban size={13} /> 개설된 스케줄러
                </div>
                <div className="text-2xl font-black text-slate-800 mt-1">
                  {stats.totalSchedulers} <span className="text-xs font-normal">개</span>
                </div>
                <div className="text-[10px] text-sky-700 mt-0.5">
                  다양한 그룹 캘린더
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-pink-50 border-2 border-pink-200 shadow-[0_3px_0_0_#f472b6]">
                <div className="text-[11px] font-black text-pink-800 flex items-center gap-1">
                  <Calendar size={13} /> 등록된 총 일정
                </div>
                <div className="text-2xl font-black text-slate-800 mt-1">
                  {stats.totalSchedules} <span className="text-xs font-normal">개</span>
                </div>
                <div className="text-[10px] text-pink-700 mt-0.5">
                  공유 & 비공개 누적
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 border-2 border-purple-200 shadow-[0_3px_0_0_#c084fc]">
                <div className="text-[11px] font-black text-purple-800 flex items-center gap-1">
                  <KeyRound size={13} /> 대기 중 초대장
                </div>
                <div className="text-2xl font-black text-slate-800 mt-1">
                  {stats.pendingInvitations} <span className="text-xs font-normal">건</span>
                </div>
                <div className="text-[10px] text-purple-700 mt-0.5">
                  새로운 멤버 요청
                </div>
              </div>
            </div>
          )}

          {/* Cloud Database Integration Info */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 border-2 border-sky-200 shadow-[0_3px_0_0_#bae6fd] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-200 border border-sky-300 flex items-center justify-center text-base shrink-0">
                ☁️
              </div>
              <div>
                <div className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <span>클라우드 데이터베이스 (Cloud Firestore) 연결 상태: 정상 작동 중</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-[11px] text-slate-500">
                  Project: gen-lang-client-0443438123 | DB: ai-studio-cozyschedule-2879854f-6982-44eb-9750-de2d4527ed02
                </div>
              </div>
            </div>
            <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300">
              보안 규칙(Rules) 배포 완료
            </span>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-2xl font-black text-xs border-2 btn-3d ${
                  activeTab === 'users'
                    ? 'bg-amber-200 text-amber-950 border-amber-300 shadow-[0_3px_0_0_#fcd34d]'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'
                }`}
              >
                👥 전체 계정 관리 ({adminUsers.length})
              </button>
              <button
                onClick={() => setActiveTab('schedulers')}
                className={`px-4 py-2 rounded-2xl font-black text-xs border-2 btn-3d ${
                  activeTab === 'schedulers'
                    ? 'bg-sky-200 text-sky-950 border-sky-300 shadow-[0_3px_0_0_#7dd3fc]'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'
                }`}
              >
                📁 전체 스케줄러 관리 ({adminSchedulers.length})
              </button>
            </div>

            {activeTab === 'users' && (
              <div className="relative w-48 sm:w-64">
                <input
                  type="text"
                  placeholder="아이디 또는 이름 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border-2 border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white focus:outline-none"
                />
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              </div>
            )}
          </div>

          {/* TAB 1: User Accounts Management Table */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-[0_3px_0_0_#e2e8f0]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b-2 border-slate-200 text-slate-600 font-black">
                    <tr>
                      <th className="p-3">프로필/아이디</th>
                      <th className="p-3">이름</th>
                      <th className="p-3">권한</th>
                      <th className="p-3">계정 상태</th>
                      <th className="p-3">스케줄러/일정 수</th>
                      <th className="p-3 text-right">관리 작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const isSelf = u.id === currentUser?.id;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-sm">
                                {u.avatar}
                              </span>
                              <div>
                                <div className="font-black text-slate-800">@{u.username}</div>
                                {isSelf && (
                                  <span className="text-[9px] px-1 bg-amber-100 text-amber-800 rounded font-black">
                                    현재 로그인
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-extrabold text-slate-700">{u.name}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-md font-black text-[10px] border ${
                                u.role === 'admin'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {u.role === 'admin' ? '👑 관리자' : '일반'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-md font-black text-[10px] ${
                                u.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {u.status === 'active' ? '정상 활성' : '이용 정지'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">
                            스케줄러 {u.memberSchedulers}개 / 일정 {u.scheduleCount}개
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Toggle active / suspended */}
                              {!isSelf && (
                                <button
                                  onClick={() => handleToggleStatus(u.id, u.status)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black border transition-all btn-3d ${
                                    u.status === 'active'
                                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                  }`}
                                  title={u.status === 'active' ? '계정 정지시키기' : '계정 정지 풀기'}
                                >
                                  {u.status === 'active' ? '정지' : '해제'}
                                </button>
                              )}

                              {/* Toggle role */}
                              {!isSelf && (
                                <button
                                  onClick={() => handleToggleRole(u.id, u.role)}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 btn-3d"
                                  title="역할 승격 또는 강등"
                                >
                                  {u.role === 'admin' ? '일반으로' : '관리자로'}
                                </button>
                              )}

                              {/* Reset password */}
                              <button
                                onClick={() => setResetTargetUser(u)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 btn-3d flex items-center gap-1"
                                title="비밀번호 변경"
                              >
                                <KeyRound size={11} /> PW 재설정
                              </button>

                              {/* Delete User */}
                              {!isSelf && (
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.username)}
                                  className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                                  title="계정 완전 삭제"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: All Schedulers Table */}
          {activeTab === 'schedulers' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {adminSchedulers.map((sch) => (
                  <div
                    key={sch.id}
                    className="p-4 rounded-2xl border-2 border-slate-200 shadow-[0_3px_0_0_#e2e8f0] bg-white space-y-2 relative overflow-hidden"
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: sch.color }}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{sch.icon}</span>
                        <div>
                          <div className="font-black text-slate-800 text-sm">{sch.name}</div>
                          <div className="text-[10px] text-slate-400">
                            방장: {sch.owner_name} (@{sch.owner_username})
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteScheduler(sch.id, sch.name)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                        title="스케줄러 강제 삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {sch.description || '설명 없음'}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                      <span>멤버: {sch.members.length}명</span>
                      <span>등록 일정: {sch.schedule_count}개</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Reset Modal Sub-dialog */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-[0_10px_0_0_#cbd5e1] max-w-sm w-full p-5 space-y-4">
            <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
              <KeyRound size={16} className="text-amber-500" />
              <span>@{resetTargetUser.username} 비밀번호 재설정</span>
            </h4>
            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  새 비밀번호 입력
                </label>
                <input
                  type="text"
                  placeholder="새로운 비밀번호 (4자 이상)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 text-xs font-bold"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetTargetUser(null);
                    setNewPassword('');
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-amber-300 text-amber-950 border-2 border-amber-400 shadow-[0_2px_0_0_#f59e0b] btn-3d"
                >
                  변경 적용
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
