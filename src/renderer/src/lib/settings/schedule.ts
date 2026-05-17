import type { ScheduleConfig, Weekday } from './types';

const parseMinutes = (time: string): number | null => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

export const isWithinSchedule = (schedule: ScheduleConfig, now: Date = new Date()): boolean => {
  if (schedule.weekdays.length === 0) return false;

  const weekday = now.getDay() as Weekday;
  const previousWeekday = ((weekday + 6) % 7) as Weekday;

  const startMinutes = parseMinutes(schedule.startTime);
  const endMinutes = parseMinutes(schedule.endTime);
  if (startMinutes === null || endMinutes === null) return false;

  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const crossesMidnight = endMinutes <= startMinutes;

  if (!crossesMidnight) {
    return (
      schedule.weekdays.includes(weekday) &&
      minutesNow >= startMinutes &&
      minutesNow < endMinutes
    );
  }

  if (schedule.weekdays.includes(weekday) && minutesNow >= startMinutes) return true;
  if (schedule.weekdays.includes(previousWeekday) && minutesNow < endMinutes) return true;
  return false;
};
