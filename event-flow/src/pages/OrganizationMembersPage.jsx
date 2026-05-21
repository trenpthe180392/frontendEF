import { useState } from 'react'
import { useParams } from 'react-router-dom'

import OrganizationCaseLayout from '../features/organizations/OrganizationCaseLayout'
import OrganizationMembersSection from '../features/organizations/OrganizationMembersSection'

function OrganizationMembersPage() {
  const { organizationId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <OrganizationCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {() => (
        <OrganizationMembersSection
          organizationId={Number(organizationId)}
          onError={setError}
          onSuccess={setSuccessMessage}
        />
      )}
    </OrganizationCaseLayout>
  )
}

export default OrganizationMembersPage
