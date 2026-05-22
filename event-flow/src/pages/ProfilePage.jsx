import { Mail, ShieldCheck, UserCircle } from 'lucide-react'

import Card from '../components/layout/Card'
import Badge from '../components/ui/Badge'
import useAuthStore from '../store/authStore'

function ProfilePage() {
  const { user, token } = useAuthStore()
  const tokenUser = decodeJwtPayload(token)
  const profile = {
    userName: user?.userName || tokenUser?.userName || tokenUser?.name || tokenUser?.sub || 'Người dùng EventFlow',
    email: user?.email || tokenUser?.email || 'Chưa có email trong phiên đăng nhập',
    role: user?.role || tokenUser?.role || tokenUser?.authorities || 'Thành viên',
  }

  return (
    <main className="min-h-[calc(100vh-129px)] bg-neutral-100 p-6 text-neutral-700">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-bg text-primary">
                <UserCircle size={34} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-neutral-500">Profile cá nhân</p>
                <h1 className="mt-1 text-2xl font-bold text-neutral-900">{profile.userName}</h1>
                <p className="mt-1 text-sm text-neutral-500">{profile.email}</p>
              </div>
            </div>
            <Badge variant="info">Đã xác thực</Badge>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card title="Thông tin tài khoản">
            <InfoItem icon={<UserCircle size={18} />} label="Tên hiển thị" value={profile.userName} />
            <InfoItem icon={<Mail size={18} />} label="Email" value={profile.email} />
            <InfoItem icon={<ShieldCheck size={18} />} label="Vai trò phiên đăng nhập" value={formatRole(profile.role)} />
          </Card>

          <Card title="Trạng thái truy cập">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-semibold text-neutral-900">Phiên đăng nhập hiện tại</p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Tài khoản đang có quyền truy cập vào workspace. Các quyền chi tiết vẫn phụ thuộc vào tổ chức, sự kiện và đội nhóm mà bạn tham gia.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 border-b border-neutral-100 py-3 last:border-b-0">
      <span className="mt-0.5 text-primary">{icon}</span>
      <span>
        <span className="block text-xs font-bold uppercase text-neutral-500">{label}</span>
        <span className="mt-1 block text-sm font-semibold text-neutral-900">{value}</span>
      </span>
    </div>
  )
}

function formatRole(value) {
  if (Array.isArray(value)) return value.join(', ')
  return String(value || 'Thành viên')
}

function decodeJwtPayload(token) {
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(window.atob(padded))
  } catch {
    return null
  }
}

export default ProfilePage
