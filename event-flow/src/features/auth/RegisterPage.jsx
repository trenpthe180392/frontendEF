import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Zap, User } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import FormField from '../../components/form/FormField'
import { AlertBanner } from '../../components/feedback/Toast'
import { authApi } from '../../api'
import { getErrorMessage } from '../../utils'

function RegisterPage() {
  const navigate = useNavigate()

  // State quản lý form đăng ký theo cấu trúc dữ liệu Backend yêu cầu (RegisterRequest)
  const [form, setForm] = useState({ userName: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  
  // Trạng thái thông báo từ API (Thành công hoặc Thất bại)
  const [apiStatus, setApiStatus] = useState({ type: null, message: null })
  const [isLoading, setIsLoading] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  // Khối logic kiểm tra dữ liệu đầu vào (Validation) trước khi gửi lên Spring Boot
  function validate() {
    const errs = {}
    if (!form.userName.trim()) errs.userName = 'Vui lòng nhập họ và tên'
    
    if (!form.email.trim()) {
      errs.email = 'Vui lòng nhập email'
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = 'Email không đúng định dạng'
    }

    if (!form.password) {
      errs.password = 'Vui lòng nhập mật khẩu'
    } else if (form.password.length < 6) {
      errs.password = 'Mật khẩu phải chứa ít nhất 6 ký tự'
    }

    if (!form.confirmPassword) {
      errs.confirmPassword = 'Vui lòng xác nhận lại mật khẩu'
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Mật khẩu xác nhận không trùng khớp'
    }

    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setIsLoading(true)
    setApiStatus({ type: null, message: null })
    
    try {
      // Gọi sang API @PostMapping("/register") ở Spring Boot Backend của bạn
      // Truyền object chứa userName, email, password
      const response = await authApi.register({
        userName: form.userName,
        email: form.email,
        password: form.password
      })
      
      // Hiển thị thông báo thành công từ Backend: "Đăng ký hoàn tất. Hãy kiểm tra email..."
      setApiStatus({ 
        type: 'success', 
        message: response.data || 'Đăng ký thành công! Vui lòng kiểm tra email kích hoạt.' 
      })

      // Xóa sạch form sau khi đăng ký thành công
      setForm({ userName: '', email: '', password: '', confirmPassword: '' })

    } catch (err) {
      setApiStatus({ type: 'error', message: getErrorMessage(err) })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo hệ thống đồng bộ trang Login */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-btn">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">EventFlow</h1>
          <p className="text-sm text-neutral-500 mt-1">Tạo tài khoản mới để trải nghiệm</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl border border-neutral-300 shadow-sm p-6">
          {/* Thông báo động dựa trên phản hồi của Backend */}
          {apiStatus.message && (
            <AlertBanner 
              variant={apiStatus.type} 
              message={apiStatus.message} 
              className="mb-4" 
            />
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Trường Họ và Tên */}
            <FormField label="Họ và tên" error={errors.userName} required>
              <Input
                name="userName"
                value={form.userName}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                leftIcon={<User size={14} />}
                error={errors.userName}
                autoComplete="name"
              />
            </FormField>

            {/* Trường Email */}
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

            {/* Trường Mật khẩu */}
            <FormField label="Mật khẩu" error={errors.password} required>
              <Input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Tối thiểu 6 ký tự"
                leftIcon={<Lock size={14} />}
                error={errors.password}
                autoComplete="new-password"
              />
            </FormField>

            {/* Trường Xác nhận mật khẩu */}
            <FormField label="Xác nhận mật khẩu" error={errors.confirmPassword} required>
              <Input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                leftIcon={<Lock size={14} />}
                error={errors.confirmPassword}
                autoComplete="new-password"
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              className="w-full mt-2"
            >
              Đăng ký tài khoản
            </Button>
          </form>
        </div>

        {/* Link quay lại trang Đăng nhập */}
        <p className="text-center text-sm text-neutral-600 mt-6">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage