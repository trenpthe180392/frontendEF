import { ArrowRight, Building2, Mail, Search, Users } from 'lucide-react'

import Card from '../../components/layout/Card'
import EmptyState from '../../components/layout/EmptyState'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import { getOrganizationImage, statusVariant } from './organizationConstants'

function OrganizationList({
  organizations,
  isLoading,
  query,
  onQueryChange,
  onOpenOrganization,
}) {
  return (
    <Card
      title="Danh sách tổ chức"
      headerRight={<span className="text-sm font-medium text-neutral-500">{organizations.length} kết quả</span>}
    >
      <div className="mb-5">
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Tìm theo tên, email, số điện thoại..."
          leftIcon={<Search size={16} />}
        />
      </div>

      {isLoading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : organizations.length === 0 ? (
        <EmptyState
          icon={<Building2 size={24} />}
          title="Chưa có tổ chức"
          description="Tạo tổ chức đầu tiên để bắt đầu quản lý dữ liệu."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {organizations.map((organization) => {
            const imageUrl = getOrganizationImage(organization)

            return (
              <article
                key={organization.id}
                className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative h-40 overflow-hidden bg-neutral-200">
                  <img
                    src={imageUrl}
                    alt={organization.organizationName}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-neutral-950/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/30 bg-white shadow-sm">
                        {organization.logoUrl ? (
                          <img src={organization.logoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Building2 size={22} className="text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold text-white">{organization.organizationName}</h3>
                        <p className="mt-0.5 truncate text-xs font-medium text-neutral-200">{organization.type}</p>
                      </div>
                    </div>
                    <Badge variant={statusVariant[organization.status] || 'default'}>{organization.status}</Badge>
                  </div>
                </div>

                <div className="p-4">
                  <p className="line-clamp-2 min-h-[40px] text-sm leading-5 text-neutral-700">
                    {organization.description || 'Chưa có mô tả'}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-neutral-50 p-3">
                      <p className="text-xl font-bold text-neutral-900">{organization.memberCount}</p>
                      <p className="mt-1 text-xs text-neutral-500">Thành viên</p>
                    </div>
                    <div className="rounded-xl bg-neutral-50 p-3">
                      <p className="text-xl font-bold text-neutral-900">{organization.departmentCount}</p>
                      <p className="mt-1 text-xs text-neutral-500">Phòng ban</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-neutral-500">
                    <div className="flex items-center gap-2">
                      <Mail size={15} />
                      <span className="truncate">{organization.email || 'Chưa có email'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={15} />
                      <span className="truncate">Chủ sở hữu: {organization.createdByUserName}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onOpenOrganization(organization)}
                    >
                      <span className="inline-flex items-center gap-2">
                        Xem chi tiết
                        <ArrowRight size={15} />
                      </span>
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </Card>
  )
}

export default OrganizationList
