import type { AppNotification, RealtimeNotificationPayload } from '../types/notification';

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ');

const titleMap: Record<string, string> = {
  'Nurse profile rejected': 'Hồ sơ nurse bị từ chối',
  'Nurse profile approved': 'Hồ sơ nurse đã được duyệt',
  'Nurse profile active': 'Tài khoản nurse đã hoạt động',
  'Nurse suspended': 'Tài khoản nurse bị tạm khóa',
  'Nurse reactivated': 'Tài khoản nurse đã được mở lại',
  'Work session updated': 'Cập nhật ca làm',
  'Nurse checked in': 'Nurse đã check-in',
  'Nurse checked out': 'Nurse đã checkout',
  'Work session completed': 'Ca làm đã hoàn thành',
  'Check-in successful': 'Check-in thành công',
  'Checkout successful': 'Checkout thành công',
  'Work session confirmed': 'Ca làm đã được xác nhận',
  'Work session reported': 'Ca làm bị báo cáo',
  'Booking is waiting for payment': 'Booking đang chờ thanh toán',
  'Booking confirmed': 'Booking đã được xác nhận',
  'Booking payment was not completed': 'Thanh toán booking chưa hoàn tất',
  'Booking payment expired': 'Thanh toán booking đã quá hạn',
  'New booking assigned': 'Bạn có booking mới',
  'Availability window opened': 'Đã mở khung nhận lịch',
  'Availability window cancelled': 'Đã hủy khung nhận lịch',
};

const fallbackTitleByType: Record<string, string> = {
  NURSE_PROFILE_REJECTED: 'Hồ sơ nurse bị từ chối',
  NURSE_PROFILE_APPROVED_PENDING_CONTRACT: 'Hồ sơ nurse đã được duyệt',
  NURSE_PROFILE_ACTIVE: 'Tài khoản nurse đã hoạt động',
  NURSE_SUSPENDED: 'Tài khoản nurse bị tạm khóa',
  NURSE_REACTIVATED: 'Tài khoản nurse đã được mở lại',
  BOOKING_PAYMENT_PENDING: 'Booking đang chờ thanh toán',
  BOOKING_PAYMENT_SUCCESS: 'Booking đã thanh toán',
  BOOKING_PAYMENT_FAILED: 'Thanh toán booking thất bại',
  BOOKING_PAYMENT_EXPIRED: 'Thanh toán booking đã quá hạn',
  NURSE_BOOKING_ASSIGNED: 'Bạn có booking mới',
  WORK_SESSION_UPDATED: 'Cập nhật ca làm',
  NURSE_AVAILABILITY_WINDOW_OPENED: 'Đã mở khung nhận lịch',
  NURSE_AVAILABILITY_WINDOW_CANCELLED: 'Đã hủy khung nhận lịch',
};

const translateExactMessage = (message: string) => {
  const normalized = normalize(message);

  if (normalized === 'Your nurse has checked in for the work session.') {
    return 'Nurse đã check-in cho ca làm.';
  }

  if (normalized === 'Your nurse has checked out. Please confirm completion or report an issue.') {
    return 'Nurse đã checkout. Vui lòng xác nhận hoàn thành hoặc báo cáo sự cố.';
  }

  if (normalized === 'The mother reported an issue with this work session.') {
    return 'Mẹ đã báo cáo sự cố với ca làm này.';
  }

  if (normalized === 'The mother reported an issue with this work session. Please review the details and wait for system handling.') {
    return 'Mẹ đã báo cáo sự cố với ca làm này. Vui lòng kiểm tra chi tiết và chờ hệ thống xử lý.';
  }

  if (normalized === 'The mother has confirmed this work session. Your earning has been processed according to the payment policy.') {
    return 'Mẹ đã xác nhận hoàn thành ca làm. Thu nhập của bạn đã được xử lý theo chính sách thanh toán.';
  }

  if (normalized === 'You have checked in for this work session. Please complete the service checklist before checkout.') {
    return 'Bạn đã check-in ca làm. Vui lòng hoàn tất checklist dịch vụ trước khi checkout.';
  }

  if (normalized === 'You have checked out. The session is waiting for mother confirmation.') {
    return 'Bạn đã checkout ca làm. Ca này đang chờ mẹ xác nhận hoàn thành.';
  }

  const lateMatch = normalized.match(/^Your nurse checked in (\d+) minute\(s\) late\.$/i);
  if (lateMatch) {
    return `Nurse đã check-in trễ ${lateMatch[1]} phút.`;
  }

  const openedAvailabilityMatch = normalized.match(/^You opened an availability window from (.+) to (.+)\.$/i);
  if (openedAvailabilityMatch) {
    return `Bạn đã mở khung nhận lịch từ ${openedAvailabilityMatch[1]} đến ${openedAvailabilityMatch[2]}.`;
  }

  const cancelledAvailabilityMatch = normalized.match(/^You cancelled an availability window from (.+) to (.+)\.$/i);
  if (cancelledAvailabilityMatch) {
    return `Bạn đã hủy khung nhận lịch từ ${cancelledAvailabilityMatch[1]} đến ${cancelledAvailabilityMatch[2]}.`;
  }

  return null;
};

const phraseMap: Array<[RegExp, string]> = [
  [/\bYour booking for\b/gi, 'Booking dịch vụ'],
  [/\bhas been created\b/gi, 'đã được tạo'],
  [/\bPlease complete payment before\b/gi, 'Vui lòng thanh toán trước'],
  [/\bYour payment was successful\b/gi, 'Thanh toán đã thành công'],
  [/\bYour session with\b/gi, 'Ca làm với'],
  [/\bis scheduled for\b/gi, 'được lên lịch vào'],
  [/\bPayment for\b/gi, 'Thanh toán cho'],
  [/\bwas not completed\b/gi, 'chưa hoàn tất'],
  [/\bYou can try again before\b/gi, 'Bạn có thể thử lại trước'],
  [/\bwas cancelled because payment was not completed in time\b/gi, 'đã bị hủy vì thanh toán quá hạn'],
  [/\bYou have a new session for\b/gi, 'Bạn có ca làm mới cho dịch vụ'],
  [/\bat\b/gi, 'vào'],
  [/\bYour nurse\b/gi, 'Nurse'],
  [/\bnurse has checked in\b/gi, 'Nurse đã check-in'],
  [/\bnurse checked in\b/gi, 'Nurse đã check-in'],
  [/\bnurse has checked out\b/gi, 'Nurse đã checkout'],
  [/\bnurse checked out\b/gi, 'Nurse đã checkout'],
  [/\bPlease confirm completion or report an issue\b/gi, 'Vui lòng xác nhận hoàn thành hoặc báo cáo sự cố'],
  [/\bminute\(s\) late\b/gi, 'phút trễ'],
  [/\bmother has confirmed\b/gi, 'Mẹ đã xác nhận'],
  [/\bThe session is waiting for mother confirmation\b/gi, 'Ca này đang chờ mẹ xác nhận hoàn thành'],
  [/\bwork session\b/gi, 'ca làm'],
  [/\bchecklist\b/gi, 'checklist'],
  [/\bcompleted\b/gi, 'hoàn thành'],
  [/\bpending mother confirmation\b/gi, 'đang chờ mẹ xác nhận'],
  [/\bplease review\b/gi, 'Vui lòng kiểm tra'],
  [/\bprofile\b/gi, 'hồ sơ'],
  [/\bapproved\b/gi, 'đã được duyệt'],
  [/\brejected\b/gi, 'bị từ chối'],
  [/\bcontract\b/gi, 'hợp đồng'],
  [/\bactive\b/gi, 'đã hoạt động'],
  [/\bsuspended\b/gi, 'bị tạm khóa'],
  [/\breactivated\b/gi, 'đã được mở lại'],
  [/\breported an issue\b/gi, 'đã báo cáo sự cố'],
  [/\breport an issue\b/gi, 'báo cáo sự cố'],
];

export const translateNotificationTitle = (title: string, type?: string) => {
  const normalized = normalize(title);
  if (titleMap[normalized]) return titleMap[normalized];
  return type ? fallbackTitleByType[type] ?? title : title;
};

export const translateNotificationMessage = (message: string) => {
  const exact = translateExactMessage(message);
  if (exact) return exact;
  return phraseMap.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), message);
};

export const localizeNotification = <T extends AppNotification | RealtimeNotificationPayload>(notification: T): T => ({
  ...notification,
  title: translateNotificationTitle(notification.title, notification.type),
  message: translateNotificationMessage(notification.message),
});
