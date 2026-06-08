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
  'Work session confirmed': 'Ca làm đã được xác nhận',
  'Work session reported': 'Ca làm bị báo cáo',
};

const fallbackTitleByType: Record<string, string> = {
  NURSE_PROFILE_REJECTED: 'Hồ sơ nurse bị từ chối',
  NURSE_PROFILE_APPROVED_PENDING_CONTRACT: 'Hồ sơ nurse đã được duyệt',
  NURSE_PROFILE_ACTIVE: 'Tài khoản nurse đã hoạt động',
  NURSE_SUSPENDED: 'Tài khoản nurse bị tạm khóa',
  NURSE_REACTIVATED: 'Tài khoản nurse đã được mở lại',
  WORK_SESSION_UPDATED: 'Cập nhật ca làm',
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

  const lateMatch = normalized.match(/^Your nurse checked in (\d+) minute\(s\) late\.$/i);
  if (lateMatch) {
    return `Nurse đã check-in trễ ${lateMatch[1]} phút.`;
  }

  return null;
};

const phraseMap: Array<[RegExp, string]> = [
  [/\bYour nurse\b/gi, 'Nurse'],
  [/\bnurse has checked in\b/gi, 'Nurse đã check-in'],
  [/\bnurse checked in\b/gi, 'Nurse đã check-in'],
  [/\bnurse has checked out\b/gi, 'Nurse đã checkout'],
  [/\bnurse checked out\b/gi, 'Nurse đã checkout'],
  [/\bPlease confirm completion or report an issue\b/gi, 'Vui lòng xác nhận hoàn thành hoặc báo cáo sự cố'],
  [/\bminute\(s\) late\b/gi, 'phút trễ'],
  [/\bmother has confirmed\b/gi, 'Mẹ đã xác nhận'],
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
