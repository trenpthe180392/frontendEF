import Button from '../components/ui/Button'
import useAuthStore from '../store/authStore'

function DashboardPage() {
  const { user, logout } = useAuthStore()

  function handleLogout() {
    logout()
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-6 text-neutral-700">
      <section className="mx-auto max-w-5xl rounded-xl border border-neutral-300 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-primary">EventFlow</p>
        <h1 className="mt-2 text-2xl font-bold text-neutral-900">Đăng nhập thành công</h1>
        <p className="mt-2 text-sm text-neutral-500">
          {user?.userName || user?.email || 'Người dùng'} đã có phiên đăng nhập hợp lệ.
        </p>
        <div className="mt-6">
          <Button variant="secondary" onClick={handleLogout}>
            Đăng xuất
          </Button>
        </div>
      </section>
    </main>
  )
}

export default DashboardPage
