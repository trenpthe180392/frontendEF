import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCw, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import AlertBanner from '../components/feedback/AlertBanner'
import Button from '../components/ui/Button'
import { organizationApi } from '../api'
import { getErrorMessage } from '../utils'
import { normalizeOrganization } from '../utils/organizationMappers'
import OrganizationForm from '../features/organizations/OrganizationForm'
import OrganizationList from '../features/organizations/OrganizationList'
import { defaultForm, organizationHeroImage } from '../features/organizations/organizationConstants'

function OrganizationsPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [data, setData] = useState([])
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState({})
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const filteredOrganizations = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return data

    return data.filter((organization) =>
      [
        organization.organizationName,
        organization.email,
        organization.phone,
        organization.type,
        organization.createdByUserName,
      ].some((value) => String(value || '').toLowerCase().includes(keyword))
    )
  }, [data, query])

  const handleLoadOrganizations = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await organizationApi.getAll()
      setData((response.data || []).map(normalizeOrganization))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    handleLoadOrganizations()
  }, [handleLoadOrganizations])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: null }))
  }

  function validateForm() {
    const nextErrors = {}
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!form.organizationName.trim()) nextErrors.organizationName = 'Vui lòng nhập tên tổ chức'
    if (!form.description.trim()) nextErrors.description = 'Vui lòng nhập mô tả'
    if (!form.type) nextErrors.type = 'Vui lòng chọn loại tổ chức'
    if (!form.phone.trim()) nextErrors.phone = 'Vui lòng nhập số điện thoại'
    if (!form.email.trim()) {
      nextErrors.email = 'Vui lòng nhập email'
    } else if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = 'Email không hợp lệ'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await organizationApi.create({
        organizationName: form.organizationName.trim(),
        description: form.description.trim(),
        type: form.type,
        logoUrl: form.logoUrl.trim() || null,
        phone: form.phone.trim(),
        email: form.email.trim(),
      })
      const created = normalizeOrganization(response.data)
      setData((current) => [created, ...current])
      setForm(defaultForm)
      setErrors({})
      setIsCreateOpen(false)
      setSuccessMessage(response.data?.message || 'Đã tạo tổ chức')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-129px)] bg-neutral-100 p-6 text-neutral-700">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div
            className="relative min-h-[260px] bg-cover bg-center"
            style={{ backgroundImage: `url(${organizationHeroImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/85 via-neutral-950/55 to-neutral-950/10" />
            <div className="relative flex min-h-[260px] flex-col justify-between gap-8 p-6 text-white md:p-8">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-bg">EventFlow workspace</p>
                <h1 className="mt-3 text-3xl font-bold leading-tight md:text-5xl">Tổ chức</h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-100 md:text-base">
                  Tạo, theo dõi và mở nhanh các tổ chức mà tài khoản hiện tại có quyền truy cập.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl border border-white/20 bg-white/15 px-4 py-3 backdrop-blur">
                    <p className="text-2xl font-bold">{data.length}</p>
                    <p className="text-neutral-200">Tổ chức</p>
                  </div>
                  <div className="rounded-xl border border-white/20 bg-white/15 px-4 py-3 backdrop-blur">
                    <p className="text-2xl font-bold">{data.reduce((total, item) => total + item.memberCount, 0)}</p>
                    <p className="text-neutral-200">Thành viên</p>
                  </div>
                  <div className="rounded-xl border border-white/20 bg-white/15 px-4 py-3 backdrop-blur">
                    <p className="text-2xl font-bold">{data.reduce((total, item) => total + item.departmentCount, 0)}</p>
                    <p className="text-neutral-200">Dept</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={isCreateOpen ? 'secondary' : 'primary'}
                    leftIcon={isCreateOpen ? <X size={16} /> : <Plus size={16} />}
                    onClick={() => {
                      setIsCreateOpen((current) => !current)
                      setErrors({})
                    }}
                  >
                    {isCreateOpen ? 'Đóng form' : 'Tạo tổ chức'}
                  </Button>
                  <Button variant="secondary" leftIcon={<RefreshCw size={16} />} onClick={handleLoadOrganizations}>
                    Tải lại
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <AlertBanner variant="error" message={error} />
        <AlertBanner variant="success" message={successMessage} />

        <div className={isCreateOpen ? 'grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]' : 'space-y-4'}>
          {isCreateOpen ? (
            <OrganizationForm
              form={form}
              errors={errors}
              isSubmitting={isSubmitting}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsCreateOpen(false)
                setErrors({})
                setForm(defaultForm)
              }}
            />
          ) : null}
          <OrganizationList
            organizations={filteredOrganizations}
            isLoading={isLoading}
            query={query}
            onQueryChange={setQuery}
            onOpenOrganization={(organization) => navigate(`/organizations/${organization.id}`)}
          />
        </div>
      </div>
    </main>
  )
}

export default OrganizationsPage
