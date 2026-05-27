import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Building2, Image, RefreshCw, Trash2, Upload } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { organizationBrandingApi } from '../api'
import { getApiMessage, unwrapResponse } from '../api/response'
import AlertBanner from '../components/feedback/AlertBanner'
import ConfirmDialog from '../components/feedback/ConfirmDialog'
import SubscriptionGateBanner from '../components/feedback/SubscriptionGateBanner'
import Card from '../components/layout/Card'
import EmptyState from '../components/layout/EmptyState'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import OrganizationCaseLayout from '../features/organizations/OrganizationCaseLayout'
import { getOrganizationBrandingPolicy, getOrganizationPermissions } from '../features/organizations/organizationPermissions'
import { cn, getErrorMessage, isSubscriptionGateError } from '../utils'

const allowedLogoTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const maxLogoSizeBytes = 2 * 1024 * 1024

function OrganizationBrandingPage() {
  const [layoutError, setLayoutError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <OrganizationCaseLayout error={layoutError} successMessage={successMessage} onError={setLayoutError}>
      {(organization, context) => (
        <OrganizationBrandingContent
          organization={organization}
          onError={setLayoutError}
          onSuccess={setSuccessMessage}
          permissions={context.permissions}
        />
      )}
    </OrganizationCaseLayout>
  )
}

function OrganizationBrandingContent({
  organization,
  onError,
  onSuccess,
  permissions = getOrganizationPermissions('MEMBER'),
}) {
  const { organizationId } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [branding, setBranding] = useState(null)
  const [error, setError] = useState(null)
  const [errorDetail, setErrorDetail] = useState(null)
  const [fileError, setFileError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const logoUrl = branding?.logoUrl || ''
  const hasLogo = Boolean(logoUrl)
  const hasSubscriptionGateError = isSubscriptionGateError(errorDetail)
  const brandingPolicy = getOrganizationBrandingPolicy(permissions)

  const loadBranding = useCallback(async () => {
    if (!brandingPolicy.canManageBranding) return

    setIsLoading(true)
    setError(null)
    setErrorDetail(null)
    setFileError(null)

    try {
      const response = await organizationBrandingApi.get(organizationId)
      setBranding(normalizeBranding(unwrapResponse(response), organization))
    } catch (err) {
      setErrorDetail(err)
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [brandingPolicy.canManageBranding, organization, organizationId])

  useEffect(() => {
    if (!brandingPolicy.canManageBranding) {
      navigate(`/organizations/${organizationId}`, { replace: true })
      return
    }

    loadBranding()
  }, [brandingPolicy.canManageBranding, loadBranding, navigate, organizationId])

  function handleChooseLogo() {
    fileInputRef.current?.click()
  }

  async function handleLogoChange(event) {
    if (!brandingPolicy.canManageBranding) return

    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return
    if (!validateLogoFile(file)) return

    setIsUploading(true)
    setError(null)
    setErrorDetail(null)
    setFileError(null)
    onError(null)
    onSuccess(null)

    try {
      const response = await organizationBrandingApi.uploadLogo(organizationId, file)
      const nextBranding = normalizeBranding(unwrapResponse(response), organization)
      setBranding(nextBranding)
      onSuccess(getApiMessage(response, nextBranding.message || 'Đã cập nhật logo workspace'))
      await loadBranding()
    } catch (err) {
      setErrorDetail(err)
      if (!isSubscriptionGateError(err)) {
        setError(getErrorMessage(err))
      }
    } finally {
      setIsUploading(false)
    }
  }

  function validateLogoFile(file) {
    if (!allowedLogoTypes.includes(file.type)) {
      setFileError('Chỉ hỗ trợ PNG, JPEG, WEBP hoặc SVG.')
      return false
    }

    if (file.size > maxLogoSizeBytes) {
      setFileError('Logo cần nhỏ hơn hoặc bằng 2MB.')
      return false
    }

    return true
  }

  async function handleDeleteLogo() {
    if (!brandingPolicy.canManageBranding) return
    if (!hasLogo) return

    setIsDeleting(true)
    setError(null)
    setErrorDetail(null)
    setFileError(null)
    onError(null)
    onSuccess(null)

    try {
      const response = await organizationBrandingApi.deleteLogo(organizationId)
      const nextBranding = normalizeBranding(unwrapResponse(response), organization)
      setBranding(nextBranding)
      onSuccess(getApiMessage(response, nextBranding.message || 'Đã xóa logo workspace'))
      await loadBranding()
    } catch (err) {
      setErrorDetail(err)
      if (!isSubscriptionGateError(err)) {
        setError(getErrorMessage(err))
      }
    } finally {
      setIsDeleting(false)
      setIsDeleteOpen(false)
    }
  }

  if (!brandingPolicy.canManageBranding) return null

  return (
    <div className="space-y-4">
      <PageHeader
        title="Branding workspace"
        subtitle="Quản lý logo hiển thị trong workspace và các trải nghiệm liên quan đến thương hiệu."
        actions={
          <Link
            to={`/organizations/${organizationId}/subscription`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm transition hover:border-primary/40 hover:bg-primary-bg hover:text-primary-dark"
          >
            Billing workspace
            <ArrowUpRight size={16} />
          </Link>
        }
      />

      {hasSubscriptionGateError ? <SubscriptionGateBanner error={errorDetail} organizationId={organizationId} /> : null}
      {!hasSubscriptionGateError && error ? <AlertBanner variant="error" message={error} /> : null}

      {isLoading ? (
        <Card>
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-neutral-500">Đang tải branding workspace...</p>
          </div>
        </Card>
      ) : error && !branding && !hasSubscriptionGateError ? (
        <EmptyState
          icon={<Image size={32} />}
          title="Không thể tải branding"
          description="Vui lòng thử lại hoặc kiểm tra quyền truy cập workspace."
          action={
            <Button type="button" variant="secondary" leftIcon={<RefreshCw size={16} />} onClick={loadBranding}>
              Tải lại
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <Card title="Logo workspace">
            <div className="space-y-4">
              {hasLogo ? (
                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                  <div className="flex min-h-[260px] items-center justify-center p-6">
                    <img
                      src={logoUrl}
                      alt={`Logo ${branding.organizationName}`}
                      className="max-h-56 max-w-full rounded-lg object-contain shadow-sm"
                    />
                  </div>
                  <div className="border-t border-neutral-200 bg-white px-4 py-3">
                    <p className="truncate text-sm font-semibold text-neutral-900">{logoUrl}</p>
                    <p className="mt-1 text-xs text-neutral-500">Logo hiện tại đang được backend trả về cho workspace này.</p>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<Building2 size={32} />}
                  title="Workspace chưa có logo"
                  description="Tải logo lên để đồng bộ nhận diện thương hiệu trong các màn hình workspace."
                />
              )}

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={allowedLogoTypes.join(',')}
                onChange={handleLogoChange}
              />

              <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Tải logo mới</p>
                  <p className={cn('mt-1 text-xs', fileError ? 'text-danger' : 'text-neutral-500')}>
                    {fileError || 'Hỗ trợ PNG, JPEG, WEBP, SVG. Dung lượng tối đa 2MB.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    loading={isUploading}
                    leftIcon={<Upload size={16} />}
                    onClick={handleChooseLogo}
                  >
                    {hasLogo ? 'Đổi logo' : 'Upload logo'}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    disabled={!hasLogo || isUploading || isDeleting}
                    leftIcon={<Trash2 size={16} />}
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    Xóa logo
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Chi tiết branding">
            {branding ? (
              <div className="space-y-3">
                <BrandingDetail label="Workspace" value={branding.organizationName} />
                <BrandingDetail label="Organization ID" value={branding.organizationId} />
                <BrandingDetail label="Trạng thái logo" value={hasLogo ? 'Đã cấu hình' : 'Chưa có logo'} />
                <BrandingDetail label="Backend message" value={branding.message || 'Không có'} />
              </div>
            ) : (
              <EmptyState
                icon={<Image size={32} />}
                title="Chưa có dữ liệu branding"
                description="Branding sẽ hiển thị sau khi backend trả dữ liệu workspace."
              />
            )}
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={isDeleteOpen}
        title="Xóa logo workspace?"
        description="Logo hiện tại sẽ bị gỡ khỏi branding của workspace. Bạn có thể upload lại logo mới sau."
        loading={isDeleting}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteLogo}
      />
    </div>
  )
}

function BrandingDetail({ label, value }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-neutral-900">{value || 'Chưa có'}</p>
    </div>
  )
}

function normalizeBranding(data, organization) {
  return {
    organizationId: data?.organizationId || organization?.id,
    organizationName: data?.organizationName || organization?.organizationName || 'Workspace',
    logoUrl: data?.logoUrl || '',
    message: data?.message || '',
  }
}

export default OrganizationBrandingPage
