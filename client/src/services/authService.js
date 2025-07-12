// src/services/authService.js

const API_BASE = 'http://localhost:5000/api/auth';

/**
 * Gọi API đăng nhập, trả về accessToken từ server.
 * refreshToken sẽ được lưu trong cookie HttpOnly từ phía backend.
 */
export const login = async (email, password) => {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // để nhận cookie refresh token
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Đăng nhập thất bại');
  }

  const data = await response.json(); // { accessToken: '...' }
  console.log('acess token',data);
  return data;
};

/**
 * Gọi API refresh token, backend sẽ đọc cookie refreshToken (HttpOnly) và trả lại accessToken mới.
 */
export const refreshToken = async () => {
  const response = await fetch(`${API_BASE}/refresh`, {
    method: 'POST',
    credentials: 'include', // gửi cookie refresh token
  });

  if (!response.ok) {
    throw new Error('Refresh token hết hạn hoặc không hợp lệ');
  }

  const data = await response.json(); // { accessToken: '...' }
  console.log("after acessToken", data);
  return data;
};

/**
 * Gọi API logout và xóa token phía FE (trong context).
 * backend sẽ xóa cookie refreshToken.
 */
export const logout = async () => {
  await fetch(`${API_BASE}/logout`, {
    method: 'POST',
    credentials: 'include', // để gửi cookie
  });

  // Không cần xóa accessToken từ localStorage nữa vì ta đang lưu trong RAM
};
