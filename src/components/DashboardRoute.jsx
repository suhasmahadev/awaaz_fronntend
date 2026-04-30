import AdminPanel from "../pages/AdminPanel.jsx";
import NGODashboard from "../pages/NGODashboard.jsx";
import Navbar from "./Navbar.jsx"; // Need to import Navbar

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    width: '100%',
  },
};

export default function DashboardRoute() {
  const role = localStorage.getItem("role");
  return (
    <div style={styles.wrapper}>
      <Navbar />
      <div style={styles.content}>
        {role === "admin" ? <AdminPanel /> : <NGODashboard />}
      </div>
    </div>
  );
}
