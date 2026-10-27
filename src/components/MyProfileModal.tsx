import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { AVATAR_PRESETS } from '../constants/theme';
import { X, User as UserIcon, KeyRound, Shield, Check } from 'lucide-react';

interface MyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUpdateProfile: (data: { name?: string; avatar?: string; password?: string }) => Promise<void>;
  onOpenAdmin: () => void;
}

export const MyProfileModal: React.FC<MyProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
  onOpenAdmin,
}) => {
  const [name, setName] = useState<string>('');
  const [avatar, setAvatar] = useState<string>('🐱');
  const [newPassword, setNewPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setAvatar(currentUser.avatar);
      setNewPassword('');
      setError('');
      setSuccess('');
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await onUpdateProfile({
        name: name.trim(),
        avatar,
        password: newPassword.trim() ? newPassword.trim() : undefined,
      });
      setSuccess('프로필 정보가 저장되었습니다!');
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || '프로필 수정 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-[0_12px_0_0_#cbd5e1] max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b-2 border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{avatar}</span>
            <div>
              <h3 className="text-lg font-black text-slate-800">마이페이지 & 프로필 설정</h3>
              <p className="text-xs text-slate-400">@{currentUser.username}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs font-bold">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-800 text-xs font-bold">
              {success}
            </div>
          )}

          {/* Role badge */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-600">시스템 계정 등급</span>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-xl text-xs font-black border ${
                  currentUser.role === 'admin'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                {currentUser.role === 'admin' ? '👑 최고 관리자 (Admin)' : '일반 사용자 (User)'}
              </span>
              {currentUser.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdmin();
                  }}
                  className="px-2 py-1 bg-amber-200 text-amber-950 font-black text-[11px] rounded-lg border border-amber-400 shadow-sm"
                >
                  관리자 콘솔 열기
                </button>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">
              이름 (닉네임)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-2xl border-2 border-slate-200 text-xs font-bold"
            />
          </div>

          {/* Avatar */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">
              프로필 아바타 이모지
            </label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_PRESETS.map((av) => (
                <button
                  type="button"
                  key={av}
                  onClick={() => setAvatar(av)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border-2 transition-all ${
                    avatar === av
                      ? 'bg-amber-100 border-amber-400 scale-110 shadow-sm'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Password change */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">
              새 비밀번호 변경 (변경할 경우에만 입력)
            </label>
            <input
              type="password"
              placeholder="변경할 새 비밀번호"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl border-2 border-slate-200 text-xs font-bold"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600"
            >
              닫기
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-amber-300 hover:bg-amber-400 text-amber-950 font-black text-xs border-2 border-amber-400 shadow-[0_3px_0_0_#f59e0b] btn-3d disabled:opacity-50"
            >
              {loading ? '저장 중...' : '변경사항 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
