import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, CheckSquare, Users, Building2,
  AlertCircle, Bell, LogOut, ChevronLeft, Menu, Zap
} from 'lucide-react'
import Avatar from '../ui/Avatar'
import useAuthStore from '../../store/authStore'
import { cn } from '../../utils'

const navItems = [
  { label: 'Dashboard',   icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Sự kiện',     icon: Zap,             path: '/events' },
  { label: 'Công việc',   icon: CheckSquare,     path: '/tasks' },
  { label: 'Lịch',        icon: CalendarDays,    path: '/calendar' },
  { label: 'Teams',       icon: Users,           path: '/teams' },
  { label: 'Tổ chức',     icon: Building2,       path: '/organizations' },
  { label: 'Vấn đề',      icon: AlertCircle,     path: '/issues' },
]

function NavItem({ item, collapsed }) {
  const { pathname } = useLocation()
  const isActive = pathname.startsWith(item.path)
  const Icon = item.icon

  return (
    <Link
      to={item.path}
      title={collapsed ? item.label : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 group',
        isActive
          ? 'bg-primary-bg text-primary'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
      )}
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )
}

function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuthStore()

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      {/* ─── SIDEBAR ──────────────────────────────────── */}
      <aside
        className={cn(
          'flex flex-col bg-white border-r border-neutral-300 transition-all duration-200 shrink-0',
          collapsed ? 'w-16' : 'w-56'
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center h-14 px-4 border-b border-neutral-100', collapsed && 'justify-center')}>
          {collapsed ? (
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Zap size={14} className="text-white" />
              </div>
              <span className="font-bold text-neutral-900 text-base tracking-tight">EventFlow</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Bottom: user + collapse toggle */}
        <div className="border-t border-neutral-100 p-2 flex flex-col gap-1">
          {!collapsed && user && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg">
              <Avatar name={user.fullName || user.username} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-neutral-900 truncate">{user.fullName || user.username}</p>
                <p className="text-xs text-neutral-500 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            title="Đăng xuất"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-500',
              'hover:bg-danger-bg hover:text-danger transition-colors duration-150',
              collapsed && 'justify-center'
            )}
          >
            <LogOut size={16} className="shrink-0" />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-500',
              'hover:bg-neutral-100 hover:text-neutral-900 transition-colors duration-150',
              collapsed && 'justify-center'
            )}
          >
            <ChevronLeft size={16} className={cn('transition-transform', collapsed && 'rotate-180')} />
            {!collapsed && <span>Thu gọn</span>}
          </button>
        </div>
      </aside>

      {/* ─── MAIN ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-neutral-300 flex items-center justify-between px-6 shrink-0">
          <button className="text-neutral-500 hover:text-neutral-700 transition-colors md:hidden">
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </button>
            {user && <Avatar name={user.fullName || user.username} size="sm" />}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppShell
