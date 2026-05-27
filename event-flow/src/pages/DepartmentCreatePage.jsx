import { useEffect, useState } from 'react'
import { ArrowLeft, GitBranch, Plus } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { departmentApi } from '../api'
import FormField from '../components/form/FormField'
import Card from '../components/layout/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import { defaultDepartmentForm } from '../features/departments/departmentConstants'
import { normalizeDepartment } from '../features/departments/departmentMappers'
import OrganizationCaseLayout from '../features/organizations/OrganizationCaseLayout'
import { getOrganizationDepartmentPolicy, getOrganizationPermissions } from '../features/organizations/organizationPermissions'
import { getErrorMessage } from '../utils'

function DepartmentCreateContent({
  organizationId,
  onError,
  onSuccess,
  permissions = getOrganizationPermissions('MEMBER'),
}) {
  const navigate = useNavigate()
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState(defaultDepartmentForm)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const departmentPolicy = getOrganizationDepartmentPolicy(permissions)

  useEffect(() => {
    if (!departmentPolicy.canManageDepartments) {
      navigate(`/organizations/${organizationId}/departments`, { replace: true })
      return
    }

    async function loadDepartments() {
      try {
        const response = await departmentApi.getByOrganization(organizationId)
        setDepartments((response.data || []).map(normalizeDepartment))
      } catch (err) {
        onError(getErrorMessage(err))
      }
    }

    loadDepartments()
  }, [departmentPolicy.canManageDepartments, navigate, organizationId, onError])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: null }))
    onSuccess(null)
  }

  function validateForm() {
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Vui lòng nhập tên phòng ban'
    if (!form.description.trim()) nextErrors.description = 'Vui lòng nhập mô tả'
    if (!form.status) nextErrors.status = 'Vui lòng chọn trạng thái'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!departmentPolicy.canManageDepartments) return
    if (!validateForm()) return

    setIsSubmitting(true)
    onError(null)
    onSuccess(null)

    try {
      await departmentApi.create({
        name: form.name.trim(),
        description: form.description.trim(),
        organizationId,
        parentDepartmentId: form.parentDepartmentId ? Number(form.parentDepartmentId) : null,
        status: form.status,
      })
      onSuccess('Đã tạo phòng ban')
      navigate(`/organizations/${organizationId}/departments`)
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!departmentPolicy.canManageDepartments) return null

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-bg text-primary">
              <GitBranch size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Tạo phòng ban</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-500">
                Tạo phòng ban nội bộ để phân tách trách nhiệm vận hành trong tổ chức.
              </p>
            </div>
          </div>
          <Button variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate(`/organizations/${organizationId}/departments`)}>
            Danh sách phòng ban
          </Button>
        </div>
      </section>

      <Card title="Thông tin phòng ban">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FormField label="Tên phòng ban" required error={errors.name}>
              <Input name="name" value={form.name} onChange={handleChange} error={errors.name} placeholder="Ví dụ: Logistics" />
            </FormField>
            <FormField label="Phòng ban cha" error={errors.parentDepartmentId}>
              <Select name="parentDepartmentId" value={form.parentDepartmentId} onChange={handleChange}>
                <option value="">Cấp gốc</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Trạng thái" required error={errors.status}>
              <Select name="status" value={form.status} onChange={handleChange} error={errors.status}>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </FormField>
            <FormField label="Mô tả" required error={errors.description}>
              <Textarea name="description" value={form.description} onChange={handleChange} error={errors.description} rows={4} />
            </FormField>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => navigate(`/organizations/${organizationId}/departments`)}>
              Hủy
            </Button>
            <Button type="submit" loading={isSubmitting} leftIcon={<Plus size={16} />}>
              Tạo phòng ban
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

function DepartmentCreatePage() {
  const { organizationId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <OrganizationCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {(_, context) => (
        <DepartmentCreateContent
          organizationId={Number(organizationId)}
          onError={setError}
          onSuccess={setSuccessMessage}
          permissions={context.permissions}
        />
      )}
    </OrganizationCaseLayout>
  )
}

export default DepartmentCreatePage
