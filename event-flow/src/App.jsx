import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { ToastContainer } from './components/feedback/Toast'

// Lazy-load pages (add as you build each feature)
import { lazy, Suspense } from 'react'
import Spinner from './components/ui/Spinner'

const LoginPage            = lazy(() => import('./features/auth/LoginPage'))
const DashboardPage        = lazy(() => import('./pages/DashboardPage'))
const EventsPage           = lazy(() => import('./pages/EventsPage'))
const TasksPage            = lazy(() => import('./pages/TasksPage'))
const TeamsPage            = lazy(() => import('./pages/TeamsPage'))
const CalendarPage         = lazy(() => import('./pages/CalendarPage'))
const OrganizationsPage    = lazy(() => import('./pages/OrganizationsPage'))
const IssuesPage           = lazy(() => import('./pages/IssuesPage'))

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"     element={<DashboardPage />} />
              <Route path="/events/*"      element={<EventsPage />} />
              <Route path="/tasks/*"       element={<TasksPage />} />
              <Route path="/teams/*"       element={<TeamsPage />} />
              <Route path="/calendar"      element={<CalendarPage />} />
              <Route path="/organizations/*" element={<OrganizationsPage />} />
              <Route path="/issues/*"      element={<IssuesPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
