import { useEffect, useState } from 'react'
import { CheckCircle2, MailOpen, TriangleAlert, UserCheck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { organizationMemberApi } from '../api'
import { unwrapResponse } from '../api/response'
import AlertBanner from '../components/feedback/AlertBanner'
import Card from '../components/layout/Card'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import { getErrorMessage } from '../utils'

function InvitationConfirmPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim()
  const [isLoading, setIsLoading] = useState(Boolean(token))
  const [error, setError] = useState(token ? null : 'Liên kết lời mời không hợp lệ hoặc thiếu token.')
  const [member, setMember] = useState(null)

  useEffect(() => {
    if (!token) return

    let isMounted = true

    async function confirmInvitation() {
      setIsLoading(true)
      setError(null)
      setMember(null)

      try {
        const response = await organizationMemberApi.confirmInvitation(token)
        const data = unwrapResponse(response)
        if (isMounted) {
          setMember(data || {})
        }
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err, 'Lời mời đã hết hạn, đã được sử dụng hoặc không hợp lệ.'))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    confirmInvitation()

    return () => {
      isMounted = false
    }
  }, [token])

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8 text-neutral-700">
      <section className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-lg items-center justify-center">
        <Card className="w-full">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-bg text-primary">
              <MailOpen size={24} />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-neutral-900">Xác nhận lời mời workspace</h1>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              EventFlow đang kiểm tra lời mời tham gia workspace của bạn.
            </p>
          </div>

          {isLoading ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50">
              <Spinner size="lg" />
              <p className="text-sm font-medium text-neutral-600">Đang xác nhận lời mời...</p>
            </div>
          ) : error ? (
            <InvitationError message={error} />
          ) : (
            <InvitationSuccess member={member} />
          )}
        </Card>
      </section>
    </main>
  )
}

function InvitationSuccess({ member }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-success/20 bg-success-bg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-success" />
          <div>
            <p className="text-sm font-bold text-neutral-900">Đã tham gia workspace</p>
            <p className="mt-1 text-sm leading-6 text-neutral-700">
              Lời mời đã được xác nhận. Bạn có thể đăng nhập để mở workspace và tiếp tục làm việc.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex items-start gap-3">
          <UserCheck size={20} className="mt-0.5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-neutral-900">
              {member?.organizationName || 'Workspace EventFlow'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="info">{member?.role || 'MEMBER'}</Badge>
              <Badge variant="success">{member?.status || 'ACTIVE'}</Badge>
            </div>
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

function InvitationError({ message }) {
  return (
    <div className="space-y-4">
      <AlertBanner variant="error" message={message} />
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex items-start gap-3">
          <TriangleAlert size={20} className="mt-0.5 shrink-0 text-warning" />
          <p className="text-sm leading-6 text-neutral-700">
            Vui lòng yêu cầu quản trị viên gửi lại lời mời nếu liên kết đã hết hạn hoặc đã được sử dụng.
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

export default InvitationConfirmPage
