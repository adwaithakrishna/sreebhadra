import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { api } from '../lib/api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

/** Route element: wraps all /admin/* routes with the session state. The server enforces auth on every API call. */
export function AuthProvider() {
  const [state, setState] = useState({ admin: null, loading: true });
  useEffect(() => {
    api.admin.me().then((admin) => setState({ admin, loading: false })).catch(() => setState({ admin: null, loading: false }));
  }, []);
  const login = useCallback(async (email, password) => {
    const { admin } = await api.admin.login(email, password);
    setState({ admin, loading: false });
  }, []);
  const logout = useCallback(async () => {
    await api.admin.logout().catch(() => {});
    setState({ admin: null, loading: false });
  }, []);
  const value = useMemo(() => ({ ...state, login, logout }), [state, login, logout]);
  return <Ctx.Provider value={value}><Outlet /></Ctx.Provider>;
}
