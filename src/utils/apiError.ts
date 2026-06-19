const ERROR_TRANSLATIONS: Array<[RegExp, string]> = [
  [/End time must be after start time/i, 'Thời gian kết thúc phải sau thời gian bắt đầu.'],
  [/Availability window must not end in the past/i, 'Khung nhận lịch không được kết thúc trong quá khứ.'],
  [/Availability window overlaps an active window/i, 'Khung nhận lịch bị trùng với khung đang hiệu lực.'],
  [/Check-in is not open yet/i, 'Chưa đến thời gian check-in.'],
  [/Check-in opens at (.+)/i, 'Chưa đến thời gian check-in. Vui lòng quay lại đúng khung giờ được phép.'],
  [/This work session has already been reviewed/i, 'Ca này đã được đánh giá trước đó.'],
  [/Only completed work sessions can be reviewed/i, 'Chỉ có thể đánh giá sau khi ca làm đã hoàn thành.'],
  [/Rating is required/i, 'Vui lòng chọn số sao đánh giá.'],
  [/Selected nurse is not available for booking/i, 'Nurse hiện không sẵn sàng nhận lịch. Vui lòng chọn nurse khác hoặc thử lại sau.'],
  [/Selected nurse does not have verified skills required for this service/i, 'Nurse chưa có đủ kỹ năng đã xác minh để nhận dịch vụ này. Vui lòng chọn dịch vụ hoặc nurse khác.'],
  [/Selected booking slot was already booked/i, 'Khung giờ này đã có lịch đặt. Vui lòng chọn giờ khác.'],
  [/Service offering was not found/i, 'Không tìm thấy dịch vụ hoặc dịch vụ đã tạm ngừng.'],
  [/Nurse onboarding is incomplete/i, 'Hồ sơ nurse chưa đủ thông tin. Vui lòng hoàn tất thông tin cá nhân, CCCD và chứng chỉ.'],
  [/Nurse profile is locked for review/i, 'Hồ sơ đang được duyệt nên chưa thể chỉnh sửa.'],
  [/Only pending review profiles can be approved/i, 'Chỉ hồ sơ đang chờ duyệt mới có thể được phê duyệt.'],
  [/Only pending review profiles can be rejected/i, 'Chỉ hồ sơ đang chờ duyệt mới có thể bị từ chối.'],
  [/Nurse profile is not ready for contract signing/i, 'Hồ sơ chưa sẵn sàng để ký hợp đồng.'],
  [/Contract agreement is required/i, 'Bạn cần đồng ý điều khoản hợp đồng trước khi ký.'],
  [/Certification document is required/i, 'Vui lòng tải lên file chứng chỉ.'],
  [/Nurse profile not found/i, 'Không tìm thấy hồ sơ nurse.'],
  [/Nurse KYC not found/i, 'Không tìm thấy thông tin KYC của nurse.'],
  [/Certification not found/i, 'Không tìm thấy chứng chỉ.'],
  [/CCCD front image is required/i, 'Vui lòng tải ảnh mặt trước CCCD.'],
  [/CCCD front image exceeds/i, 'Ảnh CCCD vượt quá dung lượng cho phép.'],
  [/Unsupported CCCD image type/i, 'Định dạng ảnh CCCD không hợp lệ. Chỉ hỗ trợ JPEG, PNG hoặc WebP.'],
  [/OCR provider is unavailable/i, 'Dịch vụ đọc CCCD bằng AI đang bận. Vui lòng thử lại sau.'],
  [/OCR provider returned an invalid response/i, 'AI trả về dữ liệu CCCD không hợp lệ. Vui lòng nhập thủ công.'],
  [/Failed to extract CCCD fields/i, 'Không đọc được thông tin CCCD từ ảnh. Vui lòng thử ảnh rõ hơn hoặc nhập thủ công.'],
  [/AI OCR is temporarily unavailable/i, 'AI OCR đang tạm thời không khả dụng. Vui lòng nhập thông tin CCCD thủ công.'],
  [/AI chat message is required/i, 'Vui lòng nhập nội dung cần hỏi AI.'],
  [/AI chat conversation was not found/i, 'Không tìm thấy hội thoại AI này.'],
  [/AI chat configuration is missing/i, 'Cấu hình AI chat của backend chưa sẵn sàng.'],
  [/AI chat provider is unavailable/i, 'Dịch vụ AI chat đang bận. Vui lòng thử lại sau.'],
  [/Message must be at most 8000 characters/i, 'Tin nhắn không được vượt quá 8000 ký tự.'],
  [/Message is required/i, 'Vui lòng nhập nội dung tin nhắn.'],
  [/Title must be at most 160 characters/i, 'Tiêu đề hội thoại không được vượt quá 160 ký tự.'],
  [/Doctor account already exists/i, 'Tài khoản doctor đã tồn tại.'],
  [/Failed to create doctor account/i, 'Không tạo được tài khoản doctor. Vui lòng thử lại.'],
  [/DOCTOR role not found/i, 'Backend chưa cấu hình role DOCTOR.'],
  [/Email must be valid/i, 'Email không đúng định dạng.'],
  [/Phone number is required/i, 'Vui lòng nhập số điện thoại.'],
  [/Phone number must follow Vietnam E\.164 format/i, 'Số điện thoại không đúng định dạng Việt Nam.'],
  [/Password is required/i, 'Vui lòng nhập mật khẩu.'],
  [/Password must be at least 8 characters/i, 'Mật khẩu phải có ít nhất 8 ký tự.'],
  [/New password is required/i, 'Vui lòng nhập mật khẩu mới.'],
  [/Full name is required/i, 'Vui lòng nhập họ tên.'],
  [/Full name must not exceed/i, 'Họ tên không được vượt quá 100 ký tự.'],
  [/Role is required/i, 'Vui lòng chọn vai trò.'],
  [/OTP code is required/i, 'Vui lòng nhập mã OTP.'],
  [/OTP code must contain exactly 6 digits/i, 'Mã OTP phải gồm đúng 6 chữ số.'],
  [/Role .* is already linked to this account/i, 'Vai trò này đã được liên kết với tài khoản.'],
  [/Phone number already exists/i, 'Số điện thoại đã tồn tại. Vui lòng nhập đúng mật khẩu để thêm vai trò mới.'],
  [/Your account is not allowed to sign in to portal/i, 'Tài khoản của bạn không có quyền đăng nhập vào portal này.'],
  [/Portal role is required for sign-in/i, 'Vui lòng chọn vai trò đăng nhập.'],
  [/This account uses social sign-in/i, 'Tài khoản này đăng nhập qua mạng xã hội nên không có mật khẩu local để đặt lại.'],
  [/This phone number belongs to a social account/i, 'Số điện thoại này thuộc tài khoản mạng xã hội. Vui lòng đăng nhập trước, xác thực số điện thoại rồi tạo mật khẩu local.'],
  [/Registration successful/i, 'Đăng ký thành công.'],
  [/Account verified successfully/i, 'Tài khoản đã được xác thực thành công.'],
  [/OTP code has been resent via SMS/i, 'Mã OTP đã được gửi lại qua SMS.'],
  [/Login successful/i, 'Đăng nhập thành công.'],
  [/Social login successful/i, 'Đăng nhập bằng tài khoản xã hội thành công.'],
  [/Token refreshed/i, 'Token đã được làm mới.'],
  [/Logout successful/i, 'Đăng xuất thành công.'],
  [/Password reset OTP has been sent via SMS/i, 'Mã OTP đặt lại mật khẩu đã được gửi qua SMS.'],
  [/Password reset successful/i, 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.'],
  [/Avatar updated successfully/i, 'Avatar đã được cập nhật thành công.'],
  [/Incorrect phone number or password/i, 'Số điện thoại hoặc mật khẩu không đúng.'],
  [/Invalid code/i, 'Mã xác thực không hợp lệ hoặc đã hết hạn.'],
  [/Access Denied|Forbidden/i, 'Bạn không có quyền thực hiện thao tác này.'],
  [/Unauthorized/i, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'],
];

export const translateApiMessage = (message?: string) => {
  if (!message) return '';
  const found = ERROR_TRANSLATIONS.find(([pattern]) => pattern.test(message));
  return found ? found[1] : message;
};

export const getApiErrorMessage = (err: any, fallback = 'Không thể xử lý yêu cầu. Vui lòng thử lại.') => {
  const data = err?.response?.data;
  const validationMessage = data?.errors?.[0]?.message;
  const message = validationMessage || data?.message || err?.message;

  if (err?.response?.status === 0 || err?.code === 'ERR_NETWORK') {
    return 'Không kết nối được server. Vui lòng kiểm tra kết nối mạng và thử lại.';
  }

  return translateApiMessage(message) || fallback;
};
