import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import LoginPage from './pages/LoginPage'
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

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
        <Route
          path="/"
          element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}
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
    </BrowserRouter>
  )
}

export default App

