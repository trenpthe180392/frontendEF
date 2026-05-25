import { useEffect, useState } from 'react'
import { CheckCircle2, MailCheck, TriangleAlert } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { authApi } from '../api'
import { getApiMessage, unwrapResponse } from '../api/response'
import AlertBanner from '../components/feedback/AlertBanner'
import Card from '../components/layout/Card'
import Spinner from '../components/ui/Spinner'
import { getErrorMessage } from '../utils'

function AuthConfirmPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim()
  const [isLoading, setIsLoading] = useState(Boolean(token))
  const [error, setError] = useState(token ? null : 'Liên kết xác nhận không hợp lệ hoặc thiếu token.')
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (!token) return

    let isMounted = true

    async function confirmAccount() {
      setIsLoading(true)
      setError(null)
      setMessage(null)

      try {
        const response = await authApi.confirm(token)
        const body = unwrapResponse(response)
        if (isMounted) {
          setMessage(getApiMessage(response, body?.message || 'Tài khoản đã được xác nhận thành công.'))
        }
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err, 'Liên kết xác nhận đã hết hạn hoặc không hợp lệ.'))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    confirmAccount()

    return () => {
      isMounted = false
    }
  }, [token])

  return (
    <PublicConfirmShell
      icon={<MailCheck size={24} />}
      title="Xác nhận tài khoản"
      subtitle="EventFlow đang kiểm tra liên kết xác nhận email của bạn."
    >
      {isLoading ? (
        <ConfirmLoading message="Đang xác nhận tài khoản..." />
      ) : error ? (
        <ConfirmError message={error} />
      ) : (
        <ConfirmSuccess message={message || 'Tài khoản đã được xác nhận thành công.'} />
      )}
    </PublicConfirmShell>
  )
}

function PublicConfirmShell({ icon, title, subtitle, children }) {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8 text-neutral-700">
      <section className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-lg items-center justify-center">
        <Card className="w-full">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-bg text-primary">
              {icon}
            </div>
            <h1 className="mt-4 text-2xl font-bold text-neutral-900">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-neutral-500">{subtitle}</p>
          </div>
          {children}
        </Card>
      </section>
    </main>
  )
}

function ConfirmLoading({ message }) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50">
      <Spinner size="lg" />
      <p className="text-sm font-medium text-neutral-600">{message}</p>
    </div>
  )
}

function ConfirmSuccess({ message }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-success/20 bg-success-bg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-success" />
          <div>
            <p className="text-sm font-bold text-neutral-900">Xác nhận thành công</p>
            <p className="mt-1 text-sm leading-6 text-neutral-700">{message}</p>
          </div>
        </div>
      </div>
      <Link
        to="/login"
        className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-btn transition hover:bg-primary-light"
      >
        Đăng nhập
      </Link>
    </div>
  )
}

function ConfirmError({ message }) {
  return (
    <div className="space-y-4">
      <AlertBanner variant="error" message={message} />
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex items-start gap-3">
          <TriangleAlert size={20} className="mt-0.5 shrink-0 text-warning" />
          <p className="text-sm leading-6 text-neutral-700">
            Vui lòng kiểm tra lại email mới nhất từ EventFlow hoặc đăng ký lại nếu liên kết đã hết hạn.
          </p>
        </div>
      </div>
      <Link
        to="/login"
        className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm transition hover:border-primary/40 hover:bg-primary-bg hover:text-primary-dark"
      >
        Quay lại đăng nhập
      </Link>
    </div>
  )
}

export default AuthConfirmPage
