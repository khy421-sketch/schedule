import { Schedule } from '../types';

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function formatDateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatKoreanDate(ymd: string): string {
  if (!ymd) return '';
  const date = parseYMD(ymd);
  const weekday = WEEKDAYS[date.getDay()];
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday})`;
}

export interface CalendarDay {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  dayOfWeek: number;
}

export function getMonthCalendarDays(year: number, monthIndex: number): CalendarDay[] {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
  const todayStr = formatDateToYMD(new Date());

  const days: CalendarDay[] = [];

  // Previous month trailing days
  const startDayOfWeek = firstDayOfMonth.getDay();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, monthIndex, -i);
    const dStr = formatDateToYMD(d);
    days.push({
      date: d,
      dateString: dStr,
      dayNumber: d.getDate(),
      isCurrentMonth: false,
      isToday: dStr === todayStr,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      dayOfWeek: d.getDay(),
    });
  }

  // Current month days
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const d = new Date(year, monthIndex, i);
    const dStr = formatDateToYMD(d);
    days.push({
      date: d,
      dateString: dStr,
      dayNumber: i,
      isCurrentMonth: true,
      isToday: dStr === todayStr,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      dayOfWeek: d.getDay(),
    });
  }

  // Next month leading days to complete weeks (42 cells: 6 rows x 7 cols)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, monthIndex + 1, i);
    const dStr = formatDateToYMD(d);
    days.push({
      date: d,
      dateString: dStr,
      dayNumber: i,
      isCurrentMonth: false,
      isToday: dStr === todayStr,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      dayOfWeek: d.getDay(),
    });
  }

  return days;
}

/**
 * Checks if a schedule occurs on targetDateString (YYYY-MM-DD)
 * Takes repeat_type (none, weekly, monthly, yearly) into account!
 */
export function isScheduleOnDate(schedule: Schedule, targetDateString: string): boolean {
  if (targetDateString < schedule.start_date) {
    return false;
  }

  if (schedule.repeat_type === 'none') {
    return targetDateString >= schedule.start_date && targetDateString <= (schedule.end_date || schedule.start_date);
  }

  const targetDate = parseYMD(targetDateString);
  const startDate = parseYMD(schedule.start_date);

  if (schedule.repeat_type === 'weekly') {
    return targetDate.getDay() === startDate.getDay();
  }

  if (schedule.repeat_type === 'monthly') {
    return targetDate.getDate() === startDate.getDate();
  }

  if (schedule.repeat_type === 'yearly') {
    return targetDate.getMonth() === startDate.getMonth() && targetDate.getDate() === startDate.getDate();
  }

  return false;
}
