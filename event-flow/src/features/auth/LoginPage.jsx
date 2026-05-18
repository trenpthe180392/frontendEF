import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Zap } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import FormField from '../../components/form/FormField'
import { AlertBanner } from '../../components/feedback/Toast'
import { authApi } from '../../api'
import useAuthStore from '../../store/authStore'
import { getErrorMessage } from '../../utils'

function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  // 1. Đổi tên key trong state thành email
  const [form, setForm]       = useState({ email: '', password: '' })
  const [errors, setErrors]   = useState({})
  const [apiError, setApiError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  // 2. Cập nhật hàm validate theo biến email
  function validate() {
    const errs = {}
    if (!form.email.trim()) errs.email = 'Vui lòng nhập email'
    if (!form.password)     errs.password = 'Vui lòng nhập mật khẩu'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setIsLoading(true)
    setApiError(null)
    
    try {
      // 3. Không cần bước tạo payload trung gian phức tạp nữa, truyền thẳng form đi luôn
      const { data } = await authApi.login(form)
      
      // Gom dữ liệu user trả về từ Java thành một object gọn gàng
      const userObj = {
        userName: data.userName,
        email: data.email
      }
      
      setAuth(userObj, data.token)
      navigate('/dashboard')
      
    } catch (err) {
      setApiError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-btn">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">EventFlow</h1>
          <p className="text-sm text-neutral-500 mt-1">Đăng nhập để tiếp tục</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-neutral-300 shadow-sm p-6">
          {apiError && (
            <AlertBanner variant="error" message={apiError} className="mb-4" />
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* 4. Đổi Label và các biến quản lý lỗi thành email */}
            <FormField label="Email" error={errors.email} required>
              <Input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@gmail.com"
                leftIcon={<Mail size={14} />}
                error={errors.email}
                autoComplete="email"
              />
            </FormField>

            <FormField label="Mật khẩu" error={errors.password} required>
              <Input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                leftIcon={<Lock size={14} />}
                error={errors.password}
                autoComplete="current-password"
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              className="w-full mt-2"
            >
              Đăng nhập
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage