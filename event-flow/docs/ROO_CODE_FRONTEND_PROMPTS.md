# Roo Code Frontend Prompts — EventFlow

Review date: 2026-05-24

## 1. Cách dùng tài liệu này

Tài liệu này chuyển `FRONTEND_PRODUCT_WORKPLAN.md` thành bộ prompt giao việc cho Roo Code theo từng phase nhỏ. Mục tiêu là để Roo làm được việc thật, hạn chế sửa lan man, và sau mỗi phase có thể review rõ ràng trước khi đi tiếp.

Quy trình khuyến nghị:

1. Trước khi chạy prompt, đối chiếu code hiện tại với acceptance criteria của prompt đó.
2. Nếu acceptance criteria đã đạt, không chạy lại prompt như feature mới; chỉ yêu cầu Roo verify và fix gap nhỏ nếu có.
3. Chạy từng prompt theo thứ tự còn thiếu.
4. Nếu phase lớn, chạy từng prompt con trong phase.
5. Sau mỗi prompt, yêu cầu Roo báo:
   - files changed
   - routes/API/components đã thêm
   - command đã chạy
   - lỗi còn lại hoặc backend dependency
6. Lead dev review diff trước khi chạy prompt tiếp theo.

Không đưa toàn bộ Phase 3, 4, 5 cho Roo trong một lần. Các phase đó phải chia vertical slice.

### Current execution guidance — 2026-05-24

Nếu repo hiện tại đã có các file hoặc behavior sau thì xem Phase 0 và Phase 1A-1D là đã qua implementation pass, không yêu cầu Roo làm lại từ đầu:

- `src/api/response.js`
- `src/utils/apiError.js`
- `src/api/subscriptionApi.js`
- `src/pages/PricingPage.jsx`
- `src/pages/SubscriptionPage.jsx` không còn là placeholder
- `src/components/feedback/SubscriptionGateBanner.jsx`
- `npm run lint` pass
- `npm run build` pass

Next action khi các điều kiện trên đúng:

1. Chạy Prompt 1E để verify/fix workspace billing IA, public pricing, `/subscription` selector, copy, và AppShell navigation.
2. Chạy Review Prompt cho diff Phase 1E.
3. Nếu review sạch, tiếp tục Phase 2A.

Không tạo Phase 0E. Vấn đề hiện tại thuộc billing IA sau subscription gate, nên nằm ở Phase 1E.

## 2. Master Context Prompt

Copy block này vào đầu mọi prompt cho Roo Code.

```text
Bạn là senior frontend engineer trong dự án EventFlow.

Repo hiện tại:
- React 18 + Vite.
- JSX, không dùng TypeScript.
- React Router v6.
- Zustand cho auth state.
- Axios wrapper ở src/api/client.js.
- Tailwind CSS custom token.
- lucide-react icon.

Tài liệu bắt buộc đọc trước khi code:
- docs/FRONTEND_PRODUCT_WORKPLAN.md
- docs/UI_PROMPT_STANDARD.md
- Backend handoff: E:\2026-SUMMER-SE1942-K8\Event-Flow\event-flow\docs\FRONTEND_BACKEND_HANDOFF.md

Nguyên tắc code:
- Không dùng raw axios trong pages/components. Mọi request đi qua src/api.
- Không introduce UI library mới.
- Dùng component/style pattern hiện có trong repo.
- Trước khi code, kiểm tra xem prompt hiện tại đã được implement chưa. Nếu đã có, chỉ fix gap theo acceptance criteria, không rebuild từ đầu.
- Dùng Tailwind token, không hardcode màu hex trong UI mới.
- Dùng lucide-react cho icon.
- Mọi data page phải có loading/error/empty/success states.
- Form phải có inline validation khi phù hợp.
- Mutating/destructive action phải có feedback và ConfirmDialog khi cần.
- Public route phải nằm ngoài ProtectedRoute.
- Preserve organizationId/eventId/teamId route context.
- Billing/subscription là workspace-scoped. Không đặt `/subscription` hoặc `/pricing` như module vận hành trong AppShell global nav; `/subscription` chỉ là workspace billing selector, còn billing chính nằm ở `/organizations/:organizationId/subscription`.
- Không refactor unrelated files.
- Không mock data nếu backend endpoint đã có.
- Nếu backend response có thể là direct DTO hoặc ApiResponseDTO, dùng unwrap helper.
- Sau khi sửa xong phải chạy npm run lint và npm run build.

Output bắt buộc sau khi hoàn thành:
1. Tóm tắt ngắn đã làm gì.
2. Danh sách file thay đổi.
3. API endpoints/routes đã thêm hoặc sửa.
4. Kết quả npm run lint và npm run build.
5. Manual test checklist đã thử hoặc chưa thử.
6. Rủi ro/blocker còn lại.
```

## 3. Review Prompt Cho Lead Sau Mỗi Phase

Dùng prompt này để yêu cầu Roo tự review trước, sau đó lead dev review tiếp.

```text
Hãy tự review toàn bộ diff vừa tạo theo vai trò senior reviewer.

Ưu tiên tìm:
- Sai API contract so với FRONTEND_BACKEND_HANDOFF.md.
- Route đặt sai protected/public boundary.
- Response unwrap thiếu, làm direct DTO hoặc ApiResponseDTO bị vỡ.
- Error handling thiếu message/fields/errorCode.
- Form thiếu validation/loading/disabled state.
- Destructive action thiếu ConfirmDialog.
- UI vi phạm UI_PROMPT_STANDARD.md.
- Hardcoded hex/inline style/import library mới.
- Lint/build risk.
- Sửa lan sang module không liên quan.

Output:
1. Findings theo severity P0/P1/P2, kèm file và line nếu có.
2. Các điểm đã ổn.
3. Test đã chạy.
4. Đề xuất fix nhỏ trước khi merge.
```

## 4. Phase 0 — Foundation Gate

Chạy phase này đầu tiên. Không làm feature lớn trước khi phase này pass.

### Prompt 0A — Fix Lint Baseline

```text
[Dán Master Context Prompt ở trên]

Task: Phase 0A - Fix lint baseline only.

Scope:
- Fix lỗi lint hiện tại: biến eventRangeTitle unused trong src/pages/EventCalendarPage.jsx.
- Không đổi UI/behavior nếu không cần thiết.
- Không sửa module khác.

Yêu cầu:
1. Đọc src/pages/EventCalendarPage.jsx.
2. Quyết định remove biến unused hoặc dùng đúng chỗ nếu rõ ràng.
3. Chạy npm run lint.
4. Chạy npm run build.

Acceptance criteria:
- npm run lint pass.
- npm run build pass.
- Không có unrelated UI changes.

Output theo format bắt buộc trong Master Context.
```

### Prompt 0B — Response Normalization Helper

```text
[Dán Master Context Prompt ở trên]

Task: Phase 0B - Add defensive API response normalization.

Scope:
- Thêm helper ở src/api/response.js hoặc src/utils/apiResponse.js, ưu tiên pattern hiện có trong repo.
- Export helper để API/page có thể dùng lại.
- Không refactor toàn app trong một lần.

Helpers cần có:
- unwrapResponse(response)
- unwrapData(body)
- getApiMessage(responseOrError, fallback)
- normalizePageResponse(data, pageSize)

Behavior:
- Direct DTO/list/page vẫn trả về đúng data.
- Wrapped ApiResponseDTO { success, message, data } trả về data nếu có.
- Nếu data null trong wrapped response, vẫn giữ được message qua getApiMessage.
- Page response hỗ trợ content,totalElements,totalPages,number,size nếu backend trả Spring Page.
- Custom page response không được làm crash UI.

Sau khi thêm helper, refactor tối thiểu 2-4 flow rủi ro cao có ApiResponseDTO<Void>:
- task reassign/unassign nếu code hiện tại đọc response.data trực tiếp.
- feedback create nếu đang bỏ qua message.
- event cancel/delete hoặc invitation update/cancel nếu phù hợp với code hiện có.

Acceptance criteria:
- Helper có JSDoc hoặc comment ngắn giải thích response shapes.
- Existing direct responses không bị đổi contract.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

### Prompt 0C — Error And Field Error Helpers

```text
[Dán Master Context Prompt ở trên]

Task: Phase 0C - Improve consistent API error handling.

Scope:
- Tìm helper getErrorMessage hiện có nếu có.
- Nếu chưa có, tạo helper ở vị trí phù hợp, ví dụ src/utils/apiError.js.
- Thêm getFieldErrors(error).
- Refactor một số form hiện có để dùng field errors nếu backend trả fields.

getErrorMessage phải ưu tiên:
1. error.response.data.message
2. error.response.data.errorCode
3. error.message
4. fallback truyền vào

getFieldErrors phải hỗ trợ:
- error.response.data.fields là object { fieldName: message }
- Nếu fields không tồn tại, trả object rỗng.

Refactor nhẹ:
- Chọn 1-2 form quan trọng đang submit backend, ví dụ auth/register hoặc organization invite/create, để render inline field errors nếu field name khớp.
- Không rewrite toàn bộ forms.

Acceptance criteria:
- Page-level AlertBanner vẫn hoạt động.
- Inline field errors hiển thị dưới field khi có backend fields.
- 401/403 có message dễ hiểu.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

## 5. Phase 1 — Subscription Product Gate

Không chạy toàn bộ Phase 1 trong một prompt nếu repo chưa có đủ shared components. Chia thành API, page shell, actions, gate messaging.

### Prompt 1A — Subscription API Layer

```text
[Dán Master Context Prompt ở trên]

Task: Phase 1A - Add subscription API layer.

Backend endpoints:
- GET /subscriptions/plans
- GET /organizations/{organizationId}/subscription
- POST /organizations/{organizationId}/subscriptions/checkout
- POST /organizations/{organizationId}/subscription/upgrade
- POST /organizations/{organizationId}/subscription/cancel
- POST /organizations/{organizationId}/subscription/resume
- GET /organizations/{organizationId}/billing-history

Scope:
- Add src/api/subscriptionApi.js.
- Export it from src/api/index.js.
- Use apiClient from src/api/client.js.
- Use unwrapResponse/normalizePageResponse if Phase 0 helper exists.
- Do not build UI in this prompt.

API method names suggested:
- getPlans()
- getActiveSubscription(organizationId)
- checkout(organizationId, payload)
- upgrade(organizationId, payload)
- cancel(organizationId)
- resume(organizationId)
- getBillingHistory(organizationId)

Payloads:
- checkout: { planId, eventId, paymentMethod, vatInvoiceRequested, companyName, taxCode }
- upgrade: { targetPlanId, paymentMethod }

Acceptance criteria:
- API wrapper covers all subscription endpoints.
- Public plans endpoint still works even when no token exists.
- No raw endpoint strings duplicated outside API layer.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

### Prompt 1B — Subscription Page Route And Data Shell

```text
[Dán Master Context Prompt ở trên]

Task: Phase 1B - Replace placeholder SubscriptionPage with real data shell.

Scope:
- Replace current placeholder page with a real subscription screen shell.
- Add route /organizations/:organizationId/subscription in App.jsx.
- Keep existing `/subscription` route as a workspace billing selector. Do not redirect directly to the first workspace.
- Load plans, active subscription, and billing history.
- Do not implement checkout/cancel/resume mutations yet unless small and safe.

UI sections:
- Current active plan summary.
- Plan comparison area.
- Usage limits: events, members, attendees, storage, AI credits.
- Billing history table/list.

States:
- Loading while fetching initial data.
- AlertBanner on fetch error.
- Empty state for no active subscription or no billing history.
- Success state with data.

Design:
- Follow UI_PROMPT_STANDARD.md.
- Use existing Button, Card, Badge, AlertBanner, EmptyState, Spinner where possible.
- If a missing shared component is needed, add the smallest reusable version only.

Acceptance criteria:
- /organizations/:organizationId/subscription loads by organizationId.
- `/subscription` does not dead-end on placeholder and does not skip workspace selection.
- Plans and billing data are displayed defensively even if fields are missing/null.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

### Prompt 1C — Subscription Mutations

```text
[Dán Master Context Prompt ở trên]

Task: Phase 1C - Add subscription checkout, upgrade, cancel, and resume flows.

Scope:
- Work inside the subscription page/module created in Phase 1B.
- Add checkout form.
- Add upgrade action.
- Add cancel/resume actions.
- Use ConfirmDialog for cancel/resume/upgrade where appropriate.
- Refresh subscription and billing history after successful mutation.

Checkout fields:
- plan
- optional eventId if an event context/selector exists; otherwise keep nullable and do not fake event data
- paymentMethod, default BANK_TRANSFER
- vatInvoiceRequested
- companyName and taxCode when VAT invoice requested

Response behavior:
- If checkout/upgrade response contains a paymentUrl or redirectUrl, render a clear CTA link.
- If response contains instructions/message only, show that message.
- If shape is unknown, show success message from getApiMessage fallback.

Acceptance criteria:
- User can start checkout.
- User can upgrade plan.
- User can cancel/resume with confirmation.
- Backend validation errors show inline where fields match.
- Mutation errors are readable.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

### Prompt 1D — Subscription Gate Messaging Helper

```text
[Dán Master Context Prompt ở trên]

Task: Phase 1D - Standardize subscription/feature-limit 403 messaging.

Scope:
- Add a small helper/component pattern for premium feature errors.
- It should detect 403 and messages/errorCode that indicate subscription/feature/limit/payment gate.
- Provide CTA to /organizations/:organizationId/subscription when organizationId is available.
- Do not refactor every module yet. Integrate with SubscriptionPage and one existing gated-like flow if appropriate.

Suggested files:
- src/utils/subscriptionGate.js
- or src/components/feedback/SubscriptionGateBanner.jsx

Acceptance criteria:
- Generic 403 remains readable.
- Premium feature 403 has a subscription CTA.
- Organization context is preserved in the CTA.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

### Prompt 1E — Workspace Billing IA And Public Pricing Polish

```text
[Dán Master Context Prompt ở trên]

Task: Phase 1E - Standardize workspace billing IA and public pricing.

Context:
- Keep current backend API and database contract.
- Backend still names paths `/organizations/{organizationId}/...`, but product copy should describe billing as workspace-scoped.
- `/pricing` is public.
- `/subscription` is not a direct subscription detail page. It is a workspace billing selector.
- `/organizations/:organizationId/subscription` is the real workspace billing screen.

Scope:
1. Add or verify public route `/pricing` outside `ProtectedRoute`.
2. Ensure `/subscription` loads a workspace billing selector, not an automatic direct redirect.
3. If the user has no workspace/organization, allow inline creation of a personal workspace before selecting a plan.
4. Change billing copy from "organization/tổ chức" to "workspace" where the user is making billing decisions.
5. Remove `/subscription` and `/pricing` from the authenticated AppShell global operations nav if present. Billing should be reachable from:
   - the workspace selector `/subscription`
   - organization/workspace navigation at `/organizations/:organizationId/subscription`
   - public pricing CTA
6. Do not change database naming, API paths, or backend DTO field names.

UX rules:
- The top-level authenticated shell should feel like an operations dashboard: workspaces, profile/account, and product info only if already present.
- Public pricing can be more explanatory, but it must show real plan data from `GET /subscriptions/plans`.
- Workspace billing selector should show existing workspaces and a compact personal workspace creation form.
- Avoid fake subscription states or mock plan data.

Acceptance criteria:
- `/pricing` works for logged-out and logged-in users.
- `/subscription` lets logged-in users choose or create a workspace.
- `/organizations/:organizationId/subscription` loads real billing data for that workspace.
- Billing UI copy consistently says workspace in user-facing billing sections.
- AppShell no longer presents subscription/pricing as main operational modules.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

## 6. Phase 2 — Organization Premium Readiness

### Prompt 2A — Small Missing API Wrappers And Public Confirm Routes

```text
[Dán Master Context Prompt ở trên]

Task: Phase 2A - Add small missing wrappers and public confirm routes.

Backend endpoints:
- GET /auth/confirm?token=...
- GET /organization-members/invitations/confirm?token=...
- GET /teams/organization/{organizationId}
- PATCH /events/{eventId}/status
- GET /tasks/{id}/subtasks

Scope:
- Add wrapper methods in existing API files.
- Add public route /auth/confirm.
- Add public route /invitations/confirm.
- Public routes must be outside ProtectedRoute.
- Add basic loading/success/error pages for confirm routes.
- Do not build task subtasks UI yet, only wrapper unless it is very small.

Acceptance criteria:
- authApi.confirm(token) exists.
- organizationMemberApi.confirmInvitation(token) or equivalent exists.
- teamApi.getByOrganization(organizationId) exists.
- eventApi.updateStatus(eventId, status) exists.
- taskApi.getSubtasks(taskId) exists.
- Confirm pages read token from query string and show readable invalid/expired state.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

### Prompt 2B — Organization Branding API And UI

```text
[Dán Master Context Prompt ở trên]

Task: Phase 2B - Build organization branding settings.

Backend endpoints:
- GET /organizations/{organizationId}/branding
- POST /organizations/{organizationId}/branding/logo multipart file
- DELETE /organizations/{organizationId}/branding/logo

Scope:
- Add src/api/organizationBrandingApi.js and export it.
- Add route /organizations/:organizationId/branding.
- Add organization workspace nav item if AppShell/OrganizationCaseLayout has a clear pattern.
- Build branding settings page.

UI:
- Current logo preview.
- Upload/change logo.
- Delete logo with ConfirmDialog.
- Branding details returned by backend.
- Empty state when no logo exists.
- 403 subscription gate CTA using Phase 1 helper if available.

Validation:
- Allow image files only.
- If backend limits are unknown, keep conservative client-side validation and clear copy.
- Use FormData for upload.

Acceptance criteria:
- Branding loads.
- Upload/delete refreshes branding state.
- 403 links to subscription page when organizationId exists.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

### Prompt 2C — Notifications API And Bell

```text
[Dán Master Context Prompt ở trên]

Task: Phase 2C - Add notification API and app shell bell.

Backend endpoints:
- GET /notifications
- PATCH /notifications/{id}/read
- PATCH /notifications/read-all

Scope:
- Add src/api/notificationApi.js and export it.
- Add notification bell entry in AppShell.
- Implement dropdown or drawer list using existing components/patterns.
- Use manual refresh or light fetch on shell mount. Do not add aggressive polling.

UI:
- Bell icon with unread count.
- List of notifications with type/status/date.
- Mark one as read.
- Mark all as read.
- Empty state.

Acceptance criteria:
- Unread count updates after mark read.
- Mark all read works.
- Empty state shown when no notifications.
- Errors do not break AppShell.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

## 7. Phase 3 — Public Event Growth Surface

### Prompt 3A — Landing Page API Layer

```text
[Dán Master Context Prompt ở trên]

Task: Phase 3A - Add landing page API layer.

Private endpoints:
- GET /events/{eventId}/landing-page
- PUT /events/{eventId}/landing-page
- POST /events/{eventId}/landing-page/publish
- POST /events/{eventId}/landing-page/unpublish

Public endpoints:
- GET /public/events/{slug}
- POST /public/events/{slug}/registrations

Scope:
- Add src/api/landingPageApi.js for authenticated event owner APIs.
- Add src/api/publicLandingPageApi.js for public APIs.
- Export both from src/api/index.js.
- Do not build UI in this prompt.

Acceptance criteria:
- Private endpoints use apiClient normally.
- Public endpoints work outside ProtectedRoute.
- Methods use unwrapResponse if available.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

### Prompt 3B — Private Landing Page Editor

```text
[Dán Master Context Prompt ở trên]

Task: Phase 3B - Build private event landing page editor.

Route:
- /organizations/:organizationId/events/:eventId/landing-page

UI:
- Page status draft/published.
- Slug display and copy/open public URL action.
- Hero title/subtitle/content fields based on backend response.
- Event description fields based on backend response.
- Registration settings fields based on backend response.
- Preview panel.
- Save draft.
- Publish/unpublish with ConfirmDialog.

Important:
- First inspect actual response fields from backend handoff/Swagger if available in repo.
- If fields are uncertain, map defensively and keep unknown fields out of the form rather than inventing fake contract.

Acceptance criteria:
- User can load existing landing page.
- User can save changes with PUT.
- User can publish/unpublish.
- Subscription/permission errors are readable.
- Route is reachable from event workspace navigation if a clear pattern exists.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

### Prompt 3C — Public Landing Page And Registration

```text
[Dán Master Context Prompt ở trên]

Task: Phase 3C - Build public event page and registration flow.

Route:
- /public/events/:slug

Scope:
- Public route outside ProtectedRoute and outside AppShell.
- Build a simple public layout for event page.
- Load public event by slug.
- Add registration form.
- Submit registration to /public/events/{slug}/registrations.

UI states:
- Loading.
- Not found/invalid slug.
- Closed registration.
- Full capacity.
- Backend validation fields inline where possible.
- Success confirmation after registration.

Design:
- This is a public page, but still use EventFlow design tokens.
- Do not turn it into a marketing landing page with fake content.
- Render actual backend event/page fields only.

Acceptance criteria:
- Public user can open event by slug without login.
- Registration posts successfully.
- Invalid/closed/full states are readable.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

### Prompt 3D — Public Email Unsubscribe

```text
[Dán Master Context Prompt ở trên]

Task: Phase 3D - Add public email unsubscribe route.

Backend endpoints:
- GET /public/email/unsubscribe?token=...
- POST /public/email/unsubscribe with { token }

Scope:
- Add src/api/publicEmailApi.js and export it.
- Add public route /public/email/unsubscribe.
- Read token from query string.
- Show confirm/success/error state.
- If GET already performs unsubscribe, handle success directly.
- If GET only validates token, use POST for final confirmation.

Acceptance criteria:
- Route works outside ProtectedRoute.
- Missing/invalid token has readable error.
- Success state shown.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

## 8. Phase 4 — Event Operations Core

Phase này lớn. Chạy từng prompt con.

### Prompt 4A — Check-in API Layer

```text
[Dán Master Context Prompt ở trên]

Task: Phase 4A - Add check-in API layer.

Backend endpoints:
- POST /events/{eventId}/members/{userEventId}/qr
- POST /events/{eventId}/check-ins/scan
- GET /events/{eventId}/check-ins/audit
- POST /events/{eventId}/attendees
- GET /events/{eventId}/attendees
- GET /events/{eventId}/attendees/{attendeeId}
- PUT /events/{eventId}/attendees/{attendeeId}
- DELETE /events/{eventId}/attendees/{attendeeId}
- POST /events/{eventId}/check-in-sessions
- GET /events/{eventId}/check-in-sessions
- GET /events/{eventId}/check-in-sessions/{sessionId}
- PUT /events/{eventId}/check-in-sessions/{sessionId}
- DELETE /events/{eventId}/check-in-sessions/{sessionId}
- POST /events/{eventId}/check-in-sessions/{sessionId}/scan
- POST /events/{eventId}/check-in-sessions/{sessionId}/manual
- GET /events/{eventId}/check-in-sessions/{sessionId}/records

Scope:
- Add src/api/checkInApi.js and export it.
- Group methods clearly: attendees, sessions, scan/manual, records, audit, QR.
- Normalize paginated audit response.
- Do not build UI in this prompt.

Acceptance criteria:
- API wrapper covers all check-in endpoints.
- Method names are readable and consistent.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

### Prompt 4B — Attendee Management

```text
[Dán Master Context Prompt ở trên]

Task: Phase 4B - Build attendee management page.

Route:
- /organizations/:organizationId/events/:eventId/check-in/attendees

UI:
- Attendee list/table.
- Local search if backend does not support search.
- Add attendee form/modal.
- Edit attendee.
- Delete attendee with ConfirmDialog.
- Empty state points to add attendee.

Acceptance criteria:
- CRUD attendees works.
- Loading/error/empty/success states exist.
- Route is reachable from event workspace navigation if a clear pattern exists.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

### Prompt 4C — Check-in Sessions And Records

```text
[Dán Master Context Prompt ở trên]

Task: Phase 4C - Build check-in session management and records.

Routes:
- /organizations/:organizationId/events/:eventId/check-in/sessions
- Optional detail/records route if useful and consistent with router patterns.

UI:
- Session list.
- Create/edit session.
- Delete session with ConfirmDialog.
- Open scanner for session.
- View records per session.

Acceptance criteria:
- Session CRUD works.
- Records display per session.
- Empty/loading/error states exist.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

### Prompt 4D — Scanner Screen Token First

```text
[Dán Master Context Prompt ở trên]

Task: Phase 4D - Build scanner screen with token/manual input first.

Route:
- /organizations/:organizationId/events/:eventId/check-in/scanner

Scope:
- Do not add camera scanning dependency yet.
- Implement token input scan and manual check-in form.
- If sessionId is required, provide a session selector loaded from check-in sessions.
- Show last scan/check-in result panel.
- Clear stale success/error state between submissions.

Acceptance criteria:
- Scan endpoint called correctly.
- Manual check-in endpoint called correctly.
- Duplicate/invalid/expired token errors are readable.
- Tablet/mobile layout is usable.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

### Prompt 4E — Issue API And Event/Team Issue Lists

```text
[Dán Master Context Prompt ở trên]

Task: Phase 4E - Add issue API and event/team issue list.

Backend endpoints:
- POST /issues
- GET /issues/{id}
- GET /issues/event/{eventId}
- GET /issues/team/{teamId}
- PUT /issues/{id}/status
- PUT /issues/{id}/assign
- POST /issue-participants
- GET /issue-participants/{issueId}
- DELETE /issue-participants/{issueId}/users/{userId}

Scope:
- Add src/api/issueApi.js.
- Add src/api/issueParticipantApi.js.
- Export both.
- Add event issue route /organizations/:organizationId/events/:eventId/issues.
- Add team issue route /organizations/:organizationId/events/:eventId/teams/:teamId/issues.
- Build list with filters and create issue form.
- Detail workflow can be minimal in this prompt.

Acceptance criteria:
- Event and team issue lists load.
- Create issue works.
- Empty state encourages reporting issue.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

### Prompt 4F — Issue Detail Workflow

```text
[Dán Master Context Prompt ở trên]

Task: Phase 4F - Complete issue detail workflow.

Scope:
- Add issue detail page or drawer consistent with existing app patterns.
- Load issue by id.
- Update status with optional resolution.
- Assign user.
- Show participants/watchers.
- Add/remove participant.

Acceptance criteria:
- Status update works.
- Assign works.
- Participants can be added/removed.
- Backend invalid transition errors are readable.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

### Prompt 4G — Task Subtasks And Calendar Edit/Delete

```text
[Dán Master Context Prompt ở trên]

Task: Phase 4G - Improve existing task/calendar completeness.

Scope:
- Add subtasks section in task detail using taskApi.getSubtasks(taskId).
- Add empty/loading/error states for subtasks.
- Add calendar item detail/edit/delete UI for event and team calendar contexts.
- Use existing calendar wrappers if already present.

Acceptance criteria:
- Task detail displays child tasks when backend returns them.
- Calendar entries can be viewed, edited, and deleted.
- Delete uses ConfirmDialog.
- UI refreshes after mutation.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

## 9. Phase 5 — Finance And Campaign Operations

Phase này dễ quá tải. Chạy theo vertical slice, không gom hết.

### Prompt 5A — Finance API Layer

```text
[Dán Master Context Prompt ở trên]

Task: Phase 5A - Add finance API layer.

Important:
- Follow Swagger/controller and FRONTEND_BACKEND_HANDOFF.md.
- Do not follow older finance docs if they conflict.
- Payment pay endpoint currently expects JSON { proofAttachmentId, notes }, not multipart.

Scope:
- Add finance API files. Either one src/api/financeApi.js or split by domain if cleaner:
  - financeBudgetApi.js
  - financeExpenseApi.js
  - financePaymentApi.js
  - financeDashboardApi.js
- Export from src/api/index.js.
- Handle binary export download for /finance/events/{eventId}/export?format=excel|pdf.
- Do not build UI in this prompt.

Endpoint groups:
- budget submit/approve
- major tasks create
- expense request list/detail/create/actions/attachments
- payment detail/approve/pay/reverse
- reallocation internal/escalate
- dashboard
- export

Acceptance criteria:
- API layer covers all finance endpoints listed in handoff.
- Export preserves backend filename if content-disposition exists.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

### Prompt 5B — Finance Dashboard

```text
[Dán Master Context Prompt ở trên]

Task: Phase 5B - Build finance dashboard first.

Route:
- /organizations/:organizationId/events/:eventId/finance

Backend:
- GET /finance/events/{eventId}/dashboard

UI:
- Budget summary.
- Major task finance summary if returned.
- Request counts.
- Status breakdown.
- Recent expense requests if returned.
- Empty/no finance data state.

Acceptance criteria:
- Dashboard loads by event.
- Handles missing/null sections gracefully.
- Route is reachable from event workspace navigation if a clear pattern exists.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

### Prompt 5C — Budget Submission And Approval

```text
[Dán Master Context Prompt ở trên]

Task: Phase 5C - Add budget submit/approve and major task create.

Backend:
- POST /finance/events/{eventId}/budget/submit-for-approval
- PATCH /finance/events/{eventId}/budget/approve
- POST /finance/events/{eventId}/major-tasks

UI:
- Submit budget form.
- Approve budget form.
- Major task create form.
- Review notes and justification fields.

Acceptance criteria:
- Submit budget works.
- Approve budget works.
- Major task create works.
- Permission errors are clear.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

### Prompt 5D — Expense Request Workflow

```text
[Dán Master Context Prompt ở trên]

Task: Phase 5D - Build expense request lifecycle.

Scope:
- Expense request list with filters.
- Create expense request form.
- Detail page/drawer.
- Actions by status/role where current status makes sense:
  approve, reject, need-more-info, resubmit, submit, commit, escalate, cancel.
- Attachment upload.
- Version/history display only if backend returns it.

Acceptance criteria:
- Create/list/detail works.
- Lifecycle actions call correct endpoints.
- Only relevant actions are visible per current status where possible.
- Invalid transition errors are readable.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

### Prompt 5E — Payments, Reallocation, Export

```text
[Dán Master Context Prompt ở trên]

Task: Phase 5E - Add payments, reallocation, and export UI.

Backend:
- GET /finance/payments/{id}
- PATCH /finance/payments/{id}/approve
- PATCH /finance/payments/{id}/pay with JSON { proofAttachmentId, notes }
- POST /finance/payments/{id}/reverse
- POST /finance/reallocate/internal
- POST /finance/reallocate/escalate
- GET /finance/events/{eventId}/export?format=excel|pdf

UI:
- Payment detail/actions.
- Execute payment form.
- Reverse payment with reason.
- Internal/escalated reallocation forms.
- Export Excel/PDF buttons.

Acceptance criteria:
- Payment execution follows JSON contract.
- Reverse requires reason.
- Reallocation confirms before submit.
- Export downloads file.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

### Prompt 5F — Email Campaign API And UI

```text
[Dán Master Context Prompt ở trên]

Task: Phase 5F - Build email campaign management.

Backend:
- POST /events/{eventId}/email-campaigns
- POST /events/{eventId}/email-campaigns/{campaignId}/schedule
- POST /events/{eventId}/email-campaigns/{campaignId}/send-now
- GET /events/{eventId}/email-campaigns
- GET /events/{eventId}/email-campaigns/{campaignId}/logs

Scope:
- Add src/api/emailCampaignApi.js and export it.
- Add route /organizations/:organizationId/events/:eventId/email-campaigns.
- Campaign list.
- Create campaign form.
- Schedule campaign modal/form.
- Send now confirm.
- Logs page/list with pagination if backend returns Page.

Acceptance criteria:
- Campaign create works.
- Schedule works.
- Send now works with confirmation.
- Logs display delivery status.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

## 10. Phase 6 — Product Polish And Release Readiness

### Prompt 6A — UI Standard Cleanup

```text
[Dán Master Context Prompt ở trên]

Task: Phase 6A - UI standard cleanup.

Scope:
- Scan changed/new UI files and existing dashboards for:
  - inline style
  - hardcoded hex colors
  - missing loading/error/empty states
  - inconsistent Badge/status labels
  - buttons without disabled/loading behavior
- Prioritize files touched by previous phases.
- Do not redesign the whole app.

Acceptance criteria:
- UI standard violations reduced.
- Dashboard/chart visuals remain readable.
- Any unavoidable SVG/chart inline styles are documented with a short comment.
- Lint/build pass.

Output theo format bắt buộc trong Master Context.
```

### Prompt 6B — Responsive And Manual QA Scripts

```text
[Dán Master Context Prompt ở trên]

Task: Phase 6B - Add manual QA scripts/checklists for implemented modules.

Scope:
- Add or update docs/manual QA checklist for modules implemented in this run.
- Include mobile width 375px and desktop 1440px checks.
- Include direct URL refresh, empty data, 400, 401/403, create/update/delete, pagination.
- Do not change app behavior unless a small obvious bug blocks QA.

Suggested file:
- docs/FRONTEND_MANUAL_QA.md

Acceptance criteria:
- QA checklist is actionable by tester/dev.
- Includes routes and expected states.
- Lint/build pass if code changed; if docs only, explain that build was not necessary.

Output theo format bắt buộc trong Master Context.
```

## 11. Prompt Khi Roo Bị Quá Scope

Dùng khi Roo đang cố làm quá nhiều.

```text
Dừng mở rộng scope.

Hãy chỉ hoàn thành vertical slice nhỏ nhất đang làm:
- API wrapper nếu task là API.
- Route shell + fetch state nếu task là page shell.
- Một mutation flow nếu task là action.

Không thêm module mới, không refactor unrelated files.

Trước khi kết thúc:
1. Revert/loại bỏ mọi thay đổi không liên quan do bạn vừa tạo.
2. Chạy npm run lint và npm run build.
3. Báo file changed và phần còn lại nên làm ở prompt tiếp theo.
```

## 12. Prompt Fix Sau Review

Dùng sau khi lead dev phát hiện issue.

```text
[Dán Master Context Prompt ở trên]

Task: Fix review findings only.

Findings cần sửa:
- [Dán từng finding cụ thể, có file/line nếu có]

Constraints:
- Chỉ sửa đúng findings.
- Không thêm feature mới.
- Không đổi route/API ngoài phần cần fix.
- Nếu finding liên quan API contract, đối chiếu FRONTEND_BACKEND_HANDOFF.md trước khi sửa.

Acceptance criteria:
- Tất cả findings được xử lý hoặc giải thích vì sao không sửa.
- npm run lint pass.
- npm run build pass.

Output:
1. Finding nào đã fix.
2. File changed.
3. Test commands đã chạy.
4. Rủi ro còn lại nếu có.
```
