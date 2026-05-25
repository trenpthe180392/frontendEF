import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Mail, Calendar, Send, FileText, ArrowLeft } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Card from '../components/layout/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import Badge from '../components/ui/Badge'
import Modal from '../components/layout/Modal'
import Spinner from '../components/ui/Spinner'
import DataTable from '../components/layout/DataTable'
import ConfirmDialog from '../components/feedback/ConfirmDialog'
import AlertBanner from '../components/feedback/AlertBanner'
import SubscriptionGateBanner from '../components/feedback/SubscriptionGateBanner'
import EmptyState from '../components/layout/EmptyState'
import FormField from '../components/form/FormField'
import RichTextEditor from '../components/form/RichTextEditor'
import { emailCampaignApi } from '../api'
import { getApiMessage } from '../api/response'
import { isSubscriptionGateError } from '../utils'

const SEGMENT_OPTIONS = [
  { value: 'ALL_EVENT_MEMBERS', label: 'Tất cả thành viên sự kiện' },
  { value: 'CHECKED_IN', label: 'Đã check-in' },
  { value: 'NOT_CHECKED_IN', label: 'Chưa check-in' },
  { value: 'LANDING_REGISTRANTS', label: 'Người đăng ký landing page' },
  { value: 'CUSTOM_EMAILS', label: 'Danh sách email tùy chọn' },
]

const EmailCampaignsPage = () => {
  const { organizationId, eventId } = useParams()
  const navigate = useNavigate()

  // Campaign list state
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [errorDetail, setErrorDetail] = useState(null)
  const [pagination, setPagination] = useState({ currentPage: 0, totalPages: 0 })

  // Campaign logs state
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsPagination, setLogsPagination] = useState({ currentPage: 0, totalPages: 0 })
  const [activeCampaign, setActiveCampaign] = useState(null)

  // Modals state
  const [createOpen, setCreateOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    htmlContent: '',
    segment: 'ALL_EVENT_MEMBERS',
    customEmails: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [formLoading, setFormLoading] = useState(false)
  const [aiBrief, setAiBrief] = useState('')
  const [aiTone, setAiTone] = useState('Chuyên nghiệp, thân thiện')
  const [aiLoading, setAiLoading] = useState(false)

  // Schedule state
  const [scheduleData, setScheduleData] = useState({ scheduledAt: '' })
  const [scheduleErrors, setScheduleErrors] = useState({})
  const [scheduleLoading, setScheduleLoading] = useState(false)

  const fetchCampaigns = useCallback(async (page = 0) => {
    try {
      setLoading(true)
      setError(null)
      setErrorDetail(null)
      const result = await emailCampaignApi.getList(eventId, { page, size: 10 })
      setCampaigns(result.items)
      setPagination({
        currentPage: result.currentPage,
        totalPages: result.pages,
      })
    } catch (err) {
      setErrorDetail(err)
      setError(getApiMessage(err, 'Failed to load campaigns'))
    } finally {
      setLoading(false)
    }
  }, [eventId])

  const fetchLogs = useCallback(async (campaignId, page = 0) => {
    try {
      setLogsLoading(true)
      const result = await emailCampaignApi.getLogs(eventId, campaignId, { page, size: 20 })
      setLogs(result.items)
      setLogsPagination({
        currentPage: result.currentPage,
        totalPages: result.pages,
      })
    } catch (err) {
      setError(getApiMessage(err, 'Failed to load logs'))
    } finally {
      setLogsLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  const openLogs = (campaign) => {
    setActiveCampaign(campaign)
    fetchLogs(campaign.id)
  }

  const handleCreate = async () => {
    setFormErrors({})
    let valid = true
    const errors = {}

    if (!formData.subject.trim()) {
      errors.subject = 'Vui lòng nhập tiêu đề email'
      valid = false
    }
    if (!formData.name.trim()) {
      errors.name = 'Vui lòng nhập tên campaign'
      valid = false
    }
    if (!formData.htmlContent.trim()) {
      errors.htmlContent = 'Vui lòng nhập nội dung email'
      valid = false
    }
    if (formData.segment === 'CUSTOM_EMAILS' && !formData.customEmails.trim()) {
      errors.customEmails = 'Vui lòng nhập ít nhất một email'
      valid = false
    }

    if (!valid) {
      setFormErrors(errors)
      return
    }

    try {
      setFormLoading(true)
      setError(null)
      setErrorDetail(null)
      await emailCampaignApi.create(eventId, {
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        htmlContent: formData.htmlContent.trim(),
        segment: formData.segment,
        customEmails: formData.segment === 'CUSTOM_EMAILS'
          ? formData.customEmails.split(/[\n,;]/).map((email) => email.trim()).filter(Boolean)
          : [],
      })
      setCreateOpen(false)
      setFormData({ name: '', subject: '', htmlContent: '', segment: 'ALL_EVENT_MEMBERS', customEmails: '' })
      setFormErrors({})
      fetchCampaigns()
    } catch (err) {
      setErrorDetail(err)
      if (err.response?.data?.fields) {
        setFormErrors(err.response.data.fields)
      } else {
        setError(getApiMessage(err, 'Failed to create campaign'))
      }
    } finally {
      setFormLoading(false)
    }
  }

  const openSchedule = (campaign) => {
    setSelectedCampaign(campaign)
    setScheduleData({ scheduledAt: '' })
    setScheduleErrors({})
    setScheduleOpen(true)
  }

  const handleGenerateContent = async () => {
    if (!aiBrief.trim()) {
      setFormErrors((current) => ({ ...current, aiBrief: 'Vui lòng mô tả email bạn muốn soạn' }))
      return
    }
    try {
      setAiLoading(true)
      setError(null)
      const generated = await emailCampaignApi.generateContent(eventId, {
        brief: aiBrief.trim(),
        tone: aiTone.trim(),
        recipientGroup: SEGMENT_OPTIONS.find((item) => item.value === formData.segment)?.label,
      })
      setFormData((current) => ({
        ...current,
        subject: generated.subject || current.subject,
        htmlContent: generated.htmlContent || current.htmlContent,
      }))
      setFormErrors((current) => ({ ...current, aiBrief: null }))
    } catch (err) {
      setError(getApiMessage(err, 'Không thể soạn email bằng AI'))
    } finally {
      setAiLoading(false)
    }
  }

  const handleSchedule = async () => {
    setScheduleErrors({})
    let valid = true
    const errors = {}

    if (!scheduleData.scheduledAt) {
      errors.scheduledAt = 'Schedule date/time is required'
      valid = false
    } else if (new Date(scheduleData.scheduledAt) <= new Date()) {
      errors.scheduledAt = 'Schedule must be in the future'
      valid = false
    }

    if (!valid) {
      setScheduleErrors(errors)
      return
    }

    try {
      setScheduleLoading(true)
      setError(null)
      setErrorDetail(null)
      await emailCampaignApi.schedule(eventId, selectedCampaign.id, { scheduledAt: scheduleData.scheduledAt })
      setScheduleOpen(false)
      setSelectedCampaign(null)
      setScheduleData({ scheduledAt: '' })
      fetchCampaigns()
    } catch (err) {
      setErrorDetail(err)
      setScheduleErrors({ scheduledAt: getApiMessage(err, 'Failed to schedule campaign') })
    } finally {
      setScheduleLoading(false)
    }
  }

  const openSendNow = (campaign) => {
    setSelectedCampaign(campaign)
    setSendConfirmOpen(true)
  }

  const handleSendNow = async () => {
    try {
      setError(null)
      setErrorDetail(null)
      await emailCampaignApi.sendNow(eventId, selectedCampaign.id)
      setSendConfirmOpen(false)
      setSelectedCampaign(null)
      fetchCampaigns()
      if (activeCampaign?.id === selectedCampaign.id) {
        fetchLogs(selectedCampaign.id)
      }
    } catch (err) {
      setErrorDetail(err)
      setError(getApiMessage(err, 'Failed to send campaign'))
    }
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'SENT': return 'success'
      case 'SENDING': return 'info'
      case 'SCHEDULED': return 'default'
      case 'FAILED': return 'danger'
      case 'DRAFT': return 'warning'
      default: return 'default'
    }
  }

  const campaignColumns = [
    { header: 'Campaign', accessor: (c) => c.name || c.subject },
    { header: 'Subject', accessor: 'subject' },
    { header: 'Recipients', accessor: (c) => SEGMENT_OPTIONS.find((option) => option.value === c.segment)?.label || c.segment },
    {
      header: 'Status',
      accessor: 'status',
      render: (c) => <Badge variant={getStatusBadgeVariant(c.status)}>{c.status}</Badge>
    },
    {
      header: 'Schedule',
      accessor: (c) => {
        if (c.scheduledAt) return new Date(c.scheduledAt).toLocaleString('vi-VN')
        return 'Immediate'
      }
    },
    {
      header: 'Created',
      accessor: (c) => new Date(c.createdAt).toLocaleDateString('vi-VN')
    },
    {
      header: 'Actions',
      render: (c) => (
        <div className="flex gap-2">
          {c.status === 'DRAFT' && (
            <Button size="sm" variant="secondary" onClick={() => openSchedule(c)}>
              <Calendar size={14} className="mr-1" /> Schedule
            </Button>
          )}
          {(c.status === 'DRAFT' || c.status === 'SCHEDULED') && (
            <Button size="sm" variant="primary" onClick={() => openSendNow(c)}>
              <Send size={14} className="mr-1" /> Send Now
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => openLogs(c)}>
            <FileText size={14} className="mr-1" /> Logs
          </Button>
        </div>
      )
    }
  ]

  const logColumns = [
    { header: 'Recipient', accessor: 'email' },
    {
      header: 'Status',
      accessor: 'status',
      render: (l) => <Badge variant={l.success ? 'success' : 'danger'}>{l.status}</Badge>
    },
    { header: 'Sent At', accessor: (l) => l.sentAt ? new Date(l.sentAt).toLocaleString('vi-VN') : '-' },
    { header: 'Opened', accessor: (l) => l.openedAt ? new Date(l.openedAt).toLocaleString('vi-VN') : 'No' },
    { header: 'Clicked', accessor: (l) => l.clickedAt ? new Date(l.clickedAt).toLocaleString('vi-VN') : 'No' },
  ]
  const hasSubscriptionGateError = isSubscriptionGateError(errorDetail)

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Chiến dịch email"
        subtitle="Soạn, đặt lịch và theo dõi email gửi tới người tham dự sự kiện."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate(`/organizations/${organizationId}/events/${eventId}`)}>
              Về sự kiện
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/organizations/${organizationId}/events`)}>
              Danh sách sự kiện
            </Button>
            <Button leftIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)} disabled={hasSubscriptionGateError}>
              Soạn email mới
            </Button>
          </div>
        }
      />

      {hasSubscriptionGateError ? (
        <SubscriptionGateBanner error={errorDetail} organizationId={organizationId} />
      ) : (
        error && <AlertBanner variant="error" message={error} />
      )}

      {activeCampaign ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setActiveCampaign(null)}>
                <ArrowLeft size={16} className="mr-1" /> Back to Campaigns
              </Button>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Logs: {activeCampaign.subject}</h3>
                <p className="text-sm text-neutral-500">Delivery status for this campaign</p>
              </div>
            </div>
          </div>

          <Card>
            {logsLoading ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : (
              <DataTable
                columns={logColumns}
                data={logs}
                emptyText="No delivery logs yet"
                pagination={{
                  currentPage: logsPagination.currentPage,
                  totalPages: logsPagination.totalPages,
                  onPageChange: (p) => fetchLogs(activeCampaign.id, p)
                }}
              />
            )}
          </Card>
        </div>
      ) : (
        <Card>
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <DataTable
              columns={campaignColumns}
              data={campaigns}
              emptyText={<EmptyState 
                icon={<Mail size={48} />} 
                title="No campaigns yet" 
                description="Create your first email campaign to reach out to your attendees."
                action={<Button onClick={() => setCreateOpen(true)} disabled={hasSubscriptionGateError}>Create Campaign</Button>}
              />}
              pagination={{
                currentPage: pagination.currentPage,
                totalPages: pagination.totalPages,
                onPageChange: (p) => fetchCampaigns(p)
              }}
            />
          )}
        </Card>
      )}

      <Modal
        open={createOpen}
        title="Soạn chiến dịch email"
        size="xl"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={formLoading}>Hủy</Button>
            <Button onClick={handleCreate} loading={formLoading}>Lưu bản nháp</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Tên campaign" error={formErrors.name}>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Nhắc lịch check-in khách mời"
            />
          </FormField>

          <FormField 
            label="Tiêu đề email" 
            error={formErrors.subject}
          >
            <Input
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="VD: Thông tin check-in sự kiện EventFlow"
            />
          </FormField>

          <div className="rounded-xl border border-primary/20 bg-primary-bg p-3">
            <p className="text-sm font-semibold text-neutral-900">Soạn bằng AI (tùy chọn)</p>
            <p className="mb-3 mt-1 text-xs text-neutral-600">Mỗi lần sinh nội dung sử dụng 1 AI credit. Bạn luôn được chỉnh sửa trước khi gửi.</p>
            <FormField label="Mục tiêu email" error={formErrors.aiBrief}>
              <Textarea value={aiBrief} onChange={(event) => setAiBrief(event.target.value)} rows={2} placeholder="Ví dụ: nhắc khách mời check-in trước 30 phút và mang theo mã QR." />
            </FormField>
            <div className="mt-3 flex gap-2">
              <Input value={aiTone} onChange={(event) => setAiTone(event.target.value)} placeholder="Giọng điệu" />
              <Button type="button" onClick={handleGenerateContent} loading={aiLoading}>Soạn bằng AI</Button>
            </div>
          </div>

          <FormField label="Nội dung email" error={formErrors.htmlContent}>
            <RichTextEditor
              value={formData.htmlContent}
              onChange={(htmlContent) => setFormData((current) => ({ ...current, htmlContent }))}
              error={formErrors.htmlContent}
            />
          </FormField>

          <FormField 
            label="Nhóm người nhận" 
            error={formErrors.segment}
          >
            <Select value={formData.segment} onChange={(e) => setFormData({ ...formData, segment: e.target.value })}>
              {SEGMENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
          {formData.segment === 'CUSTOM_EMAILS' ? (
            <FormField label="Email tùy chọn" error={formErrors.customEmails}>
              <Textarea
                value={formData.customEmails}
                onChange={(e) => setFormData({ ...formData, customEmails: e.target.value })}
                placeholder="maria@example.com, minh@example.com"
                rows={3}
              />
            </FormField>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={scheduleOpen}
        title={`Schedule: ${selectedCampaign?.subject || ''}`}
        onClose={() => setScheduleOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setScheduleOpen(false)} disabled={scheduleLoading}>Cancel</Button>
            <Button onClick={handleSchedule} loading={scheduleLoading}>Schedule</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField 
            label="Send Date & Time" 
            error={scheduleErrors.scheduledAt}
          >
            <Input
              type="datetime-local"
              value={scheduleData.scheduledAt}
              onChange={(e) => setScheduleData({ ...scheduleData, scheduledAt: e.target.value })}
              min={new Date().toISOString().slice(0, 16)}
            />
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog
        open={sendConfirmOpen}
        title="Send Campaign Now?"
        description={`Are you sure you want to send "${selectedCampaign?.subject}" immediately to all recipients?`}
        onClose={() => setSendConfirmOpen(false)}
        onConfirm={handleSendNow}
      />
    </div>
  )
}

export default EmailCampaignsPage
