import { Building2, ChevronRight, CreditCard, GraduationCap, Info, LogOut, Network, Rocket, UserCircle, Users } from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

import useAuthStore from '../../store/authStore'
import Button from '../ui/Button'

const navItems = [
  { to: '/organizations', label: 'Tổ chức', icon: Building2 },
  { to: '/subscription', label: 'Gói đăng ký', icon: CreditCard },
  { to: '/about', label: 'About us', icon: Info },
  { to: '/profile', label: 'Profile', icon: UserCircle },
]

function AppShell() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100 text-neutral-700">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-[76px] max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <Link to="/organizations" className="flex min-w-0 items-center gap-3" aria-label="Trang chủ EventFlow">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-sm">
              <Network size={21} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-neutral-900">EventFlow</p>
              <p className="truncate text-xs font-medium text-neutral-500">Nhóm khởi nghiệp EXE - Đại học FPT Hà Nội</p>
            </div>
          </Link>

          <nav className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-1 lg:justify-center" aria-label="Điều hướng chính">
            {navItems.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive
                      ? 'inline-flex h-10 items-center gap-2 rounded-lg bg-neutral-900 px-3 text-sm font-semibold text-white shadow-sm sm:px-4'
                      : 'inline-flex h-10 items-center gap-2 rounded-lg border border-transparent px-3 text-sm font-semibold text-neutral-600 hover:border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900 sm:px-4'
                  }
                >
                  <Icon size={16} />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="flex w-full items-center justify-between gap-3 lg:w-auto lg:justify-end">
            <Link to="/profile" className="flex min-w-0 items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 hover:border-primary/40 hover:bg-primary-bg">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary-bg text-secondary">
                <Users size={16} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-neutral-900">
                  {user?.userName || user?.email || 'Đã đăng nhập'}
                </p>
                <p className="truncate text-xs text-neutral-500">Không gian làm việc đã xác thực</p>
              </div>
            </Link>
            <Button variant="secondary" size="sm" leftIcon={<LogOut size={16} />} onClick={handleLogout} className="shrink-0">
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1">
        <Outlet />
      </div>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white">
                  <Network size={16} />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">Nhóm EventFlow</p>
                  <p className="text-xs font-medium text-neutral-500">Đại học FPT Hà Nội - Dự án khởi nghiệp EXE</p>
                </div>
              </div>
              <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
                Chúng tôi là một nhóm khởi nghiệp EXE của Trường Đại học FPT Hà Nội, xây dựng EventFlow để hỗ trợ quản lý nội bộ sự kiện, đội nhóm, lịch trình và công việc vận hành.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm text-neutral-600 sm:grid-cols-3">
              <FooterSignal icon={<Rocket size={16} />} label="Dự án" value="EventFlow" />
              <FooterSignal icon={<GraduationCap size={16} />} label="Đơn vị" value="FPT Hà Nội" />
              <FooterSignal icon={<Building2 size={16} />} label="Chương trình" value="EXE" />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-neutral-100 pt-4 text-xs text-neutral-500 md:flex-row md:items-center md:justify-between">
            <p>© 2026 Nhóm EventFlow - Đại học FPT Hà Nội.</p>
            <div className="flex flex-wrap items-center gap-2">
              <span>Nhóm khởi nghiệp EXE</span>
              <ChevronRight size={14} />
              <span>Quản lý sự kiện nội bộ</span>
              <ChevronRight size={14} />
              <span>Phát triển bởi EventFlow</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FooterSignal({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
      <span className="text-primary">{icon}</span>
      <span>
        <span className="block text-xs font-medium text-neutral-500">{label}</span>
        <span className="block font-semibold text-neutral-900">{value}</span>
      </span>
    </div>
  )
}

export default AppShell
