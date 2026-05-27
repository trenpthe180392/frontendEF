import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, Plus, Sparkles, Trash2, Users, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { aiApi, eventMemberApi, teamApi } from '../api'
import { normalizePageResponse } from '../api/response'
import SubscriptionGateBanner from '../components/feedback/SubscriptionGateBanner'
import FormField from '../components/form/FormField'
import Card from '../components/layout/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import EventCaseLayout, { EventWorkspaceHeader } from '../features/events/EventCaseLayout'
import { normalizeEventMember, teamRoleLabels, teamRoleOptions } from '../features/events/eventPageUtils'
import { getErrorMessage, isSubscriptionGateError } from '../utils'

const emptyTeamForm = {
  name: '',
  teamType: 'OPERATIONS',
  description: '',
  status: 'ACTIVE',
  addCreatorAsOwner: true,
  initialMemberUserId: '',
  initialMemberRole: 'MEMBER',
}

function createAiTeamDraft(suggestion, index) {
  const name = suggestion?.name?.trim() || `Đội nhóm AI ${index + 1}`
  return {
    id: `ai-team-${Date.now()}-${index}`,
    selected: true,
    name,
    teamType: suggestion?.teamType || 'OPERATIONS',
    description: suggestion?.description || `Đội nhóm ${name} được AI gợi ý cho sự kiện này.`,
    status: suggestion?.status || 'ACTIVE',
  }
}

function TeamCreateContent({ organizationId, eventId, onError, onSuccess }) {
  const navigate = useNavigate()
  const [eventMembers, setEventMembers] = useState([])
  const [initialMembers, setInitialMembers] = useState([])
  const [form, setForm] = useState(emptyTeamForm)
  const [aiTeamDrafts, setAiTeamDrafts] = useState([])
  const [aiContext, setAiContext] = useState('')
  const [draftErrors, setDraftErrors] = useState({})
  const [errors, setErrors] = useState({})
  const [subscriptionGateError, setSubscriptionGateError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)

  useEffect(() => {
    async function loadMembers() {
      try {
        const response = await eventMemberApi.getByEvent(eventId)
        setEventMembers(normalizePageResponse(response.data, 100).items.map(normalizeEventMember))
      } catch (err) {
        onError(getErrorMessage(err))
      }
    }

    loadMembers()
  }, [eventId, onError])

  function handleChange(event) {
    const { name, type, checked, value } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setErrors((current) => ({ ...current, [name]: null }))
    setSubscriptionGateError(null)
    onSuccess(null)
  }

  function handleAddInitialMember() {
    const userId = Number(form.initialMemberUserId)
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
      { userId, userName: member?.userName || `Người dùng ${userId}`, role: form.initialMemberRole, status: 'ACTIVE' },
    ])
    setForm((current) => ({ ...current, initialMemberUserId: '', initialMemberRole: 'MEMBER' }))
  }

  function validateForm() {
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Vui lòng nhập tên đội nhóm'
    if (!form.description.trim()) nextErrors.description = 'Vui lòng nhập mô tả đội nhóm'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSuggestTeam() {
    setIsSuggesting(true)
    setSubscriptionGateError(null)
    onError(null)
    onSuccess(null)

    try {
      const response = await aiApi.suggestTeams(eventId, { additionalContext: aiContext.trim() })
      const suggestions = response.data?.teams || []

      if (suggestions.length === 0) {
        setAiTeamDrafts([])
        onSuccess('AI chưa trả về danh sách đội nhóm gợi ý')
        return
      }

      setAiTeamDrafts(suggestions.map(createAiTeamDraft))
      setDraftErrors({})
      setErrors({})
      onSuccess(`AI đã gợi ý ${suggestions.length} đội nhóm. Kiểm tra danh sách rồi tạo hàng loạt.`)
    } catch (err) {
      if (isSubscriptionGateError(err)) {
        setSubscriptionGateError(err)
      } else {
        onError(getErrorMessage(err))
      }
    } finally {
      setIsSuggesting(false)
    }
  }

  function handleDraftChange(draftId, field, value) {
    setAiTeamDrafts((current) => current.map((draft) => (draft.id === draftId ? { ...draft, [field]: value } : draft)))
    setDraftErrors((current) => ({ ...current, [draftId]: { ...current[draftId], [field]: null } }))
    setSubscriptionGateError(null)
    onSuccess(null)
  }

  function handleToggleDraft(draftId) {
    setAiTeamDrafts((current) => current.map((draft) => (draft.id === draftId ? { ...draft, selected: !draft.selected } : draft)))
    setErrors((current) => ({ ...current, aiDrafts: null }))
  }

  function handleRemoveDraft(draftId) {
    setAiTeamDrafts((current) => current.filter((draft) => draft.id !== draftId))
    setErrors((current) => ({ ...current, aiDrafts: null }))
    setDraftErrors((current) => {
      const next = { ...current }
      delete next[draftId]
      return next
    })
  }

  function validateDrafts(selectedDrafts) {
    const nextErrors = {}
    selectedDrafts.forEach((draft) => {
      const errorsForDraft = {}
      if (!draft.name.trim()) errorsForDraft.name = 'Vui lòng nhập tên đội nhóm'
      if (!draft.description.trim()) errorsForDraft.description = 'Vui lòng nhập mô tả đội nhóm'
      if (Object.keys(errorsForDraft).length > 0) nextErrors[draft.id] = errorsForDraft
    })
    setDraftErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleCreateAiTeams() {
    const selectedDrafts = aiTeamDrafts.filter((draft) => draft.selected)
    if (selectedDrafts.length === 0) {
      setErrors((current) => ({ ...current, aiDrafts: 'Vui lòng chọn ít nhất một đội nhóm AI' }))
      return
    }
    if (!validateDrafts(selectedDrafts)) return

    setIsSubmitting(true)
    setSubscriptionGateError(null)
    onError(null)
    onSuccess(null)

    try {
      await Promise.all(
        selectedDrafts.map((draft) =>
          teamApi.create({
            name: draft.name.trim(),
            teamType: draft.teamType || 'OPERATIONS',
            description: draft.description.trim(),
            status: draft.status || 'ACTIVE',
            primaryScope: 'EVENT',
            organizationId,
            eventId,
            addCreatorAsOwner: true,
            initialMembers: [],
          })
        )
      )
      onSuccess(`Đã tạo ${selectedDrafts.length} đội nhóm từ AI`)
      navigate(`/organizations/${organizationId}/events/${eventId}/teams`)
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    setSubscriptionGateError(null)
    onError(null)
    onSuccess(null)

    try {
      await teamApi.create({
        name: form.name.trim(),
        teamType: form.teamType,
        description: form.description.trim(),
        status: form.status,
        primaryScope: 'EVENT',
        organizationId,
        eventId,
        addCreatorAsOwner: form.addCreatorAsOwner,
        initialMembers: initialMembers.map((member) => ({
          userId: member.userId,
          role: member.role,
          status: member.status,
        })),
      })
      onSuccess('Đã tạo đội nhóm')
      navigate(`/organizations/${organizationId}/events/${eventId}/teams`)
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <EventWorkspaceHeader
        title="Tạo đội nhóm"
        description="Tạo nhóm vận hành riêng cho sự kiện và gán thành viên ban đầu."
        icon={<Users size={24} />}
        actions={
          <Button variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate(`/organizations/${organizationId}/events/${eventId}/teams`)}>
            Danh sách đội nhóm
          </Button>
        }
      />

      <SubscriptionGateBanner error={subscriptionGateError} organizationId={organizationId} />

      <Card title="Thông tin đội nhóm">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <FormField label="Ngữ cảnh cho AI">
              <Textarea
                value={aiContext}
                onChange={(event) => setAiContext(event.target.value)}
                rows={3}
                placeholder="Ví dụ: sự kiện 500 khách VIP, cần tách đội đón tiếp và an ninh riêng, ngân sách hạn chế, ưu tiên tình nguyện viên..."
              />
            </FormField>
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" size="sm" loading={isSuggesting} leftIcon={<Sparkles size={16} />} onClick={handleSuggestTeam}>
              Gợi ý AI
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FormField label="Tên đội nhóm" required error={errors.name}>
              <Input name="name" value={form.name} onChange={handleChange} error={errors.name} placeholder="Đội vận hành" />
            </FormField>
            <FormField label="Loại đội nhóm">
              <Input name="teamType" value={form.teamType} onChange={handleChange} />
            </FormField>
            <FormField label="Trạng thái">
              <Select name="status" value={form.status} onChange={handleChange}>
                {['ACTIVE', 'INACTIVE', 'PENDING', 'BANNED'].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Mô tả" required error={errors.description}>
              <Textarea name="description" value={form.description} onChange={handleChange} error={errors.description} rows={4} />
            </FormField>
          </div>

          <label className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm font-medium text-neutral-700">
            <input className="h-4 w-4 accent-primary" type="checkbox" name="addCreatorAsOwner" checked={form.addCreatorAsOwner} onChange={handleChange} />
            Thêm người tạo làm trưởng đội
          </label>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-sm font-semibold text-neutral-900">Thành viên ban đầu</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px_auto]">
              <FormField label="Thành viên" error={errors.initialMemberUserId}>
                <Select name="initialMemberUserId" value={form.initialMemberUserId} onChange={handleChange} error={errors.initialMemberUserId}>
                  <option value="">Chọn thành viên sự kiện</option>
                  {eventMembers.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.userName} - Mã {member.userId}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Vai trò">
                <Select name="initialMemberRole" value={form.initialMemberRole} onChange={handleChange}>
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
            {initialMembers.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {initialMembers.map((member) => (
                  <span key={member.userId} className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-semibold text-neutral-700">
                    {member.userName}
                    <Badge variant="default">{teamRoleLabels[member.role] || member.role}</Badge>
                    <button type="button" className="text-neutral-500 hover:text-danger" onClick={() => setInitialMembers((current) => current.filter((item) => item.userId !== member.userId))}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => navigate(`/organizations/${organizationId}/events/${eventId}/teams`)}>
              Hủy
            </Button>
            <Button type="submit" loading={isSubmitting} leftIcon={<Plus size={16} />}>
              Tạo đội nhóm
            </Button>
          </div>
        </form>
      </Card>

      {aiTeamDrafts.length > 0 ? (
        <Card title={`Danh sách AI gợi ý (${aiTeamDrafts.length})`}>
          <div className="space-y-3">
            {errors.aiDrafts ? <p className="text-sm font-medium text-danger">{errors.aiDrafts}</p> : null}
            {aiTeamDrafts.map((draft, index) => {
              const currentErrors = draftErrors[draft.id] || {}
              return (
                <div key={draft.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-800">
                      <input className="h-4 w-4 accent-primary" type="checkbox" checked={draft.selected} onChange={() => handleToggleDraft(draft.id)} />
                      Đội #{index + 1}
                    </label>
                    <Button type="button" variant="ghost" size="sm" leftIcon={<Trash2 size={15} />} onClick={() => handleRemoveDraft(draft.id)}>
                      Xóa
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <FormField label="Tên đội nhóm" required error={currentErrors.name}>
                      <Input value={draft.name} onChange={(event) => handleDraftChange(draft.id, 'name', event.target.value)} error={currentErrors.name} />
                    </FormField>
                    <FormField label="Loại đội nhóm">
                      <Input value={draft.teamType} onChange={(event) => handleDraftChange(draft.id, 'teamType', event.target.value)} />
                    </FormField>
                    <FormField label="Trạng thái">
                      <Select value={draft.status} onChange={(event) => handleDraftChange(draft.id, 'status', event.target.value)}>
                        {['ACTIVE', 'INACTIVE', 'PENDING', 'BANNED'].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label="Mô tả" required error={currentErrors.description}>
                      <Textarea value={draft.description} onChange={(event) => handleDraftChange(draft.id, 'description', event.target.value)} error={currentErrors.description} rows={3} />
                    </FormField>
                  </div>
                </div>
              )
            })}
            <div className="flex justify-end">
              <Button type="button" loading={isSubmitting} leftIcon={<CheckCircle2 size={16} />} onClick={handleCreateAiTeams}>
                Tạo các đội đã chọn
              </Button>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  )
}

function TeamCreatePage() {
  const { organizationId, eventId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <EventCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {() => (
        <TeamCreateContent
          organizationId={Number(organizationId)}
          eventId={Number(eventId)}
          onError={setError}
          onSuccess={setSuccessMessage}
        />
      )}
    </EventCaseLayout>
  )
}

export default TeamCreatePage
