import { useState } from 'react'
import { ArrowLeft, CalendarDays, Plus } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { eventApi } from '../api'
import SubscriptionGateBanner from '../components/feedback/SubscriptionGateBanner'
import FormField from '../components/form/FormField'
import Card from '../components/layout/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import { defaultEventForm, eventTypeOptions } from '../features/events/eventConstants'
import { toEventPayload } from '../features/events/eventMappers'
import { validateEventForm } from '../features/events/eventValidation'
import OrganizationCaseLayout from '../features/organizations/OrganizationCaseLayout'
import { getErrorMessage, getFieldErrors, isSubscriptionGateError } from '../utils'

function EventCreateContent({ organizationId, onError, onSuccess }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(defaultEventForm)
  const [errors, setErrors] = useState({})
  const [subscriptionGateError, setSubscriptionGateError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    const { name, type, checked, value } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setErrors((current) => ({ ...current, [name]: null }))
    setSubscriptionGateError(null)
    onSuccess(null)
  }

  function validateForm() {
    const nextErrors = validateEventForm(form)
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    onError(null)
    onSuccess(null)
    setSubscriptionGateError(null)

    try {
      await eventApi.create(toEventPayload(form, organizationId))
      onSuccess('Đã tạo sự kiện')
      navigate(`/organizations/${organizationId}/events`)
    } catch (err) {
      const fieldErrors = normalizeEventFieldErrors(getFieldErrors(err))
      if (Object.keys(fieldErrors).length > 0) {
        setErrors((current) => ({ ...current, ...fieldErrors }))
        onError(getErrorMessage(err))
      } else if (isSubscriptionGateError(err)) {
        setSubscriptionGateError(err)
      } else {
        onError(getErrorMessage(err))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-bg text-primary">
              <CalendarDays size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Tạo sự kiện</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-500">
                Khởi tạo sự kiện nội bộ với thời gian, địa điểm, sức chứa và ngân sách dự kiến.
              </p>
            </div>
          </div>
          <Button variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate(`/organizations/${organizationId}/events`)}>
            Danh sách sự kiện
          </Button>
        </div>
      </section>

      <SubscriptionGateBanner error={subscriptionGateError} organizationId={organizationId} />

      <Card title="Thông tin sự kiện">
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FormField label="Tên sự kiện" required error={errors.name}>
              <Input name="name" value={form.name} onChange={handleChange} error={errors.name} placeholder="VD: Lễ ra mắt sản phẩm 2026" />
            </FormField>
            <FormField label="Loại sự kiện" required error={errors.eventType}>
              <Select name="eventType" value={form.eventType} onChange={handleChange} error={errors.eventType}>
                {eventTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Thời gian bắt đầu" required error={errors.startTime}>
              <Input name="startTime" type="datetime-local" value={form.startTime} onChange={handleChange} error={errors.startTime} />
            </FormField>
            <FormField label="Thời gian kết thúc" required error={errors.endTime}>
              <Input name="endTime" type="datetime-local" value={form.endTime} onChange={handleChange} error={errors.endTime} />
            </FormField>
            <FormField label="Mở đăng ký" error={errors.registrationStart}>
              <Input name="registrationStart" type="datetime-local" value={form.registrationStart} onChange={handleChange} error={errors.registrationStart} />
            </FormField>
            <FormField label="Hạn đăng ký" error={errors.registrationDeadline}>
              <Input name="registrationDeadline" type="datetime-local" value={form.registrationDeadline} onChange={handleChange} error={errors.registrationDeadline} />
            </FormField>
            <FormField label="Địa điểm" error={errors.location}>
              <Input name="location" value={form.location} onChange={handleChange} placeholder="VD: Gem Center, TP.HCM" />
            </FormField>
            <FormField label="Phạm vi hiển thị" error={errors.permissionScope}>
              <Select name="permissionScope" value={form.permissionScope} onChange={handleChange} error={errors.permissionScope}>
                <option value="ORG">Nội bộ workspace</option>
                <option value="PUBLIC">Công khai qua landing page</option>
                <option value="PRIVATE">Chỉ thành viên được cấp quyền</option>
              </Select>
            </FormField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Sức chứa" error={errors.capacity}>
                <Input name="capacity" type="number" min="1" value={form.capacity} onChange={handleChange} error={errors.capacity} />
              </FormField>
              <FormField label="Ngân sách dự kiến" error={errors.estimatedBudget}>
                <Input name="estimatedBudget" type="number" min="0" value={form.estimatedBudget} onChange={handleChange} error={errors.estimatedBudget} />
              </FormField>
            </div>
          </div>
          <FormField label="Mô tả" error={errors.description}>
            <Textarea name="description" value={form.description} onChange={handleChange} rows={4} />
          </FormField>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <input type="checkbox" name="visible" checked={form.visible} onChange={handleChange} className="h-4 w-4 accent-primary" />
            <span className="text-sm font-semibold text-neutral-900">Hiển thị sự kiện trong danh sách theo phạm vi đã chọn</span>
          </label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => navigate(`/organizations/${organizationId}/events`)}>
              Hủy
            </Button>
            <Button type="submit" loading={isSubmitting} leftIcon={<Plus size={16} />}>
              Tạo sự kiện
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

function normalizeEventFieldErrors(fieldErrors) {
  const nextErrors = { ...fieldErrors }

  if (nextErrors.registrationDeadlineBeforeStartTime) {
    nextErrors.registrationDeadline = nextErrors.registrationDeadlineBeforeStartTime
    delete nextErrors.registrationDeadlineBeforeStartTime
  }

  if (nextErrors.endTimeAfterStartTime) {
    nextErrors.endTime = nextErrors.endTimeAfterStartTime
    delete nextErrors.endTimeAfterStartTime
  }

  return nextErrors
}

function EventCreatePage() {
  const { organizationId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <OrganizationCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {() => (
        <EventCreateContent
          organizationId={Number(organizationId)}
          onError={setError}
          onSuccess={setSuccessMessage}
        />
      )}
    </OrganizationCaseLayout>
  )
}

export default EventCreatePage
