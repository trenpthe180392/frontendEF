import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom' // Import thêm Link để chuyển trang
import { Mail, Lock, Zap, Facebook } from 'lucide-react' // Import thêm icon Facebook
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

  const [form, setForm]       = useState({ email: '', password: '' })
  const [errors, setErrors]   = useState({})
  const [apiError, setApiError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

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
      const { data } = await authApi.login(form)
      
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

  // Hàm xử lý khi click Đăng nhập bằng Facebook
  function handleFacebookLogin() {
    // Điều hướng sang URL OAuth2 của Backend Spring Boot
    // Thay đổi URL này cho đúng với cấu hình Spring Security OAuth2 của bạn (ví dụ: /oauth2/authorization/facebook)
    window.location.href = 'http://localhost:8080/api/v1/oauth2/authorization/facebook'
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

        {/* Form Main Container */}
        <div className="bg-white rounded-xl border border-neutral-300 shadow-sm p-6">
          {apiError && (
            <AlertBanner variant="error" message={apiError} className="mb-4" />
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          {/* Đường phân cách HOẶC */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-neutral-200"></div>
            <span className="flex-shrink mx-4 text-xs text-neutral-400 uppercase">Hoặc</span>
            <div className="flex-grow border-t border-neutral-200"></div>
          </div>

          {/* Nút Đăng nhập Facebook */}
          <button
            type="button"
            onClick={handleFacebookLogin}
            className="w-full flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm focus:outline-none"
          >
            <Facebook size={18} fill="currentColor" />
            Tiếp tục với Facebook
          </button>
        </div>

        {/* Link chuyển sang trang Đăng ký */}
        <p className="text-center text-sm text-neutral-600 mt-6">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage