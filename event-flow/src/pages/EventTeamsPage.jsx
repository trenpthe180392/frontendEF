import { useEffect, useState } from 'react'
import { Plus, Sparkles, Trash2, Users, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { aiApi, eventMemberApi, teamApi } from '../api'
import { normalizePageResponse } from '../api/response'
import ConfirmDialog from '../components/feedback/ConfirmDialog'
import FormField from '../components/form/FormField'
import Card from '../components/layout/Card'
import EmptyState from '../components/layout/EmptyState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import PaginationControls from '../components/ui/PaginationControls'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import EventCaseLayout, { EventWorkspaceHeader } from '../features/events/EventCaseLayout'
import { normalizeEventMember, teamRoleLabels, teamRoleOptions } from '../features/events/eventPageUtils'
import { statusVariant } from '../features/organizations/organizationConstants'
import { getErrorMessage } from '../utils'

const emptyTeamForm = {
  name: '',
  teamType: 'OPERATIONS',
  description: '',
  status: 'ACTIVE',
  primaryScope: 'EVENT',
  addCreatorAsOwner: true,
  initialMemberUserId: '',
  initialMemberRole: 'MEMBER',
}
const DEFAULT_TEAMS_PER_PAGE = 6

function normalizeTeamPage(responseData, pageSize = DEFAULT_TEAMS_PER_PAGE) {
  if (Array.isArray(responseData)) {
    return {
      content: responseData,
      totalElements: responseData.length,
      totalPages: Math.max(1, Math.ceil(responseData.length / pageSize)),
      number: 0,
    }
  }

  const page = responseData?.page || {}
  return {
    content: responseData?.content || [],
    totalElements: responseData?.totalElements ?? page.totalElements ?? 0,
    totalPages: Math.max(1, responseData?.totalPages ?? page.totalPages ?? 1),
    number: responseData?.number ?? page.number ?? 0,
  }
}

function EventTeamsContent({ organizationId, eventId, onError, onSuccess }) {
  const navigate = useNavigate()
  const [teams, setTeams] = useState([])
  const [eventMembers, setEventMembers] = useState([])
  const [initialMembers, setInitialMembers] = useState([])
  const [teamForm, setTeamForm] = useState(emptyTeamForm)
  const [teamDrafts, setTeamDrafts] = useState([])
  const [aiContext, setAiContext] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingDeleteTeam, setPendingDeleteTeam] = useState(null)
  const [deletingTeamId, setDeletingTeamId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_TEAMS_PER_PAGE)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  async function loadTeams() {
    onError(null)
    try {
      const [teamsResponse, membersResponse] = await Promise.all([
        teamApi.getByEvent(eventId, { page: currentPage - 1, size: pageSize }),
        eventMemberApi.getByEvent(eventId),
      ])
      const teamPage = normalizeTeamPage(teamsResponse.data, pageSize)
      setTeams(teamPage.content)
      setTotalElements(teamPage.totalElements)
      setTotalPages(teamPage.totalPages)
      setCurrentPage(teamPage.number + 1)
      setEventMembers(normalizePageResponse(membersResponse.data, 100).items.map(normalizeEventMember))
    } catch (err) {
      onError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    loadTeams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, currentPage, pageSize])

  function handleChange(event) {
    const { name, type, checked, value } = event.target
    setTeamForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setErrors((current) => ({ ...current, [name]: null }))
  }

  function handleAddInitialMember() {
    const userId = Number(teamForm.initialMemberUserId)
    if (!userId) {
      setErrors((current) => ({ ...current, initialMemberUserId: 'Vui lòng chọn thành viên' }))
      return
    }
    if (initialMembers.some((member) => Number(member.userId) === userId)) {
      setErrors((current) => ({ ...current, initialMemberUserId: 'Thành viên đã có trong danh sách' }))
      return
    }

    const member = eventMembers.find((item) => Number(item.userId) === userId)
    setInitialMembers((current) => [
      ...current,
      {
        userId,
        userName: member?.userName || `Người dùng ${userId}`,
        role: teamForm.initialMemberRole,
        status: 'ACTIVE',
      },
    ])
    setTeamForm((current) => ({ ...current, initialMemberUserId: '', initialMemberRole: 'MEMBER' }))
    setErrors((current) => ({ ...current, initialMemberUserId: null }))
  }

  function validateTeamForm() {
    const nextErrors = {}
    if (!teamForm.name.trim()) nextErrors.name = 'Vui lòng nhập tên đội nhóm'
    if (!teamForm.description.trim()) nextErrors.description = 'Vui lòng nhập mô tả đội nhóm'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function buildTeamPayload(team) {
    return {
      name: team.name.trim(),
      teamType: team.teamType,
      description: team.description.trim(),
      status: team.status,
      primaryScope: 'EVENT',
      organizationId,
      eventId,
      addCreatorAsOwner: team.addCreatorAsOwner,
      initialMembers: (team.initialMembers || []).map((member) => ({
        userId: member.userId,
        role: member.role,
        status: member.status,
      })),
    }
  }

  function resetCurrentTeamInput() {
    setTeamForm(emptyTeamForm)
    setInitialMembers([])
    setErrors({})
  }

  function handleAddCurrentTeamToDrafts() {
    if (!validateTeamForm()) return

    const draftId = `manual-${Date.now()}-${teamDrafts.length}`
    setTeamDrafts((current) => [
      ...current,
      {
        id: draftId,
        name: teamForm.name.trim(),
        teamType: teamForm.teamType,
        description: teamForm.description.trim(),
        status: teamForm.status,
        primaryScope: 'EVENT',
        addCreatorAsOwner: teamForm.addCreatorAsOwner,
        initialMembers,
      },
    ])
    resetCurrentTeamInput()
    onSuccess('Đã thêm đội nhóm vào danh sách chờ lưu')
  }

  async function handleSuggestTeams() {
    setIsFormOpen(true)
    setIsSuggesting(true)
    onError(null)
    onSuccess(null)

    try {
      const response = await aiApi.suggestTeams(eventId, { additionalContext: aiContext.trim() })
      const suggestions = response.data?.teams || []
      if (suggestions.length === 0) {
        onSuccess('AI chưa trả về đội nhóm gợi ý')
        return
      }

      const suggestionDrafts = suggestions.map((team, index) => {
        const name = team.name?.trim() || `Đội nhóm AI ${index + 1}`
        return {
          id: `ai-${Date.now()}-${index}`,
          name,
          teamType: team.teamType || 'OPERATIONS',
          description: team.description || `Đội nhóm ${name} được AI gợi ý cho sự kiện này.`,
          status: team.status || 'ACTIVE',
          primaryScope: team.primaryScope || 'EVENT',
          addCreatorAsOwner: true,
          initialMembers: [],
          source: 'AI',
        }
      })

      setTeamDrafts((current) => [...current, ...suggestionDrafts])
      onSuccess(`AI đã gợi ý ${suggestionDrafts.length} đội nhóm. Kiểm tra rồi lưu để tạo.`)
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsSuggesting(false)
    }
  }

  async function handleCreateDrafts() {
    if (teamDrafts.length === 0) {
      onError('Vui lòng bấm dấu cộng để thêm ít nhất 1 đội nhóm vào danh sách chờ lưu')
      return
    }

    const invalidDraft = teamDrafts.find((team) => !team.name?.trim() || !team.description?.trim())
    if (invalidDraft) {
      onError('Danh sách chờ lưu có đội nhóm thiếu tên hoặc mô tả')
      return
    }

    setIsSubmitting(true)
    onError(null)
    onSuccess(null)

    try {
      await Promise.all(teamDrafts.map((team) => teamApi.create(buildTeamPayload(team))))
      const createdCount = teamDrafts.length
      setTeamDrafts([])
      resetCurrentTeamInput()
      setIsFormOpen(false)
      await loadTeams()
      onSuccess(`Đã tạo ${createdCount} đội nhóm`)
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  function closeForm() {
    resetCurrentTeamInput()
    setTeamDrafts([])
    setIsFormOpen(false)
  }

  async function handleConfirmDeleteTeam() {
    if (!pendingDeleteTeam?.id) return

    setDeletingTeamId(pendingDeleteTeam.id)
    onError(null)
    onSuccess(null)

    try {
      await teamApi.delete(pendingDeleteTeam.id)
      setPendingDeleteTeam(null)
      if (teams.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1)
      } else {
        await loadTeams()
      }
      onSuccess('Đã xóa đội nhóm khỏi sự kiện')
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setDeletingTeamId(null)
    }
  }

  function goToPage(page) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages))
  }

  function handlePageSizeChange(nextPageSize) {
    setPageSize(nextPageSize)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-4">
      <EventWorkspaceHeader
        title="Đội nhóm"
        description="Thiết kế cơ cấu đội nhóm, phân vai ban đầu và mở không gian làm việc cho từng nhóm."
        icon={<Users size={24} />}
        actions={
          <Button
            type="button"
            variant={isFormOpen ? 'secondary' : 'primary'}
            size="sm"
            leftIcon={isFormOpen ? <X size={16} /> : <Plus size={16} />}
            onClick={isFormOpen ? closeForm : () => navigate(`/organizations/${organizationId}/events/${eventId}/teams/create`)}
          >
            {isFormOpen ? 'Đóng biểu mẫu' : 'Tạo đội nhóm'}
          </Button>
        }
        stats={[
          { label: 'Đội nhóm', value: totalElements },
          { label: 'Thành viên sự kiện', value: eventMembers.length },
          { label: 'Chờ lưu', value: teamDrafts.length },
        ]}
      />

      <Card title="Danh sách đội nhóm">
      {isFormOpen ? (
        <div className="mb-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-neutral-900">Tạo đội nhóm hàng loạt</p>
              <p className="mt-1 text-xs text-neutral-500">Điền đội nhóm, bấm dấu cộng để đưa xuống danh sách chờ lưu, rồi lưu một lần.</p>
            </div>
            <Button type="button" variant="secondary" size="sm" loading={isSuggesting} leftIcon={<Sparkles size={16} />} onClick={handleSuggestTeams}>
              Gợi ý AI
            </Button>
          </div>
          <div className="mb-4 rounded-lg border border-neutral-200 bg-white p-3">
            <FormField label="Ngữ cảnh cho AI">
              <Textarea
                value={aiContext}
                onChange={(event) => setAiContext(event.target.value)}
                rows={3}
                placeholder="Ví dụ: sự kiện có nhiều khách mời doanh nghiệp, cần đội tài trợ riêng, ưu tiên check-in nhanh và kiểm soát rủi ro hiện trường..."
              />
            </FormField>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-3">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FormField label="Tên đội nhóm" required error={errors.name}>
                <Input name="name" value={teamForm.name} onChange={handleChange} error={errors.name} placeholder="Đội vận hành" />
              </FormField>
              <FormField label="Loại đội nhóm">
                <Input name="teamType" value={teamForm.teamType} onChange={handleChange} />
              </FormField>
              <FormField label="Trạng thái">
                <Select name="status" value={teamForm.status} onChange={handleChange}>
                  {['ACTIVE', 'INACTIVE', 'PENDING', 'BANNED'].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Mô tả" required error={errors.description}>
                <Textarea
                  name="description"
                  value={teamForm.description}
                  onChange={handleChange}
                  error={errors.description}
                  placeholder="Vai trò, phạm vi công việc, trách nhiệm chính của đội nhóm..."
                />
              </FormField>
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm font-medium text-neutral-700">
              <input
                className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                type="checkbox"
                name="addCreatorAsOwner"
                checked={teamForm.addCreatorAsOwner}
                onChange={handleChange}
              />
              Thêm người tạo làm trưởng đội
            </label>

            <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-sm font-semibold text-neutral-900">Thành viên ban đầu</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px_auto]">
                <FormField label="Thành viên" error={errors.initialMemberUserId}>
                  <Select name="initialMemberUserId" value={teamForm.initialMemberUserId} onChange={handleChange} error={errors.initialMemberUserId}>
                    <option value="">Chọn thành viên sự kiện</option>
                    {eventMembers.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.userName} - Mã {member.userId}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Vai trò">
                  <Select name="initialMemberRole" value={teamForm.initialMemberRole} onChange={handleChange}>
                    {teamRoleOptions.map((role) => (
                      <option key={role} value={role}>
                        {teamRoleLabels[role]} ({role})
                      </option>
                    ))}
                  </Select>
                </FormField>
                <div className="flex items-end">
                  <Button type="button" variant="secondary" leftIcon={<Plus size={16} />} onClick={handleAddInitialMember}>
                    Thêm
                  </Button>
                </div>
              </div>
              {initialMembers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {initialMembers.map((member) => (
                    <span key={member.userId} className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-semibold text-neutral-700">
                      {member.userName} - {teamRoleLabels[member.role] || member.role}
                      <button
                        type="button"
                        className="text-neutral-500 hover:text-danger"
                        onClick={() => setInitialMembers((current) => current.filter((item) => item.userId !== member.userId))}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <Button type="button" variant="secondary" leftIcon={<Plus size={16} />} onClick={handleAddCurrentTeamToDrafts}>
                Thêm đội nhóm
              </Button>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-neutral-900">Đội nhóm sẽ được lưu</p>
              <Badge variant="default">{teamDrafts.length}</Badge>
            </div>
            {teamDrafts.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">Chưa có đội nhóm nào trong danh sách chờ lưu.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {teamDrafts.map((team) => (
                  <div key={team.id} className="rounded-lg border border-neutral-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-neutral-900">{team.name}</p>
                          {team.source === 'AI' ? <Badge variant="info">AI</Badge> : null}
                          <Badge variant={statusVariant[String(team.status || '').toLowerCase()] || 'default'}>{team.status}</Badge>
                        </div>
                        <p className="mt-1 text-xs font-medium text-neutral-500">{team.teamType}</p>
                        <p className="mt-2 text-sm text-neutral-600">{team.description}</p>
                        <p className="mt-2 text-xs text-neutral-500">{team.initialMembers?.length || 0} thành viên ban đầu</p>
                      </div>
                      <button
                        type="button"
                        className="rounded-md p-2 text-neutral-500 transition hover:bg-danger/10 hover:text-danger"
                        onClick={() => setTeamDrafts((current) => current.filter((item) => item.id !== team.id))}
                        aria-label="Bỏ đội nhóm khỏi danh sách chờ lưu"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={closeForm} disabled={isSubmitting || isSuggesting}>
              Hủy
            </Button>
            <Button type="button" loading={isSubmitting} leftIcon={<Plus size={16} />} onClick={handleCreateDrafts} disabled={teamDrafts.length === 0}>
              Lưu {teamDrafts.length > 0 ? `(${teamDrafts.length})` : ''}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-neutral-600">
          Hiển thị {teams.length}/{totalElements} đội nhóm
        </p>
        <p className="text-xs text-neutral-500">Trang {currentPage}/{totalPages}</p>
      </div>

      {teams.length === 0 ? (
        <EmptyState icon={<Users size={24} />} title="Chưa có đội nhóm" description="Tạo đội nhóm để chia nhóm công việc trong sự kiện." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {teams.map((team) => (
            <article
              key={team.id}
              className="rounded-lg border border-neutral-200 p-4 transition hover:border-primary hover:bg-primary/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-neutral-900">{team.name}</p>
                  <p className="mt-1 text-xs text-neutral-500">{team.teamType || 'Đội nhóm'}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{team.description || 'Chưa có mô tả'}</p>
                </div>
                <Badge variant={statusVariant[String(team.status || '').toLowerCase()] || 'default'}>{team.status || 'ACTIVE'}</Badge>
              </div>
              <p className="mt-4 text-sm text-neutral-700">{team.memberCount ?? 0} thành viên</p>
              <p className="mt-1 text-xs text-neutral-500">{team.taskCount ?? 0} công việc - {team.calendarCount ?? 0} lịch</p>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/organizations/${organizationId}/events/${eventId}/teams/${team.id}`)}
                >
                  Mở đội nhóm
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 size={16} />}
                  loading={deletingTeamId === team.id}
                  onClick={() => setPendingDeleteTeam(team)}
                >
                  Xóa
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={goToPage}
        onPageSizeChange={handlePageSizeChange}
      />
      </Card>

      <ConfirmDialog
        open={Boolean(pendingDeleteTeam)}
        title="Xóa đội nhóm"
        description={`Xóa đội nhóm ${pendingDeleteTeam?.name || 'này'} khỏi sự kiện? Công việc thuộc đội nhóm sẽ được chuyển về cấp sự kiện và thành viên đội nhóm sẽ được gỡ khỏi đội nhóm.`}
        loading={Boolean(deletingTeamId)}
        onClose={() => setPendingDeleteTeam(null)}
        onConfirm={handleConfirmDeleteTeam}
      />
    </div>
  )
}

function EventTeamsPage() {
  const { organizationId, eventId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <EventCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {() => (
        <EventTeamsContent
          organizationId={Number(organizationId)}
          eventId={Number(eventId)}
          onError={setError}
          onSuccess={setSuccessMessage}
        />
      )}
    </EventCaseLayout>
  )
}

export default EventTeamsPage
