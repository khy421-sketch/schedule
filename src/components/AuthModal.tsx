import React, { useState } from 'react';
import { User } from '../types';
import { AVATAR_PRESETS } from '../constants/theme';
import { X, Sparkles, LogIn, UserPlus, Shield, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (data: { username: string; password: string; name: string; avatar?: string }) => Promise<void>;
  demoUsers: User[];
  onDemoLogin: (username: string) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  demoUsers,
  onDemoLogin,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [avatar, setAvatar] = useState<string>('🐱');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      if (mode === 'login') {
        await onLogin(username, password);
      } else {
        await onRegister({ username, password, name, avatar });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || '인증에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoUsername: string) => {
    try {
      setLoading(true);
      setError('');
      await onDemoLogin(demoUsername);
      onClose();
    } catch (err: any) {
      setError(err.message || '데모 로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-[0_12px_0_0_#cbd5e1] max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b-2 border-slate-100 flex items-center justify-between bg-amber-50/80">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌸</span>
            <div>
              <h3 className="text-lg font-black text-slate-800">CozySchedule</h3>
              <p className="text-xs text-slate-500">포근하고 안전한 멀티 공유 스케줄러</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="p-5 pb-0">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-2 rounded-xl text-xs font-black transition-all ${
                mode === 'login'
                  ? 'bg-white text-slate-800 shadow-[0_2px_0_0_#cbd5e1]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              로그인 (Login)
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`py-2 rounded-xl text-xs font-black transition-all ${
                mode === 'register'
                  ? 'bg-white text-slate-800 shadow-[0_2px_0_0_#cbd5e1]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              회원가입 (Sign Up)
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs font-bold space-y-2">
              <div>{error}</div>
              {mode === 'login' && error.includes('존재하지 않는') && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                    if (!name) setName(username);
                  }}
                  className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 font-black rounded-xl border-2 border-amber-400 text-xs flex items-center gap-1 shadow-[0_2px_0_0_#f59e0b] btn-3d"
                >
                  <span>✨ '{username}' 아이디로 회원가입 진행하기</span>
                </button>
              )}
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  이름 (닉네임)
                </label>
                <input
                  type="text"
                  placeholder="예: 홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-2xl border-2 border-slate-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  프로필 아바타 선택
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_PRESETS.map((av) => (
                    <button
                      type="button"
                      key={av}
                      onClick={() => setAvatar(av)}
                      className={`w-8 h-8 rounded-xl text-base flex items-center justify-center border-2 transition-all ${
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
            </>
          )}

          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">
              아이디 (Username)
            </label>
            <input
              type="text"
              placeholder="영문, 숫자 아이디"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-2xl border-2 border-slate-200 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-2xl border-2 border-slate-200 text-xs font-bold"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-2xl bg-amber-300 hover:bg-amber-400 text-amber-950 font-black text-xs border-2 border-amber-400 shadow-[0_3px_0_0_#f59e0b] btn-3d disabled:opacity-50"
          >
            {loading ? '처리 중...' : mode === 'login' ? '로그인하기' : '회원가입 완료'}
          </button>
        </form>

        {/* 1-Click Fast Demo Login for testing */}
        <div className="p-4 bg-slate-50/80 border-t-2 border-slate-100 space-y-2">
          <div className="text-[11px] font-black text-slate-500 flex items-center gap-1">
            <Sparkles size={12} className="text-amber-500" />
            <span>원클릭 데모 계정으로 즉시 체험:</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {demoUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickDemo(u.username)}
                className="p-2 rounded-xl bg-white hover:bg-amber-50 border-2 border-slate-200 hover:border-amber-300 shadow-[0_2px_0_0_#e2e8f0] text-left transition-all btn-3d flex items-center gap-2"
              >
                <span className="text-lg">{u.avatar}</span>
                <div className="truncate">
                  <div className="text-xs font-black text-slate-800 truncate flex items-center gap-1">
                    <span>{u.name}</span>
                    {u.role === 'admin' && (
                      <span className="text-[9px] px-1 bg-amber-200 text-amber-900 rounded font-black">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">@{u.username}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
