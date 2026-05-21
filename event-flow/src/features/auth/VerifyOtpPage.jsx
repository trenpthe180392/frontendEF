import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { KeyRound, Mail, Zap } from 'lucide-react'

import { authApi } from '../../api'
import AlertBanner from '../../components/feedback/AlertBanner'
import FormField from '../../components/form/FormField'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import useAuthStore from '../../store/authStore'
import { getErrorMessage } from '../../utils'

function VerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()
  const [email, setEmail] = useState(location.state?.email || '')
  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(location.state?.message || null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/organizations" replace />
  }

  function validateForm() {
    const nextErrors = {}
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!email.trim()) {
      nextErrors.email = 'Vui lòng nhập email'
    } else if (!emailPattern.test(email.trim())) {
      nextErrors.email = 'Email không hợp lệ'
    }
    if (!otp.trim()) {
      nextErrors.otp = 'Vui lòng nhập OTP'
    } else if (!/^\d{6}$/.test(otp.trim())) {
      nextErrors.otp = 'OTP phải gồm 6 chữ số'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validateForm()) return

    setIsVerifying(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await authApi.verifyOtp({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      })
      setSuccessMessage(response.data || 'Xác thực thành công. Bạn có thể đăng nhập.')
      setOtp('')
      window.setTimeout(() => navigate('/login', { replace: true }), 900)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsVerifying(false)
    }
  }

  async function handleResendOtp() {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim() || !emailPattern.test(email.trim())) {
      setErrors((current) => ({ ...current, email: 'Nhập email hợp lệ để gửi lại OTP' }))
      return
    }

    setIsResending(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await authApi.resendOtp({ email: email.trim().toLowerCase() })
      setSuccessMessage(response.data || 'Đã gửi lại OTP.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-50 px-4 py-8 text-neutral-700">
      <div className="login-grid-bg absolute inset-0 opacity-80" />
      <div className="absolute inset-x-0 top-0 h-40 bg-primary-bg/80 blur-3xl" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-64px)] w-full items-center justify-center">
        <div className="login-panel-in w-full max-w-md rounded-xl border border-neutral-300 bg-white p-6 shadow-lg sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-btn">
              <Zap size={24} />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-neutral-900">Xác thực email</h1>
            <p className="mt-2 text-sm text-neutral-500">Nhập mã OTP 6 chữ số đã gửi tới email đăng ký.</p>
          </div>

          <div className="space-y-4">
            <AlertBanner variant="error" message={error} />
            <AlertBanner variant="success" message={successMessage} />

            <form className="space-y-4" onSubmit={handleSubmit}>
              <FormField label="Email" required error={errors.email}>
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setErrors((current) => ({ ...current, email: null }))
                    setError(null)
                  }}
                  error={errors.email}
                  leftIcon={<Mail size={16} />}
                  placeholder="name@example.com"
                />
              </FormField>

              <FormField label="Mã OTP" required error={errors.otp}>
                <Input
                  name="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => {
                    setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                    setErrors((current) => ({ ...current, otp: null }))
                    setError(null)
                  }}
                  error={errors.otp}
                  leftIcon={<KeyRound size={16} />}
                  placeholder="123456"
                />
              </FormField>

              <Button type="submit" className="w-full" loading={isVerifying}>
                Xác nhận OTP
              </Button>
            </form>

            <Button type="button" variant="secondary" className="w-full" loading={isResending} onClick={handleResendOtp}>
              Gửi lại OTP
            </Button>

            <div className="text-center text-sm text-neutral-500">
              Đã xác thực?{' '}
              <Link className="font-semibold text-primary hover:text-primary-dark" to="/login">
                Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default VerifyOtpPage
