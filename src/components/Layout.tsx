import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import './Layout.css'

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, partner, logout } = useAuthStore()

  const menuItems = [
    { path: '/', label: '대시보드', icon: '📊' },
    { path: '/salary', label: '월급', icon: '💰' },
    { path: '/fixed-expense', label: '고정비', icon: '📅' },
    { path: '/living-expense', label: '생활비', icon: '🛒' },
    { path: '/allowance', label: '용돈', icon: '💵' },
    { path: '/ledger', label: '가계부', icon: '📖' },
    { path: '/savings', label: '적금/비상금', icon: '🏦' },
    { path: '/investment', label: '투자', icon: '📈' },
    { path: '/goal', label: '목표', icon: '🎯' },
  ]

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout()
      navigate('/login')
    }
  }

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="layout-header-content">
          <h1 className="layout-title">부부 돈 관리</h1>
          <div className="layout-user-info">
            <span>{user?.name}</span>
            <span className="layout-separator">×</span>
            <span>{partner?.name}</span>
            <button className="layout-logout-btn" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </div>
      </header>
      <div className="layout-body">
        <nav className="layout-sidebar">
          <ul className="layout-menu">
            {menuItems.map((item) => (
              <li key={item.path}>
                <button
                  className={`layout-menu-item ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  <span className="layout-menu-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <main className="layout-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout

