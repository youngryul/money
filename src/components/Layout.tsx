import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import Modal from './Modal'
import Button from './Button'
import './Layout.css'

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, partner, signOut, removePartner } = useAuthStore()
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageModalContent, setMessageModalContent] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null)

  const menuItems = [
    { path: '/', label: '대시보드', icon: '📊' },
    { path: '/salary', label: '수입', icon: '💰' },
    { path: '/fixed-expense', label: '고정비', icon: '📅' },
    { path: '/living-expense', label: '생활비', icon: '🛒' },
    { path: '/allowance', label: '용돈', icon: '💵' },
    { path: '/ledger', label: '지출', icon: '📖' },
    { path: '/savings', label: '적금/비상금', icon: '🏦' },
    { path: '/investment', label: '투자', icon: '📈' },
    { path: '/goal', label: '목표', icon: '🎯' },
  ]

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      try {
        await signOut()
        navigate('/login')
      } catch (error) {
        console.error('로그아웃 오류:', error)
        setMessageModalContent({
          title: '오류',
          message: '로그아웃 중 오류가 발생했습니다.',
          type: 'error',
        })
        setShowMessageModal(true)
      }
    }
  }

  const handleRemovePartnerClick = () => {
    setShowConfirmModal(true)
  }

  const handleConfirmRemovePartner = async () => {
    setShowConfirmModal(false)
    try {
      await removePartner()
      setMessageModalContent({
        title: '완료',
        message: '파트너가 해지되었습니다.',
        type: 'success',
      })
      setShowMessageModal(true)
      setTimeout(() => {
        setShowMessageModal(false)
        navigate('/invite-partner')
      }, 1500)
    } catch (error) {
      console.error('파트너 해지 오류:', error)
      const errorMessage = error instanceof Error ? error.message : '파트너 해지 중 오류가 발생했습니다.'
      setMessageModalContent({
        title: '오류',
        message: errorMessage,
        type: 'error',
      })
      setShowMessageModal(true)
    }
  }

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="layout-header-content">
          <h1 className="layout-title">돈 관리</h1>
          <div className="layout-user-info">
            {partner ? (
              <>
                <span>{user?.name}</span>
                <span className="layout-separator">×</span>
                <span>{partner?.name}</span>
                <button 
                  className="layout-logout-btn" 
                  onClick={handleRemovePartnerClick}
                  style={{ marginLeft: '0.5rem', fontSize: '0.85rem', padding: '0.25rem 0.5rem' }}
                  title="파트너 해지"
                >
                  파트너 해지
                </button>
              </>
            ) : (
              <>
                <span>{user?.name}</span>
                <button 
                  className="layout-logout-btn" 
                  onClick={() => navigate('/invite-partner')}
                  style={{ marginLeft: '0.5rem', fontSize: '0.85rem', padding: '0.25rem 0.5rem' }}
                  title="파트너 초대"
                >
                  파트너 초대
                </button>
              </>
            )}
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

      {/* 파트너 해지 확인 모달 */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="파트너 해지">
        <div style={{ padding: '1rem 0' }}>
          <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
            파트너를 해지하시겠습니까?
            <br />
            <strong style={{ color: '#d32f2f' }}>이 작업은 되돌릴 수 없습니다.</strong>
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
              취소
            </Button>
            <Button variant="danger" onClick={handleConfirmRemovePartner}>
              해지하기
            </Button>
          </div>
        </div>
      </Modal>

      {/* 메시지 모달 */}
      <Modal isOpen={showMessageModal} onClose={() => setShowMessageModal(false)} title={messageModalContent?.title || ''}>
        <div style={{ padding: '1rem 0' }}>
          <p style={{ marginBottom: '1.5rem', lineHeight: '1.6', color: messageModalContent?.type === 'error' ? '#d32f2f' : '#2e7d32' }}>
            {messageModalContent?.message}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setShowMessageModal(false)}>
              확인
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Layout

