import React, { useState } from 'react';
import { User, Scheduler, SchedulerRole } from '../types';
import { PASTEL_COLORS, ICON_PRESETS } from '../constants/theme';
import {
  X,
  Plus,
  Users,
  Crown,
  Edit3,
  Eye,
  UserPlus,
  Trash2,
  LogOut,
  Search,
  Check,
  Settings,
  ShieldAlert
} from 'lucide-react';

interface SchedulerManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  schedulers: Scheduler[];
  onCreateScheduler: (data: { name: string; description?: string; icon?: string; color?: string }) => Promise<void>;
  onUpdateScheduler: (id: string, data: { name?: string; description?: string; icon?: string; color?: string }) => Promise<void>;
  onDeleteScheduler: (id: string) => Promise<void>;
  onInviteMember: (schedulerId: string, username: string, role: string) => Promise<void>;
  onUpdateMemberRole: (schedulerId: string, userId: string, role: string) => Promise<void>;
  onRemoveMember: (schedulerId: string, userId: string) => Promise<void>;
  onSearchUsers: (q: string) => Promise<{ id: string; username: string; name: string; avatar: string }[]>;
}

export const SchedulerManagerModal: React.FC<SchedulerManagerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  schedulers,
  onCreateScheduler,
  onUpdateScheduler,
  onDeleteScheduler,
  onInviteMember,
  onUpdateMemberRole,
  onRemoveMember,
  onSearchUsers,
}) => {
  const [selectedSchedulerId, setSelectedSchedulerId] = useState<string>(
    schedulers[0]?.id || ''
  );
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // New scheduler form state
  const [newName, setNewName] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newIcon, setNewIcon] = useState<string>('🌸');
  const [newColor, setNewColor] = useState<string>('#FEF08A');

  // Invite state
  const [inviteSearch, setInviteSearch] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{ id: string; username: string; name: string; avatar: string }[]>([]);
  const [inviteRole, setInviteRole] = useState<SchedulerRole>('editor');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [inviteStatusMsg, setInviteStatusMsg] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const currentScheduler = schedulers.find((s) => s.id === selectedSchedulerId) || schedulers[0];
  const isOwner = currentScheduler && (currentScheduler.owner_id === currentUser?.id || currentUser?.role === 'admin');
  const myRoleInScheduler = currentScheduler?.members.find((m) => m.user_id === currentUser?.id)?.role;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setError('스케줄러 이름을 입력해주세요.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await onCreateScheduler({
        name: newName.trim(),
        description: newDesc.trim(),
        icon: newIcon,
        color: newColor,
      });
      setIsCreating(false);
      setNewName('');
      setNewDesc('');
    } catch (err: any) {
      setError(err.message || '스케줄러 생성 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (val: string) => {
    setInviteSearch(val);
    setInviteStatusMsg('');
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const res = await onSearchUsers(val);
      // filter out users already in scheduler
      const existingIds = currentScheduler?.members.map((m) => m.user_id) || [];
      setSearchResults(res.filter((u) => !existingIds.includes(u.id) && u.id !== currentUser?.id));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendInvite = async (targetUsername: string) => {
    if (!currentScheduler) return;
    try {
      setLoading(true);
      setError('');
      await onInviteMember(currentScheduler.id, targetUsername, inviteRole);
      setInviteStatusMsg(`@${targetUsername} 님에게 초대장을 보냈습니다!`);
      setInviteSearch('');
      setSearchResults([]);
    } catch (err: any) {
      setError(err.message || '초대 전송 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-[0_12px_0_0_#cbd5e1] max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b-2 border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📁</span>
            <div>
              <h3 className="text-lg font-black text-slate-800">다중 스케줄러 & 멤버 권한 관리</h3>
              <p className="text-xs text-slate-400">
                직장, 동아리, 개인 등 스케줄러를 분리하고 권한을 부여하세요.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content body split into 2 columns on tablet/desktop */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          {/* Left Column: Schedulers List & Create Button */}
          <div className="w-full md:w-64 border-b-2 md:border-b-0 md:border-r-2 border-slate-100 p-4 bg-slate-50/70 shrink-0 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                내 스케줄러 목록 ({schedulers.length})
              </span>
              <button
                onClick={() => {
                  setIsCreating(true);
                  setError('');
                }}
                className="p-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-black flex items-center gap-1 shadow-sm transition-all"
                title="새 스케줄러 만들기"
              >
                <Plus size={14} className="stroke-[3]" /> 새 추가
              </button>
            </div>

            <div className="space-y-1.5">
              {schedulers.map((sch) => {
                const isSelected = !isCreating && currentScheduler?.id === sch.id;
                const isSchOwner = sch.owner_id === currentUser?.id;

                return (
                  <button
                    key={sch.id}
                    onClick={() => {
                      setSelectedSchedulerId(sch.id);
                      setIsCreating(false);
                      setError('');
                      setInviteStatusMsg('');
                    }}
                    className={`w-full text-left p-3 rounded-2xl border-2 transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-400 shadow-[0_3px_0_0_#fcd34d] scale-101'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                    style={{
                      backgroundColor: isSelected ? sch.color : '#ffffff',
                    }}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-xl">{sch.icon}</span>
                      <div className="truncate">
                        <div className="text-xs font-black text-slate-800 truncate">
                          {sch.name}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          {isSchOwner ? (
                            <span className="text-amber-700 font-extrabold flex items-center gap-0.5">
                              <Crown size={10} /> 방장
                            </span>
                          ) : (
                            <span className="text-slate-500">
                              {sch.members.find((m) => m.user_id === currentUser?.id)?.role === 'editor'
                                ? '편집자'
                                : '조회자'}
                            </span>
                          )}
                          <span>•</span>
                          <span>{sch.members.length}명</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Scheduler Details OR Create Scheduler Form */}
          <div className="flex-1 p-5 overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs font-bold">
                {error}
              </div>
            )}

            {isCreating ? (
              /* Create New Scheduler Form */
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
                  <h4 className="text-base font-black text-slate-800">✨ 새로운 스케줄러 만들기</h4>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600"
                  >
                    취소
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    스케줄러 이름
                  </label>
                  <input
                    type="text"
                    placeholder="예: 주말 러닝 크루, 마케팅 프로젝트팀"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl border-2 border-slate-200 font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    간단 설명
                  </label>
                  <input
                    type="text"
                    placeholder="이 스케줄러의 목적을 입력하세요"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl border-2 border-slate-200 text-xs"
                  />
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    대표 아이콘 선택
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ICON_PRESETS.map((ic) => (
                      <button
                        type="button"
                        key={ic}
                        onClick={() => setNewIcon(ic)}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border-2 transition-all ${
                          newIcon === ic
                            ? 'bg-amber-100 border-amber-400 shadow-sm scale-110'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    파스텔 테마 색상 선택
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PASTEL_COLORS.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setNewColor(c.hex)}
                        className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold flex items-center gap-1.5 transition-all ${
                          newColor === c.hex ? 'border-slate-800 scale-105 shadow-sm' : 'border-slate-200'
                        }`}
                        style={{ backgroundColor: c.hex, color: '#1e293b' }}
                      >
                        {newColor === c.hex && <Check size={12} className="stroke-[3]" />}
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-2xl bg-amber-300 hover:bg-amber-400 text-amber-950 font-black text-xs border-2 border-amber-400 shadow-[0_3px_0_0_#f59e0b] btn-3d disabled:opacity-50"
                  >
                    {loading ? '생성 중...' : '스케줄러 생성하기'}
                  </button>
                </div>
              </form>
            ) : currentScheduler ? (
              /* Selected Scheduler Details and Member Management */
              <div className="space-y-6">
                {/* Header info */}
                <div
                  className="p-4 rounded-2xl border-2 border-slate-200 shadow-[0_4px_0_0_#e2e8f0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  style={{ backgroundColor: currentScheduler.color }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 rounded-2xl bg-white/70 border border-slate-200 shadow-sm">
                      {currentScheduler.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-black text-slate-800">
                          {currentScheduler.name}
                        </h4>
                        {isOwner && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-300 text-amber-900 border border-amber-400">
                            👑 방장 (Owner)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {currentScheduler.description || '등록된 설명이 없습니다.'}
                      </p>
                    </div>
                  </div>

                  {/* Scheduler Delete button (Owner only) */}
                  {isOwner && (
                    <button
                      onClick={() => {
                        if (confirm(`'${currentScheduler.name}' 스케줄러를 완전히 삭제하시겠습니까? 관련 일정도 모두 삭제됩니다.`)) {
                          onDeleteScheduler(currentScheduler.id);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-rose-50 text-rose-600 border border-rose-300 text-xs font-black shadow-sm btn-3d flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      <span>스케줄러 삭제</span>
                    </button>
                  )}
                </div>

                {/* PRD 4.2: 아이디 검색 초대 (Owner Only) */}
                {isOwner && (
                  <div className="p-4 rounded-2xl border-2 border-amber-200 bg-amber-50/50 shadow-[0_3px_0_0_#fcd34d]">
                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 mb-2">
                      <UserPlus size={15} />
                      <span>새로운 멤버 초대 (아이디 검색)</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="상대방의 아이디(Username) 입력 (예: minwoo, jiwon)"
                          value={inviteSearch}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 rounded-xl border-2 border-amber-300 bg-white text-xs font-bold text-slate-800"
                        />
                        <Search size={14} className="absolute left-2.5 top-3 text-amber-500" />
                      </div>

                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as SchedulerRole)}
                        className="px-3 py-2 rounded-xl border-2 border-amber-300 bg-white text-xs font-extrabold text-slate-800"
                      >
                        <option value="editor">✏️ 편집자 (일정 작성/수정)</option>
                        <option value="viewer">👁️ 조회자 (읽기/본인일정만)</option>
                      </select>
                    </div>

                    {inviteStatusMsg && (
                      <div className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-100 p-2 rounded-xl">
                        {inviteStatusMsg}
                      </div>
                    )}

                    {/* Search results dropdown */}
                    {searchResults.length > 0 && (
                      <div className="mt-2 bg-white rounded-xl border-2 border-amber-200 shadow-md p-1.5 space-y-1">
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-amber-50"
                          >
                            <div className="flex items-center gap-2">
                              <span>{user.avatar}</span>
                              <span className="text-xs font-black text-slate-800">
                                {user.name}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                @{user.username}
                              </span>
                            </div>
                            <button
                              onClick={() => handleSendInvite(user.username)}
                              disabled={loading}
                              className="px-3 py-1 rounded-lg bg-amber-300 hover:bg-amber-400 text-amber-950 font-black text-[11px] shadow-sm btn-3d"
                            >
                              초대하기
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* PRD 4.2: 등급별 멤버 목록 & 권한 관리 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={14} className="text-slate-400" />
                      <span>참여 멤버 및 등급별 권한</span>
                    </h5>
                    <span className="text-[11px] text-slate-400">
                      총 {currentScheduler.members.length}명
                    </span>
                  </div>

                  {/* Role explanation callout */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
                    <div>
                      <span className="font-black text-amber-800">👑 방장 (Owner):</span> 멤버 권한 변경, 공유 일정 및 타인 일정 전체 수정/삭제, 초대 및 강퇴 권한.
                    </div>
                    <div>
                      <span className="font-black text-sky-800">✏️ 편집자 (Editor):</span> 일정 작성, 공유 설정, 본인 작성 일정 및 다른 편집자의 공유 일정 수정/삭제 가능.
                    </div>
                    <div>
                      <span className="font-black text-purple-800">👁️ 조회자 (Viewer):</span> 모든 일정 작성 가능, 본인이 작성한 일정만 수정/삭제 가능 (타인 공유 일정은 읽기 전용).
                    </div>
                  </div>

                  {/* Members list */}
                  <div className="space-y-2 pt-1">
                    {currentScheduler.members.map((member) => {
                      const isMemberOwner = member.role === 'owner';
                      const isMe = member.user_id === currentUser?.id;

                      return (
                        <div
                          key={member.user_id}
                          className="p-3 rounded-2xl border-2 border-slate-200 bg-white flex items-center justify-between shadow-[0_2px_0_0_#f1f5f9]"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-sm">
                              {member.avatar}
                            </span>
                            <div>
                              <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                <span>{member.name}</span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  (@{member.username})
                                </span>
                                {isMe && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-black">
                                    나
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {isMemberOwner ? '스케줄러 생성자' : '멤버'}
                              </div>
                            </div>
                          </div>

                          {/* Member Role Display / Changer */}
                          <div className="flex items-center gap-2">
                            {isMemberOwner ? (
                              <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs flex items-center gap-1">
                                <Crown size={12} className="text-amber-600" /> 방장
                              </span>
                            ) : isOwner ? (
                              /* Owner can change member role */
                              <select
                                value={member.role}
                                onChange={(e) =>
                                  onUpdateMemberRole(
                                    currentScheduler.id,
                                    member.user_id,
                                    e.target.value
                                  )
                                }
                                className="px-2.5 py-1 rounded-xl text-xs font-black bg-slate-50 border-2 border-slate-200 text-slate-700 focus:outline-none"
                              >
                                <option value="editor">✏️ 편집자</option>
                                <option value="viewer">👁️ 조회자</option>
                              </select>
                            ) : (
                              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700">
                                {member.role === 'editor' ? '✏️ 편집자' : '👁️ 조회자'}
                              </span>
                            )}

                            {/* Kick member (if Owner) OR Leave scheduler (if not owner) */}
                            {isOwner && !isMemberOwner && (
                              <button
                                onClick={() => {
                                  if (confirm(`${member.name} 님을 스케줄러에서 강퇴하시겠습니까?`)) {
                                    onRemoveMember(currentScheduler.id, member.user_id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                                title="멤버 강퇴"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}

                            {!isMemberOwner && isMe && (
                              <button
                                onClick={() => {
                                  if (confirm('정말로 이 스케줄러에서 나가시겠습니까?')) {
                                    onRemoveMember(currentScheduler.id, currentUser.id);
                                  }
                                }}
                                className="px-2.5 py-1 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1"
                              >
                                <LogOut size={12} /> 나가기
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
