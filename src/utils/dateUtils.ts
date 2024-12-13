import { isSameDay } from 'date-fns';

export const isDateToday = (date: Date) => {
  return isSameDay(date, new Date());
}; 