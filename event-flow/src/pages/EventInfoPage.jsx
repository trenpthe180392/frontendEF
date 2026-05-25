import { useState } from 'react'

import EventCaseLayout, { EventInfoPanel } from '../features/events/EventCaseLayout'

function EventInfoPage() {
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <EventCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {({ eventDetail, organizationId, reloadEvent }) => (
        <EventInfoPanel
          eventDetail={eventDetail}
          organizationId={organizationId}
          onError={setError}
          onSuccess={setSuccessMessage}
          onReload={reloadEvent}
        />
      )}
    </EventCaseLayout>
  )
}

export default EventInfoPage
