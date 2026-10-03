import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../ui/primitives';
import { AppShell } from './AppShell';
import { PublicShell } from './PublicShell';

/** Signed-in, onboarded users only; sends others to login or onboarding. */
export function RequireAuth({ allowNotOnboarded = false, children }: { allowNotOnboarded?: boolean; children?: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!allowNotOnboarded && !user.onboarded) return <Navigate to="/onboarding" replace />;
  return <>{children ?? <Outlet />}</>;
}

/** Login/register pages: bounce signed-in users to where they belong. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to={user.onboarded ? '/dashboard' : '/onboarding'} replace />;
  return <>{children}</>;
}

/** Public pages (careers, courses) use the app shell when signed in and the marketing shell otherwise. */
export function AdaptiveShell() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user?.onboarded) return <AppShell />;
  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </div>
    </PublicShell>
  );
}
