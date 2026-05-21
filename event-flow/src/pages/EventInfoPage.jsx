import { useState } from 'react'

import EventCaseLayout, { EventInfoPanel } from '../features/events/EventCaseLayout'

function EventInfoPage() {
  const [error, setError] = useState(null)
  const [successMessage] = useState(null)

  return (
    <EventCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {({ eventDetail, organizationId }) => <EventInfoPanel eventDetail={eventDetail} organizationId={organizationId} />}
    </EventCaseLayout>
  )
}

export default EventInfoPage
