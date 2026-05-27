import { Pencil, Plus } from 'lucide-react'

import FormField from '../../components/form/FormField'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import { sessionStatusLabels, sessionStatusOptions } from './checkInConstants'

function CheckInSessionForm({ form, errors, editingSession, isSubmitting, onChange, onCancel, onSubmit }) {
  return (
    <form className="mb-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FormField label="Tên phiên" required error={errors.name}>
          <Input name="name" value={form.name} onChange={onChange} error={errors.name} placeholder="Cổng check-in chính" />
        </FormField>
        <FormField label="Địa điểm" error={errors.location}>
          <Input name="location" value={form.location} onChange={onChange} error={errors.location} placeholder="Sảnh A" />
        </FormField>
        <FormField label="Bắt đầu" error={errors.startTime}>
          <Input name="startTime" type="datetime-local" value={form.startTime} onChange={onChange} error={errors.startTime} />
        </FormField>
        <FormField label="Kết thúc" error={errors.endTime}>
          <Input name="endTime" type="datetime-local" value={form.endTime} onChange={onChange} error={errors.endTime} />
        </FormField>
        <FormField label="Trạng thái" required error={errors.status}>
          <Select name="status" value={form.status} onChange={onChange} error={errors.status}>
            {sessionStatusOptions.map((status) => (
              <option key={status} value={status}>
                {sessionStatusLabels[status]} ({status})
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Mô tả" error={errors.description}>
          <Textarea
            name="description"
            value={form.description}
            onChange={onChange}
            error={errors.description}
            placeholder="Ghi chú phạm vi phiên, cổng check-in, nhân sự phụ trách..."
          />
        </FormField>
      </div>
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Hủy
        </Button>
        <Button type="submit" loading={isSubmitting} leftIcon={editingSession ? <Pencil size={16} /> : <Plus size={16} />}>
          {editingSession ? 'Lưu thay đổi' : 'Tạo phiên'}
        </Button>
      </div>
    </form>
  )
}

export default CheckInSessionForm
