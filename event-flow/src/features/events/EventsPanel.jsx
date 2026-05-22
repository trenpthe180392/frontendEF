import { CalendarDays, Eye, EyeOff, MapPin, Pencil, Plus, Trash2, Users, Wallet, X } from 'lucide-react'

import ConfirmDialog from '../../components/feedback/ConfirmDialog'
import FormField from '../../components/form/FormField'
import Card from '../../components/layout/Card'
import EmptyState from '../../components/layout/EmptyState'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import { statusVariant } from '../organizations/organizationConstants'
import { eventTypeOptions, getEventStatusLabel } from './eventConstants'
import { formatCurrency } from '../../utils/dateFormat'

function EventsPanel({
  events,
  eventForm,
  eventErrors,
  editingEvent,
  isEventFormOpen,
  isEventSubmitting,
  eventActionId,
  pendingDeleteEvent,
  pendingCancelEvent,
  onChange,
  onSubmit,
  onCreate,
  onToggleForm,
  onEdit,
  onCancelEdit,
  onCancelEvent,
  onDeleteEvent,
  onViewEvent,
  onCloseDelete,
  onConfirmDelete,
  onCloseCancel,
  onConfirmCancel,
  formatDateTime,
}) {
  const isEditing = Boolean(editingEvent)

  return (
    <>
      <Card
        title="Danh sách sự kiện"
        headerRight={
          <div className="flex flex-wrap gap-2">
            <Button
              variant={isEventFormOpen ? 'secondary' : 'primary'}
              size="sm"
              leftIcon={isEventFormOpen ? <X size={16} /> : <Plus size={16} />}
              onClick={isEditing ? onCancelEdit : isEventFormOpen ? onToggleForm : onCreate}
            >
                {isEventFormOpen ? 'Đóng form' : 'Tạo sự kiện'}
            </Button>
          </div>
        }
      >
        {isEventFormOpen ? (
          <form className="mb-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4" onSubmit={onSubmit}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-neutral-900">{isEditing ? 'Cập nhật sự kiện' : 'Tạo sự kiện'}</h3>
              {isEditing ? (
                <Button type="button" variant="ghost" size="sm" leftIcon={<X size={16} />} onClick={onCancelEdit}>
                  Hủy sửa
                </Button>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FormField label="Tên sự kiện" required error={eventErrors.name}>
                <Input
                  name="name"
                  value={eventForm.name}
                  onChange={onChange}
                  error={eventErrors.name}
                  placeholder="VD: Lễ ra mắt sản phẩm 2026"
                />
              </FormField>

              <FormField label="Loại sự kiện" required error={eventErrors.eventType}>
                <Select name="eventType" value={eventForm.eventType} onChange={onChange} error={eventErrors.eventType}>
                  {eventTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Thời gian bắt đầu" required error={eventErrors.startTime}>
                <Input
                  name="startTime"
                  type="datetime-local"
                  value={eventForm.startTime}
                  onChange={onChange}
                  error={eventErrors.startTime}
                />
              </FormField>

              <FormField label="Thời gian kết thúc" required error={eventErrors.endTime}>
                <Input
                  name="endTime"
                  type="datetime-local"
                  value={eventForm.endTime}
                  onChange={onChange}
                  error={eventErrors.endTime}
                />
              </FormField>

              <FormField label="Mở đăng ký" error={eventErrors.registrationStart}>
                <Input
                  name="registrationStart"
                  type="datetime-local"
                  value={eventForm.registrationStart}
                  onChange={onChange}
                  error={eventErrors.registrationStart}
                />
              </FormField>

              <FormField label="Hạn đăng ký" error={eventErrors.registrationDeadline}>
                <Input
                  name="registrationDeadline"
                  type="datetime-local"
                  value={eventForm.registrationDeadline}
                  onChange={onChange}
                  error={eventErrors.registrationDeadline}
                />
              </FormField>

              <FormField label="Địa điểm" error={eventErrors.location}>
                <Input
                  name="location"
                  value={eventForm.location}
                  onChange={onChange}
                  error={eventErrors.location}
                  placeholder="VD: Gem Center, TP.HCM"
                />
              </FormField>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Sức chứa" error={eventErrors.capacity}>
                  <Input
                    name="capacity"
                    type="number"
                    min="1"
                    value={eventForm.capacity}
                    onChange={onChange}
                    error={eventErrors.capacity}
                    placeholder="300"
                  />
                </FormField>
                <FormField label="Ngân sách dự kiến" error={eventErrors.estimatedBudget}>
                  <Input
                    name="estimatedBudget"
                    type="number"
                    min="0"
                    value={eventForm.estimatedBudget}
                    onChange={onChange}
                    error={eventErrors.estimatedBudget}
                    placeholder="VD: 50000000"
                  />
                </FormField>
              </div>
            </div>

            <FormField label="Mô tả" error={eventErrors.description}>
              <Textarea
                name="description"
                value={eventForm.description}
                onChange={onChange}
                error={eventErrors.description}
                placeholder="Mục tiêu, phạm vi nội bộ, ban phụ trách..."
              />
            </FormField>

            <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4">
              <input
                type="checkbox"
                name="visible"
                checked={eventForm.visible}
                onChange={onChange}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <span>
                <span className="block text-sm font-semibold text-neutral-900">Hiển thị trong hệ thống</span>
                <span className="mt-1 block text-xs leading-5 text-neutral-500">
                  Bật để sự kiện xuất hiện trong không gian làm việc nội bộ. Tắt để ẩn khỏi danh sách vận hành thông thường.
                </span>
              </span>
            </label>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={isEditing ? onCancelEdit : onToggleForm} disabled={isEventSubmitting}>
                Đóng
              </Button>
              <Button type="submit" loading={isEventSubmitting} leftIcon={<Plus size={16} />}>
                {isEditing ? 'Lưu sự kiện' : 'Tạo sự kiện'}
              </Button>
            </div>
          </form>
        ) : null}

        {events.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={24} />}
            title="Chưa có sự kiện"
            description="Tạo sự kiện đầu tiên cho tổ chức này để bắt đầu quản lý lịch, đội nhóm và công việc."
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {events.map((event) => (
              <article
                key={event.eventId}
                className="rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusVariant[event.status] || 'default'}>{getEventStatusLabel(event.status)}</Badge>
                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                          {event.eventType}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                          {event.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                          {event.visible ? 'Công khai' : 'Nội bộ'}
                        </span>
                      </div>
                      <h3 className="mt-3 line-clamp-2 text-xl font-bold leading-tight text-neutral-900">{event.name}</h3>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-bg text-primary">
                      <CalendarDays size={24} />
                    </div>
                  </div>

                  <p className="line-clamp-2 min-h-[40px] text-sm leading-5 text-neutral-600">
                    {event.description || 'Chưa có mô tả'}
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <InfoItem icon={<CalendarDays size={16} />} label="Bắt đầu" value={formatDateTime(event.startTime)} />
                    <InfoItem icon={<CalendarDays size={16} />} label="Kết thúc" value={formatDateTime(event.endTime)} />
                    <InfoItem icon={<MapPin size={16} />} label="Địa điểm" value={event.location || 'Chưa có'} />
                    <InfoItem icon={<Users size={16} />} label="Sức chứa" value={event.capacity || 'Không giới hạn'} />
                  </div>

                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
                    <Wallet size={16} className="text-primary" />
                    <span className="font-medium">Ngân sách dự kiến:</span>
                    <span className="truncate">{formatCurrency(event.estimatedBudget)}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <Button variant="ghost" size="sm" leftIcon={<Eye size={16} />} onClick={() => onViewEvent(event)}>
                      Xem
                    </Button>
                    <Button variant="ghost" size="sm" leftIcon={<Pencil size={16} />} onClick={() => onEdit(event)}>
                      Sửa
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<X size={16} />}
                      loading={eventActionId === `cancel-${event.eventId}`}
                      disabled={event.status === 'cancelled' || event.status === 'deleted'}
                      onClick={() => onCancelEvent(event)}
                    >
                      Hủy event
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Trash2 size={16} />}
                      loading={eventActionId === `delete-${event.eventId}`}
                      onClick={() => onDeleteEvent(event)}
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(pendingCancelEvent)}
        title="Hủy sự kiện"
        description={`Chuyển ${pendingCancelEvent?.name || 'sự kiện'} sang trạng thái Đã hủy? Dữ liệu vẫn được giữ lại, khác với thao tác Xóa.`}
        loading={eventActionId === `cancel-${pendingCancelEvent?.eventId}`}
        onClose={onCloseCancel}
        onConfirm={onConfirmCancel}
      />

      <ConfirmDialog
        open={Boolean(pendingDeleteEvent)}
        title="Xóa sự kiện"
        description={`Xóa ${pendingDeleteEvent?.name || 'sự kiện'} khỏi tổ chức này?`}
        loading={eventActionId === `delete-${pendingDeleteEvent?.eventId}`}
        onClose={onCloseDelete}
        onConfirm={onConfirmDelete}
      />
    </>
  )
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2">
      <span className="text-primary">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs text-neutral-500">{label}</span>
        <span className="block truncate font-semibold text-neutral-900">{value}</span>
      </span>
    </div>
  )
}

export default EventsPanel
