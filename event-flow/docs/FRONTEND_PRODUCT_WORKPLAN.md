# EventFlow Frontend Product Workplan

Review date: 2026-05-24

## 1. Purpose

Tài liệu này là backlog triển khai front-end tổng thể cho EventFlow. Mục tiêu là giúp DEV follow thống nhất theo hướng product, đúng hợp đồng backend, đúng chuẩn UI/UX, và hạn chế làm dàn trải.

Tài liệu này dùng để:

- Bàn giao cho DEV mới đọc và hiểu toàn cảnh front-end.
- Chia task theo sprint/module.
- Review tiến độ tích hợp backend.
- Làm checklist trước khi merge.

## 2. Reference Documents

Nguồn tham chiếu bắt buộc:

- UI standard: `E:\2026-SUMMER-SE1942-K8\Event-Flow\frontendEF\event-flow\docs\UI_PROMPT_STANDARD.md`
- Backend handoff: `E:\2026-SUMMER-SE1942-K8\Event-Flow\event-flow\docs\FRONTEND_BACKEND_HANDOFF.md`

Quy tắc áp dụng:

- Backend API contract ưu tiên theo Swagger/controller và file `FRONTEND_BACKEND_HANDOFF.md`.
- UI/code style ưu tiên theo `UI_PROMPT_STANDARD.md`.
- Nếu docs finance cũ khác Swagger/controller, follow Swagger/controller.
- Nếu response backend chưa đồng nhất, front-end phải xử lý phòng thủ bằng helper unwrap.

## 2.1 Current Execution Decision

Use this section before assigning the next Roo Code prompt.

If the current frontend already has:

- response unwrap helpers,
- error/field-error helpers,
- `subscriptionApi`,
- public `/pricing`,
- `/subscription` as a workspace billing selector,
- `/organizations/:organizationId/subscription` as the real billing screen,
- subscription gate messaging,
- `npm run lint` passing,
- `npm run build` passing,

then do not restart Phase 0 or Phase 1A-1D. The next action is:

1. Run Phase 1E verification/polish for workspace billing IA.
2. Review the Phase 1E diff.
3. Continue to Phase 2A only after Phase 1E is accepted.

If any item above is missing, run the smallest missing prompt only. Do not run an entire phase again.

## 3. Current Frontend Baseline

Tech stack hiện tại:

- React 18 + Vite.
- React Router v6.
- Zustand cho auth state.
- Axios wrapper ở `src/api/client.js`.
- Tailwind CSS custom token.
- lucide-react icon.
- JSX, không dùng TypeScript.

Đã có:

- Auth: login, register, verify OTP, resend OTP.
- Organization: list, create, detail.
- Organization members: list, invite, update invitation, cancel invitation, remove.
- Departments: list, create, member add/remove.
- Events: list, create, edit, detail, cancel, delete.
- Event members: list, add, remove.
- Teams: list, create, detail, dashboard, delete.
- Team members: list, add, update role/status, remove.
- Tasks: list by event/team, create, edit, detail, delete, assign/reassign/unassign.
- Feedback for task.
- Attachments for task.
- Event/team calendar list and create.
- AI suggest teams/tasks/calendar.
- Event/team dashboard.
- Subscription API layer, public pricing route, workspace billing selector, workspace billing page, and subscription gate messaging are implemented or in active Phase 1 review.

Technical status:

- Latest verified on 2026-05-24: `npm run lint` passed.
- Latest verified on 2026-05-24: `npm run build` passed.
- Build currently emits Vite's large chunk warning only; it is not a blocking failure.

## 4. Product Principles

Front-end should feel like an operations dashboard, not a marketing website.

Priorities:

1. Make critical event operations reliable.
2. Keep role and permission boundaries visible.
3. Make data states explicit: loading, error, empty, success.
4. Keep workflows short: list -> detail -> action -> confirmation -> feedback.
5. Prefer predictable dense screens for repeated operations.
6. Preserve user context after actions: page, filters, selected event/team.
7. Use backend messages when they are useful, but normalize errors for users.
8. Avoid UI-only fake flows unless clearly marked as placeholder.

### 4.1 Information Architecture Rules

- AppShell global navigation is for primary authenticated operations and account access.
- Pricing is public and should not appear as a main authenticated operations module.
- Subscription/billing is workspace-scoped. The real billing screen is `/organizations/:organizationId/subscription`.
- `/subscription` is only a helper selector for users who do not yet have a workspace context.
- User-facing billing copy should say workspace when the user is choosing plans, checking limits, or managing payments.
- Backend paths and DTO field names can still use `organizationId`; do not rename backend contract terms in API wrappers.

## 5. Global Engineering Workstream

### FE-0001: Fix Existing Quality Gate

Goal:

- Restore clean lint/build baseline before adding large features.

Tasks:

- Remove or use unused `eventRangeTitle` in `src/pages/EventCalendarPage.jsx`.
- Run `npm run lint`.
- Run `npm run build`.

Acceptance criteria:

- `npm run lint` passes.
- `npm run build` passes.
- No unrelated UI changes.

Priority: P0

### FE-0002: Add Response Normalization Layer

Goal:

- Handle mixed backend response shapes: direct DTO/List/Page and wrapped `ApiResponseDTO`.

Tasks:

- Add helper in `src/utils/apiResponse.js` or `src/api/response.js`.
- Suggested helpers:
  - `unwrapResponse(response)`
  - `unwrapData(body)`
  - `getApiMessage(response, fallback)`
  - `normalizePageResponse(data, pageSize)`
- Refactor API consumers gradually, starting with actions returning `ApiResponseDTO<Void>`.

Implementation note:

```js
export function unwrapResponse(response) {
  const body = response?.data
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return body.data ?? body
  }
  return body
}
```

Acceptance criteria:

- Direct list/object responses still work.
- Wrapped success responses still show meaningful success message.
- Existing pages do not break.

Priority: P0

### FE-0003: Improve Error Handling

Goal:

- Surface backend validation errors consistently.

Tasks:

- Extend `getErrorMessage(error)` to support:
  - `error.response.data.message`
  - `error.response.data.errorCode`
  - `error.response.data.fields`
- Add `getFieldErrors(error)` helper for forms.
- Use inline errors for validation fields where backend returns `fields`.
- Keep auth/session messages readable for 401/403.

Acceptance criteria:

- Form validation errors can be shown under fields.
- Page-level errors still use `AlertBanner`.
- 403 subscription/feature-limit messages are clear.

Priority: P0

### FE-0004: Component Inventory Gap

Goal:

- Align repo with UI standard before building big modules.

Currently missing from UI standard:

- `Checkbox`
- `Avatar`
- `Tooltip`
- `DataTable`
- `Modal`
- `Drawer`
- `Tabs`
- `Breadcrumb`
- `Toast` and `useToast`
- `FormSection`
- `DateRangePicker`
- `SearchBar`

Tasks:

- Add only the components needed by the next module first.
- Keep components simple and reusable.
- Do not introduce a new UI library.
- Use Tailwind tokens and lucide-react.

Acceptance criteria:

- New components match `UI_PROMPT_STANDARD.md`.
- Components handle disabled/loading/focus states where relevant.
- No hardcoded hex unless unavoidable for SVG/chart internals.

Priority: P1

### FE-0005: Layout and Navigation IA

Goal:

- Ensure navigation supports all product modules without burying workflows.

Tasks:

- Review `AppShell` navigation groups.
- Add event workspace sections:
  - Overview
  - Dashboard
  - Members
  - Teams
  - Tasks
  - Calendar
  - Issues
  - Landing Page
  - Check-in
  - Finance
  - Email
- Add organization sections:
  - Overview
  - Members
  - Invitations
  - Departments
  - Events
  - Branding
  - Subscription/Billing
- Add global notification entry.

Acceptance criteria:

- Users can reach every implemented module from the app shell or workspace nav.
- Current organization/event/team context remains clear.
- Unimplemented modules are not shown unless behind a clear disabled/coming-soon pattern.

Priority: P1

## 6. Small Missing API Wrappers

### FE-0101: Auth Confirm Route

Backend:

- `GET /auth/confirm?token=...`

Tasks:

- Add `authApi.confirm(token)`.
- Add public route `/auth/confirm`.
- Show loading/success/error states.
- Provide CTA to login after success.

Acceptance criteria:

- Token from query string is sent.
- Expired/invalid token shows readable error.

Priority: P1

### FE-0102: Organization Invitation Confirm Route

Backend:

- `GET /organization-members/invitations/confirm?token=...`

Tasks:

- Add wrapper.
- Add public route, for example `/invitations/confirm`.
- Show organization/member info after success if available.
- CTA to login.

Acceptance criteria:

- Public confirmation does not require auth.
- Existing invitation management remains unchanged.

Priority: P1

### FE-0103: Team by Organization Wrapper

Backend:

- `GET /teams/organization/{organizationId}`

Tasks:

- Add `teamApi.getByOrganization(organizationId)`.
- Use where cross-event organization team selection is needed.

Acceptance criteria:

- Wrapper exists and is exported.
- No current page breaks.

Priority: P2

### FE-0104: Event Status Update

Backend:

- `PATCH /events/{eventId}/status`

Tasks:

- Add `eventApi.updateStatus(eventId, status)`.
- Add status actions in event detail/list if product approves:
  - Draft -> Published
  - Published -> Ongoing
  - Ongoing -> Completed
  - Any active -> Cancelled
- Use `ConfirmDialog` for irreversible transitions.

Acceptance criteria:

- Invalid transitions from backend show error.
- UI refreshes event status after success.

Priority: P1

### FE-0105: Task Subtasks

Backend:

- `GET /tasks/{id}/subtasks`

Tasks:

- Add `taskApi.getSubtasks(taskId)`.
- Show subtasks section in task detail.
- Add empty/loading/error states.

Acceptance criteria:

- Task detail can display child tasks if backend returns data.
- Empty section is visually quiet.

Priority: P2

## 7. Subscription and Billing

### FE-0201: Subscription API Layer

Backend:

- `GET /subscriptions/plans`
- `GET /organizations/{organizationId}/subscription`
- `POST /organizations/{organizationId}/subscriptions/checkout`
- `POST /organizations/{organizationId}/subscription/upgrade`
- `POST /organizations/{organizationId}/subscription/cancel`
- `POST /organizations/{organizationId}/subscription/resume`
- `GET /organizations/{organizationId}/billing-history`

Tasks:

- Add `src/api/subscriptionApi.js`.
- Export from `src/api/index.js`.
- Normalize plans, active subscription, billing history.

Acceptance criteria:

- API layer covers all subscription endpoints.
- Handles public plans endpoint without token dependency.

Priority: P0

### FE-0202: Real Subscription Page

Goal:

- Replace placeholder subscription screen with real product billing UI.

UI sections:

- Current active plan.
- Plan comparison table/cards.
- Usage limits:
  - events
  - members
  - attendees
  - storage
  - AI credits
- Checkout form:
  - plan
  - optional event
  - payment method
  - VAT invoice fields
- Billing history.
- Cancel/resume actions.
- Upgrade flow.

Tasks:

- Decide route shape:
  - Preferred: `/organizations/:organizationId/subscription`
  - Existing `/subscription` must show a workspace billing selector. Do not redirect directly to the first workspace.
- Add loading/error/empty/success states.
- Use `ConfirmDialog` for cancel/resume/upgrade.
- Handle checkout response URL or payment instructions based on backend response.

Acceptance criteria:

- User can see available plans.
- User can see current organization subscription.
- User can start checkout/upgrade.
- User can cancel/resume subscription.
- Billing history displays empty state when none.

Priority: P0

### FE-0203: Subscription Gate Messaging

Goal:

- Make premium feature 403 errors understandable.

Tasks:

- Standardize 403 feature-limit messages.
- Add CTA to subscription page where appropriate.
- Use in branding, landing page, AI, finance if backend gates features.

Acceptance criteria:

- 403 does not look like generic failure when it is a plan limit.
- CTA preserves organization context.

Priority: P1

### FE-0204: Workspace Billing IA and Public Pricing

Goal:

- Make subscription/billing screens match the backend reality: plans are public, but active subscription, checkout, upgrade, cancel, resume, and billing history are scoped to a workspace.

Tasks:

- Add public route `/pricing`.
- Keep `/subscription` as a workspace billing selector, not a direct subscription detail page.
- Keep `/organizations/:organizationId/subscription` as the real workspace billing screen.
- If a logged-in user has no workspace, allow inline creation of a personal workspace from `/subscription`.
- Use workspace copy in billing sections even though current backend paths still use `organizations/{organizationId}`.
- Do not show `/subscription` or `/pricing` as primary operational modules in `AppShell`; billing belongs in workspace navigation and pricing CTAs.
- Keep current API/backend/database contract unchanged.

Acceptance criteria:

- Public pricing loads real plans from `GET /subscriptions/plans`.
- `/subscription` lets users choose an existing workspace or create a personal workspace.
- `/organizations/:organizationId/subscription` loads billing data for that workspace.
- Billing copy does not describe paid-plan decisions as organization-level management.
- Main authenticated navigation remains operations-focused.

Priority: P0

## 8. Organization Branding

### FE-0301: Branding API Layer

Backend:

- `GET /organizations/{organizationId}/branding`
- `POST /organizations/{organizationId}/branding/logo`
- `DELETE /organizations/{organizationId}/branding/logo`

Tasks:

- Add `organizationBrandingApi.js`.
- Support multipart logo upload.

Acceptance criteria:

- Upload uses `FormData`.
- Delete refreshes branding state.

Priority: P1

### FE-0302: Branding Settings UI

Goal:

- Let organization admins manage logo/branding.

UI:

- Current logo preview.
- Upload/change logo.
- Delete logo.
- Branding details returned by backend.
- Subscription gate error handling.

Tasks:

- Add route `/organizations/:organizationId/branding`.
- Add nav item in organization workspace.
- Validate file type/size client-side if limits are known.

Acceptance criteria:

- Upload and delete work.
- Empty state explains no logo yet.
- 403 links to subscription page.

Priority: P1

## 9. Landing Page and Public Registration

### FE-0401: Landing Page API Layer

Backend private:

- `GET /events/{eventId}/landing-page`
- `PUT /events/{eventId}/landing-page`
- `POST /events/{eventId}/landing-page/publish`
- `POST /events/{eventId}/landing-page/unpublish`

Backend public:

- `GET /public/events/{slug}`
- `POST /public/events/{slug}/registrations`

Tasks:

- Add `landingPageApi.js`.
- Add `publicLandingPageApi.js`.

Acceptance criteria:

- Private endpoints use Bearer token.
- Public endpoints work outside protected shell.

Priority: P1

### FE-0402: Landing Page Editor

Goal:

- Event owner can edit and publish public event page.

UI:

- Page status: draft/published.
- Slug display/copy.
- Hero content editor.
- Event description.
- Registration settings.
- Preview panel.
- Publish/unpublish actions.

Tasks:

- Add route `/organizations/:organizationId/events/:eventId/landing-page`.
- Add form with validation.
- Save as draft with `PUT`.
- Publish/unpublish with confirm.
- Handle backend subscription/permission errors.

Acceptance criteria:

- User can load existing landing page.
- User can save changes.
- User can publish/unpublish.
- User can open/copy public URL.

Priority: P1

### FE-0403: Public Landing and Registration

Goal:

- Attendee can view event page and register without login.

UI:

- Public route `/events/:slug` or `/public/events/:slug`.
- Event hero/details.
- Registration form.
- Success confirmation.
- Closed/full registration states.

Tasks:

- Add public route outside `ProtectedRoute`.
- Add public layout without app shell.
- Validate attendee registration fields.

Acceptance criteria:

- Public page loads by slug.
- Registration posts successfully.
- Backend validation errors show inline where possible.

Priority: P1

## 10. Notifications

### FE-0501: Notification API Layer

Backend:

- `GET /notifications`
- `PATCH /notifications/{id}/read`
- `PATCH /notifications/read-all`

Tasks:

- Add `notificationApi.js`.
- Normalize notification status/date/type.

Acceptance criteria:

- API layer exported.

Priority: P1

### FE-0502: Notification Bell and List

Goal:

- Users can see and clear operational notifications.

UI:

- Bell in app shell.
- Unread count.
- Dropdown or drawer list.
- Mark one as read.
- Mark all as read.
- Empty state.

Tasks:

- Add polling or manual refresh. Avoid aggressive polling initially.
- Decide click behavior per notification type.
- Add relative timestamp display.

Acceptance criteria:

- Unread count updates after mark read.
- Mark all read works.
- Empty state shown.

Priority: P1

## 11. Check-in

### FE-0601: Check-in API Layer

Backend:

- `POST /events/{eventId}/members/{userEventId}/qr`
- `POST /events/{eventId}/check-ins/scan`
- `GET /events/{eventId}/check-ins/audit`
- `POST /events/{eventId}/attendees`
- `GET /events/{eventId}/attendees`
- `GET /events/{eventId}/attendees/{attendeeId}`
- `PUT /events/{eventId}/attendees/{attendeeId}`
- `DELETE /events/{eventId}/attendees/{attendeeId}`
- `POST /events/{eventId}/check-in-sessions`
- `GET /events/{eventId}/check-in-sessions`
- `GET /events/{eventId}/check-in-sessions/{sessionId}`
- `PUT /events/{eventId}/check-in-sessions/{sessionId}`
- `DELETE /events/{eventId}/check-in-sessions/{sessionId}`
- `POST /events/{eventId}/check-in-sessions/{sessionId}/scan`
- `POST /events/{eventId}/check-in-sessions/{sessionId}/manual`
- `GET /events/{eventId}/check-in-sessions/{sessionId}/records`

Tasks:

- Add `checkInApi.js`.
- Separate attendee, session, scan, audit methods.
- Normalize paginated audit response.

Acceptance criteria:

- API wrapper covers both member QR flow and attendee/session flow.

Priority: P1

### FE-0602: Attendee Management

Goal:

- Operators can manage attendee list before event.

UI:

- Attendee table/list.
- Search/filter if backend supports, otherwise local search.
- Add attendee form.
- Edit attendee.
- Delete attendee with confirm.
- Import placeholder only if backend lacks import.

Acceptance criteria:

- CRUD attendees works.
- Empty state points to add attendee.
- Delete asks confirmation.

Priority: P1

### FE-0603: Check-in Session Management

Goal:

- Operators can create and manage check-in windows.

UI:

- Session list.
- Create/edit session.
- Open scanner for session.
- View records.

Acceptance criteria:

- Session CRUD works.
- Records display per session.

Priority: P1

### FE-0604: Scanner Screen

Goal:

- Staff can scan QR or enter token/manual check-in quickly.

UI:

- Scanner route optimized for tablet/mobile.
- Token input fallback.
- Manual check-in form.
- Last scan result panel.
- Clear success/error state between scans.

Tasks:

- If camera scanning library is needed, choose lightweight dependency and document it.
- If no camera library approved, implement token input first.

Acceptance criteria:

- Scan endpoint called correctly.
- Duplicate/invalid/expired token errors are readable.
- Manual check-in works.

Priority: P1

### FE-0605: QR Generation and Audit

Goal:

- Event member QR and audit history are available.

Tasks:

- Add QR generation action from event member detail/list.
- Display generated QR payload/image according to backend response.
- Add audit page with pagination.

Acceptance criteria:

- QR generation works for event members.
- Audit page handles empty and paginated data.

Priority: P2

## 12. Issue Management

### FE-0701: Issue API Layer

Backend:

- `POST /issues`
- `GET /issues/{id}`
- `GET /issues/event/{eventId}`
- `GET /issues/team/{teamId}`
- `PUT /issues/{id}/status`
- `PUT /issues/{id}/assign`
- `POST /issue-participants`
- `GET /issue-participants/{issueId}`
- `DELETE /issue-participants/{issueId}/users/{userId}`

Tasks:

- Add `issueApi.js`.
- Add `issueParticipantApi.js`.
- Normalize status/role labels.

Acceptance criteria:

- Wrappers exported.

Priority: P1

### FE-0702: Event/Team Issue List

Goal:

- Teams can track operational blockers.

UI:

- Issue list by event.
- Issue list by team.
- Filters:
  - status
  - assignee
  - severity if backend returns it
- Create issue.
- Issue detail drawer/page.

Acceptance criteria:

- Event and team issue lists load.
- Create issue works.
- Empty state encourages reporting an issue.

Priority: P1

### FE-0703: Issue Detail Workflow

Goal:

- Users can assign, resolve, close, and manage participants.

UI:

- Issue summary.
- Status timeline or status controls.
- Assign user.
- Resolution note.
- Participants/watchers list.
- Add/remove participant.

Acceptance criteria:

- Status update works with resolution.
- Assign works.
- Participants can be added/removed.

Priority: P2

## 13. Finance

Finance is a large module. Build it in vertical slices instead of one big screen.

### FE-0801: Finance API Layer

Backend groups:

- Budget.
- Major tasks.
- Expense requests.
- Expense attachments.
- Payments.
- Reallocation.
- Finance dashboard.
- Export.

Tasks:

- Add `financeApi.js` or split:
  - `financeBudgetApi.js`
  - `financeExpenseApi.js`
  - `financePaymentApi.js`
  - `financeDashboardApi.js`
- Use Swagger/controller contract, not older finance docs if inconsistent.
- Handle binary export download.

Acceptance criteria:

- API layer covers all finance endpoints.
- Export can download Excel/PDF response.

Priority: P2

### FE-0802: Finance Dashboard

Backend:

- `GET /finance/events/{eventId}/dashboard`

Goal:

- Finance managers see budget status and risk.

UI:

- Budget summary.
- Major task finance summary.
- Request counts.
- Status breakdown.
- Recent expense requests if returned.

Acceptance criteria:

- Dashboard loads by event.
- Handles no finance data gracefully.

Priority: P2

### FE-0803: Budget Submission and Approval

Backend:

- `POST /finance/events/{eventId}/budget/submit-for-approval`
- `PATCH /finance/events/{eventId}/budget/approve`
- `POST /finance/events/{eventId}/major-tasks`

UI:

- Submit budget form.
- Approve budget form.
- Major task create form.
- Review notes and justification.

Acceptance criteria:

- Submit budget works.
- Approve budget works.
- Major task create works.
- Permission errors are clear.

Priority: P2

### FE-0804: Expense Request Workflow

Backend:

- Create, list, detail, approve, reject, need-more-info, resubmit, submit, commit, escalate, cancel, upload attachments.

UI:

- Expense request list with filters.
- Create expense request form.
- Detail page.
- Action buttons by status/role.
- Attachment upload.
- Version/history display if returned.

Acceptance criteria:

- CRUD/action lifecycle works end to end.
- Only relevant actions are visible per current status.
- Backend errors for invalid transitions are shown.

Priority: P2

### FE-0805: Payments

Backend:

- `GET /finance/payments/{id}`
- `PATCH /finance/payments/{id}/approve`
- `PATCH /finance/payments/{id}/pay`
- `POST /finance/payments/{id}/reverse`

Important:

- Current controller expects JSON for pay: `{ proofAttachmentId, notes }`.

UI:

- Payment detail.
- Approve payment.
- Execute payment.
- Reverse payment.

Acceptance criteria:

- Payment execution follows current Swagger/controller.
- Reverse requires reason.

Priority: P3

### FE-0806: Reallocation and Export

Backend:

- `POST /finance/reallocate/internal`
- `POST /finance/reallocate/escalate`
- `GET /finance/events/{eventId}/export?format=excel|pdf`

UI:

- Internal reallocation form.
- Escalated reallocation form.
- Export buttons.

Acceptance criteria:

- Export downloads file.
- Reallocation confirms before submit.

Priority: P3

## 14. Email Campaign and Public Unsubscribe

### FE-0901: Email Campaign API Layer

Backend:

- `POST /events/{eventId}/email-campaigns`
- `POST /events/{eventId}/email-campaigns/{campaignId}/schedule`
- `POST /events/{eventId}/email-campaigns/{campaignId}/send-now`
- `GET /events/{eventId}/email-campaigns`
- `GET /events/{eventId}/email-campaigns/{campaignId}/logs`
- `POST /public/email/unsubscribe`
- `GET /public/email/unsubscribe?token=...`

Tasks:

- Add `emailCampaignApi.js`.
- Add `publicEmailApi.js`.

Acceptance criteria:

- Auth and public APIs are separated clearly.

Priority: P2

### FE-0902: Campaign Management

Goal:

- Event organizers can create, schedule, send, and inspect campaigns.

UI:

- Campaign list.
- Create/edit campaign form if backend supports update later.
- Schedule campaign modal.
- Send now confirm.
- Logs page with pagination.

Acceptance criteria:

- Campaign create works.
- Schedule works.
- Send now works with confirmation.
- Logs display delivery status.

Priority: P2

### FE-0903: Public Unsubscribe

Goal:

- Recipients can unsubscribe without login.

UI:

- Public unsubscribe route.
- Token from query string.
- Confirm unsubscribe if using POST.
- Success/error state.

Acceptance criteria:

- Public route works outside protected shell.
- Invalid token is readable.

Priority: P2

## 15. Existing Core Module Improvements

### FE-1001: Event Create/Edit Completeness

Issue:

- Backend handoff lists important fields not fully exposed in current form:
  - `permissionScope`
  - `isHost`
  - `isCheckerStaff`

Tasks:

- Confirm required fields with BA/backend.
- Add fields to event create/edit if product requires them.
- Ensure update handles `204 No Content`.

Acceptance criteria:

- Event payload matches backend contract.
- Required product fields are configurable.

Priority: P1

### FE-1002: Calendar Edit/Delete UI

Current:

- Wrappers exist for detail/update/delete.
- UI mainly supports list/create.

Tasks:

- Add calendar item detail view.
- Add edit calendar form.
- Add delete action with confirm.
- Support both event and team calendar contexts.

Acceptance criteria:

- Calendar entries can be edited/deleted from UI.
- Refresh after mutation.

Priority: P2

### FE-1003: Task Detail Completeness

Tasks:

- Add subtasks section after wrapper exists.
- Review attachment update flow if needed.
- Ensure task comments/issues/feedback returned in detail response are displayed clearly.

Acceptance criteria:

- Task detail reflects all important fields in `ViewTaskDetailResponse`.

Priority: P2

### FE-1004: Dashboard Styling Cleanup

Issue:

- Current dashboard SVG/chart code uses hardcoded hex and inline style.

Tasks:

- Move chart colors to semantic constants or Tailwind-compatible classes where possible.
- Avoid inline styles except dynamic SVG geometry where no clean alternative exists.
- Document exception if needed.

Acceptance criteria:

- UI standard violations are reduced.
- Dashboard visuals remain readable.

Priority: P3

## 16. Routing Plan

Suggested routes:

Public:

- `/login`
- `/register`
- `/verify-otp`
- `/pricing`
- `/auth/confirm?token=...`
- `/invitations/confirm?token=...`
- `/public/events/:slug`
- `/public/email/unsubscribe?token=...`
- `/oauth2/success`

Protected workspace selector:

- `/subscription`

Organization:

- `/organizations`
- `/organizations/:organizationId`
- `/organizations/:organizationId/members`
- `/organizations/:organizationId/members/invite`
- `/organizations/:organizationId/members/invitations`
- `/organizations/:organizationId/departments`
- `/organizations/:organizationId/events`
- `/organizations/:organizationId/branding`
- `/organizations/:organizationId/subscription`

Event:

- `/organizations/:organizationId/events/:eventId`
- `/organizations/:organizationId/events/:eventId/dashboard`
- `/organizations/:organizationId/events/:eventId/members`
- `/organizations/:organizationId/events/:eventId/teams`
- `/organizations/:organizationId/events/:eventId/tasks`
- `/organizations/:organizationId/events/:eventId/calendar`
- `/organizations/:organizationId/events/:eventId/issues`
- `/organizations/:organizationId/events/:eventId/landing-page`
- `/organizations/:organizationId/events/:eventId/check-in/attendees`
- `/organizations/:organizationId/events/:eventId/check-in/sessions`
- `/organizations/:organizationId/events/:eventId/check-in/scanner`
- `/organizations/:organizationId/events/:eventId/check-in/audit`
- `/organizations/:organizationId/events/:eventId/finance`
- `/organizations/:organizationId/events/:eventId/email-campaigns`

Team:

- `/organizations/:organizationId/events/:eventId/teams/:teamId`
- `/organizations/:organizationId/events/:eventId/teams/:teamId/dashboard`
- `/organizations/:organizationId/events/:eventId/teams/:teamId/members`
- `/organizations/:organizationId/events/:eventId/teams/:teamId/tasks`
- `/organizations/:organizationId/events/:eventId/teams/:teamId/calendar`
- `/organizations/:organizationId/events/:eventId/teams/:teamId/issues`

## 17. Suggested Implementation Order

Sprint 0: Stabilize foundations

1. Fix lint.
2. Add unwrap helpers.
3. Improve error/field-error helpers.
4. Add missing small wrappers.
5. Add minimum missing shared components needed for next modules.

Sprint 1: Subscription and organization readiness

1. Subscription API.
2. Real subscription page.
3. Subscription gate messaging.
4. Workspace billing IA and public pricing.
5. Organization branding API/UI.
6. Notification API and bell.

Sprint 2: Public growth surfaces

1. Landing page API.
2. Landing page editor.
3. Public landing page.
4. Public registration.
5. Public unsubscribe.

Sprint 3: Event operations

1. Check-in API.
2. Attendee management.
3. Session management.
4. Scanner screen.
5. QR generation and audit.
6. Issue list/detail workflow.

Sprint 4: Finance and campaign operations

1. Finance API.
2. Finance dashboard.
3. Budget submission/approval.
4. Expense request lifecycle.
5. Payment/reallocation/export.
6. Email campaigns and logs.

Sprint 5: Polish and hardening

1. Calendar edit/delete.
2. Task subtasks/detail completeness.
3. Dashboard style cleanup.
4. Accessibility review.
5. Responsive QA.
6. End-to-end manual test scripts.

## 18. DEV Execution Phases

This section is the practical handoff order for frontend developers. Do not start later phases until the required gate of the current phase is done, unless the team lead explicitly splits work across developers.

### Phase 0: Mandatory Foundation Gate

Scope:

- `FE-0001`: fix lint.
- `FE-0002`: add response unwrap helper.
- `FE-0003`: improve error and field-error helper.

Why this phase is mandatory:

- Backend response shape is mixed between direct DTO/List/Page and wrapped `ApiResponseDTO`.
- Without unwrap/error helpers, new modules will duplicate fragile response parsing.
- Lint must be clean before feature work so later regressions are visible.

Concrete DEV tasks:

1. Fix unused `eventRangeTitle` in `src/pages/EventCalendarPage.jsx`.
2. Add `unwrapResponse()` and related helpers.
3. Refactor high-risk existing actions that return `ApiResponseDTO<Void>`:
   - task reassign/unassign
   - feedback create
   - event cancel/delete if needed
   - invitation update/cancel if wrapped
4. Extend error helper to read `message`, `errorCode`, and `fields`.
5. Add `getFieldErrors(error)` for forms.
6. Run `npm run lint`.
7. Run `npm run build`.

Exit criteria:

- Lint passes.
- Build passes.
- Existing auth, organization, event, team, task screens still load.
- At least one wrapped response flow is verified manually.

Owner suggestion:

- 1 frontend dev.

### Phase 1: Subscription First Product Gate

Scope:

- `FE-0201`: subscription API layer.
- `FE-0202`: real subscription page.
- `FE-0203`: subscription gate messaging.
- `FE-0204`: workspace billing IA and public pricing.

Why this phase is mandatory:

- Subscription affects branding, landing page, AI credits, storage, and premium features.
- Building premium modules before subscription messaging will create confusing 403 flows.
- Before Phase 1, `/subscription` was only a placeholder; after Phase 1 it must remain a selector, while the real billing page is workspace-scoped.

Concrete DEV tasks:

1. Add `src/api/subscriptionApi.js`.
2. Export it from `src/api/index.js`.
3. Implement wrappers for:
   - plans
   - active subscription
   - checkout
   - upgrade
   - cancel
   - resume
   - billing history
4. Replace placeholder `SubscriptionPage`.
5. Prefer route `/organizations/:organizationId/subscription`.
6. Keep `/subscription` as a workspace billing selector if no workspace context exists.
7. Build:
   - current plan summary
   - plan comparison
   - usage limits
   - checkout form
   - upgrade action
   - cancel/resume action
   - billing history
8. Add 403 premium-feature helper/CTA pattern.
9. Add public `/pricing` and keep it outside `ProtectedRoute`.
10. Treat `/subscription` as a workspace billing selector with inline personal workspace creation when no workspace exists.
11. Remove subscription/pricing from primary authenticated operations navigation if present.
12. Use workspace copy in billing decision sections while keeping backend API path names unchanged.

Exit criteria:

- Plans load from backend.
- Active subscription loads by organization.
- Checkout or upgrade can be started.
- Cancel/resume uses confirmation.
- Billing history has empty/success states.
- 403 feature-limit errors can link user to subscription page.
- Public pricing route works.
- `/subscription` does not dead-end and does not masquerade as a workspace-specific billing page.
- Main app navigation remains operations-focused.
- Lint/build pass.

Owner suggestion:

- 1 frontend dev for API/page.
- Optional second dev can prepare shared UI components needed by the page.

### Phase 2: Organization Premium Readiness

Scope:

- Organization branding.
- Notifications.
- Small missing wrappers that support organization/event workflows.

Recommended work items:

- `FE-0101`: auth confirm route.
- `FE-0102`: organization invitation confirm route.
- `FE-0103`: team by organization wrapper.
- `FE-0104`: event status update.
- `FE-0301`: branding API layer.
- `FE-0302`: branding settings UI.
- `FE-0501`: notification API layer.
- `FE-0502`: notification bell and list.

Concrete DEV tasks:

1. Add small wrappers first.
2. Add public confirm routes outside `ProtectedRoute`.
3. Add organization branding page.
4. Reuse subscription gate messaging from Phase 1 for branding 403.
5. Add notification bell in `AppShell`.
6. Add mark read/mark all read flows.

Exit criteria:

- Public confirm routes work without login.
- Branding logo get/upload/delete works.
- Branding 403 links to subscription page.
- Notification unread count and read actions work.
- Lint/build pass.

### Phase 3: Public Event Growth Surface

Scope:

- Landing page editor.
- Public landing page.
- Public registration.
- Public email unsubscribe if the email module is not ready yet.

Recommended work items:

- `FE-0401`: landing page API layer.
- `FE-0402`: landing page editor.
- `FE-0403`: public landing and registration.
- `FE-0903`: public unsubscribe.

Concrete DEV tasks:

1. Add private landing page API.
2. Add public landing page API.
3. Add event workspace route for landing page editor.
4. Build save/publish/unpublish flow.
5. Add public route outside app shell.
6. Build registration form and success state.
7. Add unsubscribe public route.

Exit criteria:

- Organizer can save landing page.
- Organizer can publish/unpublish.
- Public user can load event by slug.
- Public user can register.
- Invalid/closed/full registration states are handled.
- Lint/build pass.

### Phase 4: Event Operations Core

Scope:

- Check-in.
- Issue management.
- Calendar/task completeness where needed.

Recommended work items:

- `FE-0601` to `FE-0605`: check-in.
- `FE-0701` to `FE-0703`: issues.
- `FE-0105`: task subtasks.
- `FE-1002`: calendar edit/delete.
- `FE-1003`: task detail completeness.

Concrete DEV tasks:

1. Build check-in API layer.
2. Build attendee management.
3. Build check-in session management.
4. Build scanner screen with token/manual input first.
5. Add QR generation and audit.
6. Build issue API layer.
7. Build event/team issue list.
8. Build issue detail assignment/status/participants.
9. Add task subtasks to task detail.
10. Add calendar edit/delete.

Exit criteria:

- Event operators can manage attendees and sessions.
- Staff can perform scan/manual check-in.
- Audit/records are viewable.
- Event/team issues can be created, assigned, updated, and closed.
- Lint/build pass.

### Phase 5: Finance and Campaign Operations

Scope:

- Finance workflows.
- Email campaigns and campaign logs.

Recommended work items:

- `FE-0801` to `FE-0806`: finance.
- `FE-0901` to `FE-0902`: email campaign.

Concrete DEV tasks:

1. Build finance API layer.
2. Build finance dashboard first.
3. Add budget submit/approve.
4. Add major task create.
5. Add expense request list/detail/create.
6. Add expense lifecycle actions.
7. Add payment detail/actions.
8. Add reallocation and export.
9. Add email campaign API.
10. Build campaign list/create/schedule/send/logs.

Exit criteria:

- Finance manager can see dashboard.
- Budget and expense flows work end to end.
- Export downloads a file.
- Campaign create/schedule/send/logs work.
- Lint/build pass.

### Phase 6: Product Polish and Release Readiness

Scope:

- UI consistency.
- Responsive QA.
- Accessibility.
- Manual test scripts.
- Dashboard cleanup.

Concrete DEV tasks:

1. Reduce hardcoded hex/inline style violations.
2. Review mobile layouts for every new route.
3. Review empty/loading/error states.
4. Review Vietnamese product copy consistency.
5. Verify role/status labels.
6. Add manual QA scripts by module.
7. Run full app smoke test against backend.

Exit criteria:

- All implemented modules satisfy Definition of Done.
- No console errors in main workflows.
- Lint/build pass.
- Ready for UAT.

## 19. Definition of Done

Every frontend task is done only when:

- Uses API wrapper from `src/api`, no raw Axios in pages.
- Handles loading/error/empty/success states.
- Uses `AlertBanner`, `EmptyState`, `Spinner`, `ConfirmDialog` where appropriate.
- Forms have inline validation.
- Destructive actions use confirmation.
- Success/error feedback is visible.
- Refreshes data after mutation.
- Preserves current route context.
- Uses Tailwind tokens and lucide-react.
- Does not introduce unapproved UI libraries.
- Passes `npm run lint`.
- Passes `npm run build`.
- Has been manually tested against backend or clearly marked as pending backend.

## 20. Manual QA Checklist

For each module:

- Open page directly by URL.
- Refresh page while on detail route.
- Test empty data.
- Test backend 400 validation error.
- Test backend 401/403.
- Test create success.
- Test update success.
- Test delete/cancel with confirm.
- Test pagination if present.
- Test mobile width around 375px.
- Test desktop width around 1440px.
- Verify no console errors.

## 21. Risk Register

Response shape mismatch:

- Risk: Some endpoints return direct DTO, some return `ApiResponseDTO`.
- Mitigation: Add `unwrapResponse()` and use consistently.

Permission/subscription gating:

- Risk: Premium features return 403 and confuse users.
- Mitigation: Detect feature-limit messages and show upgrade CTA.

Finance contract drift:

- Risk: Old docs differ from controller.
- Mitigation: Follow Swagger/controller and backend handoff.

Large module complexity:

- Risk: Check-in/finance/email become oversized PRs.
- Mitigation: Build vertical slices and merge small.

Component standard mismatch:

- Risk: UI standard lists components not in repo.
- Mitigation: Add shared components gradually before feature screens need them.

Routing sprawl:

- Risk: Many modules make nav noisy.
- Mitigation: Group by organization/event/team workspace and hide unimplemented modules.

## 22. Open Questions for BA/Backend

1. Event create/update: should `permissionScope`, `isHost`, and `isCheckerStaff` be required in UI now?
2. Subscription: what should checkout response do in FE, redirect to payment URL or show bank transfer instructions?
3. Landing page: what fields are in `LandingPageRequest` that must be editable in v1?
4. Check-in: should v1 support real camera scanning, or token/manual input first?
5. Finance: which roles can approve budget, approve expense, execute payment, and reverse payment?
6. Notifications: should frontend poll, or will backend later provide WebSocket/SSE?
7. Email campaign: is update/delete campaign supported later, or create/schedule/send-only for v1?
8. Public registration: what attendee fields are mandatory?
9. Branding: what file size/type limits should frontend enforce?
10. AI suggestions: should usage be blocked by subscription/AI credits and surfaced in UI?

## 23. Developer Handoff Notes

- Start every new module by adding the API wrapper and route shell first.
- Do not build UI around mock data if backend endpoint already exists.
- Prefer small PRs:
  - API wrapper + route shell.
  - List page.
  - Create/edit form.
  - Detail/actions.
  - Polish/QA.
- Keep product copy in Vietnamese consistent with existing screens.
- Keep role/status values exactly as backend enums, but show friendly labels in UI.
- For binary export, use browser download behavior and preserve backend filename if provided.
- For public routes, ensure they are outside `ProtectedRoute`.
