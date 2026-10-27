import React, { useState, useMemo } from 'react';
import { User, Scheduler, Schedule } from '../types';
import {
  WEEKDAYS,
  getMonthCalendarDays,
  formatDateToYMD,
  formatKoreanDate,
  isScheduleOnDate,
  CalendarDay
} from '../utils/date';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Lock,
  Users,
  Repeat,
  Edit2,
  Trash2,
  Calendar as CalendarIcon,
  Filter,
  Check,
  Eye,
  Info
} from 'lucide-react';

interface CalendarViewProps {
  currentUser: User | null;
  schedulers: Scheduler[];
  schedules: Schedule[];
  selectedSchedulerIds: string[];
  onToggleSchedulerFilter: (schedulerId: string) => void;
  onSelectAllSchedulers: () => void;
  onOpenCreateSchedule: (initialDate?: string) => void;
  onOpenEditSchedule: (schedule: Schedule) => void;
  onDeleteSchedule: (scheduleId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentUser,
  schedulers,
  schedules,
  selectedSchedulerIds,
  onToggleSchedulerFilter,
  onSelectAllSchedulers,
  onOpenCreateSchedule,
  onOpenEditSchedule,
  onDeleteSchedule,
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(today.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(formatDateToYMD(today));

  // Calendar cells
  const calendarDays = useMemo(() => {
    return getMonthCalendarDays(currentYear, currentMonthIndex);
  }, [currentYear, currentMonthIndex]);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonthIndex((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonthIndex((prev) => prev + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonthIndex(now.getMonth());
    setSelectedDateStr(formatDateToYMD(now));
  };

  // Schedules occurring on the selected date
  const selectedDateSchedules = useMemo(() => {
    return schedules.filter((sc) => isScheduleOnDate(sc, selectedDateStr));
  }, [schedules, selectedDateStr]);

  // Schedulers map for quick lookup
  const schedulerMap = useMemo(() => {
    return new Map(schedulers.map((s) => [s.id, s]));
  }, [schedulers]);

  // Check user permission on a schedule
  const getPermission = (schedule: Schedule) => {
    if (!currentUser) return { canEdit: false, canDelete: false, roleName: '게스트' };
    if (currentUser.role === 'admin') return { canEdit: true, canDelete: true, roleName: '관리자' };

    const scheduler = schedulerMap.get(schedule.scheduler_id);
    if (!scheduler) return { canEdit: false, canDelete: false, roleName: '권한없음' };

    const member = scheduler.members.find((m) => m.user_id === currentUser.id);
    if (!member) return { canEdit: false, canDelete: false, roleName: '비회원' };

    const isAuthor = schedule.author_id === currentUser.id;

    if (member.role === 'owner') {
      return { canEdit: true, canDelete: true, roleName: '방장 (전체 권한)' };
    }
    if (member.role === 'editor') {
      const can = isAuthor || schedule.is_shared;
      return {
        canEdit: can,
        canDelete: can,
        roleName: isAuthor ? '작성자 (편집자)' : '편집자 (공유 수정 가능)'
      };
    }
    if (member.role === 'viewer') {
      return {
        canEdit: isAuthor,
        canDelete: isAuthor,
        roleName: isAuthor ? '작성자 (조회자)' : '조회자 (읽기 전용)'
      };
    }
    return { canEdit: false, canDelete: false, roleName: '권한없음' };
  };

  return (
    <div className="space-y-6">
      {/* Schedulers Multi-Filter Bar */}
      <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-[0_5px_0_0_#e2e8f0]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-slate-700 font-extrabold text-sm">
            <Filter size={16} className="text-amber-500" />
            <span>스케줄러 필터</span>
            <span className="text-xs font-normal text-slate-400">
              (체크하여 원하는 스케줄러 일정만 골라보기)
            </span>
          </div>
          <button
            onClick={onSelectAllSchedulers}
            className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-xl border border-amber-300 transition-colors"
          >
            모든 스케줄러 선택
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {schedulers.map((s) => {
            const isSelected = selectedSchedulerIds.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => onToggleSchedulerFilter(s.id)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 border-2 transition-all btn-3d ${
                  isSelected
                    ? 'border-slate-300 shadow-[0_3px_0_0_#cbd5e1] scale-102'
                    : 'bg-slate-50 border-dashed border-slate-300 text-slate-400 opacity-60'
                }`}
                style={{
                  backgroundColor: isSelected ? s.color : undefined,
                  color: isSelected ? '#1e293b' : undefined,
                }}
              >
                <span>{s.icon}</span>
                <span>{s.name}</span>
                <span className="w-4 h-4 rounded-full bg-white/80 border border-slate-300 flex items-center justify-center text-[10px]">
                  {isSelected ? <Check size={11} className="text-slate-800 stroke-[3]" /> : ''}
                </span>
              </button>
            );
          })}
          {schedulers.length === 0 && (
            <p className="text-xs text-slate-400 py-1">
              참여 중인 스케줄러가 없습니다. 상단 '스케줄러 관리'에서 새 스케줄러를 만들어보세요!
            </p>
          )}
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-slate-200 shadow-[0_6px_0_0_#e2e8f0]">
        {/* Month Header & Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span>
                {currentYear}년 {currentMonthIndex + 1}월
              </span>
            </h2>
            <button
              onClick={handleToday}
              className="px-3 py-1 rounded-xl text-xs font-black bg-pink-100 text-pink-700 border-2 border-pink-200 hover:bg-pink-200 btn-3d shadow-[0_2px_0_0_#fbcfe8]"
            >
              오늘
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 border-2 border-slate-200 shadow-[0_3px_0_0_#cbd5e1] btn-3d"
              title="이전 달"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 border-2 border-slate-200 shadow-[0_3px_0_0_#cbd5e1] btn-3d"
              title="다음 달"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => onOpenCreateSchedule(selectedDateStr)}
              className="ml-2 px-4 py-2.5 rounded-2xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-sm border-2 border-amber-400 shadow-[0_4px_0_0_#f59e0b] btn-3d flex items-center gap-1.5"
            >
              <Plus size={16} className="stroke-[3]" />
              <span>새 일정</span>
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
          {WEEKDAYS.map((w, idx) => (
            <div
              key={w}
              className={`py-2 text-xs sm:text-sm font-extrabold rounded-xl ${
                idx === 0
                  ? 'text-rose-500 bg-rose-50/70'
                  : idx === 6
                  ? 'text-sky-500 bg-sky-50/70'
                  : 'text-slate-600 bg-slate-50/60'
              }`}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Calendar Day Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((cell: CalendarDay) => {
            const isSelected = cell.dateString === selectedDateStr;
            const daySchedules = schedules.filter((sc) => isScheduleOnDate(sc, cell.dateString));

            return (
              <div
                key={cell.dateString}
                onClick={() => setSelectedDateStr(cell.dateString)}
                className={`min-h-[78px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between select-none ${
                  isSelected
                    ? 'border-amber-400 bg-amber-50/80 shadow-[0_4px_0_0_#fcd34d] -translate-y-0.5'
                    : cell.isCurrentMonth
                    ? 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 shadow-[0_3px_0_0_#f1f5f9]'
                    : 'border-slate-100 bg-slate-50/50 text-slate-300'
                }`}
              >
                {/* Day Number Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs sm:text-sm font-extrabold w-6 h-6 rounded-xl flex items-center justify-center ${
                      cell.isToday
                        ? 'bg-rose-500 text-white shadow-sm'
                        : isSelected
                        ? 'bg-amber-300 text-amber-950 font-black'
                        : cell.dayOfWeek === 0
                        ? 'text-rose-500'
                        : cell.dayOfWeek === 6
                        ? 'text-sky-500'
                        : cell.isCurrentMonth
                        ? 'text-slate-700'
                        : 'text-slate-300'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {daySchedules.length > 0 && (
                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {daySchedules.length}
                    </span>
                  )}
                </div>

                {/* Day Schedule preview chips */}
                <div className="space-y-1 mt-1 overflow-hidden">
                  {daySchedules.slice(0, 3).map((sc) => (
                    <div
                      key={sc.id}
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg truncate border flex items-center gap-1 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]"
                      style={{
                        backgroundColor: sc.color || '#BAE6FD',
                        borderColor: 'rgba(0,0,0,0.08)',
                        color: '#1e293b'
                      }}
                      title={`${sc.title} (${sc.is_shared ? '공유' : '비공개'})`}
                    >
                      {!sc.is_shared ? (
                        <Lock size={9} className="text-slate-700 shrink-0" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-800/60 shrink-0" />
                      )}
                      <span className="truncate">{sc.title}</span>
                    </div>
                  ))}
                  {daySchedules.length > 3 && (
                    <div className="text-[9px] font-bold text-slate-400 pl-1">
                      +{daySchedules.length - 3}개 더보기
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Detail Drawer (3D Card List) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-slate-200 shadow-[0_6px_0_0_#e2e8f0]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
              <h3 className="text-lg sm:text-xl font-black text-slate-800">
                {formatKoreanDate(selectedDateStr)}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              선택한 날짜의 일정 목록 (공유 일정 및 본인의 개인 일정 포함)
            </p>
          </div>

          <button
            onClick={() => onOpenCreateSchedule(selectedDateStr)}
            className="self-start sm:self-auto px-4 py-2 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-300 font-extrabold text-xs flex items-center gap-1.5 shadow-[0_3px_0_0_#fcd34d] btn-3d"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>이 날짜에 새 일정 추가</span>
          </button>
        </div>

        {/* Schedule cards list */}
        <div className="mt-5 space-y-3.5">
          {selectedDateSchedules.map((schedule) => {
            const perm = getPermission(schedule);
            const isMine = currentUser?.id === schedule.author_id;

            return (
              <div
                key={schedule.id}
                className="group p-4 sm:p-5 rounded-2xl border-2 border-slate-200 shadow-[0_5px_0_0_#e2e8f0] card-3d-hover relative overflow-hidden bg-white"
              >
                {/* Top color bar indicator */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: schedule.color || '#BAE6FD' }}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Scheduler Name Badge */}
                      <span
                        className="px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1 shadow-sm"
                        style={{
                          backgroundColor: schedule.scheduler_color || '#BAE6FD',
                          borderColor: 'rgba(0,0,0,0.1)',
                          color: '#1e293b'
                        }}
                      >
                        <span>{schedule.scheduler_icon || '📁'}</span>
                        <span>{schedule.scheduler_name || '스케줄러'}</span>
                      </span>

                      {/* Shared vs Private Badge (PRD 핵심 요구사항!) */}
                      {schedule.is_shared ? (
                        <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1">
                          <Users size={12} />
                          <span>👥 팀 공유 일정</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-pink-100 text-pink-800 border border-pink-300 flex items-center gap-1">
                          <Lock size={12} />
                          <span>🔒 나만의 비밀 일정 (비공개)</span>
                        </span>
                      )}

                      {/* Category Badge */}
                      {schedule.category && (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          #{schedule.category}
                        </span>
                      )}

                      {/* Repeat badge */}
                      {schedule.repeat_type !== 'none' && (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                          <Repeat size={11} />
                          <span>
                            {schedule.repeat_type === 'weekly'
                              ? '매주 반복'
                              : schedule.repeat_type === 'monthly'
                              ? '매월 반복'
                              : '매년 반복'}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Schedule Title */}
                    <h4 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                      {schedule.title}
                    </h4>

                    {/* Description memo */}
                    {schedule.description && (
                      <p className="text-xs sm:text-sm text-slate-500 whitespace-pre-wrap leading-relaxed">
                        {schedule.description}
                      </p>
                    )}

                    {/* Time & Author metadata */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                      <div className="flex items-center gap-1 font-bold text-slate-600">
                        <Clock size={13} className="text-amber-500" />
                        <span>
                          {schedule.is_all_day
                            ? '하루 종일'
                            : `${schedule.start_time || '00:00'} ~ ${schedule.end_time || '23:59'}`}
                        </span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <span>작성자:</span>
                        <span className="font-bold text-slate-600">
                          {schedule.author_name} (@{schedule.author_username})
                        </span>
                        {isMine && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 font-extrabold rounded">
                            나
                          </span>
                        )}
                      </div>
                      <span>•</span>
                      <span className="text-[11px] text-slate-400">
                        권한: {perm.roleName}
                      </span>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {perm.canEdit ? (
                      <button
                        onClick={() => onOpenEditSchedule(schedule)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border-2 border-slate-200 text-xs font-black shadow-[0_2px_0_0_#cbd5e1] btn-3d flex items-center gap-1"
                        title="일정 수정"
                      >
                        <Edit2 size={13} />
                        <span>수정</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-xl flex items-center gap-1">
                        <Eye size={12} /> 읽기 전용
                      </span>
                    )}

                    {perm.canDelete && (
                      <button
                        onClick={() => {
                          if (confirm(`'${schedule.title}' 일정을 삭제하시겠습니까?`)) {
                            onDeleteSchedule(schedule.id);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border-2 border-rose-200 text-xs font-black shadow-[0_2px_0_0_#fecdd3] btn-3d flex items-center gap-1"
                        title="일정 삭제"
                      >
                        <Trash2 size={13} />
                        <span>삭제</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {selectedDateSchedules.length === 0 && (
            <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
              <div className="text-3xl mb-2">🌿</div>
              <p className="text-sm font-extrabold text-slate-600">등록된 일정이 없습니다</p>
              <p className="text-xs text-slate-400 mt-1">
                상단의 '이 날짜에 새 일정 추가' 버튼을 눌러 소중한 계획을 기록해보세요.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
