import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Lock, Mail, Phone, User, Zap } from 'lucide-react'

import { authApi } from '../../api'
import { getApiMessage } from '../../api/response'
import AlertBanner from '../../components/feedback/AlertBanner'
import FormField from '../../components/form/FormField'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import useAuthStore from '../../store/authStore'
import { getErrorMessage, getFieldErrors } from '../../utils'

const defaultForm = {
  userName: '',
  email: '',
  number: '',
  password: '',
  confirmPassword: '',
}

function RegisterPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/organizations" replace />
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: null }))
    setError(null)
    setSuccessMessage(null)
  }

  function validateForm() {
    const nextErrors = {}
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phonePattern = /^[0-9+\-\s]{8,20}$/

    if (!form.userName.trim()) nextErrors.userName = 'Vui lòng nhập tên người dùng'
    if (!form.email.trim()) {
      nextErrors.email = 'Vui lòng nhập email'
    } else if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = 'Email không hợp lệ'
    }
    if (!form.number.trim()) {
      nextErrors.number = 'Vui lòng nhập số điện thoại'
    } else if (!phonePattern.test(form.number.trim())) {
      nextErrors.number = 'Số điện thoại không hợp lệ'
    }
    if (!form.password) {
      nextErrors.password = 'Vui lòng nhập mật khẩu'
    } else if (form.password.length < 6) {
      nextErrors.password = 'Mật khẩu tối thiểu 6 ký tự'
    }
    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu'
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Mật khẩu nhập lại không khớp'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await authApi.register({
        userName: form.userName.trim(),
        email: form.email.trim().toLowerCase(),
        number: form.number.trim(),
        password: form.password,
      })
      setForm(defaultForm)
      const message = getApiMessage(response, 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP.')
      setSuccessMessage(message)
      navigate('/verify-otp', {
        state: {
          email: form.email.trim().toLowerCase(),
          message,
        },
      })
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      setErrors((current) => ({ ...current, ...fieldErrors }))
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-50 px-4 py-8 text-neutral-700">
      <div className="login-grid-bg absolute inset-0 opacity-80" />
      <div className="absolute inset-x-0 top-0 h-40 bg-primary-bg/80 blur-3xl" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-64px)] w-full items-center justify-center">
        <div className="login-panel-in w-full max-w-lg rounded-xl border border-neutral-300 bg-white p-6 shadow-lg sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-btn">
              <Zap size={24} />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-neutral-900">Tạo tài khoản EventFlow</h1>
            <p className="mt-2 text-sm text-neutral-500">Đăng ký tài khoản để tham gia quản lý sự kiện nội bộ.</p>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="rounded-lg border border-info/20 bg-info-bg p-3 text-sm font-medium text-info">
                Đang tạo tài khoản...
              </div>
            ) : null}
            <AlertBanner variant="error" message={error} />
            <AlertBanner variant="success" message={successMessage} />

            <form className="space-y-4" onSubmit={handleSubmit}>
              <FormField label="Tên người dùng" required error={errors.userName}>
                <Input
                  name="userName"
                  autoComplete="name"
                  value={form.userName}
                  onChange={handleChange}
                  error={errors.userName}
                  leftIcon={<User size={16} />}
                  placeholder="nguyenvana"
                />
                <p className="mt-1 text-xs text-neutral-500">Tên duy nhất dùng để nhận diện tài khoản; không thể trùng người dùng đang đăng ký hoặc đã kích hoạt.</p>
              </FormField>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Email" required error={errors.email}>
                  <Input
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    error={errors.email}
                    leftIcon={<Mail size={16} />}
                    placeholder="name@example.com"
                  />
                </FormField>

                <FormField label="Số điện thoại" required error={errors.number}>
                  <Input
                    name="number"
                    autoComplete="tel"
                    value={form.number}
                    onChange={handleChange}
                    error={errors.number}
                    leftIcon={<Phone size={16} />}
                    placeholder="0901234567"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Mật khẩu" required error={errors.password}>
                  <Input
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={handleChange}
                    error={errors.password}
                    leftIcon={<Lock size={16} />}
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </FormField>

                <FormField label="Nhập lại mật khẩu" required error={errors.confirmPassword}>
                  <Input
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    leftIcon={<Lock size={16} />}
                    placeholder="Nhập lại mật khẩu"
                  />
                </FormField>
              </div>

              <Button type="submit" className="w-full" loading={isLoading}>
                Đăng ký
              </Button>
            </form>

            <div className="text-center text-sm text-neutral-500">
              Đã có tài khoản?{' '}
              <Link className="font-semibold text-primary hover:text-primary-dark" to="/login">
                Đăng nhập
              </Link>
            </div>

            <div className="flex justify-center">
              <Button type="button" variant="secondary" onClick={() => navigate('/verify-otp', { state: { email: form.email.trim().toLowerCase() } })}>
                Đã có OTP
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default RegisterPage
