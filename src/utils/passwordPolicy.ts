export const PASSWORD_POLICY_MESSAGE =
  'Mật khẩu tối thiểu 8 ký tự, bao gồm chữ và số, ít nhất 1 chữ hoa, ít nhất 1 chữ thường, ít nhất 1 ký tự đặc biệt.';

export const isPasswordPolicyValid = (password: string) => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
};

export const getPasswordPolicyError = (password: string) => {
  return isPasswordPolicyValid(password) ? '' : PASSWORD_POLICY_MESSAGE;
};
