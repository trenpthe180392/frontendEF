import { useState } from 'react'
import { useParams } from 'react-router-dom'

import OrganizationEventsSection from '../features/events/OrganizationEventsSection'
import OrganizationCaseLayout from '../features/organizations/OrganizationCaseLayout'

function OrganizationEventsPage() {
  const { organizationId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <OrganizationCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {(_, context) => (
        <OrganizationEventsSection
          organizationId={Number(organizationId)}
          onError={setError}
          onSuccess={setSuccessMessage}
          permissions={context.permissions}
        />
      )}
    </OrganizationCaseLayout>
  )
}

export default OrganizationEventsPage
