import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AppShell, PageContainer } from '../components/layout';
import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';

// Lazy load page components
const Dashboard = lazy(() => import('../pages/Dashboard'));
const JobDetail = lazy(() => import('../pages/jobs/JobDetail'));
const JobList = lazy(() => import('../pages/jobs/JobList'));
const ReportList = lazy(() => import('../pages/reports/ReportList'));
const IncidentList = lazy(() => import('../pages/incidents/IncidentList'));
const NcrList = lazy(() => import('../pages/ncr/NcrList'));
const TemplateList = lazy(() => import('../pages/templates/TemplateList'));
const ResourceList = lazy(() => import('../pages/resources/ResourceList'));
const AdminPanel = lazy(() => import('../pages/admin/AdminPanel'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Loading fallback component
const LoadingFallback = () => (
  <AppShell>
    <PageContainer>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-sga-100 border-t-sga-700 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    </PageContainer>
  </AppShell>
);

export const RoutesComponent = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense></ProtectedRoute>} />

      {/* Jobs Routes */}
      <Route path="/jobs" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><JobList /></Suspense></ProtectedRoute>} />
      <Route path="/jobs/:id" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><JobDetail /></Suspense></ProtectedRoute>} />

      {/* Reports Routes */}
      <Route path="/reports" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><ReportList /></Suspense></ProtectedRoute>} />

      {/* Incidents Routes */}
      <Route path="/incidents" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><IncidentList /></Suspense></ProtectedRoute>} />

      {/* NCR Routes - Admin only */}
      <Route path="/ncr" element={<ProtectedRoute><RoleGuard allowedRoles={['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'scheduler_admin', 'management_admin', 'hseq_manager']}><Suspense fallback={<LoadingFallback />}><NcrList /></Suspense></RoleGuard></ProtectedRoute>} />

      {/* Templates Routes - Admin only */}
      <Route path="/templates" element={<ProtectedRoute><RoleGuard allowedRoles={['asphalt_engineer', 'profiling_engineer', 'scheduler_admin', 'management_admin', 'hseq_manager']}><Suspense fallback={<LoadingFallback />}><TemplateList /></Suspense></RoleGuard></ProtectedRoute>} />

      {/* Resources Routes */}
      <Route path="/resources" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><ResourceList /></Suspense></ProtectedRoute>} />

      {/* Admin Routes - Admin only */}
      <Route path="/admin" element={<ProtectedRoute><RoleGuard allowedRoles={['management_admin', 'scheduler_admin']}><Suspense fallback={<LoadingFallback />}><AdminPanel /></Suspense></RoleGuard></ProtectedRoute>} />

      {/* 404 Not Found */}
      <Route path="/not-found" element={<Suspense fallback={<LoadingFallback />}><NotFound /></Suspense>} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
};

export const AppRouter = () => {
  return (
    <Router>
      <RoutesComponent />
    </Router>
  );
};

export default AppRouter;
