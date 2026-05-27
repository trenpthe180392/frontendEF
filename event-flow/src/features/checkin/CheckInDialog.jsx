import { CheckCircle2, QrCode, X } from 'lucide-react'

import FormField from '../../components/form/FormField'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'

function CheckInDialog({ open, session, attendee, form, errors, result, isSubmitting, onChange, onClose, onSubmit }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 p-5">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Check-in người tham dự</h2>
            <p className="mt-1 text-sm text-neutral-500">{session?.name || 'Chưa chọn phiên'}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" leftIcon={<X size={16} />} onClick={onClose}>
            Đóng
          </Button>
        </div>

        <div className="space-y-4 p-5">
          {attendee ? (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="font-semibold text-neutral-900">{attendee.fullName}</p>
              <p className="mt-1 text-sm text-neutral-600">{attendee.email || 'Chưa có email'} - {attendee.phone || 'Chưa có số điện thoại'}</p>
              <p className="mt-2 font-mono text-xs font-bold text-neutral-700">{attendee.inviteCode}</p>
            </div>
          ) : null}

          {errors.session ? <p className="text-sm font-medium text-danger">{errors.session}</p> : null}

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
              <FormField label="Cách check-in">
                <Select name="lookupType" value={form.lookupType} onChange={onChange}>
                  <option value="inviteCode">Nhập mã mời</option>
                  <option value="qrToken">Quét QR khách</option>
                </Select>
              </FormField>
              <FormField label={form.lookupType === 'qrToken' ? 'Dữ liệu QR' : 'Mã mời'} required error={errors.lookupValue}>
                <Input
                  name="lookupValue"
                  value={form.lookupValue}
                  onChange={onChange}
                  error={errors.lookupValue}
                  placeholder={form.lookupType === 'qrToken' ? 'Dán dữ liệu QR sau khi quét...' : 'Nhập mã mời 6 chữ số'}
                />
              </FormField>
              <div className="md:col-span-2">
                <FormField label="Ghi chú" error={errors.note}>
                  <Textarea name="note" value={form.note} onChange={onChange} error={errors.note} placeholder="Ghi chú ngắn..." />
                </FormField>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" loading={isSubmitting} leftIcon={form.lookupType === 'qrToken' ? <QrCode size={16} /> : <CheckCircle2 size={16} />}>
                Hoàn thành check-in
              </Button>
            </div>
          </form>

          {result ? (
            <div className={result.duplicate ? 'rounded-xl border border-warning/30 bg-warning-bg p-4' : 'rounded-xl border border-success/30 bg-success-bg p-4'}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={result.duplicate ? 'warning' : 'success'}>
                  {result.duplicate ? 'Đã check-in trước đó' : 'Check-in thành công'}
                </Badge>
                <span className="text-sm font-semibold text-neutral-900">{result.message}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default CheckInDialog
