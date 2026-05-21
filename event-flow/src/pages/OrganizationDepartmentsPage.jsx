import { useState } from 'react'
import { useParams } from 'react-router-dom'

import OrganizationDepartmentsSection from '../features/departments/OrganizationDepartmentsSection'
import OrganizationCaseLayout from '../features/organizations/OrganizationCaseLayout'

function OrganizationDepartmentsPage() {
  const { organizationId } = useParams()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  return (
    <OrganizationCaseLayout error={error} successMessage={successMessage} onError={setError}>
      {() => (
        <OrganizationDepartmentsSection
          organizationId={Number(organizationId)}
          onError={setError}
          onSuccess={setSuccessMessage}
        />
      )}
    </OrganizationCaseLayout>
  )
}

export default OrganizationDepartmentsPage
