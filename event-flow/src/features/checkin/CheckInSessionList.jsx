import { ClipboardList, Plus } from 'lucide-react'

import Card from '../../components/layout/Card'
import EmptyState from '../../components/layout/EmptyState'
import Button from '../../components/ui/Button'
import CheckInSessionCard from './CheckInSessionCard'
import CheckInSessionForm from './CheckInSessionForm'

function CheckInSessionList({
  sessions,
  selectedSession,
  form,
  errors,
  editingSession,
  isSubmitting,
  isFormOpen,
  hasSubscriptionGateError,
  deletingSessionId,
  onChange,
  onCancelForm,
  onSubmit,
  onCreateForm,
  onEdit,
  onDelete,
  onSelect,
}) {
  return (
    <Card title="Phiên check-in">
      {isFormOpen ? (
        <CheckInSessionForm
          form={form}
          errors={errors}
          editingSession={editingSession}
          isSubmitting={isSubmitting}
          onChange={onChange}
          onCancel={onCancelForm}
          onSubmit={onSubmit}
        />
      ) : null}

      {sessions.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={24} />}
          title="Chưa có phiên check-in"
          description="Tạo phiên đầu tiên, sau đó vào chi tiết phiên để thêm người tham dự và vận hành check-in."
          action={
            <Button type="button" leftIcon={<Plus size={16} />} onClick={onCreateForm} disabled={hasSubscriptionGateError}>
              Tạo phiên
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {sessions.map((session) => (
            <CheckInSessionCard
              key={session.id}
              session={session}
              selected={selectedSession?.id === session.id}
              deleting={deletingSessionId === session.id}
              onEdit={onEdit}
              onDelete={onDelete}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </Card>
  )
}

export default CheckInSessionList
