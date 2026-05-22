import { Building2, GraduationCap, Network, Rocket, ShieldCheck, Users } from 'lucide-react'

import Card from '../components/layout/Card'

const values = [
  {
    icon: <Network size={20} />,
    title: 'Quản lý tập trung',
    description: 'Tổ chức, sự kiện, đội nhóm, lịch trình và công việc được gom về một không gian vận hành.',
  },
  {
    icon: <Users size={20} />,
    title: 'Làm việc theo đội',
    description: 'Mỗi đội nhóm có thành viên, vai trò, task và lịch riêng để giảm nhầm lẫn khi triển khai.',
  },
  {
    icon: <ShieldCheck size={20} />,
    title: 'Phân quyền rõ ràng',
    description: 'EventFlow ưu tiên mô hình quyền theo tổ chức, sự kiện và đội nhóm để dữ liệu được kiểm soát đúng phạm vi.',
  },
]

function AboutPage() {
  return (
    <main className="min-h-[calc(100vh-129px)] bg-neutral-100 p-6 text-neutral-700">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-center">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white">
                <Network size={24} />
              </div>
              <h1 className="mt-5 text-3xl font-bold text-neutral-900">About EventFlow</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-neutral-600">
                EventFlow là sản phẩm của nhóm khởi nghiệp EXE tại Trường Đại học FPT Hà Nội, hướng tới việc giúp ban tổ chức quản lý sự kiện nội bộ mạch lạc hơn từ khâu lập kế hoạch đến vận hành thực tế.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <InfoRow icon={<Rocket size={18} />} label="Dự án" value="EventFlow" />
              <InfoRow icon={<GraduationCap size={18} />} label="Đơn vị" value="FPT University Hà Nội" />
              <InfoRow icon={<Building2 size={18} />} label="Chương trình" value="EXE Startup Project" />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {values.map((item) => (
            <Card key={item.title} title={item.title}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-bg text-primary">
                {item.icon}
              </div>
              <p className="mt-4 text-sm leading-6 text-neutral-600">{item.description}</p>
            </Card>
          ))}
        </div>

        <Card title="Chúng tôi đang xây dựng điều gì?">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <p className="text-sm leading-6 text-neutral-600">
              Mục tiêu của EventFlow là tạo ra một dashboard vận hành đủ rõ để trưởng sự kiện biết việc gì đang diễn ra, đội nào đang phụ trách, lịch nào cần theo dõi và ai là người chịu trách nhiệm.
            </p>
            <p className="text-sm leading-6 text-neutral-600">
              Sản phẩm tập trung vào trải nghiệm quản lý thực dụng: ít rối, dễ quét, có phân quyền, có lịch và công việc theo từng phạm vi để phù hợp với các sự kiện nhiều đội nhóm.
            </p>
          </div>
        </Card>
      </div>
    </main>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 border-b border-neutral-200 py-3 last:border-b-0">
      <span className="text-primary">{icon}</span>
      <span>
        <span className="block text-xs font-bold uppercase text-neutral-500">{label}</span>
        <span className="block text-sm font-semibold text-neutral-900">{value}</span>
      </span>
    </div>
  )
}

export default AboutPage
