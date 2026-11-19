import { useState } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import AdminNav from './AdminNav';
import ProductionNote from './ProductionNote';
import Logo from '../components/Logo';
import { Spinner } from '../components/States';
import { IconLogout, IconMenu, IconX } from '../components/Icons';
import { useAuth } from './AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function AdminLayout() {
  useDocumentTitle('Admin');
  const { admin, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  if (loading) return <div className="min-h-screen bg-ivory"><Spinner label="Checking your session…" /></div>;
  if (!admin) return <Navigate to="/admin/login" state={{ from: loc.pathname }} replace />;

  const side = (
    <div className="flex h-full flex-col p-5">
      <Logo light to="/admin" />
      <p className="mt-1 pl-1 text-xs font-bold uppercase tracking-[0.2em] text-sage">Admin</p>
      <AdminNav className="mt-8" onNavigate={() => setOpen(false)} />
      <div className="mt-auto space-y-3 border-t border-white/10 pt-5 text-sm">
        <p className="truncate text-sage" title={admin.email}>{admin.email}</p>
        <Link to="/" className="block text-ivory/90 underline-offset-4 hover:underline">View public site</Link>
        <button type="button" onClick={logout} className="inline-flex items-center gap-2 font-bold text-sun hover:underline"><IconLogout size={18} />Sign out</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ivory md:grid md:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen bg-forest md:block">{side}</aside>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between bg-forest px-4 md:hidden">
        <Logo light to="/admin" />
        <button type="button" onClick={() => setOpen(true)} aria-label="Open admin menu" className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ivory hover:bg-white/10"><IconMenu size={24} /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-forest-900/70" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="relative h-full w-72 animate-slideIn bg-forest">
            <button type="button" onClick={() => setOpen(false)} aria-label="Close admin menu" className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full text-ivory hover:bg-white/10"><IconX /></button>
            {side}
          </div>
        </div>
      )}
      <main id="main" className="min-w-0 p-4 sm:p-8">
        <ProductionNote />
        <Outlet />
      </main>
    </div>
  );
}
