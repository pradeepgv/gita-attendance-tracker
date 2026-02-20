import { Routes, Route, Link, useLocation } from 'react-router-dom';
import AttendancePage from './pages/AttendancePage';
import AdminPage from './pages/AdminPage';

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-orange-50">
      <nav className="bg-saffron-600 shadow-lg">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🙏</span>
              <h1 className="text-white font-bold text-lg">Pemulwuy - Bhagavad Gita Class Attendance</h1>
            </div>
            <div className="flex gap-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'bg-saffron-700 text-white'
                    : 'text-saffron-100 hover:bg-saffron-500'
                }`}
              >
                Mark Attendance
              </Link>
              <Link
                to="/admin"
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  location.pathname === '/admin'
                    ? 'bg-saffron-700 text-white'
                    : 'text-saffron-100 hover:bg-saffron-500'
                }`}
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<AttendancePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
