import { useEffect, useState } from 'react'
import { CheckCircle2, MailX, RefreshCw, TriangleAlert } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { publicEmailApi } from '../api'
import Card from '../components/layout/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { getErrorMessage } from '../utils'

function PublicEmailUnsubscribePage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim()
  const [isLoading, setIsLoading] = useState(Boolean(token))
  const [error, setError] = useState(token ? null : 'Liên kết hủy nhận email không hợp lệ hoặc thiếu token.')
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!token) return

    let isMounted = true

    async function unsubscribe() {
      setIsLoading(true)
      setError(null)
      setResult(null)

      try {
        const data = await publicEmailApi.unsubscribeByToken(token)
        if (isMounted) {
          setResult(normalizeUnsubscribeResponse(data))
        }
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err, 'Token hủy nhận email đã hết hạn hoặc không hợp lệ.'))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    unsubscribe()

    return () => {
      isMounted = false
    }
  }, [token])

  async function handleRetry() {
    if (!token) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await publicEmailApi.unsubscribeByToken(token)
      setResult(normalizeUnsubscribeResponse(data))
    } catch (err) {
      setError(getErrorMessage(err, 'Token hủy nhận email đã hết hạn hoặc không hợp lệ.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8 text-neutral-700">
      <section className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-lg items-center justify-center">
        <Card className="w-full">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-bg text-primary">
              <MailX size={24} />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-neutral-900">Hủy nhận email EventFlow</h1>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              EventFlow đang xử lý yêu cầu hủy nhận email chiến dịch từ liên kết của bạn.
            </p>
          </div>

          {isLoading ? (
            <UnsubscribeLoading />
          ) : error ? (
            <UnsubscribeError message={error} canRetry={Boolean(token)} onRetry={handleRetry} />
          ) : (
            <UnsubscribeSuccess result={result} />
          )}
        </Card>
      </section>
    </main>
  )
}

function UnsubscribeLoading() {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50">
      <Spinner size="lg" />
      <p className="text-sm font-medium text-neutral-600">Đang xác nhận hủy nhận email...</p>
    </div>
  )
}

function UnsubscribeSuccess({ result }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-success/20 bg-success-bg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-success" />
          <div>
            <p className="text-sm font-bold text-neutral-900">Đã hủy nhận email</p>
            <p className="mt-1 text-sm leading-6 text-neutral-700">
              {result?.message || 'Bạn sẽ không còn nhận email chiến dịch từ EventFlow cho địa chỉ này.'}
            </p>
            {result?.email ? (
              <p className="mt-2 break-words text-xs font-semibold text-neutral-600">{result.email}</p>
            ) : null}
          </div>
        </div>
      </div>

      <Link
        to="/login"
        className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm transition hover:border-primary/40 hover:bg-primary-bg hover:text-primary-dark"
      >
        Quay lại EventFlow
      </Link>
    </div>
  )
}

function UnsubscribeError({ message, canRetry, onRetry }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-danger/20 bg-danger-bg p-4">
        <div className="flex items-start gap-3">
          <TriangleAlert size={20} className="mt-0.5 shrink-0 text-danger" />
          <div>
            <p className="text-sm font-bold text-neutral-900">Không thể hủy nhận email</p>
            <p className="mt-1 text-sm leading-6 text-neutral-700">{message}</p>
          </div>
        </div>
      </div>

      {canRetry ? (
        <Button type="button" variant="secondary" className="w-full" leftIcon={<RefreshCw size={16} />} onClick={onRetry}>
          Thử lại
        </Button>
      ) : null}

      <Link
        to="/login"
        className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm transition hover:border-primary/40 hover:bg-primary-bg hover:text-primary-dark"
      >
        Quay lại EventFlow
      </Link>
    </div>
  )
}

function normalizeUnsubscribeResponse(data) {
  return {
    email: data?.email || '',
    message: data?.message || 'Unsubscribed successfully',
  }
}

export default PublicEmailUnsubscribePage
