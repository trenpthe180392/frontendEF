import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, Clock, Globe2, Mail, MapPin, Phone, RefreshCw, TriangleAlert, User, Users } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { publicLandingPageApi } from '../api'
import Card from '../components/layout/Card'
import EmptyState from '../components/layout/EmptyState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import { cn, getErrorMessage, getFieldErrors } from '../utils'
import { formatDateTime } from '../utils/dateFormat'

const initialRegistrationForm = {
  fullName: '',
  email: '',
  phone: '',
}

function PublicEventPage() {
  const { slug } = useParams()
  const [eventPage, setEventPage] = useState(null)
  const [registration, setRegistration] = useState(null)
  const [form, setForm] = useState(initialRegistrationForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const normalizedSlug = String(slug || '').trim()
  const registrationState = useMemo(() => getRegistrationState(eventPage, submitError), [eventPage, submitError])

  const loadEvent = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setSubmitError(null)
    setFieldErrors({})

    try {
      if (!normalizedSlug) {
        setEventPage(null)
        setError('Đường dẫn sự kiện không hợp lệ.')
        return
      }

      const data = await publicLandingPageApi.getBySlug(normalizedSlug)
      const normalized = normalizePublicLandingPage(data)
      setEventPage(normalized)
      if (normalized.seoTitle || normalized.title) {
        globalThis.document.title = `${normalized.seoTitle || normalized.title} | EventFlow`
      }
    } catch (err) {
      setEventPage(null)
      setError(getPublicLoadError(err))
    } finally {
      setIsLoading(false)
    }
  }, [normalizedSlug])

  useEffect(() => {
    loadEvent()
  }, [loadEvent])

  function handleChange(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: '' }))
    setSubmitError(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = validateRegistrationForm(form)
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    setSubmitError(null)
    setFieldErrors({})

    try {
      const data = await publicLandingPageApi.register(normalizedSlug, buildRegistrationPayload(form))
      setRegistration(normalizeRegistrationResponse(data, form))
      setForm(initialRegistrationForm)
    } catch (err) {
      setSubmitError(getErrorMessage(err))
      setFieldErrors(getFieldErrors(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-700">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-neutral-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-btn">
              <Globe2 size={18} />
            </span>
            EventFlow
          </Link>
          <Link
            to="/login"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm transition hover:border-primary/40 hover:bg-primary-bg hover:text-primary-dark"
          >
            Đăng nhập
          </Link>
        </div>
      </header>

      {isLoading ? (
        <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl items-center justify-center px-4 py-10 sm:px-6">
          <Card className="w-full">
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-3">
              <Spinner size="lg" />
              <p className="text-sm text-neutral-500">Đang tải trang sự kiện...</p>
            </div>
          </Card>
        </section>
      ) : error && !eventPage ? (
        <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-3xl items-center justify-center px-4 py-10 sm:px-6">
          <EmptyState
            icon={<CalendarDays size={32} />}
            title="Không tìm thấy trang sự kiện"
            description={error}
            action={
              <Button type="button" variant="secondary" leftIcon={<RefreshCw size={16} />} onClick={loadEvent}>
                Tải lại
              </Button>
            }
          />
        </section>
      ) : (
        <section className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 lg:py-8">
          <PublicEventHero eventPage={eventPage} registrationState={registrationState} />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-5">
              <Card title="Thông tin sự kiện">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoTile icon={<CalendarDays size={18} />} label="Bắt đầu" value={formatDateTime(eventPage.startTime)} />
                  <InfoTile icon={<Clock size={18} />} label="Kết thúc" value={formatDateTime(eventPage.endTime)} />
                  <InfoTile icon={<MapPin size={18} />} label="Địa điểm" value={eventPage.location || 'Chưa có'} />
                  <InfoTile icon={<Users size={18} />} label="Mã sự kiện" value={eventPage.eventId || 'Chưa có'} />
                </div>
              </Card>

              <Card title="Mô tả">
                <div className="space-y-4 text-sm leading-7 text-neutral-700">
                  {eventPage.description ? <p className="whitespace-pre-wrap">{eventPage.description}</p> : null}
                  {eventPage.eventDescription && eventPage.eventDescription !== eventPage.description ? (
                    <p className="whitespace-pre-wrap">{eventPage.eventDescription}</p>
                  ) : null}
                  {!eventPage.description && !eventPage.eventDescription ? (
                    <p className="text-neutral-500">Sự kiện này chưa có mô tả công khai.</p>
                  ) : null}
                </div>
              </Card>

              {eventPage.seoDescription ? (
                <Card title="Tóm tắt chia sẻ">
                  <p className="text-sm leading-7 text-neutral-700">{eventPage.seoDescription}</p>
                </Card>
              ) : null}
            </div>

            <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
              <RegistrationPanel
                form={form}
                fieldErrors={fieldErrors}
                isSubmitting={isSubmitting}
                registration={registration}
                registrationState={registrationState}
                submitError={submitError}
                onChange={handleChange}
                onSubmit={handleSubmit}
              />
            </aside>
          </div>
        </section>
      )}
    </main>
  )
}

function PublicEventHero({ eventPage, registrationState }) {
  const themeColor = /^#[0-9a-fA-F]{6}$/.test(eventPage.themeColor || '') ? eventPage.themeColor : '#171717'

  return (
    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="relative min-h-[360px] bg-neutral-900" style={{ backgroundColor: themeColor }}>
        {eventPage.bannerUrl ? (
          <img src={eventPage.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 opacity-80" style={{ backgroundColor: themeColor }} />
        )}
        <div className="absolute inset-0 bg-neutral-950/60" />
        <div className="relative flex min-h-[360px] flex-col justify-end px-5 py-8 text-white sm:px-8">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant={registrationState.variant} className="bg-white/90">
              {registrationState.label}
            </Badge>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              {eventPage.slug}
            </span>
          </div>
          <h1 className="max-w-4xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            {eventPage.title || eventPage.eventName}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-100 sm:text-base">
            {eventPage.description || eventPage.eventDescription || 'Thông tin sự kiện sẽ được cập nhật sớm.'}
          </p>
        </div>
      </div>
    </section>
  )
}

function RegistrationPanel({
  form,
  fieldErrors,
  isSubmitting,
  registration,
  registrationState,
  submitError,
  onChange,
  onSubmit,
}) {
  return (
    <Card title="Đăng ký tham dự">
      {registration ? (
        <div className="rounded-xl border border-success/20 bg-success-bg p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-success shadow-sm">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-success">Đăng ký thành công</p>
              <p className="mt-1 text-sm leading-6 text-neutral-700">
                {registration.message || 'Thông tin đăng ký của bạn đã được ghi nhận.'}
              </p>
              <div className="mt-3 space-y-1 text-xs text-neutral-600">
                <p className="font-semibold text-neutral-900">{registration.fullName}</p>
                <p>{registration.email}</p>
                {registration.phone ? <p>{registration.phone}</p> : null}
              </div>
            </div>
          </div>
        </div>
      ) : registrationState.closed ? (
        <div className={cn('rounded-xl border p-4', registrationState.variant === 'danger' ? 'border-danger/20 bg-danger-bg' : 'border-warning/20 bg-warning-bg')}>
          <p className={cn('text-sm font-bold', registrationState.variant === 'danger' ? 'text-danger' : 'text-warning')}>
            {registrationState.title}
          </p>
          <p className="mt-1 text-sm leading-6 text-neutral-700">{registrationState.description}</p>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          {submitError ? (
            <div className="flex items-start gap-3 rounded-xl border border-danger/20 bg-danger-bg p-3 text-danger">
              <TriangleAlert size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm leading-6">{submitError}</p>
            </div>
          ) : null}
          <Field label="Họ và tên" error={fieldErrors.fullName}>
            <Input
              value={form.fullName}
              error={fieldErrors.fullName}
              leftIcon={<User size={16} />}
              placeholder="Nguyễn Văn A"
              onChange={(event) => onChange('fullName', event.target.value)}
            />
          </Field>
          <Field label="Email" error={fieldErrors.email}>
            <Input
              type="email"
              value={form.email}
              error={fieldErrors.email}
              leftIcon={<Mail size={16} />}
              placeholder="you@example.com"
              onChange={(event) => onChange('email', event.target.value)}
            />
          </Field>
          <Field label="Số điện thoại" error={fieldErrors.phone} hint="Không bắt buộc.">
            <Input
              value={form.phone}
              error={fieldErrors.phone}
              leftIcon={<Phone size={16} />}
              placeholder="090..."
              onChange={(event) => onChange('phone', event.target.value)}
            />
          </Field>
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Gửi đăng ký
          </Button>
        </form>
      )}
    </Card>
  )
}

function InfoTile({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <span className="mt-0.5 text-primary">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</span>
        <span className="mt-1 block break-words text-sm font-bold text-neutral-900">{value}</span>
      </span>
    </div>
  )
}

function Field({ label, error = '', hint = '', children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-neutral-700">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-xs font-medium text-danger">{error}</span> : null}
      {!error && hint ? <span className="mt-1.5 block text-xs text-neutral-500">{hint}</span> : null}
    </label>
  )
}

function normalizePublicLandingPage(data) {
  return {
    eventId: data?.eventId ?? null,
    eventName: data?.eventName || '',
    eventDescription: data?.eventDescription || '',
    location: data?.location || '',
    startTime: data?.startTime || null,
    endTime: data?.endTime || null,
    slug: data?.slug || '',
    title: data?.title || data?.eventName || '',
    description: data?.description || data?.eventDescription || '',
    bannerUrl: data?.bannerUrl || '',
    themeColor: data?.themeColor || '',
    registrationEnabled: data?.registrationEnabled !== false,
    seoTitle: data?.seoTitle || '',
    seoDescription: data?.seoDescription || '',
    capacity: data?.capacity ?? data?.maxCapacity ?? null,
    registeredCount: data?.registeredCount ?? data?.currentRegistrations ?? data?.registrationCount ?? null,
  }
}

function normalizeRegistrationResponse(data, fallbackForm) {
  return {
    id: data?.id ?? null,
    eventId: data?.eventId ?? null,
    fullName: data?.fullName || fallbackForm.fullName,
    email: data?.email || fallbackForm.email,
    phone: data?.phone || fallbackForm.phone,
    createdAt: data?.createdAt || null,
    message: data?.message || 'Registration submitted',
  }
}

function getRegistrationState(eventPage, submitError) {
  if (!eventPage) {
    return {
      label: 'Unavailable',
      title: 'Chưa có dữ liệu đăng ký',
      description: 'Vui lòng tải lại trang.',
      variant: 'default',
      closed: true,
    }
  }

  if (isFullCapacity(eventPage) || isFullCapacityMessage(submitError)) {
    return {
      label: 'Full capacity',
      title: 'Sự kiện đã đủ số lượng',
      description: 'Hiện tại sự kiện không nhận thêm đăng ký mới.',
      variant: 'danger',
      closed: true,
    }
  }

  if (!eventPage.registrationEnabled || isClosedRegistrationMessage(submitError)) {
    return {
      label: 'Registration closed',
      title: 'Đăng ký đang đóng',
      description: 'Ban tổ chức hiện không nhận đăng ký từ landing page này.',
      variant: 'warning',
      closed: true,
    }
  }

  return {
    label: 'Registration open',
    title: 'Đăng ký đang mở',
    description: 'Bạn có thể gửi thông tin đăng ký cho sự kiện này.',
    variant: 'success',
    closed: false,
  }
}

function validateRegistrationForm(form) {
  const errors = {}
  const email = form.email.trim()

  if (!form.fullName.trim()) {
    errors.fullName = 'Vui lòng nhập họ và tên.'
  }

  if (!email) {
    errors.email = 'Vui lòng nhập email.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Email không hợp lệ.'
  }

  return errors
}

function buildRegistrationPayload(form) {
  return {
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim() || null,
  }
}

function getPublicLoadError(error) {
  const status = error?.response?.status
  if (status === 404) {
    return 'Slug không tồn tại, trang chưa publish, hoặc sự kiện đã bị gỡ khỏi public.'
  }

  return getErrorMessage(error, 'Không thể tải trang sự kiện.')
}

function isFullCapacity(eventPage) {
  const capacity = Number(eventPage?.capacity)
  const registeredCount = Number(eventPage?.registeredCount)

  return Number.isFinite(capacity) && capacity > 0 && Number.isFinite(registeredCount) && registeredCount >= capacity
}

function isFullCapacityMessage(message) {
  const text = String(message || '').toLowerCase()
  return text.includes('full') || text.includes('capacity') || text.includes('đủ số lượng') || text.includes('du so luong')
}

function isClosedRegistrationMessage(message) {
  const text = String(message || '').toLowerCase()
  return text.includes('registration is disabled') || text.includes('registration closed') || text.includes('đăng ký đang đóng')
}

export default PublicEventPage
