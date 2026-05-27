import { UserPlus } from 'lucide-react'

import FormField from '../../components/form/FormField'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import { attendeeGuestTypeOptions } from './checkInConstants'

function CheckInAttendeeForm({ form, errors, isSubmitting, disabled, onChange, onSubmit }) {
  return (
    <form className="rounded-xl border border-neutral-200 p-4" onSubmit={onSubmit}>
      <div className="mb-4 flex items-center gap-2">
        <UserPlus size={18} className="text-primary" />
        <h3 className="text-sm font-bold uppercase text-neutral-900">Thêm người tham dự</h3>
      </div>
      {errors.session ? <p className="mb-3 text-sm font-medium text-danger">{errors.session}</p> : null}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <FormField label="Họ tên" required error={errors.fullName}>
          <Input name="fullName" value={form.fullName} onChange={onChange} error={errors.fullName} placeholder="Nguyễn Văn A" disabled={disabled} />
        </FormField>
        <FormField label="Email" error={errors.email}>
          <Input name="email" type="email" value={form.email} onChange={onChange} error={errors.email} placeholder="abc@example.com" disabled={disabled} />
        </FormField>
        <FormField label="Số điện thoại" error={errors.phone}>
          <Input name="phone" value={form.phone} onChange={onChange} error={errors.phone} placeholder="090..." disabled={disabled} />
        </FormField>
        <FormField label="Chức danh" error={errors.jobTitle}>
          <Input name="jobTitle" value={form.jobTitle} onChange={onChange} error={errors.jobTitle} placeholder="Giám đốc vận hành" disabled={disabled} />
        </FormField>
        <FormField label="Công ty/đơn vị" error={errors.companyName}>
          <Input name="companyName" value={form.companyName} onChange={onChange} error={errors.companyName} placeholder="EventFlow Co." disabled={disabled} />
        </FormField>
        <FormField label="Phòng ban" error={errors.departmentName}>
          <Input name="departmentName" value={form.departmentName} onChange={onChange} error={errors.departmentName} placeholder="Marketing, CSR..." disabled={disabled} />
        </FormField>
        <FormField label="Nhóm khách" error={errors.guestType}>
          <Select name="guestType" value={form.guestType} onChange={onChange} error={errors.guestType} disabled={disabled}>
            {attendeeGuestTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="lg:col-span-2">
          <FormField label="Ghi chú" error={errors.note}>
            <Textarea name="note" value={form.note} onChange={onChange} error={errors.note} placeholder="Nhu cầu đón tiếp, lưu ý an ninh, người liên hệ..." disabled={disabled} rows={3} />
          </FormField>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button type="submit" loading={isSubmitting} disabled={disabled} leftIcon={<UserPlus size={16} />}>
          Thêm và sinh mã
        </Button>
      </div>
    </form>
  )
}

export default CheckInAttendeeForm
