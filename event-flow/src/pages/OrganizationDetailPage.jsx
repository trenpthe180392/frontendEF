import { useState } from 'react'

import OrganizationCaseLayout from '../features/organizations/OrganizationCaseLayout'
import OrganizationInfoPanel from '../features/organizations/OrganizationInfoPanel'

function OrganizationDetailPage() {
  const [error, setError] = useState(null)
  const [successMessage] = useState(null)

  return (
    <OrganizationCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {(organization) => (
        <OrganizationInfoPanel
          organization={organization}
          memberCount={organization.memberCount}
          departmentCount={organization.departmentCount}
        />
      )}
    </OrganizationCaseLayout>
  )
}

export default OrganizationDetailPage
