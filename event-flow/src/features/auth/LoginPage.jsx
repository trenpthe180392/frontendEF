import { useState } from 'react'
import { Facebook, Lock, Mail, Zap } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import AlertBanner from '../../components/feedback/AlertBanner'
import FormField from '../../components/form/FormField'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { authApi } from '../../api'
import useAuthStore from '../../store/authStore'
import { getErrorMessage } from '../../utils'

const defaultForm = {
  email: '',
  password: '',
}

function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, setAuth } = useAuthStore()
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/organizations" replace />
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: null }))
    setError(null)
  }

  function validateForm() {
    const nextErrors = {}
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!form.email.trim()) {
      nextErrors.email = 'Vui lòng nhập email'
    } else if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = 'Email không hợp lệ'
    }

    if (!form.password) {
      nextErrors.password = 'Vui lòng nhập mật khẩu'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await authApi.login({
        email: form.email.trim(),
        password: form.password,
      })
      const { token, userName, email } = response.data

      setAuth({ userName, email }, token)
      setForm(defaultForm)
      navigate('/organizations', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  function handleFacebookLogin() {
    window.location.href = 'http://localhost:8080/api/v1/oauth2/authorization/facebook'
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
            <h1 className="mt-4 text-2xl font-bold text-neutral-900">EventFlow</h1>
            <p className="mt-2 text-sm text-neutral-500">Đăng nhập để tiếp tục</p>
          </div>

          <div className="space-y-4">
              {isLoading && (
                <div className="rounded-lg border border-info/20 bg-info-bg p-3 text-sm font-medium text-info">
                  Đang xác thực tài khoản...
                </div>
              )}
              <AlertBanner variant="error" message={error} />

              <form className="space-y-4" onSubmit={handleSubmit}>
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

                <FormField label="Mật khẩu" required error={errors.password}>
                  <Input
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    error={errors.password}
                    leftIcon={<Lock size={16} />}
                    placeholder="Nhập mật khẩu"
                  />
                </FormField>

                <Button type="submit" className="w-full" loading={isLoading}>
                  Đăng nhập
                </Button>
              </form>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-neutral-300" />
                <span className="text-xs font-medium text-neutral-500">Hoặc</span>
                <div className="h-px flex-1 bg-neutral-300" />
              </div>

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                leftIcon={<Facebook size={18} />}
                onClick={handleFacebookLogin}
              >
                Tiếp tục với Facebook
              </Button>

              <div className="text-center text-sm text-neutral-500">
                Chưa có tài khoản?{' '}
                <Link className="font-semibold text-primary hover:text-primary-dark" to="/register">
                  Đăng ký
                </Link>
              </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
