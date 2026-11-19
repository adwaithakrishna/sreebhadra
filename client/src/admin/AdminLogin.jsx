import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Field from '../components/Field';
import Button from '../components/Button';
import Logo from '../components/Logo';
import { Notice } from '../components/States';
import { useAuth } from './AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function AdminLogin() {
  useDocumentTitle('Staff sign-in');
  const { admin, loading, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ email: '', password: '' });
  const [st, setSt] = useState({ busy: false, error: '' });
  if (!loading && admin) return <Navigate to={loc.state?.from || '/admin'} replace />;

  async function submit(e) {
    e.preventDefault();
    setSt({ busy: true, error: '' });
    try {
      await login(f.email, f.password);
      nav(loc.state?.from || '/admin', { replace: true });
    } catch (err) {
      setSt({ busy: false, error: err.message });
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-forest px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo light /></div>
        <form onSubmit={submit} className="card space-y-5 p-8" aria-label="Staff sign-in">
          <h1 className="text-3xl font-extrabold">Staff sign-in</h1>
          <Field id="a-email" type="email" label="Email" required autoComplete="username" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <Field id="a-pass" type="password" label="Password" required autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          {st.error && <Notice tone="error">{st.error}</Notice>}
          <Button type="submit" variant="dark" size="lg" className="w-full" loading={st.busy} disabled={!f.email || !f.password}>Sign in</Button>
          <p className="text-center text-sm"><Link to="/" className="text-forest underline underline-offset-4">Back to the website</Link></p>
        </form>
      </div>
    </div>
  );
}
