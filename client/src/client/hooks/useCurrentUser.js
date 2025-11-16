import { useCallback, useEffect, useState } from 'react';
import userService from '../../services/userService';

const decodeAccessToken = (token) => {
  if (!token || typeof window === 'undefined') return null;
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const decoded = JSON.parse(window.atob(payload));
    return decoded || null;
  } catch (error) {
    console.warn('Không thể giải mã accessToken', error);
    return null;
  }
};

const useCurrentUser = () => {
  const [state, setState] = useState({ userId: null, loading: true, error: null });

  const resolveUser = useCallback(async () => {
    if (typeof window === 'undefined') {
      setState({ userId: null, loading: false, error: null });
      return;
    }

    const token = window.localStorage.getItem('accessToken');
    const decoded = decodeAccessToken(token || '');
    if (decoded?.id) {
      setState({ userId: decoded.id, loading: false, error: null });
      return;
    }

    try {
      const profile = await userService.getCurrentUser();
      setState({ userId: profile?.id ?? null, loading: false, error: null });
    } catch (error) {
      setState({
        userId: null,
        loading: false,
        error: error?.message || 'Không thể xác thực người dùng',
      });
    }
  }, []);

  useEffect(() => {
    resolveUser();
  }, [resolveUser]);

  return {
    userId: state.userId,
    loading: state.loading,
    error: state.error,
    refreshUser: resolveUser,
  };
};

export default useCurrentUser;
