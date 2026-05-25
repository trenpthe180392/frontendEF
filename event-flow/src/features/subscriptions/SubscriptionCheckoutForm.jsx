import { useState } from 'react'
import {
  Building2,
  FileText,
  CheckCircle2
} from 'lucide-react'

import FormField from '../../components/form/FormField'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'

/**
 * @param {object} props
 * @param {Array} props.plans - List of available subscription plans
 * @param {Array} props.events - List of events for optional context
 * @param {Function} props.onSubmit - Submit handler
 * @param {boolean} props.isLoading - Loading state
 * @param {object} props.errors - Field errors from backend
 * @param {object} props.initialValues - Initial form values
 * @param {'checkout'|'upgrade'} props.mode - Form mode
 */
function SubscriptionCheckoutForm({ 
  plans = [], 
  events = [], 
  onSubmit, 
  isLoading = false, 
  errors = {}, 
  initialValues = {},
  mode = 'checkout',
}) {
  const [formData, setFormData] = useState({
    planId: '',
    eventId: '',
    paymentMethod: 'BANK_TRANSFER',
    vatInvoiceRequested: false,
    companyName: '',
    taxCode: '',
    ...initialValues
  })
  const [localErrors, setLocalErrors] = useState({})

  const displayErrors = {
    ...localErrors,
    ...errors,
    planId: errors.planId || errors.targetPlanId || localErrors.planId,
  }
  const hasEventSelector = mode === 'checkout' && events.length > 0
  const showVatFields = mode === 'checkout'

  function handleChange(e) {
    const { name, type, checked, value } = e.target
    setLocalErrors(prev => ({ ...prev, [name]: '' }))
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  function validateForm() {
    const nextErrors = {}

    if (!formData.planId) {
      nextErrors.planId = 'Vui lòng chọn gói dịch vụ'
    }

    if (!formData.paymentMethod) {
      nextErrors.paymentMethod = 'Vui lòng chọn phương thức thanh toán'
    }

    if (showVatFields && formData.vatInvoiceRequested) {
      if (!formData.companyName.trim()) {
        nextErrors.companyName = 'Vui lòng nhập tên công ty'
      }
      if (!formData.taxCode.trim()) {
        nextErrors.taxCode = 'Vui lòng nhập mã số thuế'
      }
    }

    setLocalErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function buildPayload() {
    const payload = {
      planId: Number(formData.planId),
      paymentMethod: formData.paymentMethod,
    }

    if (mode === 'checkout') {
      payload.eventId = formData.eventId ? Number(formData.eventId) : null
      payload.vatInvoiceRequested = Boolean(formData.vatInvoiceRequested)
      payload.companyName = formData.vatInvoiceRequested ? formData.companyName.trim() : null
      payload.taxCode = formData.vatInvoiceRequested ? formData.taxCode.trim() : null
    }

    return payload
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validateForm()) return
    onSubmit(e, buildPayload())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-neutral-900">Thông tin gói workspace</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Chọn gói" required error={displayErrors.planId}>
            <Select
              name="planId"
              value={formData.planId}
              onChange={handleChange}
              error={displayErrors.planId}
              required
            >
              <option value="">-- Chọn gói dịch vụ --</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - {plan.price} {plan.currency || 'VND'}
                </option>
              ))}
            </Select>
          </FormField>

          {hasEventSelector && (
            <FormField label="Sự kiện áp dụng (Tùy chọn)" error={displayErrors.eventId}>
              <Select
                name="eventId"
                value={formData.eventId}
                onChange={handleChange}
                error={displayErrors.eventId}
              >
                <option value="">-- Áp dụng cho toàn workspace --</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </Select>
            </FormField>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-neutral-900">Thanh toán</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Phương thức thanh toán" required error={displayErrors.paymentMethod}>
            <Select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              error={displayErrors.paymentMethod}
              required
            >
              <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
            </Select>
          </FormField>

          {showVatFields && (
            <FormField label="Yêu cầu hóa đơn VAT">
              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  name="vatInvoiceRequested"
                  checked={formData.vatInvoiceRequested}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-neutral-700">Tôi muốn xuất hóa đơn GTGT</span>
              </div>
            </FormField>
          )}
        </div>

        {showVatFields && formData.vatInvoiceRequested && (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Tên công ty" required error={displayErrors.companyName}>
              <Input
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Nhập tên công ty xuất hóa đơn"
                leftIcon={<Building2 size={16} />}
                error={displayErrors.companyName}
                required
              />
            </FormField>
            <FormField label="Mã số thuế" required error={displayErrors.taxCode}>
              <Input
                name="taxCode"
                value={formData.taxCode}
                onChange={handleChange}
                placeholder="Nhập mã số thuế"
                leftIcon={<FileText size={16} />}
                error={displayErrors.taxCode}
                required
              />
            </FormField>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 pt-4 border-t border-neutral-200">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <CheckCircle2 size={14} className="text-success" />
          <span>Cam kết bảo mật thông tin thanh toán</span>
        </div>
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          className="px-8"
        >
          {mode === 'upgrade' ? 'Tiếp tục nâng cấp' : 'Tiến hành thanh toán'}
        </Button>
      </div>
    </form>
  )
}

export default SubscriptionCheckoutForm
