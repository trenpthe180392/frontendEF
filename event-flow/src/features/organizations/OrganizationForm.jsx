import { Plus, X } from 'lucide-react'

import FormField from '../../components/form/FormField'
import Card from '../../components/layout/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import { organizationTypes } from './organizationConstants'

function OrganizationForm({
  form,
  errors,
  isSubmitting,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <Card
      title="Tạo tổ chức"
      headerRight={
        <Button type="button" variant="ghost" size="sm" leftIcon={<X size={14} />} onClick={onCancel}>
          Đóng
        </Button>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <FormField label="Tên tổ chức" required error={errors.organizationName}>
          <Input
            name="organizationName"
            value={form.organizationName}
            onChange={onChange}
            error={errors.organizationName}
            placeholder="Nhập tên tổ chức"
          />
        </FormField>

        <FormField label="Loại tổ chức" required error={errors.type}>
          <Select name="type" value={form.type} onChange={onChange} error={errors.type}>
            {organizationTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Số điện thoại" required error={errors.phone}>
            <Input
              name="phone"
              value={form.phone}
              onChange={onChange}
              error={errors.phone}
              placeholder="090..."
            />
          </FormField>

          <FormField label="Email" required error={errors.email}>
            <Input
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              error={errors.email}
              placeholder="contact@example.com"
            />
          </FormField>
        </div>

        <FormField label="Mô tả" required error={errors.description}>
          <Textarea
            name="description"
            value={form.description}
            onChange={onChange}
            error={errors.description}
            placeholder="Mô tả ngắn về tổ chức"
          />
        </FormField>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" loading={isSubmitting} leftIcon={<Plus size={16} />}>
            Tạo tổ chức
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default OrganizationForm
