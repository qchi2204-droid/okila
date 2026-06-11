import dayjs from 'dayjs';

// Formats a number as Vietnamese currency: "1.240.000 ₫"
export function formatVnd(amount: number): string {
  return `${Math.round(amount).toLocaleString('vi-VN')} ₫`;
}

export function formatTime(datetime: string): string {
  return dayjs(datetime).format('HH:mm');
}

export function formatDayMonth(datetime: string): string {
  return dayjs(datetime).format('DD/MM');
}

export function formatMonthLabel(date: dayjs.Dayjs): string {
  return `Tháng ${date.month() + 1}`;
}
