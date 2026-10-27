import React, { useState, useEffect } from 'react';
import { Scheduler, Schedule, RepeatType } from '../types';
import { PASTEL_COLORS, CATEGORY_PRESETS } from '../constants/theme';
import { X, Calendar, Clock, Lock, Users, Repeat, Check, Palette, Sparkles } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (scheduleData: Partial<Schedule>) => Promise<void>;
  editingSchedule: Schedule | null;
  initialDate?: string;
  schedulers: Scheduler[];
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingSchedule,
  initialDate,
  schedulers,
}) => {
  const [schedulerId, setSchedulerId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isAllDay, setIsAllDay] = useState<boolean>(true);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [isShared, setIsShared] = useState<boolean>(true);
  const [repeatType, setRepeatType] = useState<RepeatType>('none');
  const [color, setColor] = useState<string>('#BAE6FD');
  const [category, setCategory] = useState<string>('일반');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (editingSchedule) {
      setSchedulerId(editingSchedule.scheduler_id);
      setTitle(editingSchedule.title);
      setDescription(editingSchedule.description || '');
      setStartDate(editingSchedule.start_date);
      setEndDate(editingSchedule.end_date || editingSchedule.start_date);
      setIsAllDay(editingSchedule.is_all_day);
      setStartTime(editingSchedule.start_time || '09:00');
      setEndTime(editingSchedule.end_time || '10:00');
      setIsShared(editingSchedule.is_shared);
      setRepeatType(editingSchedule.repeat_type || 'none');
      setColor(editingSchedule.color || '#BAE6FD');
      setCategory(editingSchedule.category || '일반');
    } else {
      const defaultDate = initialDate || new Date().toISOString().split('T')[0];
      setSchedulerId(schedulers[0]?.id || '');
      setTitle('');
      setDescription('');
      setStartDate(defaultDate);
      setEndDate(defaultDate);
      setIsAllDay(true);
      setStartTime('09:00');
      setEndTime('10:00');
      setIsShared(true);
      setRepeatType('none');
      setColor(schedulers[0]?.color || '#BAE6FD');
      setCategory('일반');
    }
    setError('');
  }, [editingSchedule, initialDate, schedulers, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('일정 제목을 입력해주세요.');
      return;
    }
    if (!schedulerId) {
      setError('저장할 스케줄러를 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit({
        scheduler_id: schedulerId,
        title: title.trim(),
        description: description.trim(),
        start_date: startDate,
        end_date: endDate || startDate,
        is_all_day: isAllDay,
        start_time: isAllDay ? undefined : startTime,
        end_time: isAllDay ? undefined : endTime,
        is_shared: isShared,
        repeat_type: repeatType,
        color,
        category,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || '일정 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-[0_10px_0_0_#cbd5e1] max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b-2 border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{editingSchedule ? '✏️' : '✨'}</span>
            <h3 className="text-lg font-black text-slate-800">
              {editingSchedule ? '일정 수정하기' : '새로운 일정 등록'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Scheduler Selection */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">
              📁 소속 스케줄러 선택
            </label>
            <select
              value={schedulerId}
              onChange={(e) => {
                const sId = e.target.value;
                setSchedulerId(sId);
                const found = schedulers.find((s) => s.id === sId);
                if (found) setColor(found.color);
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:outline-none text-xs font-extrabold text-slate-800 shadow-[0_2px_0_0_#e2e8f0]"
            >
              {schedulers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">
              📌 일정 제목
            </label>
            <input
              type="text"
              placeholder="예: 2분기 디자인 스프린트 미팅"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-amber-400 focus:outline-none text-sm font-black text-slate-800 shadow-[0_2px_0_0_#e2e8f0]"
            />
          </div>

          {/* CORE PRD REQUIREMENT: is_shared Toggle Card */}
          <div className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50/60 shadow-[0_3px_0_0_#e2e8f0]">
            <label className="block text-xs font-black text-slate-800 mb-2">
              🔒 선별적 일정 공유 설정 (사생활 보호 & 그룹 협업)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsShared(true)}
                className={`p-3 rounded-2xl border-2 text-left transition-all btn-3d flex flex-col justify-between ${
                  isShared
                    ? 'bg-sky-50 border-sky-400 shadow-[0_3px_0_0_#7dd3fc]'
                    : 'bg-white border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">👥</span>
                  {isShared && (
                    <span className="w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <div className="text-xs font-black text-sky-900">멤버와 공유</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    모든 스케줄러 멤버의 캘린더에 표시됩니다.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsShared(false)}
                className={`p-3 rounded-2xl border-2 text-left transition-all btn-3d flex flex-col justify-between ${
                  !isShared
                    ? 'bg-pink-50 border-pink-400 shadow-[0_3px_0_0_#f472b6]'
                    : 'bg-white border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">🔒</span>
                  {!isShared && (
                    <span className="w-4 h-4 rounded-full bg-pink-500 text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <div className="text-xs font-black text-pink-900">나만 보기 (비공개)</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    오직 나에게만 보이며 타인에게 숨겨집니다.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Dates & Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                시작 날짜
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl border-2 border-slate-200 text-xs font-bold text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                종료 날짜
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl border-2 border-slate-200 text-xs font-bold text-slate-700"
              />
            </div>
          </div>

          {/* All day toggle & Time picker */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-extrabold text-slate-700">하루 종일 진행</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
            </label>
          </div>

          {!isAllDay && (
            <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-100">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  시작 시간
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl border-2 border-slate-200 text-xs font-bold text-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  종료 시간
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl border-2 border-slate-200 text-xs font-bold text-slate-700"
                />
              </div>
            </div>
          )}

          {/* Repeat Option */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1">
              <Repeat size={13} className="text-purple-500" />
              <span>반복 주기 설정</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { type: 'none', label: '반복 없음' },
                  { type: 'weekly', label: '매주 반복' },
                  { type: 'monthly', label: '매월 반복' },
                  { type: 'yearly', label: '매년 반복' },
                ] as const
              ).map((rep) => (
                <button
                  type="button"
                  key={rep.type}
                  onClick={() => setRepeatType(rep.type)}
                  className={`py-2 rounded-xl text-xs font-extrabold border-2 transition-all btn-3d ${
                    repeatType === rep.type
                      ? 'bg-purple-100 text-purple-900 border-purple-300 shadow-[0_2px_0_0_#c084fc]'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {rep.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">
                🏷️ 카테고리 태그
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl border-2 border-slate-200 text-xs font-bold text-slate-700"
              >
                {CATEGORY_PRESETS.map((cat) => (
                  <option key={cat} value={cat}>
                    #{cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">
                🎨 파스텔 테마 색상
              </label>
              <div className="flex items-center gap-1.5">
                {PASTEL_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setColor(c.hex)}
                    className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${
                      color === c.hex ? 'scale-115 border-slate-800 shadow-sm' : 'border-slate-200'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {color === c.hex && <Check size={12} className="text-slate-800 stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">
              📝 상세 메모 (선택사항)
            </label>
            <textarea
              rows={3}
              placeholder="준비물, 링크, 회의 안건 등을 편하게 메모하세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl border-2 border-slate-200 focus:border-amber-400 focus:outline-none text-xs text-slate-700 shadow-[0_2px_0_0_#e2e8f0]"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t-2 border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 btn-3d"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-2xl text-xs font-black text-amber-950 bg-amber-300 hover:bg-amber-400 border-2 border-amber-400 shadow-[0_4px_0_0_#f59e0b] btn-3d disabled:opacity-50"
            >
              {loading ? '저장 중...' : editingSchedule ? '수정 완료' : '일정 등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
