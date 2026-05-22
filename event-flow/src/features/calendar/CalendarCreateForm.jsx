import { Sparkles, Plus, X } from 'lucide-react'

import FormField from '../../components/form/FormField'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import { calendarStatusOptions } from './calendarUtils'
import { formatDateTime } from '../../utils/dateFormat'

function CalendarCreateForm({
  form,
  errors,
  isSubmitting,
  isSuggesting,
  drafts = [],
  onCancel,
  onChange,
  onSubmit,
  onSuggest,
  onRemoveDraft,
  onCreateDrafts,
}) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" loading={isSuggesting} leftIcon={<Sparkles size={16} />} onClick={onSuggest}>
          Gợi ý AI
        </Button>
        <Button type="submit" variant="primary" size="sm" leftIcon={<Plus size={16} />}>
          Thêm lịch
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-lg border border-neutral-200 bg-white p-4">
          <SectionTitle title="Thông tin lịch" description="Tiêu đề, thời gian và nội dung lịch sẽ tạo." />
          <div className="mt-4 space-y-4">
            <FormField label="Tiêu đề" required error={errors.title}>
              <Input name="title" value={form.title} onChange={onChange} error={errors.title} placeholder="Họp BTC" />
            </FormField>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FormField label="Bắt đầu" required error={errors.startTime}>
                <Input name="startTime" type="datetime-local" value={form.startTime} onChange={onChange} error={errors.startTime} />
              </FormField>
              <FormField label="Kết thúc" required error={errors.endTime}>
                <Input name="endTime" type="datetime-local" value={form.endTime} onChange={onChange} error={errors.endTime} />
              </FormField>
            </div>
            <FormField label="Mô tả">
              <Textarea name="description" value={form.description} onChange={onChange} rows={6} />
            </FormField>
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <SectionTitle title="Thiết lập" description="Trạng thái, hình thức họp và chế độ cả ngày." />
          <div className="mt-4 space-y-4">
            <FormField label="Trạng thái">
              <Select name="status" value={form.status} onChange={onChange}>
                {calendarStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Meeting URL">
              <Input name="meetingUrl" value={form.meetingUrl} onChange={onChange} placeholder="https://..." />
            </FormField>
            <label className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white p-4 text-sm font-medium text-neutral-700">
              <input className="h-4 w-4 accent-primary" type="checkbox" name="allDay" checked={form.allDay} onChange={onChange} />
              Cả ngày
            </label>
          </div>
        </section>
      </div>

      {errors.batch ? <p className="text-sm font-medium text-danger">{errors.batch}</p> : null}
      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionTitle title="Danh sách sẽ tạo" description="Kiểm tra các lịch nháp trước khi lưu hàng loạt." />
          <Badge variant={drafts.length > 0 ? 'info' : 'default'}>{drafts.length} lịch</Badge>
        </div>
        {drafts.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
            Chưa có lịch nháp. Nhập lịch rồi bấm Thêm lịch hoặc dùng Gợi ý AI.
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {drafts.map((draft, index) => (
              <div key={draft.id} className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-neutral-900">{index + 1}. {draft.title}</p>
                    {draft.source === 'AI' ? <Badge variant="info">AI</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs font-medium text-neutral-500">
                    {formatDateTime(draft.startTime)} - {formatDateTime(draft.endTime)} - {draft.status}
                  </p>
                  {draft.description ? <p className="mt-2 text-sm leading-5 text-neutral-600">{draft.description}</p> : null}
                </div>
                <Button type="button" variant="ghost" size="sm" leftIcon={<X size={16} />} onClick={() => onRemoveDraft(draft.id)}>
                  Bỏ
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Hủy
        </Button>
        <Button type="button" loading={isSubmitting} disabled={drafts.length === 0} leftIcon={<Plus size={16} />} onClick={onCreateDrafts}>
          Lưu ({drafts.length})
        </Button>
      </div>
    </form>
  )
}

function SectionTitle({ title, description }) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase text-neutral-900">{title}</h3>
      <p className="mt-1 text-sm leading-5 text-neutral-500">{description}</p>
    </div>
  )
}

export default CalendarCreateForm
