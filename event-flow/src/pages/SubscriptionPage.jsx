import { CreditCard } from 'lucide-react'

import Card from '../components/layout/Card'

function SubscriptionPage() {
  return (
    <main className="min-h-[calc(100vh-129px)] bg-neutral-100 p-6 text-neutral-700">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-bg text-primary">
              <CreditCard size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Gói đăng ký</h1>
              <p className="mt-1 text-sm text-neutral-500">Trang này được tạo để gắn link trước. Nội dung gói sẽ xử lý sau.</p>
            </div>
          </div>
        </section>

        <Card title="Nội dung đang để trống">
          <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
            <p className="text-sm font-semibold text-neutral-900">Khu vực đăng ký gói sẽ được bổ sung sau.</p>
            <p className="mt-2 text-sm text-neutral-500">Hiện tại trang này chỉ đóng vai trò điều hướng từ header.</p>
          </div>
        </Card>
      </div>
    </main>
  )
}

export default SubscriptionPage
