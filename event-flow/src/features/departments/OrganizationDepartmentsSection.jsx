import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { departmentApi, departmentMemberApi, organizationMemberApi } from '../../api'
import ConfirmDialog from '../../components/feedback/ConfirmDialog'
import { getErrorMessage } from '../../utils'
import { formatDateTime } from '../../utils/dateFormat'
import { normalizeOrganizationMember } from '../../utils/organizationMappers'
import { defaultDepartmentForm, defaultDepartmentMemberForm } from './departmentConstants'
import { normalizeDepartment, normalizeDepartmentMember } from './departmentMappers'
import DepartmentsPanel from './DepartmentsPanel'

function OrganizationDepartmentsSection({ organizationId, onError, onSuccess, onCountChange }) {
  const navigate = useNavigate()
  const [departments, setDepartments] = useState([])
  const [members, setMembers] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [departmentMembers, setDepartmentMembers] = useState([])
  const [departmentForm, setDepartmentForm] = useState(defaultDepartmentForm)
  const [departmentMemberForm, setDepartmentMemberForm] = useState(defaultDepartmentMemberForm)
  const [departmentErrors, setDepartmentErrors] = useState({})
  const [departmentMemberErrors, setDepartmentMemberErrors] = useState({})
  const [isDepartmentSubmitting, setIsDepartmentSubmitting] = useState(false)
  const [isDepartmentMemberSubmitting, setIsDepartmentMemberSubmitting] = useState(false)
  const [isDepartmentCreateOpen, setIsDepartmentCreateOpen] = useState(false)
  const [loadingDepartmentMembersId, setLoadingDepartmentMembersId] = useState(null)
  const [removingDepartmentMember, setRemovingDepartmentMember] = useState(null)
  const [pendingRemoveDepartmentMember, setPendingRemoveDepartmentMember] = useState(null)

  useEffect(() => {
    async function loadDepartments() {
      try {
        const [departmentsResponse, membersResponse] = await Promise.all([
          departmentApi.getByOrganization(organizationId),
          organizationMemberApi.getByOrganization(organizationId),
        ])
        const normalizedDepartments = (departmentsResponse.data || []).map(normalizeDepartment)
        setDepartments(normalizedDepartments)
        setMembers((membersResponse.data || []).map(normalizeOrganizationMember))
        onCountChange?.(normalizedDepartments.length)
      } catch (err) {
        onError(getErrorMessage(err))
      }
    }

    loadDepartments()
  }, [organizationId, onCountChange, onError])

  function handleDepartmentChange(event) {
    const { name, value } = event.target
    setDepartmentForm((current) => ({ ...current, [name]: value }))
    setDepartmentErrors((current) => ({ ...current, [name]: null }))
    onSuccess(null)
  }

  function handleDepartmentMemberChange(event) {
    const { name, value } = event.target
    setDepartmentMemberForm((current) => ({ ...current, [name]: value }))
    setDepartmentMemberErrors((current) => ({ ...current, [name]: null }))
    onSuccess(null)
  }

  function validateDepartmentForm() {
    const nextErrors = {}
    if (!departmentForm.name.trim()) nextErrors.name = 'Vui lòng nhập tên phòng ban'
    if (!departmentForm.description.trim()) nextErrors.description = 'Vui lòng nhập mô tả'
    if (!departmentForm.status) nextErrors.status = 'Vui lòng chọn trạng thái'

    setDepartmentErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleCreateDepartment(event) {
    event.preventDefault()
    if (!validateDepartmentForm()) return

    setIsDepartmentSubmitting(true)
    onError(null)
    onSuccess(null)

    try {
      const response = await departmentApi.create({
        name: departmentForm.name.trim(),
        description: departmentForm.description.trim(),
        organizationId,
        parentDepartmentId: departmentForm.parentDepartmentId ? Number(departmentForm.parentDepartmentId) : null,
        status: departmentForm.status,
      })
      const created = normalizeDepartment(response.data)
      setDepartments((current) => {
        const next = [created, ...current]
        onCountChange?.(next.length)
        return next
      })
      setDepartmentForm(defaultDepartmentForm)
      setDepartmentErrors({})
      setIsDepartmentCreateOpen(false)
      onSuccess(response.data?.message || 'Đã tạo phòng ban')
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsDepartmentSubmitting(false)
    }
  }

  function validateDepartmentMemberForm() {
    const nextErrors = {}
    if (!selectedDepartment?.id) nextErrors.departmentId = 'Vui lòng chọn phòng ban'
    if (!departmentMemberForm.userId) nextErrors.userId = 'Vui lòng chọn thành viên'
    if (!departmentMemberForm.role) nextErrors.role = 'Vui lòng chọn vai trò'

    setDepartmentMemberErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleOpenDepartment(department) {
    if (!department?.id) return

    setSelectedDepartment(department)
    setDepartmentMembers([])
    setDepartmentMemberForm(defaultDepartmentMemberForm)
    setDepartmentMemberErrors({})
    setLoadingDepartmentMembersId(department.id)
    onError(null)

    try {
      const response = await departmentMemberApi.getByDepartment(department.id)
      setDepartmentMembers((response.data || []).map(normalizeDepartmentMember))
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setLoadingDepartmentMembersId(null)
    }
  }

  async function handleAddDepartmentMember(event) {
    event.preventDefault()
    if (!validateDepartmentMemberForm()) return

    setIsDepartmentMemberSubmitting(true)
    onError(null)
    onSuccess(null)

    try {
      const response = await departmentMemberApi.add({
        departmentId: Number(selectedDepartment.id),
        userId: Number(departmentMemberForm.userId),
        role: departmentMemberForm.role,
        status: 'ACTIVE',
      })
      const created = normalizeDepartmentMember(response.data)
      setDepartmentMembers((current) => [created, ...current.filter((item) => item.userId !== created.userId)])
      setDepartmentMemberForm((current) => ({ ...current, userId: '', role: 'MEMBER' }))
      setDepartmentMemberErrors({})
      setDepartments((current) =>
        current.map((department) =>
          department.id === created.departmentId
            ? { ...department, memberCount: Number(department.memberCount || 0) + 1 }
            : department
        )
      )
      setSelectedDepartment((current) =>
        current ? { ...current, memberCount: Number(current.memberCount || 0) + 1 } : current
      )
      onSuccess(response.data?.message || 'Đã thêm thành viên vào phòng ban')
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsDepartmentMemberSubmitting(false)
    }
  }

  async function handleConfirmRemoveDepartmentMember() {
    if (!pendingRemoveDepartmentMember?.departmentId || !pendingRemoveDepartmentMember?.userId) return

    setRemovingDepartmentMember(pendingRemoveDepartmentMember)
    onError(null)
    onSuccess(null)

    try {
      const removed = pendingRemoveDepartmentMember
      const response = await departmentMemberApi.remove(removed.departmentId, removed.userId)
      setDepartmentMembers((current) => current.filter((item) => item.userId !== removed.userId))
      setDepartments((current) =>
        current.map((department) =>
          department.id === removed.departmentId
            ? { ...department, memberCount: Math.max(0, Number(department.memberCount || 0) - 1) }
            : department
        )
      )
      setSelectedDepartment((current) =>
        current ? { ...current, memberCount: Math.max(0, Number(current.memberCount || 0) - 1) } : current
      )
      setPendingRemoveDepartmentMember(null)
      onSuccess(response.data?.message || 'Đã xóa thành viên khỏi phòng ban')
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setRemovingDepartmentMember(null)
    }
  }

  return (
    <>
      <DepartmentsPanel
        departmentForm={departmentForm}
        departmentErrors={departmentErrors}
        departments={departments}
        selectedDepartment={selectedDepartment}
        departmentMembers={departmentMembers}
        departmentMemberForm={departmentMemberForm}
        departmentMemberErrors={departmentMemberErrors}
        members={members}
        isDepartmentSubmitting={isDepartmentSubmitting}
        isDepartmentMemberSubmitting={isDepartmentMemberSubmitting}
        loadingDepartmentMembersId={loadingDepartmentMembersId}
        removingDepartmentMember={removingDepartmentMember}
        isDepartmentCreateOpen={isDepartmentCreateOpen}
        onDepartmentChange={handleDepartmentChange}
        onCreateDepartment={handleCreateDepartment}
        onToggleCreateDepartment={() => navigate(`/organizations/${organizationId}/departments/create`)}
        onCancelCreateDepartment={() => {
          setIsDepartmentCreateOpen(false)
          setDepartmentForm(defaultDepartmentForm)
          setDepartmentErrors({})
        }}
        onOpenDepartment={handleOpenDepartment}
        onBackToDepartments={() => {
          setSelectedDepartment(null)
          setDepartmentMembers([])
          setDepartmentMemberForm(defaultDepartmentMemberForm)
          setDepartmentMemberErrors({})
        }}
        onDepartmentMemberChange={handleDepartmentMemberChange}
        onAddDepartmentMember={handleAddDepartmentMember}
        onRemoveDepartmentMember={setPendingRemoveDepartmentMember}
        formatDateTime={formatDateTime}
      />

      <ConfirmDialog
        open={Boolean(pendingRemoveDepartmentMember)}
        title="Xóa thành viên khỏi phòng ban"
        description={`Xóa ${pendingRemoveDepartmentMember?.userName || 'thành viên'} khỏi phòng ban ${
          pendingRemoveDepartmentMember?.departmentName || 'này'
        }?`}
        loading={Boolean(removingDepartmentMember)}
        onClose={() => setPendingRemoveDepartmentMember(null)}
        onConfirm={handleConfirmRemoveDepartmentMember}
      />
    </>
  )
}

export default OrganizationDepartmentsSection
