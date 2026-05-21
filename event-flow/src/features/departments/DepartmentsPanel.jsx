import { ArrowLeft, CalendarDays, Eye, GitBranch, Plus, Trash2, UserPlus, Users, X } from 'lucide-react'

import FormField from '../../components/form/FormField'
import Card from '../../components/layout/Card'
import EmptyState from '../../components/layout/EmptyState'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import { departmentStatusVariant } from './departmentConstants'

const departmentRoleOptions = [
  { value: 'OWNER', label: 'Chủ phòng ban' },
  { value: 'LEADER', label: 'Trưởng phòng ban' },
  { value: 'MEMBER', label: 'Thành viên' },
]
const departmentRoleLabels = departmentRoleOptions.reduce((labels, role) => {
  labels[role.value] = role.label
  return labels
}, {
  ADMIN: 'Trưởng phòng ban',
  MANAGER: 'Trưởng phòng ban',
})

function DepartmentsPanel({
  departmentForm,
  departmentErrors,
  departments,
  selectedDepartment,
  departmentMembers,
  departmentMemberForm,
  departmentMemberErrors,
  members,
  isDepartmentSubmitting,
  isDepartmentMemberSubmitting,
  loadingDepartmentMembersId,
  removingDepartmentMember,
  isDepartmentCreateOpen,
  onDepartmentChange,
  onCreateDepartment,
  onToggleCreateDepartment,
  onCancelCreateDepartment,
  onOpenDepartment,
  onBackToDepartments,
  onDepartmentMemberChange,
  onAddDepartmentMember,
  onRemoveDepartmentMember,
  formatDateTime,
}) {
  return (
    <Card
      title="Phòng ban"
      headerRight={
        selectedDepartment ? null : (
          <Button
            type="button"
            variant={isDepartmentCreateOpen ? 'secondary' : 'primary'}
            size="sm"
            leftIcon={isDepartmentCreateOpen ? <X size={16} /> : <Plus size={16} />}
            onClick={onToggleCreateDepartment}
          >
            {isDepartmentCreateOpen ? 'Đóng form' : 'Tạo phòng ban'}
          </Button>
        )
      }
    >
      {isDepartmentCreateOpen ? (
        <form className="mb-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4" onSubmit={onCreateDepartment}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FormField label="Tên phòng ban" required error={departmentErrors.name}>
              <Input
                name="name"
                value={departmentForm.name}
                onChange={onDepartmentChange}
                error={departmentErrors.name}
                placeholder="Ví dụ: Logistics"
              />
            </FormField>
            <FormField label="Phòng ban cha" error={departmentErrors.parentDepartmentId}>
              <Select
                name="parentDepartmentId"
                value={departmentForm.parentDepartmentId}
                onChange={onDepartmentChange}
                error={departmentErrors.parentDepartmentId}
              >
                <option value="">Cấp gốc</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Trạng thái" required error={departmentErrors.status}>
              <Select
                name="status"
                value={departmentForm.status}
                onChange={onDepartmentChange}
                error={departmentErrors.status}
              >
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Ngừng hoạt động</option>
              </Select>
            </FormField>
            <FormField label="Mô tả" required error={departmentErrors.description}>
              <Textarea
                name="description"
                value={departmentForm.description}
                onChange={onDepartmentChange}
                error={departmentErrors.description}
                rows={3}
                placeholder="Mô tả nhiệm vụ chính của phòng ban"
              />
            </FormField>
          </div>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onCancelCreateDepartment} disabled={isDepartmentSubmitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              leftIcon={<Plus size={16} />}
              loading={isDepartmentSubmitting}
              disabled={isDepartmentSubmitting}
            >
              Tạo phòng ban
            </Button>
          </div>
        </form>
      ) : null}

      {selectedDepartment ? (
        <div className="space-y-5 border-t border-neutral-200 pt-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<ArrowLeft size={16} />}
                onClick={onBackToDepartments}
              >
                Quay lại phòng ban
              </Button>
              <h3 className="mt-4 text-lg font-semibold text-neutral-900">{selectedDepartment.name}</h3>
              <div className="mt-2">
                <Badge variant={departmentStatusVariant[selectedDepartment.status] || 'default'}>
                  {selectedDepartment.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-neutral-500">
                {selectedDepartment.description || 'Chưa có mô tả'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
              <DepartmentMetric label="Phòng ban cha" value={selectedDepartment.parentDepartmentName || 'Cấp gốc'} icon={<GitBranch size={16} />} />
              <DepartmentMetric label="Thành viên" value={selectedDepartment.memberCount} icon={<Users size={16} />} />
              <DepartmentMetric label="Phòng ban con" value={selectedDepartment.childrenCount} icon={<GitBranch size={16} />} />
              <DepartmentMetric label="ID" value={selectedDepartment.id} icon={<GitBranch size={16} />} />
              <DepartmentMetric label="Ngày tạo" value={formatDateTime(selectedDepartment.createAt)} icon={<CalendarDays size={16} />} />
              <DepartmentMetric label="Cập nhật" value={formatDateTime(selectedDepartment.updateAt)} icon={<CalendarDays size={16} />} />
            </div>
          </div>

          <form className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px_auto]" onSubmit={onAddDepartmentMember}>
            <FormField label="Thành viên tổ chức" required error={departmentMemberErrors.userId}>
              <Select
                name="userId"
                value={departmentMemberForm.userId}
                onChange={onDepartmentMemberChange}
                error={departmentMemberErrors.userId}
              >
                <option value="">Chọn thành viên</option>
                {members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.userName} - Mã {member.userId}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Vai trò" required error={departmentMemberErrors.role}>
              <Select
                name="role"
                value={departmentMemberForm.role}
                onChange={onDepartmentMemberChange}
                error={departmentMemberErrors.role}
              >
                {departmentRoleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label} ({role.value})
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="flex items-end">
              <Button
                type="submit"
                leftIcon={<UserPlus size={16} />}
                loading={isDepartmentMemberSubmitting}
                disabled={isDepartmentMemberSubmitting}
              >
                Thêm thành viên
              </Button>
            </div>
          </form>

          {departmentMembers.length === 0 ? (
            <EmptyState
              icon={<Users size={24} />}
              title="Chưa có thành viên"
              description="Thành viên của phòng ban này sẽ hiển thị tại đây."
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-neutral-300">
              <table className="min-w-full divide-y divide-neutral-100 text-sm">
                <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Thành viên</th>
                    <th className="px-4 py-3">Vai trò</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Ngày tham gia</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {departmentMembers.map((member) => (
                    <tr key={member.id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-neutral-900">{member.userName}</p>
                        <p className="text-xs text-neutral-500">Mã {member.userId}</p>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{departmentRoleLabels[member.role] || member.role}</td>
                      <td className="px-4 py-3">
                        <Badge variant={departmentStatusVariant[member.status] || 'default'}>{member.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{formatDateTime(member.joinedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          leftIcon={<Trash2 size={16} />}
                          loading={
                            removingDepartmentMember?.departmentId === member.departmentId &&
                            removingDepartmentMember?.userId === member.userId
                          }
                          onClick={() => onRemoveDepartmentMember(member)}
                        >
                          Xóa
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : departments.length === 0 ? (
        <EmptyState
          icon={<GitBranch size={24} />}
          title="Chưa có phòng ban"
          description="Phòng ban thuộc tổ chức này sẽ hiển thị tại đây."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {departments.map((department) => (
            <article key={department.id} className="rounded-xl border border-neutral-300 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-lg font-bold text-neutral-900">{department.name}</h3>
                    <Badge variant={departmentStatusVariant[department.status] || 'default'}>{department.status}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-600">
                    {department.description || 'Chưa có mô tả'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Eye size={16} />}
                  loading={loadingDepartmentMembersId === department.id}
                  onClick={() => onOpenDepartment(department)}
                >
                  Chi tiết
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <DepartmentMetric label="Phòng ban cha" value={department.parentDepartmentName || 'Cấp gốc'} icon={<GitBranch size={16} />} />
                <DepartmentMetric label="Thành viên" value={department.memberCount} icon={<Users size={16} />} />
                <DepartmentMetric label="Phòng ban con" value={department.childrenCount} icon={<GitBranch size={16} />} />
                <DepartmentMetric label="ID" value={department.id} icon={<GitBranch size={16} />} />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 border-t border-neutral-100 pt-3 text-xs text-neutral-500 sm:grid-cols-2">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={14} className="text-primary" />
                  Tạo: {formatDateTime(department.createAt)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={14} className="text-primary" />
                  Cập nhật: {formatDateTime(department.updateAt)}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  )
}

function DepartmentMetric({ icon, label, value }) {
  return (
    <div className="min-w-0 rounded-lg bg-neutral-50 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
        <span className="text-primary">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-2 truncate text-sm font-bold text-neutral-900">{value || 0}</p>
    </div>
  )
}

export default DepartmentsPanel
