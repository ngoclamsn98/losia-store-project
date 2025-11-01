import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);

// Set Vietnamese locale
dayjs.locale('vi');

/**
 * Format number to Vietnamese currency
 * @param amount - Number to format
 * @returns Formatted string like "1,000,000 VNĐ"
 */
export function formatVND(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  return `${num.toLocaleString('vi-VN')} VNĐ`;
}

/**
 * Format number with thousand separators
 * @param num - Number to format
 * @returns Formatted string like "1,000,000"
 */
export function formatNumber(num: number | string | null | undefined): string {
  const n = typeof num === 'string' ? parseFloat(num) : (num || 0);
  return n.toLocaleString('vi-VN');
}

/**
 * Format date to DD-MM-YYYY
 * @param date - Date string or Date object
 * @returns Formatted date string like "26-10-2025"
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return dayjs(date).format('DD-MM-YYYY');
}

/**
 * Format date to DD-MM-YYYY HH:mm
 * @param date - Date string or Date object
 * @returns Formatted datetime string like "26-10-2025 10:30"
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return dayjs(date).format('DD-MM-YYYY HH:mm');
}

/**
 * Format date to DD-MM-YYYY HH:mm:ss
 * @param date - Date string or Date object
 * @returns Formatted datetime string like "26-10-2025 10:30:45"
 */
export function formatDateTimeFull(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return dayjs(date).format('DD-MM-YYYY HH:mm:ss');
}

/**
 * Format relative time (e.g., "2 giờ trước")
 * @param date - Date string or Date object
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return dayjs(date).fromNow();
}

