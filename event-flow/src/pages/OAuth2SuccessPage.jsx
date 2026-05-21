import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import Spinner from '../components/ui/Spinner'
import useAuthStore from '../store/authStore'

function OAuth2SuccessPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const hasProcessed = useRef(false)

  useEffect(() => {
    if (hasProcessed.current) return
    hasProcessed.current = true

    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const userName = params.get('userName')
    const email = params.get('email')

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    setAuth({ userName, email }, token)
    navigate('/organizations', { replace: true })
  }, [navigate, setAuth])

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="flex items-center gap-3 rounded-lg border border-neutral-300 bg-white p-4 shadow-sm">
        <Spinner />
        <p className="text-sm font-medium text-neutral-700">Đang thiết lập phiên đăng nhập...</p>
      </div>
    </main>
  )
}

export default OAuth2SuccessPage
