import { Building2, Mail, Phone, UserRound } from 'lucide-react'

import Card from '../../components/layout/Card'
import Badge from '../../components/ui/Badge'
import { getOrganizationImage, statusVariant } from './organizationConstants'

function OrganizationInfoPanel({ organization, memberCount = 0, departmentCount = 0 }) {
  const imageUrl = getOrganizationImage(organization)

  return (
    <Card noPadding className="overflow-hidden">
      <div className="relative min-h-[300px] bg-neutral-200">
        <img src={imageUrl} alt={organization.organizationName} className="h-[300px] w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex min-w-0 items-end gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/30 bg-white shadow-lg">
                {organization.logoUrl ? (
                  <img src={organization.logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Building2 size={34} className="text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant[organization.status] || 'default'}>{organization.status}</Badge>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                    {organization.type}
                  </span>
                </div>
                <h2 className="truncate text-3xl font-bold">{organization.organizationName}</h2>
                <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-neutral-100">
                  {organization.description || 'Chưa có mô tả'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-white/20 bg-white/15 px-4 py-3 backdrop-blur">
                <p className="text-2xl font-bold">{memberCount}</p>
                <p className="text-neutral-200">Thành viên</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/15 px-4 py-3 backdrop-blur">
                <p className="text-2xl font-bold">{departmentCount}</p>
                <p className="text-neutral-200">Phòng ban</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 text-sm md:grid-cols-3">
        <div className="rounded-xl bg-neutral-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-neutral-500">
            <Mail size={15} />
            Email
          </div>
          <p className="mt-2 truncate font-semibold text-neutral-900">{organization.email || 'Chưa có'}</p>
        </div>
        <div className="rounded-xl bg-neutral-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-neutral-500">
            <Phone size={15} />
            Số điện thoại
          </div>
          <p className="mt-2 font-semibold text-neutral-900">{organization.phone || 'Chưa có'}</p>
        </div>
        <div className="rounded-xl bg-neutral-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-neutral-500">
            <UserRound size={15} />
            Chủ sở hữu
          </div>
          <p className="mt-2 truncate font-semibold text-neutral-900">{organization.createdByUserName || 'Không rõ'}</p>
        </div>
      </div>
    </Card>
  )
}

export default OrganizationInfoPanel
