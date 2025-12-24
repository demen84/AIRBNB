
export const PASSWORD_MESSAGES = {
    minLength: 'Password tối thiểu 8 ký tự',
    lower: 'Password phải có ít nhất 1 chữ thường (a-z)',
    upper: 'Password phải có ít nhất 1 chữ HOA (A-Z)',
    digit: 'Password phải có ít nhất 1 chữ số (0-9)',
    symbol: 'Password phải có ít nhất 1 ký tự đặc biệt',
} as const;

// (tuỳ chọn) Nếu muốn type-safe key
export type PasswordMessageKey = keyof typeof PASSWORD_MESSAGES;