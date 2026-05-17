import type { ScheduleConfig, Weekday } from './types';

const weekdayLabels: Record<Weekday, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
};

const WEEKDAY_ORDER: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0];

const formatWeekdays = (weekdays: readonly Weekday[]): string => {
  if (weekdays.length === 0) return 'Nenhum dia';
  if (weekdays.length === 7) return 'Todos os dias';

  const sorted = WEEKDAY_ORDER.filter((day) => weekdays.includes(day));
  if (sorted.length >= 3) {
    const positions = sorted.map((day) => WEEKDAY_ORDER.indexOf(day));
    const isContiguous = positions.every(
      (pos, idx) => idx === 0 || pos === positions[idx - 1] + 1,
    );
    if (isContiguous) {
      return `${weekdayLabels[sorted[0]]} a ${weekdayLabels[sorted[sorted.length - 1]]}`;
    }
  }
  return sorted.map((day) => weekdayLabels[day]).join(', ');
};

export const formatScheduleSummary = (schedule: ScheduleConfig): string => {
  const days = formatWeekdays(schedule.weekdays);
  return `${days} · ${schedule.startTime} às ${schedule.endTime}`;
};
