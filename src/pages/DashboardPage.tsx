import { useMemo, useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useDataStore } from '../stores/dataStore'
import { getKisConnection } from '../services/kisConnectionService'
import { getKisAccessToken, getKisHoldings, type KisHolding } from '../services/kisApiService'
import Card from '../components/Card'
import AssetAnimation from '../components/AssetAnimation'
import './DashboardPage.css'

const DashboardPage = () => {
  const {
    salaries,
    fixedExpenses,
    livingExpenses,
    allowances,
    savings,
    investments,
    ledgerTransactions,
  } = useDataStore()

  const [kisHoldings, setKisHoldings] = useState<KisHolding[]>([])

  // 한국투자증권 보유 종목 로드
  useEffect(() => {
    const loadKisHoldings = async () => {
      try {
        const connection = await getKisConnection()
        if (connection && connection.accountNumber) {
          const tokenData = await getKisAccessToken(
            connection.appKey,
            connection.appSecret,
            connection.isVirtual
          )
          const holdings = await getKisHoldings(
            tokenData.access_token,
            connection.appKey,
            connection.appSecret,
            connection.accountNumber,
            connection.isVirtual
          )
          setKisHoldings(holdings)
        }
      } catch (error) {
        console.error('KIS 보유 종목 로드 오류:', error)
        // 오류가 발생해도 대시보드는 계속 표시
      }
    }

    loadKisHoldings()
  }, [])

  // 자산 계산
  const assets = useMemo(() => {
    const currentMonth = format(new Date(), 'yyyy-MM')
    
    // 수입 합계 (이번 달)
    const monthlySalary = salaries
      .filter((s) => s.date.startsWith(currentMonth))
      .reduce((sum, s) => sum + s.amount, 0)

    // 고정비 합계 (이번 달 예상)
    const monthlyFixedExpense = fixedExpenses.reduce((sum, e) => sum + e.amount, 0)

    // 생활비 합계 (이번 달) - '생활비' 카테고리만 계산
    const monthlyLivingExpense = livingExpenses
      .filter((e) => e.date.startsWith(currentMonth) && e.category === '생활비')
      .reduce((sum, e) => sum + e.amount, 0)

    // 용돈 합계 (이번 달)
    const monthlyAllowance = allowances
      .filter((a) => a.date.startsWith(currentMonth))
      .reduce((sum, a) => sum + a.amount, 0)

    // 적금/비상금 합계 (전체)
    const totalSavings = savings.reduce((sum, s) => sum + s.amount, 0)

    // 적금/비상금 합계 (이번 달) - 현금에서 차감
    const monthlySavings = savings
      .filter((s) => s.date.startsWith(currentMonth))
      .reduce((sum, s) => sum + s.amount, 0)

    // 한국투자증권 총 평가금액 계산
    const kisTotalValue = kisHoldings.reduce((sum, h) => sum + h.totalValue, 0)
    
    // 투자 합계 (한국투자증권 연동이 있으면 총 평가금액 사용, 없으면 기존 로직)
    const totalInvestment = kisTotalValue > 0 
      ? kisTotalValue 
      : investments.reduce((sum, i) => sum + (i.currentValue || i.amount), 0)

    // 투자 예수금 합계 (이번 달) - 현금에서 차감
    const monthlyInvestmentDeposit = investments
      .filter((i) => i.date.startsWith(currentMonth))
      .reduce((sum, i) => sum + (i.monthlyDeposit || 0), 0)

    // 가계부 수입 합계 (이번 달)
    const monthlyIncome = ledgerTransactions
      .filter((t) => t.type === 'INCOME' && t.date.startsWith(currentMonth))
      .reduce((sum, t) => sum + t.amount, 0)

    // 가계부 지출 합계 (이번 달)
    const monthlyExpense = ledgerTransactions
      .filter((t) => t.type === 'EXPENSE' && t.date.startsWith(currentMonth))
      .reduce((sum, t) => sum + t.amount, 0)

    const totalIncome = monthlySalary + monthlyIncome
    const totalExpense = monthlyFixedExpense + monthlyLivingExpense + monthlyAllowance + monthlyExpense + monthlySavings + monthlyInvestmentDeposit
    const cashBalance = totalIncome - totalExpense
    const totalAssets = cashBalance + totalSavings + totalInvestment

    return {
      totalIncome,
      totalExpense,
      cashBalance,
      savings: totalSavings,
      investment: totalInvestment,
      totalAssets,
    }
  }, [salaries, fixedExpenses, livingExpenses, allowances, savings, investments, ledgerTransactions, kisHoldings])

  // 이전 달 자산 (간단한 계산)
  const previousAssets = useMemo(() => {
    // 실제로는 이전 달 데이터를 계산해야 하지만, 여기서는 간단히 95%로 설정
    return assets.totalAssets * 0.95
  }, [assets.totalAssets])

  const assetChange = assets.totalAssets - previousAssets
  const assetChangePercent = previousAssets > 0 ? (assetChange / previousAssets) * 100 : 0

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">대시보드</h1>
      
      <div className="dashboard-asset-section">
        <Card>
          <div className="dashboard-asset-header">
            <h2>총 자산</h2>
            <AssetAnimation
              currentValue={assets.totalAssets}
              previousValue={previousAssets}
            />
          </div>
          <div className="dashboard-asset-breakdown">
            <div className="dashboard-asset-item">
              <span className="dashboard-asset-label">현금</span>
              <span className="dashboard-asset-value">
                {assets.cashBalance.toLocaleString()}원
              </span>
            </div>
            <div className="dashboard-asset-item">
              <span className="dashboard-asset-label">적금/비상금</span>
              <span className="dashboard-asset-value">
                {assets.savings.toLocaleString()}원
              </span>
            </div>
            <div className="dashboard-asset-item">
              <span className="dashboard-asset-label">투자</span>
              <span className="dashboard-asset-value">
                {assets.investment.toLocaleString()}원
              </span>
            </div>
          </div>
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card title="이번 달 수입">
          <div className="dashboard-stat-value">
            {assets.totalIncome.toLocaleString()}원
          </div>
        </Card>

        <Card title="이번 달 지출">
          <div className="dashboard-stat-value">
            {assets.totalExpense.toLocaleString()}원
          </div>
        </Card>

        <Card title="현금 잔액">
          <div className={`dashboard-stat-value ${assets.cashBalance < 0 ? 'negative' : ''}`}>
            {assets.cashBalance.toLocaleString()}원
          </div>
        </Card>

        <Card title="자산 변동">
          <div className={`dashboard-stat-value ${assetChange >= 0 ? 'positive' : 'negative'}`}>
            {assetChange >= 0 ? '+' : ''}
            {assetChange.toLocaleString()}원
            <span className="dashboard-stat-percent">
              ({assetChangePercent >= 0 ? '+' : ''}
              {assetChangePercent.toFixed(1)}%)
            </span>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage

