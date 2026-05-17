import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import Footer from "../../components/layout/Footer";

function DashboardPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold text-neutral-900">
            Dashboard
          </h1>

          <p className="mt-2 text-neutral-500">
            Welcome to EventFlow Management System.
          </p>
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default DashboardPage;