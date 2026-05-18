import PageHeader from '../components/layout/PageHeader'
import Card from '../components/layout/Card'

function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Tổng quan hoạt động sự kiện"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card title="Sự kiện đang diễn ra">
          <p className="text-sm text-neutral-500">Chưa có dữ liệu</p>
        </Card>
        <Card title="Công việc hôm nay">
          <p className="text-sm text-neutral-500">Chưa có dữ liệu</p>
        </Card>
        <Card title="Vấn đề cần xử lý">
          <p className="text-sm text-neutral-500">Chưa có dữ liệu</p>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage
