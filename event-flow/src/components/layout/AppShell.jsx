import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bell, Building2, Check, CheckCheck, ChevronRight, GraduationCap, Info, Inbox, LogOut, Network, RefreshCw, Rocket, UserCircle, Users, X } from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

import { notificationApi } from '../../api'
import useAutoReload from '../../hooks/useAutoReload'
import useAuthStore from '../../store/authStore'
import { getErrorMessage } from '../../utils'
import { formatDateTime } from '../../utils/dateFormat'
import EmptyState from './EmptyState'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'

const navItems = [
  { to: '/organizations', label: 'Workspaces', icon: Building2 },
  { to: '/about', label: 'About us', icon: Info },
  { to: '/profile', label: 'Profile', icon: UserCircle },
]

function AppShell() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [notifications, setNotifications] = useState([])
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  const [notificationError, setNotificationError] = useState(null)
  const [markingNotificationId, setMarkingNotificationId] = useState(null)
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)
  const notificationRef = useRef(null)

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications]
  )

  const handleLoadNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoadingNotifications(true)
      setNotificationError(null)
    }

    try {
      const data = await notificationApi.getAll()
      setNotifications((Array.isArray(data) ? data : []).map(normalizeNotification))
    } catch (err) {
      if (!silent) setNotificationError(getErrorMessage(err))
    } finally {
      if (!silent) setIsLoadingNotifications(false)
    }
  }, [])

  useEffect(() => {
    handleLoadNotifications()
  }, [handleLoadNotifications])

  useAutoReload(() => handleLoadNotifications({ silent: true }), { intervalMs: 15000 })

  useEffect(() => {
    function handleClickOutside(event) {
      if (!notificationRef.current?.contains(event.target)) {
        setIsNotificationOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  async function handleMarkRead(notification) {
    if (!notification?.id || notification.readAt) return

    setMarkingNotificationId(notification.id)
    setNotificationError(null)

    try {
      const updated = normalizeNotification(await notificationApi.markRead(notification.id))
      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, ...updated } : item))
      )
    } catch (err) {
      setNotificationError(getErrorMessage(err))
    } finally {
      setMarkingNotificationId(null)
    }
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0) return

    setIsMarkingAllRead(true)
    setNotificationError(null)

    try {
      await notificationApi.markAllRead()
      await handleLoadNotifications()
    } catch (err) {
      setNotificationError(getErrorMessage(err))
    } finally {
      setIsMarkingAllRead(false)
    }
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
            <NotificationBell
              refObject={notificationRef}
              notifications={notifications}
              unreadCount={unreadCount}
              isOpen={isNotificationOpen}
              isLoading={isLoadingNotifications}
              error={notificationError}
              markingNotificationId={markingNotificationId}
              isMarkingAllRead={isMarkingAllRead}
              onToggle={() => setIsNotificationOpen((current) => !current)}
              onClose={() => setIsNotificationOpen(false)}
              onRefresh={handleLoadNotifications}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
            />
            <Link to="/profile" className="flex min-w-0 items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 hover:border-primary/40 hover:bg-primary-bg">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary-bg text-secondary">
                <Users size={16} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-neutral-900">
                  {user?.userName || user?.email || 'Đã đăng nhập'}
                </p>
                <p className="truncate text-xs text-neutral-500">Workspace đã xác thực</p>
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

function NotificationBell({
  refObject,
  notifications,
  unreadCount,
  isOpen,
  isLoading,
  error,
  markingNotificationId,
  isMarkingAllRead,
  onToggle,
  onClose,
  onRefresh,
  onMarkRead,
  onMarkAllRead,
}) {
  return (
    <div ref={refObject} className="relative shrink-0">
      <button
        type="button"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 shadow-sm transition hover:border-primary/40 hover:bg-primary-bg hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        onClick={onToggle}
        aria-label="Thông báo"
        title="Thông báo"
      >
        <Bell size={19} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-bold leading-none text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-12 z-50 w-[calc(100vw-32px)] max-w-md overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg sm:w-[420px]">
          <div className="flex items-center justify-between gap-3 border-b border-neutral-100 bg-neutral-50 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-neutral-900">Thông báo</p>
              <p className="text-xs text-neutral-500">
                {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Không có thông báo chưa đọc'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 transition hover:bg-white hover:text-neutral-900"
                onClick={onRefresh}
                title="Tải lại thông báo"
                aria-label="Tải lại thông báo"
                disabled={isLoading}
              >
                {isLoading ? <Spinner size="sm" /> : <RefreshCw size={16} />}
              </button>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 transition hover:bg-white hover:text-neutral-900"
                onClick={onClose}
                title="Đóng thông báo"
                aria-label="Đóng thông báo"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {error ? (
            <div className="border-b border-danger/20 bg-danger-bg px-4 py-3 text-sm font-medium text-danger">
              {error}
            </div>
          ) : null}

          <div className="max-h-[440px] overflow-y-auto p-3">
            {isLoading && notifications.length === 0 ? (
              <div className="flex min-h-[180px] flex-col items-center justify-center gap-3">
                <Spinner />
                <p className="text-sm text-neutral-500">Đang tải thông báo...</p>
              </div>
            ) : notifications.length === 0 ? (
              <EmptyState
                icon={<Inbox size={32} />}
                title="Chưa có thông báo"
                description="Khi có thay đổi quan trọng trong workspace, thông báo sẽ xuất hiện tại đây."
              />
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    isMarkingRead={markingNotificationId === notification.id}
                    onMarkRead={onMarkRead}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-50 px-4 py-3">
            <span className="text-xs text-neutral-500">{notifications.length} thông báo</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<CheckCheck size={15} />}
              loading={isMarkingAllRead}
              disabled={unreadCount === 0}
              onClick={onMarkAllRead}
            >
              Đánh dấu đã đọc
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function NotificationItem({ notification, isMarkingRead, onMarkRead }) {
  const isUnread = !notification.readAt

  return (
    <article className={isUnread ? 'rounded-lg border border-primary/20 bg-primary-bg p-3' : 'rounded-lg border border-neutral-200 bg-white p-3'}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isUnread ? 'info' : 'default'}>{isUnread ? 'Chưa đọc' : 'Đã đọc'}</Badge>
            <Badge variant="default">{getNotificationTypeLabel(notification.type)}</Badge>
          </div>
          <h3 className="mt-2 line-clamp-2 text-sm font-bold text-neutral-900">{notification.title}</h3>
          <p className="mt-1 line-clamp-3 text-sm leading-6 text-neutral-600">{notification.message}</p>
          <p className="mt-2 text-xs font-medium text-neutral-500">{formatDateTime(notification.createdAt)}</p>
        </div>

        {isUnread ? (
          <button
            type="button"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm transition hover:bg-primary hover:text-white"
            onClick={() => onMarkRead(notification)}
            disabled={isMarkingRead}
            title="Đánh dấu thông báo đã đọc"
            aria-label="Đánh dấu thông báo đã đọc"
          >
            {isMarkingRead ? <Spinner size="sm" /> : <Check size={15} />}
          </button>
        ) : null}
      </div>
    </article>
  )
}

function normalizeNotification(notification) {
  return {
    id: notification?.id,
    recipientUserId: notification?.recipientUserId,
    organizationId: notification?.organizationId,
    eventId: notification?.eventId,
    type: notification?.type || 'GENERAL',
    title: notification?.title || 'Thông báo',
    message: notification?.message || '',
    readAt: notification?.readAt || null,
    createdAt: notification?.createdAt || null,
  }
}

function getNotificationTypeLabel(type) {
  const labels = {
    ORGANIZATION_ADDED: 'Workspace',
    ORGANIZATION_INVITATION: 'Lời mời',
    EVENT_ADDED: 'Sự kiện',
    EVENT_STATUS_CHANGED: 'Trạng thái',
    DEPARTMENT_ADDED: 'Phòng ban',
    TEAM_ADDED: 'Đội nhóm',
    TASK_ASSIGNED: 'Công việc',
    ISSUE_ASSIGNED: 'Vấn đề',
    BUDGET_REVIEWED: 'Tài chính',
    BUDGET_REQUEST_APPROVED: 'Tài chính',
    BUDGET_REQUEST_REJECTED: 'Tài chính',
    EXPENSE_REQUEST_SUBMITTED: 'Chi phí',
    EXPENSE_REQUEST_NEEDS_INFO: 'Chi phí',
  }

  return labels[type] || type || 'Chung'
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
