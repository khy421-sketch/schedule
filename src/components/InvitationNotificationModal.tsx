import React from 'react';
import { Invitation } from '../types';
import { X, Bell, Check, Ban, Sparkles, Folder } from 'lucide-react';

interface InvitationNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitations: Invitation[];
  onRespond: (id: string, action: 'accept' | 'reject') => Promise<void>;
}

export const InvitationNotificationModal: React.FC<InvitationNotificationModalProps> = ({
  isOpen,
  onClose,
  invitations,
  onRespond,
}) => {
  if (!isOpen) return null;

  const pendingInvitations = invitations.filter((i) => i.status === 'pending');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-[0_12px_0_0_#cbd5e1] max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b-2 border-slate-100 flex items-center justify-between bg-amber-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-200 border-2 border-amber-300 shadow-[0_3px_0_0_#fcd34d] flex items-center justify-center text-lg">
              🔔
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">초대 알림 보관함</h3>
              <p className="text-xs text-slate-500">
                대기 중인 초대 ({pendingInvitations.length}건)
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

        {/* Body */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {pendingInvitations.length > 0 ? (
            pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-2xl border-2 border-slate-200 shadow-[0_4px_0_0_#e2e8f0] card-3d-hover space-y-3"
                style={{
                  backgroundColor: '#ffffff',
                }}
              >
                {/* Scheduler banner */}
                <div
                  className="p-3 rounded-xl border flex items-center gap-2.5"
                  style={{
                    backgroundColor: inv.scheduler_color || '#BAE6FD',
                    borderColor: 'rgba(0,0,0,0.08)',
                  }}
                >
                  <span className="text-2xl">{inv.scheduler_icon || '📁'}</span>
                  <div>
                    <div className="text-xs font-black text-slate-800">
                      {inv.scheduler_name}
                    </div>
                    <div className="text-[10px] text-slate-600">
                      초대 등급: {inv.role === 'editor' ? '✏️ 편집자' : '👁️ 조회자'}
                    </div>
                  </div>
                </div>

                {/* Message required by PRD 4.2 */}
                <p className="text-xs font-bold text-slate-700 leading-relaxed">
                  <span className="text-amber-800 font-black">
                    @{inv.from_username} ({inv.from_user_name})
                  </span>
                  님이{' '}
                  <span className="text-pink-600 font-black">
                    [{inv.scheduler_name}]
                  </span>
                  에 초대했습니다.
                </p>

                {/* Accept / Reject 3D Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onRespond(inv.id, 'accept')}
                    className="flex-1 py-2 rounded-xl bg-emerald-200 hover:bg-emerald-300 text-emerald-950 font-black text-xs border-2 border-emerald-400 shadow-[0_3px_0_0_#34d399] btn-3d flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} className="stroke-[3]" />
                    <span>수락하기</span>
                  </button>

                  <button
                    onClick={() => onRespond(inv.id, 'reject')}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs border-2 border-slate-200 shadow-[0_3px_0_0_#cbd5e1] btn-3d flex items-center justify-center gap-1.5"
                  >
                    <Ban size={14} />
                    <span>거절</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-slate-400 space-y-2">
              <div className="text-3xl">📭</div>
              <p className="text-xs font-extrabold text-slate-600">도착한 새 초대가 없습니다</p>
              <p className="text-[11px]">다른 멤버가 스케줄러로 초대하면 여기에 알림이 뜹니다.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t-2 border-slate-100 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-black border-2 border-slate-200 shadow-[0_2px_0_0_#e2e8f0] btn-3d"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
