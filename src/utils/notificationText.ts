import type { AppNotification, RealtimeNotificationPayload } from '../types/notification';

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ');

const formatVnd = (value: string) => {
  const amount = Number(value.replace(/,/g, ''));
  if (!Number.isFinite(amount)) return `${value} đ`;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

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
  'Booking cancelled by mother': 'Mẹ đã hủy booking',
  'Booking cancelled by nurse': 'Nurse đã hủy booking',
  'Booking cancelled - refund pending': 'Đã hủy booking - chờ hoàn tiền',
  'Booking cancellation recorded': 'Đã ghi nhận hủy booking',
  'Mother refund request created': 'Yêu cầu hoàn tiền mới',
  'Refund request approved': 'Yêu cầu hoàn tiền đã được duyệt',
  'Refund request rejected': 'Yêu cầu hoàn tiền bị từ chối',
  'Mother unreachable incident reported': 'Báo cáo không liên lạc được mẹ',
  'Work session incident reported': 'Báo cáo sự cố ca làm',
  'Incident approved': 'Sự cố đã được duyệt',
  'Incident rejected': 'Sự cố bị từ chối',
  'Nurse no-show confirmed': 'Đã xác nhận nurse bỏ ca',
  'No-show penalty applied': 'Đã áp dụng phạt bỏ ca',
  'Booking availability suspended': 'Tạm khóa nhận lịch',
  'Nurse account suspended': 'Tài khoản nurse bị khóa',
  'New user feedback': 'Góp ý mới',
  'Feedback received': 'Góp ý đã được ghi nhận',
  'Feedback status updated': 'Cập nhật góp ý',
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

  if (normalized === 'Your feedback has been received. Our team will review it and use it to improve Happabi.') {
    return 'Góp ý của bạn đã được ghi nhận. Đội ngũ Happabi sẽ xem xét để cải thiện sản phẩm.';
  }

  const newFeedbackMatch = normalized.match(/^(.+) submitted feedback about (.+)\.$/);
  if (newFeedbackMatch) {
    return `${newFeedbackMatch[1]} đã gửi góp ý về ${newFeedbackMatch[2]}.`;
  }

  const feedbackStatusMatch = normalized.match(/^Your feedback status was updated to (.+)\.$/);
  if (feedbackStatusMatch) {
    const statusMap: Record<string, string> = {
      REVIEWING: 'đang xem xét',
      PLANNED: 'đã lên kế hoạch',
      RESOLVED: 'đã xử lý',
      CLOSED: 'đã đóng',
    };
    return `Góp ý của bạn đã được cập nhật sang trạng thái ${statusMap[feedbackStatusMatch[1]] ?? feedbackStatusMatch[1]}.`;
  }
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

  if (/^The nurse reported that they could not reach you after arrival\. Admin will review the evidence\.?$/i.test(normalized)) {
    return 'Nurse báo không liên lạc được với bạn sau khi đến nơi. Admin sẽ kiểm tra bằng chứng.';
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

const translateWithdrawalTitle = (title: string) => {
  const normalized = normalize(title);
  if (normalized === 'New withdrawal request') return 'Yêu cầu rút tiền mới';
  if (normalized === 'Withdrawal request created') return 'Yêu cầu rút tiền đã được tạo';
  if (normalized === 'Withdrawal request approved') return 'Yêu cầu rút tiền đã được duyệt';
  if (normalized === 'Withdrawal request rejected') return 'Yêu cầu rút tiền bị từ chối';
  if (normalized === 'Withdrawal request cancelled') return 'Yêu cầu rút tiền đã hủy';
  if (normalized.toLowerCase().includes('withdrawal request')) return 'Cập nhật rút tiền';
  return 'Cập nhật rút tiền';
};

const translateWithdrawalMessage = (message: string) => {
  const normalized = normalize(message);

  const requestedMatch = normalized.match(/^(.+) requested a withdrawal of ([\d.,eE+-]+) VND\.?$/);
  if (requestedMatch) {
    return `${requestedMatch[1]} đã tạo yêu cầu rút ${formatVnd(requestedMatch[2])}.`;
  }

  const createdMatch = normalized.match(/^Your withdrawal request of ([\d.,eE+-]+) VND has been created and is waiting for admin approval\.?$/);
  if (createdMatch) {
    return `Yêu cầu rút ${formatVnd(createdMatch[1])} đã được tạo và đang chờ admin duyệt.`;
  }

  const cancelledByNurseMatch = normalized.match(/^(.+) cancelled a withdrawal request of ([\d.,eE+-]+) VND\.?$/);
  if (cancelledByNurseMatch) {
    return `${cancelledByNurseMatch[1]} đã hủy yêu cầu rút ${formatVnd(cancelledByNurseMatch[2])}.`;
  }

  if (
    normalized === 'Your withdrawal request has been approved. Please check your bank account.' ||
    normalized === 'Your withdrawal request has been đã được duyệt. Please check your bank account.'
  ) {
    return 'Yêu cầu rút tiền đã được duyệt. Vui lòng kiểm tra tài khoản ngân hàng.';
  }

  if (normalized === 'Your withdrawal request has been cancelled and the held amount has been returned to your wallet.') {
    return 'Yêu cầu rút tiền đã được hủy. Số tiền tạm giữ đã được hoàn về ví.';
  }

  const rejectedMatch = normalized.match(/^Your withdrawal request was rejected\. Reason: (.+)$/);
  if (rejectedMatch) {
    return `Yêu cầu rút tiền bị từ chối. Lý do: ${rejectedMatch[1]}`;
  }

  if (normalized.toLowerCase().includes('withdrawal request')) {
    return normalized
      .replace(/^Your withdrawal request/i, 'Yêu cầu rút tiền')
      .replace(/has been created and is waiting for admin approval\.?/i, 'đã được tạo và đang chờ admin duyệt.')
      .replace(/has been approved\.? Please check your bank account\.?/i, 'đã được duyệt. Vui lòng kiểm tra tài khoản ngân hàng.')
      .replace(/has been cancelled and the held amount has been returned to your wallet\.?/i, 'đã được hủy. Số tiền tạm giữ đã được hoàn về ví.');
  }

  return normalized;
};

const translatePolicyMessage = (message: string) => {
  const normalized = normalize(message);
  const refundMatch = normalized.match(/^A refund request of ([\d.,eE+-]+) VND was created for booking (.+)\.$/);
  if (refundMatch) {
    return `Yêu cầu hoàn ${formatVnd(refundMatch[1])} đã được tạo cho booking ${refundMatch[2]}.`;
  }
  if (normalized === 'Your booking was cancelled and a manual refund request has been created.') {
    return 'Booking đã được hủy và yêu cầu hoàn tiền thủ công đã được tạo.';
  }
  if (normalized === 'Your booking was cancelled. This cancellation is not refundable by policy.') {
    return 'Booking đã được hủy. Lần hủy này không được hoàn tiền theo chính sách.';
  }
  if (normalized === 'Your refund request has been approved. Please check your bank account.') {
    return 'Yêu cầu hoàn tiền đã được duyệt. Vui lòng kiểm tra tài khoản ngân hàng.';
  }
  if (normalized.startsWith('Your refund request was rejected. Reason:')) {
    return normalized.replace('Your refund request was rejected. Reason:', 'Yêu cầu hoàn tiền bị từ chối. Lý do:');
  }
  if (normalized === 'The nurse reported that they could not reach you after arrival. Admin will review the evidence.') {
    return 'Nurse báo không liên lạc được với bạn sau khi đến nơi. Admin sẽ kiểm tra bằng chứng.';
  }
  const adminIncidentMatch = normalized.match(/^A nurse reported a mother unreachable incident for work session (.+)\.$/);
  if (adminIncidentMatch) {
    return `Nurse đã báo cáo không liên lạc được với mẹ cho ca làm ${adminIncidentMatch[1]}.`;
  }
  if (normalized === 'Admin approved the incident report. This work session has been closed according to policy.') {
    return 'Admin đã duyệt báo cáo sự cố. Ca làm đã được đóng theo chính sách.';
  }
  if (normalized === 'Admin confirmed that the nurse did not attend this work session. Support will follow up according to policy.') {
    return 'Admin đã xác nhận nurse không đến ca. Bộ phận hỗ trợ sẽ xử lý tiếp theo chính sách.';
  }
  if (normalized === 'A no-show violation has been confirmed for this work session. Your booking availability has been restricted according to policy.') {
    return 'Ca này đã bị ghi nhận là bỏ ca. Khả năng nhận lịch của bạn đã bị giới hạn theo chính sách.';
  }
  if (normalized === 'Your account has been suspended because of repeated no-show violations.') {
    return 'Tài khoản của bạn đã bị khóa vì nhiều lần bỏ ca.';
  }
  const noShowPenaltyMatch = normalized.match(/^Your booking availability has been suspended until (.+) because of a confirmed no-show violation\.$/);
  if (noShowPenaltyMatch) {
    return `Bạn bị tạm khóa nhận lịch đến ${noShowPenaltyMatch[1]} do một ca bỏ đã được xác nhận.`;
  }
  if (normalized === 'Admin approved your incident report.') {
    return 'Admin đã duyệt báo cáo sự cố của bạn.';
  }
  return null;
};

const translateFeedbackTitle = (title: string) => {
  const normalized = normalize(title);
  if (normalized === 'New user feedback') return 'Góp ý mới';
  if (normalized === 'Feedback received') return 'Góp ý đã được ghi nhận';
  if (normalized === 'Feedback status updated') return 'Cập nhật góp ý';
  return 'Góp ý';
};
export const translateNotificationTitle = (title: string, type?: string, resourceType?: string) => {
  if (resourceType === 'NURSE_WITHDRAWAL') return translateWithdrawalTitle(title);
  if (resourceType === 'USER_FEEDBACK') return translateFeedbackTitle(title);
  const normalized = normalize(title);
  if (titleMap[normalized]) return titleMap[normalized];
  return type ? fallbackTitleByType[type] ?? title : title;
};

export const translateNotificationMessage = (message: string, resourceType?: string) => {
  if (resourceType === 'NURSE_WITHDRAWAL') return translateWithdrawalMessage(message);
  if (resourceType === 'MOTHER_REFUND' || resourceType === 'WORK_SESSION_INCIDENT' || resourceType === 'WORK_SESSION' || resourceType === 'BOOKING' || resourceType === 'NURSE_PENALTY') {
    const policy = translatePolicyMessage(message);
    if (policy) return policy;
  }
  const exact = translateExactMessage(message);
  if (exact) return exact;
  return phraseMap.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), message);
};

export const localizeNotification = <T extends AppNotification | RealtimeNotificationPayload>(notification: T): T => ({
  ...notification,
  title: translateNotificationTitle(notification.title, notification.type, notification.resourceType),
  message: translateNotificationMessage(notification.message, notification.resourceType),
});
