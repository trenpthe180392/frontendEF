import { Building2, CalendarDays, GitBranch, Users } from 'lucide-react'

export const defaultForm = {
  organizationName: '',
  description: '',
  type: 'EVENT',
  logoUrl: '',
  phone: '',
  email: '',
}

export const defaultMemberForm = {
  email: '',
  role: 'MEMBER',
}

export const organizationTypes = [
  { value: 'EVENT', label: 'Sự kiện' },
  { value: 'COMPANY', label: 'Công ty' },
  { value: 'EDUCATION', label: 'Giáo dục' },
  { value: 'COMMUNITY', label: 'Cộng đồng' },
  { value: 'OTHER', label: 'Khác' },
]

export const statusVariant = {
  active: 'success',
  inactive: 'default',
  pending: 'warning',
  accepted: 'success',
  expired: 'danger',
  cancelled: 'danger',
  draft: 'warning',
  published: 'success',
  ongoing: 'success',
  completed: 'default',
  deleted: 'danger',
  suspended: 'danger',
  scheduled: 'info',
  todo: 'default',
  in_progress: 'info',
  in_review: 'warning',
  done: 'success',
}

export const organizationHeroImage =
  'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1800&q=80'

export const organizationImagesByType = {
  EVENT: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
  COMPANY: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
  EDUCATION: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=80',
  COMMUNITY: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80',
  OTHER: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
}

export function getOrganizationImage(organization) {
  return organization.logoUrl || organizationImagesByType[organization.type] || organizationImagesByType.OTHER
}

export const detailTabs = [
  { key: 'info', label: 'Thông tin', icon: Building2 },
  { key: 'members', label: 'Thành viên', icon: Users },
  { key: 'departments', label: 'Phòng ban', icon: GitBranch },
  { key: 'events', label: 'Sự kiện', icon: CalendarDays },
]
