# Frontend Manual QA Checklist

This document provides a comprehensive manual testing guide for the EventFlow frontend. Every implemented module must be verified against these scenarios to ensure stability, responsiveness, and correct error handling.

## 1. General Testing Requirements (Apply to ALL Modules)

### 1.1 Environment & Device
- [ ] **Desktop:** Width 1440px (Chrome/Edge/Firefox).
- [ ] **Mobile:** Width 375px (Chrome DevTools / Physical Device).
- [ ] **Network:** Test with "Fast 3G" to verify loading states.

### 1.2 Core State Transitions
- [ ] **Loading State:** Verify `Spinner` or skeleton is shown during API calls.
- [ ] **Empty State:** Verify `EmptyState` component is shown when no data is returned.
- [ ] **Error State:** Verify `AlertBanner` or inline errors are shown on API failure.
- [ ] **Success State:** Verify success feedback (Toast/Banner) after mutations.

### 1.3 Edge Cases & Security
- [ ] **Direct URL Access:** Paste the route URL directly into the browser $\rightarrow$ Page loads correctly.
- [ ] **Page Refresh:** Refresh (F5) on a detail page $\rightarrow$ Context (ID) is preserved, data re-loads.
- [ ] **400 Bad Request:** Trigger validation error $\rightarrow$ Inline field errors are visible.
- [ ] **401 Unauthorized:** Clear token/session $\rightarrow$ Redirect to `/login`.
- [ ] **403 Forbidden:** Access premium feature without plan $\rightarrow$ Subscription gate/CTA is shown.
- [ ] **Pagination:** Test first page, last page, and page size changes.

---

## 2. Module Specific Checklists

### 2.1 Authentication & Public Routes
- **Routes:** `/login`, `/register`, `/verify-otp`, `/pricing`, `/auth/confirm`, `/invitations/confirm`
- [ ] Login with valid/invalid credentials.
- [ ] Register $\rightarrow$ OTP verification flow.
- [ ] Public `/pricing` loads plans from backend.
- [ ] `/auth/confirm` and `/invitations/confirm` work without login.
- [ ] Public Event Page (`/public/events/:slug`) loads and allows registration.

### 2.2 Organization Management
- **Routes:** `/organizations`, `/organizations/:id`, `/organizations/:id/members`, `/organizations/:id/departments`, `/organizations/:id/branding`, `/organizations/:id/subscription`
- [ ] Create organization $\rightarrow$ Redirect to detail.
- [ ] Invite member $\rightarrow$ Verify invitation status.
- [ ] Remove member $\rightarrow$ Confirm dialog $\rightarrow$ List updates.
- [ ] Department CRUD $\rightarrow$ Member assignment.
- [ ] Branding: Upload logo $\rightarrow$ Preview $\rightarrow$ Delete logo.
- [ ] Subscription: Plan selection $\rightarrow$ Checkout flow $\rightarrow$ Billing history.

### 2.3 Event Operations
- **Routes:** `/organizations/:id/events`, `/organizations/:id/events/:eventId`, `/organizations/:id/events/:eventId/dashboard`, `/organizations/:id/events/:eventId/members`, `/organizations/:id/events/:eventId/teams`, `/organizations/:id/events/:eventId/tasks`, `/organizations/:id/events/:eventId/calendar`, `/organizations/:id/events/:eventId/issues`, `/organizations/:id/events/:eventId/landing-page`
- [ ] Event CRUD $\rightarrow$ Status transitions (Draft $\rightarrow$ Published $\rightarrow$ Ongoing $\rightarrow$ Completed).
- [ ] Event Member: Add/Remove members.
- [ ] Landing Page: Edit content $\rightarrow$ Save draft $\rightarrow$ Publish $\rightarrow$ Verify public URL.
- [ ] Event Dashboard: Verify charts/stats load correctly.
- [ ] Event Calendar: Create event $\rightarrow$ Verify on calendar view.

### 2.4 Team & Task Management
- **Routes:** `/organizations/:id/events/:eventId/teams/:teamId`, `/organizations/:id/events/:eventId/teams/:teamId/dashboard`, `/organizations/:id/events/:eventId/teams/:teamId/members`, `/organizations/:id/events/:eventId/teams/:teamId/tasks`, `/organizations/:id/events/:eventId/teams/:teamId/calendar`
- [ ] Team CRUD $\rightarrow$ Member assignment $\rightarrow$ Role update.
- [ ] Task CRUD $\rightarrow$ Assignee change $\rightarrow$ Status update.
- [ ] Task Detail: Feedback/Comments $\rightarrow$ Attachments upload.
- [ ] Task Detail: View subtasks returned by backend.
- [ ] Team Dashboard: Verify team-specific metrics.

### 2.5 Check-in System
- **Routes:** `/organizations/:id/events/:eventId/check-in/attendees`, `/organizations/:id/events/:eventId/check-in/sessions`, `/organizations/:id/events/:eventId/check-in/scanner`
- [ ] Attendee CRUD $\rightarrow$ Search/Filter.
- [ ] Session Management: Create session $\rightarrow$ Open scanner.
- [ ] Scanner: Token input $\rightarrow$ Manual check-in $\rightarrow$ Success/Error feedback.
- [ ] Session records: Open a check-in session and verify records are displayed.

### 2.6 Issue Management
- **Routes:** `/organizations/:id/events/:eventId/issues`, `/organizations/:id/events/:eventId/teams/:teamId/issues`
- [ ] Create issue $\rightarrow$ Assign to user.
- [ ] Update issue status $\rightarrow$ Add resolution note.
- [ ] Manage participants $\rightarrow$ Add/Remove watchers.
- [ ] Filter issues by status/assignee.

### 2.7 Finance & Email Campaigns
- **Routes:** `/organizations/:id/events/:eventId/finance`, `/organizations/:id/events/:eventId/email-campaigns`
- [ ] Finance Dashboard: Budget summary $\rightarrow$ Risk indicators.
- [ ] Expense Request: Create $\rightarrow$ Upload attachment $\rightarrow$ Approval flow.
- [ ] Budget Submission: Submit $\rightarrow$ Approve/Reject.
- [ ] Email Campaign: Create $\rightarrow$ Schedule $\rightarrow$ Send Now $\rightarrow$ Verify logs.
- [ ] Public Unsubscribe: Token link $\rightarrow$ Confirm unsubscribe.

---

## 3. Final Smoke Test Matrix

| Feature | Desktop (1440) | Mobile (375) | Refresh/URL | Empty State | 403/Gate | Result |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Auth | [ ] | [ ] | [ ] | N/A | N/A | |
| Org Mgmt | [ ] | [ ] | [ ] | [ ] | [ ] | |
| Event Ops | [ ] | [ ] | [ ] | [ ] | [ ] | |
| Team/Task | [ ] | [ ] | [ ] | [ ] | [ ] | |
| Check-in | [ ] | [ ] | [ ] | [ ] | [ ] | |
| Issues | [ ] | [ ] | [ ] | [ ] | [ ] | |
| Finance | [ ] | [ ] | [ ] | [ ] | [ ] | |
| Email | [ ] | [ ] | [ ] | [ ] | [ ] | |
