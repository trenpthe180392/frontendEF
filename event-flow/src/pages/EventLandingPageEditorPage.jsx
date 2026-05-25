import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpRight,
  Clipboard,
  FileText,
  Globe2,
  Image,
  Link as LinkIcon,
  Megaphone,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Upload,
} from 'lucide-react'

import { landingPageApi } from '../api'
import AlertBanner from '../components/feedback/AlertBanner'
import ConfirmDialog from '../components/feedback/ConfirmDialog'
import SubscriptionGateBanner from '../components/feedback/SubscriptionGateBanner'
import Card from '../components/layout/Card'
import EmptyState from '../components/layout/EmptyState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import Textarea from '../components/ui/Textarea'
import EventCaseLayout, { EventWorkspaceHeader } from '../features/events/EventCaseLayout'
import { cn, getErrorMessage, getFieldErrors, isSubscriptionGateError } from '../utils'
import { formatDateTime } from '../utils/dateFormat'

const initialForm = {
  slug: '',
  title: '',
  description: '',
  bannerUrl: '',
  themeColor: '#2563eb',
  registrationEnabled: true,
  seoTitle: '',
  seoDescription: '',
}

const allowedBannerTypes = ['image/png', 'image/jpeg', 'image/webp']
const maxBannerSizeBytes = 8 * 1024 * 1024

function EventLandingPageEditorPage() {
  const [layoutError, setLayoutError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <EventCaseLayout error={layoutError} successMessage={successMessage} onError={setLayoutError}>
      {({ eventDetail, organizationId, eventId }) => (
        <EventLandingPageEditorContent
          eventDetail={eventDetail}
          organizationId={organizationId}
          eventId={eventId}
          onError={setLayoutError}
          onSuccess={setSuccessMessage}
        />
      )}
    </EventCaseLayout>
  )
}

function EventLandingPageEditorContent({ eventDetail, organizationId, eventId, onError, onSuccess }) {
  const bannerInputRef = useRef(null)
  const [landingPage, setLandingPage] = useState(null)
  const [form, setForm] = useState(() => createDefaultForm(eventDetail))
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState(null)
  const [errorDetail, setErrorDetail] = useState(null)
  const [infoMessage, setInfoMessage] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [bannerFileError, setBannerFileError] = useState('')
  const [publishAction, setPublishAction] = useState(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [copyMessage, setCopyMessage] = useState('')

  const isPublished = Boolean(landingPage?.published)
  const publicUrl = useMemo(() => buildPublicUrl(form.slug), [form.slug])
  const hasSubscriptionGateError = isSubscriptionGateError(errorDetail)

  const loadLandingPage = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setErrorDetail(null)
    setFieldErrors({})
    setBannerFileError('')
    setInfoMessage(null)

    try {
      const data = await landingPageApi.get(eventId)
      const normalized = normalizeLandingPage(data, eventDetail)
      setLandingPage(normalized)
      setForm(toFormState(normalized, eventDetail))
    } catch (err) {
      const status = err?.response?.status
      const message = getErrorMessage(err)

      if (status === 404 || /not found/i.test(message)) {
        setLandingPage(null)
        setForm(createDefaultForm(eventDetail))
        setInfoMessage('Sự kiện này chưa có landing page. Lưu draft để khởi tạo trang công khai.')
      } else {
        setErrorDetail(err)
        setError(message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [eventDetail, eventId])

  useEffect(() => {
    loadLandingPage()
  }, [loadLandingPage])

  function handleChange(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: '' }))
    if (field === 'bannerUrl') setBannerFileError('')
    setCopyMessage('')
  }

  async function handleBannerChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!landingPage?.id) {
      setBannerFileError('Hãy lưu draft trước khi tải banner lên.')
      return
    }
    if (!allowedBannerTypes.includes(file.type)) {
      setBannerFileError('Chỉ hỗ trợ PNG, JPEG hoặc WEBP.')
      return
    }
    if (file.size > maxBannerSizeBytes) {
      setBannerFileError('Banner cần nhỏ hơn hoặc bằng 8MB.')
      return
    }

    setIsUploadingBanner(true)
    setBannerFileError('')
    setError(null)
    setErrorDetail(null)
    onError(null)
    onSuccess(null)

    try {
      const data = await landingPageApi.uploadBanner(eventId, file)
      const normalized = normalizeLandingPage(data, eventDetail)
      setLandingPage(normalized)
      setForm(toFormState(normalized, eventDetail))
      onSuccess('Đã tải banner lên và tính dung lượng vào storage của gói đăng ký.')
    } catch (err) {
      setErrorDetail(err)
      if (!isSubscriptionGateError(err)) {
        setBannerFileError(getErrorMessage(err))
      }
    } finally {
      setIsUploadingBanner(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextFieldErrors = validateForm(form)
    setFieldErrors(nextFieldErrors)
    if (Object.keys(nextFieldErrors).length > 0) return

    setIsSaving(true)
    setError(null)
    setErrorDetail(null)
    onError(null)
    onSuccess(null)

    try {
      const data = await landingPageApi.update(eventId, buildPayload(form))
      const normalized = normalizeLandingPage(data, eventDetail)
      setLandingPage(normalized)
      setForm(toFormState(normalized, eventDetail))
      setInfoMessage(null)
      onSuccess('Đã lưu draft landing page.')
    } catch (err) {
      setErrorDetail(err)
      setFieldErrors(getFieldErrors(err))
      if (!isSubscriptionGateError(err)) {
        setError(getErrorMessage(err))
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePublishToggle() {
    if (!publishAction) return

    setIsPublishing(true)
    setError(null)
    setErrorDetail(null)
    onError(null)
    onSuccess(null)

    try {
      const data = publishAction === 'publish'
        ? await landingPageApi.publish(eventId)
        : await landingPageApi.unpublish(eventId)
      const normalized = normalizeLandingPage(data, eventDetail)
      setLandingPage(normalized)
      setForm(toFormState(normalized, eventDetail))
      onSuccess(publishAction === 'publish' ? 'Đã publish landing page.' : 'Đã chuyển landing page về draft.')
    } catch (err) {
      setErrorDetail(err)
      if (!isSubscriptionGateError(err)) {
        setError(getErrorMessage(err))
      }
    } finally {
      setIsPublishing(false)
      setPublishAction(null)
    }
  }

  async function handleCopyPublicUrl() {
    if (!publicUrl) return

    try {
      await globalThis.navigator.clipboard.writeText(publicUrl)
      setCopyMessage('Đã copy public URL.')
    } catch {
      setCopyMessage('Không thể copy tự động. Bạn có thể copy URL đang hiển thị.')
    }
  }

  function handleOpenPublicUrl() {
    if (!publicUrl) return
    globalThis.window.open(publicUrl, '_blank', 'noopener,noreferrer')
  }

  const publishDisabled = !landingPage?.id || isSaving || isPublishing

  return (
    <div className="space-y-4">
      <EventWorkspaceHeader
        title="Landing page sự kiện"
        description="Biên tập trang giới thiệu công khai, kiểm soát đăng ký và publish khi nội dung đã sẵn sàng."
        icon={<Megaphone size={24} />}
        actions={
          <>
            <Button type="button" variant="secondary" leftIcon={<RefreshCw size={16} />} onClick={loadLandingPage} disabled={isLoading || isSaving}>
              Tải lại
            </Button>
            <Button
              type="button"
              variant={isPublished ? 'secondary' : 'primary'}
              leftIcon={isPublished ? <ShieldCheck size={16} /> : <Globe2 size={16} />}
              disabled={publishDisabled}
              onClick={() => setPublishAction(isPublished ? 'unpublish' : 'publish')}
            >
              {isPublished ? 'Unpublish' : 'Publish'}
            </Button>
          </>
        }
        stats={[
          { label: 'Trạng thái', value: isPublished ? 'Published' : 'Draft' },
          { label: 'Đăng ký', value: form.registrationEnabled ? 'Đang mở' : 'Đang tắt' },
          { label: 'Slug', value: form.slug || 'Chưa có' },
          { label: 'Cập nhật', value: landingPage?.updateAt ? formatDateTime(landingPage.updateAt) : 'Chưa lưu' },
        ]}
      />

      {hasSubscriptionGateError ? <SubscriptionGateBanner error={errorDetail} organizationId={organizationId} /> : null}
      {infoMessage ? <AlertBanner variant="info" message={infoMessage} /> : null}
      {!hasSubscriptionGateError && error ? <AlertBanner variant="error" message={error} /> : null}
      {copyMessage ? <AlertBanner variant="success" message={copyMessage} /> : null}

      {isLoading ? (
        <Card>
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-neutral-500">Đang tải landing page...</p>
          </div>
        </Card>
      ) : error && !landingPage && !infoMessage && !hasSubscriptionGateError ? (
        <EmptyState
          icon={<FileText size={32} />}
          title="Không thể tải landing page"
          description="Vui lòng thử lại hoặc kiểm tra quyền truy cập sự kiện."
          action={
            <Button type="button" variant="secondary" leftIcon={<RefreshCw size={16} />} onClick={loadLandingPage}>
              Tải lại
            </Button>
          }
        />
      ) : (
        <form className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Card
              title="Trạng thái & public URL"
              headerRight={<Badge variant={isPublished ? 'success' : 'warning'}>{isPublished ? 'Published' : 'Draft'}</Badge>}
            >
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <Field label="Slug" error={fieldErrors.slug} hint="Backend sẽ chuẩn hóa slug khi lưu.">
                  <Input
                    value={form.slug}
                    error={fieldErrors.slug}
                    leftIcon={<LinkIcon size={16} />}
                    placeholder="summer-music-festival"
                    onChange={(event) => handleChange('slug', event.target.value)}
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" leftIcon={<Clipboard size={16} />} disabled={!publicUrl} onClick={handleCopyPublicUrl}>
                    Copy URL
                  </Button>
                  <Button type="button" variant="secondary" leftIcon={<ArrowUpRight size={16} />} disabled={!publicUrl} onClick={handleOpenPublicUrl}>
                    Mở public
                  </Button>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                <p className="break-all text-sm font-semibold text-neutral-900">{publicUrl || 'Nhập slug để tạo public URL'}</p>
                <p className="mt-1 text-xs text-neutral-500">Public route sẽ được hoàn thiện ở phase public landing page.</p>
              </div>
            </Card>

            <Card title="Hero content">
              <div className="space-y-4">
                <Field label="Tiêu đề landing page" error={fieldErrors.title}>
                  <Input
                    value={form.title}
                    error={fieldErrors.title}
                    placeholder={eventDetail.name || 'Tên sự kiện'}
                    onChange={(event) => handleChange('title', event.target.value)}
                  />
                </Field>
                <Field
                  label="Banner"
                  error={fieldErrors.bannerUrl || bannerFileError}
                  hint="Nhập URL ngoài hoặc upload PNG/JPEG/WEBP tối đa 8MB. File upload được tính vào subscription storage."
                >
                  <Input
                    value={form.bannerUrl}
                    error={fieldErrors.bannerUrl}
                    leftIcon={<Image size={16} />}
                    placeholder="https://..."
                    onChange={(event) => handleChange('bannerUrl', event.target.value)}
                  />
                  <input
                    ref={bannerInputRef}
                    type="file"
                    className="hidden"
                    accept={allowedBannerTypes.join(',')}
                    onChange={handleBannerChange}
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      leftIcon={<Upload size={14} />}
                      loading={isUploadingBanner}
                      disabled={!landingPage?.id || isSaving || isPublishing}
                      onClick={() => bannerInputRef.current?.click()}
                    >
                      Upload ảnh
                    </Button>
                  </div>
                </Field>
                <Field label="Theme color" error={fieldErrors.themeColor} hint="Chọn màu trực quan hoặc nhập mã hex. Preview cập nhật ngay.">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="h-10 w-14 cursor-pointer rounded-lg border border-neutral-300 bg-white p-1"
                      value={getThemeColor(form.themeColor)}
                      onChange={(event) => handleChange('themeColor', event.target.value)}
                      aria-label="Chọn theme color"
                    />
                    <Input
                      value={form.themeColor}
                      error={fieldErrors.themeColor}
                      placeholder="#RRGGBB"
                      onChange={(event) => handleChange('themeColor', event.target.value)}
                    />
                  </div>
                </Field>
              </div>
            </Card>

            <Card title="Mô tả sự kiện">
              <Field label="Nội dung mô tả" error={fieldErrors.description}>
                <Textarea
                  value={form.description}
                  error={fieldErrors.description}
                  className="min-h-40"
                  placeholder="Mô tả điểm nổi bật, đối tượng tham dự và giá trị của sự kiện."
                  onChange={(event) => handleChange('description', event.target.value)}
                />
              </Field>
            </Card>

            <Card title="Registration settings">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                  checked={form.registrationEnabled}
                  onChange={(event) => handleChange('registrationEnabled', event.target.checked)}
                />
                <span>
                  <span className="block text-sm font-semibold text-neutral-900">Cho phép đăng ký từ landing page</span>
                  <span className="mt-1 block text-xs leading-5 text-neutral-500">
                    Khi tắt, trang public vẫn có thể hiển thị nội dung nhưng không nhận đăng ký mới.
                  </span>
                </span>
              </label>
            </Card>

            <Card title="SEO">
              <div className="space-y-4">
                <Field label="SEO title" error={fieldErrors.seoTitle}>
                  <Input
                    value={form.seoTitle}
                    error={fieldErrors.seoTitle}
                    leftIcon={<Search size={16} />}
                    placeholder={form.title || eventDetail.name}
                    onChange={(event) => handleChange('seoTitle', event.target.value)}
                  />
                </Field>
                <Field label="SEO description" error={fieldErrors.seoDescription}>
                  <Textarea
                    value={form.seoDescription}
                    error={fieldErrors.seoDescription}
                    placeholder="Mô tả ngắn gọn cho công cụ tìm kiếm và chia sẻ link."
                    onChange={(event) => handleChange('seoDescription', event.target.value)}
                  />
                </Field>
              </div>
            </Card>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={loadLandingPage} disabled={isSaving || isPublishing}>
                Hủy thay đổi
              </Button>
              <Button type="submit" variant="primary" loading={isSaving} leftIcon={<Save size={16} />}>
                Save draft
              </Button>
            </div>
          </div>

          <LandingPreview eventDetail={eventDetail} form={form} isPublished={isPublished} publicUrl={publicUrl} />
        </form>
      )}

      <ConfirmDialog
        open={Boolean(publishAction)}
        title={publishAction === 'publish' ? 'Publish landing page?' : 'Unpublish landing page?'}
        description={
          publishAction === 'publish'
            ? 'Trang public sẽ có thể truy cập bằng slug hiện tại. Hãy chắc chắn nội dung và đăng ký đã sẵn sàng.'
            : 'Trang public sẽ không còn truy cập được cho khách bên ngoài cho đến khi publish lại.'
        }
        loading={isPublishing}
        onClose={() => setPublishAction(null)}
        onConfirm={handlePublishToggle}
      />
    </div>
  )
}

function LandingPreview({ eventDetail, form, isPublished, publicUrl }) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <Card
        title="Preview"
        headerRight={<Badge variant={isPublished ? 'success' : 'warning'}>{isPublished ? 'Public' : 'Draft'}</Badge>}
        noPadding
      >
        <div className="overflow-hidden rounded-b-xl">
          <div className="relative min-h-[220px] bg-neutral-900" style={{ backgroundColor: getThemeColor(form.themeColor) }}>
            {form.bannerUrl ? (
              <img src={form.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 opacity-70" style={{ backgroundColor: getThemeColor(form.themeColor) }} />
            )}
            <div className="absolute inset-0 bg-neutral-950/55" />
            <div className="relative flex min-h-[220px] flex-col justify-end p-5 text-white">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-neutral-800">
                  {eventDetail.eventType || 'Event'}
                </span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
                  {form.registrationEnabled ? 'Registration open' : 'Registration closed'}
                </span>
              </div>
              <h2 className="text-2xl font-bold leading-tight">{form.title || eventDetail.name || 'Untitled event'}</h2>
              <p className="mt-3 line-clamp-4 text-sm leading-6 text-neutral-100">
                {form.description || eventDetail.description || 'Landing page description will appear here.'}
              </p>
            </div>
          </div>
          <div className="space-y-3 bg-white p-4">
            <PreviewRow label="Public URL" value={publicUrl || 'Chưa có slug'} />
            <PreviewRow label="Địa điểm" value={eventDetail.location || 'Chưa có'} />
            <PreviewRow label="Bắt đầu" value={formatDateTime(eventDetail.startTime)} />
            <PreviewRow label="Kết thúc" value={formatDateTime(eventDetail.endTime)} />
            <div className={cn('rounded-xl border p-3', form.registrationEnabled ? 'border-success/20 bg-success-bg' : 'border-warning/20 bg-warning-bg')}>
              <p className={cn('text-sm font-bold', form.registrationEnabled ? 'text-success' : 'text-warning')}>
                {form.registrationEnabled ? 'Form đăng ký đang mở' : 'Form đăng ký đang tắt'}
              </p>
              <p className="mt-1 text-xs leading-5 text-neutral-600">
                Preview này dùng contract hiện có của backend, chưa thêm field ngoài DTO.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Backend contract">
        <div className="space-y-2 text-sm text-neutral-600">
          <PreviewRow label="ID" value={eventDetail.eventId || eventDetail.id || 'Chưa có'} />
          <PreviewRow label="Slug" value={form.slug || 'Chưa có'} />
          <PreviewRow label="SEO title" value={form.seoTitle || 'Chưa có'} />
          <PreviewRow label="SEO description" value={form.seoDescription || 'Chưa có'} />
        </div>
      </Card>
    </aside>
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

function PreviewRow({ label, value }) {
  return (
    <div className="flex gap-3 rounded-lg bg-neutral-50 px-3 py-2">
      <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</span>
      <span className="min-w-0 break-words text-sm font-semibold text-neutral-900">{value || 'Chưa có'}</span>
    </div>
  )
}

function validateForm(form) {
  const errors = {}

  if (!form.slug.trim()) {
    errors.slug = 'Slug không được để trống.'
  }

  if (!form.title.trim()) {
    errors.title = 'Tiêu đề landing page không được để trống.'
  }

  if (form.bannerUrl.trim() && !isLikelyUrl(form.bannerUrl.trim())) {
    errors.bannerUrl = 'Banner URL cần bắt đầu bằng http:// hoặc https://.'
  }

  if (form.themeColor.trim() && !/^#[0-9a-fA-F]{6}$/.test(form.themeColor.trim())) {
    errors.themeColor = 'Theme color cần có dạng #RRGGBB.'
  }

  return errors
}

function buildPayload(form) {
  return {
    slug: form.slug.trim(),
    title: form.title.trim(),
    description: form.description.trim() || null,
    bannerUrl: form.bannerUrl.trim() || null,
    themeColor: form.themeColor.trim() || null,
    registrationEnabled: Boolean(form.registrationEnabled),
    seoTitle: form.seoTitle.trim() || null,
    seoDescription: form.seoDescription.trim() || null,
  }
}

function normalizeLandingPage(data, eventDetail) {
  return {
    id: data?.id ?? null,
    eventId: data?.eventId ?? eventDetail?.eventId ?? eventDetail?.id ?? null,
    slug: data?.slug || '',
    title: data?.title || eventDetail?.name || '',
    description: data?.description || eventDetail?.description || '',
    bannerUrl: data?.bannerUrl || '',
    themeColor: data?.themeColor || initialForm.themeColor,
    published: Boolean(data?.published),
    registrationEnabled: data?.registrationEnabled !== false,
    seoTitle: data?.seoTitle || '',
    seoDescription: data?.seoDescription || '',
    createAt: data?.createAt || null,
    updateAt: data?.updateAt || null,
  }
}

function toFormState(data, eventDetail) {
  const normalized = normalizeLandingPage(data, eventDetail)

  return {
    slug: normalized.slug,
    title: normalized.title,
    description: normalized.description,
    bannerUrl: normalized.bannerUrl,
    themeColor: normalized.themeColor,
    registrationEnabled: normalized.registrationEnabled,
    seoTitle: normalized.seoTitle,
    seoDescription: normalized.seoDescription,
  }
}

function createDefaultForm(eventDetail) {
  const eventName = eventDetail?.name || ''

  return {
    ...initialForm,
    slug: slugify(eventName),
    title: eventName,
    description: eventDetail?.description || '',
    seoTitle: eventName,
    seoDescription: eventDetail?.description || '',
  }
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildPublicUrl(slug) {
  const cleanSlug = String(slug || '').trim()
  if (!cleanSlug) return ''

  return `${globalThis.window.location.origin}/public/events/${cleanSlug}`
}

function isLikelyUrl(value) {
  return /^https?:\/\//i.test(value)
}

function getThemeColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || '').trim()) ? value : initialForm.themeColor
}

export default EventLandingPageEditorPage
