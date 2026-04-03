const TOKEN_KEY = 'restaurant_staff_token_v2';
const USER_KEY = 'restaurant_staff_user_v2';

const canUseStorage = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export const getStoredStaffToken = () => {
  if (!canUseStorage()) return '';
  return localStorage.getItem(TOKEN_KEY) || '';
};

export const getStoredStaffUser = () => {
  if (!canUseStorage()) return null;

  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveStaffSession = ({ token, user }) => {
  if (!canUseStorage()) return;

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('admin_token', token);
  }

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const clearStaffSession = () => {
  if (!canUseStorage()) return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('admin_token');
};

export const hasStaffRole = (user, allowedRoles = []) =>
  Boolean(user && allowedRoles.includes(user.role));
