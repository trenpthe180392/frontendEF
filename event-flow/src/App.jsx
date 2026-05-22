import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AppShell from './components/layout/AppShell'
import AboutPage from './pages/AboutPage'
import DepartmentCreatePage from './pages/DepartmentCreatePage'
import EventCalendarCreatePage from './pages/EventCalendarCreatePage'
import EventCalendarPage from './pages/EventCalendarPage'
import EventCreatePage from './pages/EventCreatePage'
import EventDashboardPage from './pages/EventDashboardPage'
import EventInfoPage from './pages/EventInfoPage'
import EventMembersPage from './pages/EventMembersPage'
import EventTasksPage from './pages/EventTasksPage'
import EventTeamsPage from './pages/EventTeamsPage'
import TeamCalendarCreatePage from './pages/TeamCalendarCreatePage'
import TeamCalendarPage from './pages/TeamCalendarPage'
import TeamCreatePage from './pages/TeamCreatePage'
import TeamDashboardPage from './pages/TeamDashboardPage'
import TeamMembersPage from './pages/TeamMembersPage'
import TeamTasksPage from './pages/TeamTasksPage'
import TaskCreatePage from './pages/TaskCreatePage'
import TaskDetailPage from './pages/TaskDetailPage'
import TaskEditPage from './pages/TaskEditPage'
import TaskFeedbackPage from './pages/TaskFeedbackPage'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import VerifyOtpPage from './features/auth/VerifyOtpPage'
import OAuth2SuccessPage from './pages/OAuth2SuccessPage'
import MemberProfilePage from './pages/MemberProfilePage'
import ProfilePage from './pages/ProfilePage'
import OrganizationDepartmentsPage from './pages/OrganizationDepartmentsPage'
import OrganizationDetailPage from './pages/OrganizationDetailPage'
import OrganizationEventsPage from './pages/OrganizationEventsPage'
import OrganizationMemberInvitePage from './pages/OrganizationMemberInvitePage'
import OrganizationMemberInvitationsPage from './pages/OrganizationMemberInvitationsPage'
import OrganizationMembersPage from './pages/OrganizationMembersPage'
import OrganizationsPage from './pages/OrganizationsPage'
import ProtectedRoute from './routes/ProtectedRoute'
import SubscriptionPage from './pages/SubscriptionPage'

function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/oauth2/success" element={<OAuth2SuccessPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/organizations" element={<OrganizationsPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/organizations/:organizationId" element={<OrganizationDetailPage />} />
            <Route path="/organizations/:organizationId/members" element={<OrganizationMembersPage />} />
            <Route path="/organizations/:organizationId/members/invite" element={<OrganizationMemberInvitePage />} />
            <Route path="/organizations/:organizationId/members/invitations" element={<OrganizationMemberInvitationsPage />} />
            <Route path="/organizations/:organizationId/members/:userId" element={<MemberProfilePage />} />
            <Route path="/organizations/:organizationId/departments/create" element={<DepartmentCreatePage />} />
            <Route path="/organizations/:organizationId/departments" element={<OrganizationDepartmentsPage />} />
            <Route path="/organizations/:organizationId/events/create" element={<EventCreatePage />} />
            <Route path="/organizations/:organizationId/events" element={<OrganizationEventsPage />} />
            <Route path="/organizations/:organizationId/events/:eventId" element={<EventInfoPage />} />
            <Route path="/organizations/:organizationId/events/:eventId/dashboard" element={<EventDashboardPage />} />
            <Route path="/organizations/:organizationId/events/:eventId/calendar/create" element={<EventCalendarCreatePage />} />
            <Route path="/organizations/:organizationId/events/:eventId/calendar" element={<EventCalendarPage />} />
            <Route path="/organizations/:organizationId/events/:eventId/members" element={<EventMembersPage />} />
            <Route path="/organizations/:organizationId/events/:eventId/members/:userId" element={<MemberProfilePage />} />
            <Route path="/organizations/:organizationId/events/:eventId/teams/create" element={<TeamCreatePage />} />
            <Route path="/organizations/:organizationId/events/:eventId/teams" element={<EventTeamsPage />} />
            <Route path="/organizations/:organizationId/events/:eventId/teams/:teamId" element={<TeamDashboardPage />} />
            <Route path="/organizations/:organizationId/events/:eventId/teams/:teamId/dashboard" element={<TeamDashboardPage />} />
            <Route path="/organizations/:organizationId/events/:eventId/teams/:teamId/calendar/create" element={<TeamCalendarCreatePage />} />
            <Route path="/organizations/:organizationId/events/:eventId/teams/:teamId/calendar" element={<TeamCalendarPage />} />
            <Route path="/organizations/:organizationId/events/:eventId/teams/:teamId/members" element={<TeamMembersPage />} />
            <Route path="/organizations/:organizationId/events/:eventId/teams/:teamId/members/:userId" element={<MemberProfilePage />} />
            <Route path="/organizations/:organizationId/events/:eventId/teams/:teamId/tasks" element={<TeamTasksPage />} />
            <Route path="/organizations/:organizationId/events/:eventId/teams/:teamId/tasks/create" element={<TaskCreatePage />} />
            <Route path="/organizations/:organizationId/events/:eventId/teams/:teamId/tasks/:taskId/edit" element={<TaskEditPage />} />
            <Route path="/organizations/:organizationId/events/:eventId/teams/:teamId/tasks/:taskId/feedback" element={<TaskFeedbackPage />} />
            <Route path="/organizations/:organizationId/events/:eventId/teams/:teamId/tasks/:taskId" element={<TaskDetailPage />} />
            <Route path="/organizations/:organizationId/events/:eventId/tasks" element={<EventTasksPage />} />
            <Route path="/organizations/:organizationId/events/:eventId/tasks/create" element={<TaskCreatePage />} />
            <Route path="/organizations/:organizationId/events/:eventId/tasks/:taskId/edit" element={<TaskEditPage />} />
            <Route path="/organizations/:organizationId/events/:eventId/tasks/:taskId/feedback" element={<TaskFeedbackPage />} />
            <Route path="/organizations/:organizationId/events/:eventId/tasks/:taskId" element={<TaskDetailPage />} />
            <Route path="/dashboard" element={<Navigate to="/organizations" replace />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/organizations" replace />} />
        <Route path="*" element={<Navigate to="/organizations" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
