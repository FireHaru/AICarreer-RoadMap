import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { AppShell } from './components/layout/AppShell';
import { AdaptiveShell, GuestOnly, RequireAuth } from './components/layout/guards';
import { PageLoader } from './components/ui/primitives';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SkillGap = lazy(() => import('./pages/SkillGap'));
const RoadmapPage = lazy(() => import('./pages/Roadmap'));
const CourseLibrary = lazy(() => import('./pages/CourseLibrary'));
const CourseDetailPage = lazy(() => import('./pages/CourseDetail'));
const CareerExplorer = lazy(() => import('./pages/CareerExplorer'));
const Projects = lazy(() => import('./pages/Projects'));
const Assistant = lazy(() => import('./pages/Assistant'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/onboarding" element={<RequireAuth allowNotOnboarded><Onboarding /></RequireAuth>} />

          <Route element={<RequireAuth><AppShell /></RequireAuth>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/skill-gap" element={<SkillGap />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route element={<AdaptiveShell />}>
            <Route path="/courses" element={<CourseLibrary />} />
            <Route path="/courses/:code" element={<CourseDetailPage />} />
            <Route path="/careers" element={<CareerExplorer />} />
            <Route path="/careers/:slug" element={<CareerExplorer />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
