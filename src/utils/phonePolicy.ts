export const PHONE_POLICY_MESSAGE =
  'Số điện thoại phải bắt đầu bằng 0 và đủ 10 chữ số, ví dụ 0912345678.';

const compactPhone = (value: string) => value.replace(/[\s.-]+/g, '');

export const isVietnamPhoneValid = (value: string) => {
  const compact = compactPhone(value);
  return /^0\d{9}$/.test(compact) || /^\+84\d{9}$/.test(compact) || /^84\d{9}$/.test(compact);
};

export const getVietnamPhoneError = (value: string) => {
  return isVietnamPhoneValid(value) ? '' : PHONE_POLICY_MESSAGE;
};

export const normalizeVietnamPhone = (value: string) => {
  const compact = compactPhone(value);

  if (/^0\d{9}$/.test(compact)) {
    return `+84${compact.slice(1)}`;
  }

  if (/^84\d{9}$/.test(compact)) {
    return `+${compact}`;
  }

  if (/^\+84\d{9}$/.test(compact)) {
    return compact;
  }

  return compact;
};
