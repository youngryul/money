import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useDataStore } from './stores/dataStore'
import LoginPage from './pages/LoginPage'
import InvitePartnerPage from './pages/InvitePartnerPage'
import AcceptInvitationPage from './pages/AcceptInvitationPage'
import DashboardPage from './pages/DashboardPage'
import SalaryPage from './pages/SalaryPage'
import FixedExpensePage from './pages/FixedExpensePage'
import LivingExpensePage from './pages/LivingExpensePage'
import AllowancePage from './pages/AllowancePage'
import LedgerPage from './pages/LedgerPage'
import SavingsPage from './pages/SavingsPage'
import InvestmentPage from './pages/InvestmentPage'
import GoalPage from './pages/GoalPage'
import Layout from './components/Layout'

// 보호된 라우트 컴포넌트
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, partner, supabaseUser } = useAuthStore()
  const location = useLocation()
  const [hasCheckedInvitations, setHasCheckedInvitations] = useState(false)

  useEffect(() => {
    const checkInvitations = async () => {
      if (isAuthenticated && !partner && supabaseUser?.email && !hasCheckedInvitations) {
        try {
          const { getReceivedInvitations } = await import('./services/invitationService')
          const receivedInvitations = await getReceivedInvitations(supabaseUser.email)
          if (receivedInvitations.length > 0) {
            const latestInvitation = receivedInvitations[0]
            window.location.href = `/accept-invitation?code=${latestInvitation.code}`
            return
          }
        } catch (error) {
          console.error('초대장 확인 오류:', error)
        }
        setHasCheckedInvitations(true)
      }
    }
    checkInvitations()
  }, [isAuthenticated, partner, supabaseUser, hasCheckedInvitations])

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!user) {
    return <Navigate to="/invite-partner" replace />
  }

  // 파트너가 없어도 사용자가 있으면 접근 가능 (혼자 사용하기)
  if (!partner && hasCheckedInvitations) {
    // 초대장 확인이 완료되었고 파트너가 없으면 그대로 진행 (혼자 사용하기)
    return <>{children}</>
  }

  if (!partner) {
    // 초대장 확인 중이면 잠시 대기
    return <div>로딩 중...</div>
  }

  return <>{children}</>
}

// 로그인 페이지 라우트 컴포넌트
const LoginRoute = () => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
}

// 파트너 초대 페이지 라우트 컴포넌트
const InvitePartnerRoute = () => {
  const { isAuthenticated, partner } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (partner) {
    return <Navigate to="/" replace />
  }

  return <InvitePartnerPage />
}

// 초대장 수락 페이지 라우트 컴포넌트
const AcceptInvitationRoute = () => {
  const { partner } = useAuthStore()

  // 이미 파트너가 있으면 대시보드로 이동
  if (partner) {
    return <Navigate to="/" replace />
  }

  // 로그인 여부와 관계없이 초대장 수락 페이지 표시
  return <AcceptInvitationPage />
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuthStore()
  const { loadAllData } = useDataStore()

  // 데이터 로딩 (한 번만 실행되도록 useMemo로 감싸기)
  // 파트너가 없어도 사용자가 있으면 데이터 로딩 (혼자 사용하기)
  const hasLoadedData = useMemo(() => {
    return isAuthenticated && user
  }, [isAuthenticated, user?.id]) // id만 비교하여 불필요한 재렌더링 방지

  useEffect(() => {
    if (hasLoadedData) {
      loadAllData().catch((error) => {
        console.error('데이터 로딩 실패:', error)
      })
    }
  }, [hasLoadedData, loadAllData])

  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/invite-partner" element={<InvitePartnerRoute />} />
      <Route path="/accept-invitation" element={<AcceptInvitationRoute />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="salary" element={<SalaryPage />} />
        <Route path="fixed-expense" element={<FixedExpensePage />} />
        <Route path="living-expense" element={<LivingExpensePage />} />
        <Route path="allowance" element={<AllowancePage />} />
        <Route path="ledger" element={<LedgerPage />} />
        <Route path="savings" element={<SavingsPage />} />
        <Route path="investment" element={<InvestmentPage />} />
        <Route path="goal" element={<GoalPage />} />
      </Route>
    </Routes>
  )
}

function App() {
  const { initializeSession } = useAuthStore()

  // 앱 시작 시 Supabase 세션 초기화 (한 번만 실행)
  useEffect(() => {
    initializeSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 빈 의존성 배열로 한 번만 실행

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App

