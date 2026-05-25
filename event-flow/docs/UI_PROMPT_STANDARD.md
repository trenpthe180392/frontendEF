# UI_PROMPT_STANDARD.md — EventFlow Management System

> Tài liệu này là chuẩn bắt buộc cho mọi member khi dùng AI generate UI component.
> Copy toàn bộ **SYSTEM CONTEXT** vào đầu mỗi prompt. Chỉ thay đổi phần **COMPONENT REQUEST**.

---

## PHẦN 1 — DESIGN TOKEN REFERENCE

### 1.1 Color System

```
PRIMARY PALETTE (Tươi sáng, năng động)
  --color-primary:        #FF6B2C   /* Vivid Orange — CTA chính */
  --color-primary-light:  #FF8F5E   /* Hover / active state */
  --color-primary-dark:   #E5501A   /* Pressed state */
  --color-primary-bg:     #FFF2EC   /* Background nhạt của primary */

SECONDARY PALETTE
  --color-secondary:      #00C2A8   /* Teal — accent, badge, tag */
  --color-secondary-light:#33CFBB
  --color-secondary-bg:   #E6FAF8

NEUTRAL PALETTE
  --color-neutral-900:    #111827   /* Text heading */
  --color-neutral-700:    #374151   /* Text body */
  --color-neutral-500:    #6B7280   /* Text muted / label */
  --color-neutral-300:    #D1D5DB   /* Border default */
  --color-neutral-100:    #F3F4F6   /* Background row alt */
  --color-neutral-50:     #F9FAFB   /* Background page */
  --color-white:          #FFFFFF

SEMANTIC COLORS
  --color-success:        #16A34A
  --color-success-bg:     #F0FDF4
  --color-warning:        #D97706
  --color-warning-bg:     #FFFBEB
  --color-danger:         #DC2626
  --color-danger-bg:      #FEF2F2
  --color-info:           #2563EB
  --color-info-bg:        #EFF6FF
```

### 1.2 Typography Scale

```
Font family: "Plus Jakarta Sans", sans-serif
Import: https://fonts.google.com/specimen/Plus+Jakarta+Sans

SCALE
  --text-xs:    12px / line-height: 1.5 / weight: 400
  --text-sm:    13px / line-height: 1.5 / weight: 400
  --text-base:  14px / line-height: 1.6 / weight: 400   ← body mặc định
  --text-md:    16px / line-height: 1.6 / weight: 400
  --text-lg:    18px / line-height: 1.4 / weight: 500
  --text-xl:    20px / line-height: 1.3 / weight: 600
  --text-2xl:   24px / line-height: 1.2 / weight: 700
  --text-3xl:   30px / line-height: 1.2 / weight: 700

DÙNG Tailwind class:
  Heading page:  text-2xl font-bold text-neutral-900
  Section title: text-lg font-semibold text-neutral-800
  Label:         text-sm font-medium text-neutral-600
  Body:          text-base text-neutral-700
  Caption:       text-xs text-neutral-500
```

### 1.3 Spacing Scale

```
Chỉ dùng bội số của 4px:
  4px  → gap-1, p-1, m-1
  8px  → gap-2, p-2
  12px → gap-3, p-3
  16px → gap-4, p-4   ← padding card mặc định
  20px → gap-5, p-5
  24px → gap-6, p-6   ← padding section
  32px → gap-8, p-8
  40px → gap-10
  48px → gap-12
```

### 1.4 Border Radius

```
  --radius-sm:   6px   → rounded   (input, badge nhỏ)
  --radius-md:   10px  → rounded-lg (card, button)
  --radius-lg:   14px  → rounded-xl (modal, panel lớn)
  --radius-full: 9999px → rounded-full (avatar, tag pill)
```

### 1.5 Shadow

```
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.08)           → card rest
  --shadow-md:  0 4px 12px rgba(0,0,0,0.10)           → card hover
  --shadow-lg:  0 8px 24px rgba(0,0,0,0.12)           → modal, dropdown
  --shadow-btn: 0 2px 8px rgba(255,107,44,0.35)        → button primary
```

### 1.6 Icon Set

```
Library: lucide-react (duy nhất)
Import:  import { IconName } from "lucide-react"
Size mặc định: 16px (inline), 20px (button), 24px (standalone)
Stroke width: 1.5 (mặc định lucide)
Color: inherit từ text color của parent
KHÔNG dùng: react-icons, heroicons, material icons, emoji
```

---

## PHẦN 2 — COMPONENT INVENTORY

> AI chỉ được dùng các component sau. KHÔNG tự tạo component mới.

```
BASE COMPONENTS (src/components/ui/)
  Button          → variant: primary | secondary | ghost | danger
  Input           → type: text | search | date | number
  Select          → single select, có placeholder
  Textarea
  Checkbox
  Badge           → variant: success | warning | danger | info | default
  Avatar          → size: sm | md | lg, fallback initials
  Tooltip
  Spinner         → size: sm | md | lg

LAYOUT COMPONENTS (src/components/layout/)
  PageHeader      → title + subtitle + action slot
  Card            → padding, shadow, optional header/footer
  DataTable       → columns[], data[], loading, empty state
  EmptyState      → icon + title + description + optional CTA
  Modal           → title, body, footer, onClose
  Drawer          → side panel
  Tabs            → tab list + tab panel
  Breadcrumb

FEEDBACK COMPONENTS
  Toast           → success | error | warning | info (dùng qua useToast hook)
  AlertBanner     → inline alert trong page
  ConfirmDialog   → confirm trước khi delete/action nguy hiểm

FORM COMPONENTS (src/components/form/)
  FormField       → wrapper: label + input + error message
  FormSection     → nhóm các FormField liên quan
  DateRangePicker
  SearchBar       → input + icon + clear button
```

---

## PHẦN 3 — STATE & BEHAVIOR PATTERN

```
MỌI component fetch data phải handle đủ 4 state:
  loading  → hiển thị Spinner hoặc Skeleton
  error    → hiển thị AlertBanner với message từ API
  empty    → hiển thị EmptyState component
  success  → hiển thị data

MỌI form phải có:
  - Validation inline (hiển thị error ngay dưới field)
  - Disabled submit button khi đang loading
  - Reset về default sau khi submit thành công
  - ConfirmDialog trước khi delete

NAMING STATE VARIABLES:
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState([])
```

---

## PHẦN 4 — CODE CONVENTION

```
FILE NAMING
  Component:    PascalCase        → EventCard.jsx
  Hook:         camelCase use*    → useEventList.js
  Util:         camelCase         → formatDate.js
  API:          camelCase         → eventApi.js
  Store/slice:  camelCase         → eventSlice.js

FOLDER STRUCTURE (theo feature)
  src/features/events/
    ├── components/   ← component riêng của feature này
    ├── hooks/        ← custom hooks
    ├── EventListPage.jsx
    └── EventDetailPage.jsx

IMPORT ORDER (tuân theo eslint)
  1. React & external libs
  2. Internal components (@/components/...)
  3. Hooks, stores, utils
  4. Assets, styles

PROPS
  - TypeScript-style JSDoc comment cho mọi props nếu dùng JSX
  - Destructure props ngay trong function signature
  - Đặt defaultProps hoặc default value trong destructure

EVENT HANDLER
  - Prefix: handle*   → handleSubmit, handleDelete, handleSearch
  - Async handler: dùng try/catch, set loading + error state

KHÔNG ĐƯỢC
  - Inline style (style={{ }}) — dùng Tailwind class
  - Hardcode màu hex — dùng CSS variable hoặc Tailwind token
  - Import component không có trong inventory
  - Dùng index làm key trong .map() nếu list có thể thay đổi
```

---

## PHẦN 5 — PROMPT TEMPLATE CHUẨN

> Copy toàn bộ block dưới đây, điền vào phần COMPONENT REQUEST.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SYSTEM CONTEXT — KHÔNG THAY ĐỔI]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bạn đang generate UI component cho hệ thống quản lý sự kiện "EventFlow".

TECH STACK: React + Vite, JSX (không phải TSX), Tailwind CSS, lucide-react
STATE MANAGEMENT: Zustand (store ở src/store/)
ROUTING: React Router v6
API LAYER: Axios wrapper ở src/api/

DESIGN DIRECTION: Tinh gọn, sáng, tươi. Không rườm rà. Mỗi element có mục đích rõ ràng.

DESIGN TOKENS (bắt buộc dùng):
  Primary: #FF6B2C | Primary bg: #FFF2EC
  Secondary (accent): #00C2A8 | Secondary bg: #E6FAF8
  Text heading: #111827 | Text body: #374151 | Text muted: #6B7280
  Border: #D1D5DB | Background page: #F9FAFB | White: #FFFFFF
  Success: #16A34A | Warning: #D97706 | Danger: #DC2626
  Font: "Plus Jakarta Sans" — import từ Google Fonts
  Border-radius: 6px (sm) / 10px (md) / 14px (lg) / full
  Shadow card: 0 1px 3px rgba(0,0,0,0.08)
  Shadow card hover: 0 4px 12px rgba(0,0,0,0.10)

BASE COMPONENTS CÓ SẴN (không tạo lại):
  Button (variant: primary|secondary|ghost|danger)
  Input, Select, Textarea, Checkbox
  Badge (variant: success|warning|danger|info|default)
  Avatar, Tooltip, Spinner
  PageHeader, Card, DataTable, EmptyState
  Modal, Drawer, Tabs, Breadcrumb
  Toast (qua useToast), AlertBanner, ConfirmDialog
  FormField, FormSection, DateRangePicker, SearchBar

ICON: Chỉ dùng lucide-react, size 16/20/24px, stroke 1.5
SPACING: Bội số 4px. Padding card mặc định: p-4. Padding section: p-6.
TAILWIND: text-neutral-900/700/500, bg-neutral-50/100, rounded-lg/xl

QUY TẮC BẮT BUỘC:
  1. KHÔNG dùng inline style={{ }}
  2. KHÔNG hardcode màu hex — dùng Tailwind token hoặc CSS var
  3. KHÔNG import component ngoài danh sách trên
  4. PHẢI handle đủ 4 state: loading / error / empty / success
  5. PHẢI dùng "Plus Jakarta Sans" cho toàn bộ text
  6. Event handler prefix: handle* (handleSubmit, handleDelete...)
  7. File name: PascalCase cho component (EventCard.jsx)
  8. Props destructure ngay trong function signature

OUTPUT FORMAT:
  1. Component code (JSX đầy đủ)
  2. Props list (tên, kiểu, mô tả, default)
  3. Usage example (import + render)
  Không giải thích thêm nếu không được hỏi.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[COMPONENT REQUEST — ĐIỀN VÀO ĐÂY]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tên component:    [Ví dụ: EventCard]
File path:        [Ví dụ: src/features/events/components/EventCard.jsx]
Chức năng:        [Mô tả ngắn]

Dữ liệu hiển thị:
  - [field 1: tên — kiểu dữ liệu]
  - [field 2: ...]

Actions người dùng có thể làm:
  - [Ví dụ: Click để xem detail → navigate đến /events/:id]
  - [Ví dụ: Click nút Edit → gọi onEdit(id)]
  - [Ví dụ: Click nút Delete → mở ConfirmDialog rồi gọi onDelete(id)]

States cần handle:
  - loading: [mô tả skeleton/spinner]
  - error: [message gì]
  - empty: [text hiển thị khi không có data]
  - success: [layout chính]

Responsive:
  - Mobile: [ví dụ: 1 cột, ẩn bớt field]
  - Desktop: [ví dụ: grid 3 cột]

Ghi chú thêm:
  - [Bất kỳ yêu cầu đặc biệt nào]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## PHẦN 6 — VÍ DỤ PROMPT ĐÃ ĐIỀN (Tham khảo)

```
[COMPONENT REQUEST]
Tên component:    EventCard
File path:        src/features/events/components/EventCard.jsx
Chức năng:        Card hiển thị tóm tắt 1 sự kiện trong danh sách

Dữ liệu hiển thị:
  - title: string (tên sự kiện)
  - date: string ISO (ngày diễn ra)
  - location: string (địa điểm)
  - status: "upcoming" | "ongoing" | "ended" | "cancelled"
  - coverImage: string (URL ảnh, có thể null)
  - attendeeCount: number

Actions người dùng có thể làm:
  - Click card → navigate đến /events/:id
  - Click nút Edit (icon) → gọi onEdit(id)
  - Click nút Delete (icon) → mở ConfirmDialog rồi gọi onDelete(id)

States cần handle:
  - loading: Skeleton 3 dòng, không cần ảnh
  - success: Layout đầy đủ

Responsive:
  - Mobile: Full width, ảnh cover 160px height
  - Desktop: Giữ nguyên width do parent là grid

Ghi chú thêm:
  - Badge status dùng màu semantic: upcoming=info, ongoing=success,
    ended=default, cancelled=danger
  - Format date ra "DD/MM/YYYY" dùng util formatDate từ src/utils/
```

---

## PHẦN 7 — REVIEW CHECKLIST (Trước khi merge)

```
□ Dùng đúng font "Plus Jakarta Sans"?
□ Không có inline style={{ }}?
□ Không hardcode màu hex?
□ Import icon từ lucide-react, đúng size?
□ Handle đủ loading / error / empty / success?
□ Props có default value hoặc documented?
□ Event handler đặt tên handle*?
□ File đặt tên PascalCase?
□ Không import component ngoài inventory?
□ Responsive đúng theo yêu cầu?
```

---

*Cập nhật lần cuối: 2025 — EventFlow Design System v1.0*
