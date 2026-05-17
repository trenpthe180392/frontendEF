import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Footer from "../components/layout/Footer";
import "../styles/homepage.css";

function HomePage() {
  return (
    <div className="home-page">
      <Navbar />

      <div className="home-body">
        <Sidebar />

        <main className="home-main">
          <h1>EventFlow Management System</h1>

          <p>Beta dashboard version</p>

          <div className="stats-grid">
            <div className="stat-card">
              <h2>Total Events</h2>
              <p className="primary">24</p>
            </div>

            <div className="stat-card">
              <h2>Tasks</h2>
              <p className="secondary">58</p>
            </div>

            <div className="stat-card">
              <h2>Users</h2>
              <p className="info">132</p>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default HomePage;