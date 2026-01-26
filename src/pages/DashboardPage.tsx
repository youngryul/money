import { useMemo, useState, useEffect } from 'react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { useDataStore } from '../stores/dataStore'
import { getKisConnection } from '../services/kisConnectionService'
import { getKisAccessToken, getKisHoldings, type KisHolding } from '../services/kisApiService'
import { getMonthEndInvestment } from '../services/investmentSnapshotService'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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
  const [monthlyInvestmentSnapshots, setMonthlyInvestmentSnapshots] = useState<Map<string, number>>(new Map())

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

  // 월별 투자금 스냅샷 로드
  useEffect(() => {
    const loadInvestmentSnapshots = async () => {
      try {
        // 모든 데이터에서 가장 이른 날짜 찾기
        const allDates: string[] = []
        salaries.forEach((s) => allDates.push(s.date))
        livingExpenses.forEach((e) => allDates.push(e.date))
        allowances.forEach((a) => allDates.push(a.date))
        savings.forEach((s) => allDates.push(s.date))
        investments.forEach((i) => allDates.push(i.date))
        ledgerTransactions.forEach((t) => allDates.push(t.date))

        if (allDates.length === 0) return

        const earliestDate = new Date(Math.min(...allDates.map((d) => new Date(d).getTime())))
        const earliestMonth = startOfMonth(earliestDate)
        const currentDate = new Date()
        const currentMonth = startOfMonth(currentDate)

        const snapshots = new Map<string, number>()
        let monthDate = earliestMonth
        let monthCount = 0
        const maxMonths = 6

        while (monthDate <= currentMonth && monthCount < maxMonths) {
          const monthKey = format(monthDate, 'yyyy-MM')
          const monthYear = monthDate.getFullYear()
          const monthMonth = monthDate.getMonth() + 1

          try {
            const investmentAmount = await getMonthEndInvestment(monthYear, monthMonth)
            snapshots.set(monthKey, investmentAmount)
          } catch (error) {
            console.error(`투자금 스냅샷 조회 오류 (${monthKey}):`, error)
          }

          monthDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)
          monthCount++
        }

        setMonthlyInvestmentSnapshots(snapshots)
      } catch (error) {
        console.error('투자금 스냅샷 로드 오류:', error)
      }
    }

    loadInvestmentSnapshots()
  }, [salaries, livingExpenses, allowances, savings, investments, ledgerTransactions])

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
    // 이번 달 지출 (적금/비상금, 투자 예수금 제외)
    const totalExpense = monthlyFixedExpense + monthlyLivingExpense + monthlyAllowance + monthlyExpense
    // 현금 잔액 계산 (적금/비상금, 투자 예수금 포함)
    const cashBalance = totalIncome - (monthlyFixedExpense + monthlyLivingExpense + monthlyAllowance + monthlyExpense + monthlySavings + monthlyInvestmentDeposit)
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

  // 월별 자산 데이터 계산 (데이터가 있는 기간만 표시, 최대 6개월)
  const monthlyAssetData = useMemo(() => {
    // 모든 데이터에서 가장 이른 날짜 찾기
    const allDates: string[] = []
    
    salaries.forEach((s) => allDates.push(s.date))
    livingExpenses.forEach((e) => allDates.push(e.date))
    allowances.forEach((a) => allDates.push(a.date))
    savings.forEach((s) => allDates.push(s.date))
    investments.forEach((i) => allDates.push(i.date))
    ledgerTransactions.forEach((t) => allDates.push(t.date))
    
    if (allDates.length === 0) {
      // 데이터가 없으면 현재 달만 표시
      const currentDate = new Date()
      const monthKey = format(currentDate, 'yyyy-MM')
      const monthLabel = format(currentDate, 'MM월')
      
      return [{
        month: monthLabel,
        assets: 0,
      }]
    }
    
    // 가장 이른 날짜 찾기
    const earliestDate = new Date(Math.min(...allDates.map((d) => new Date(d).getTime())))
    const earliestMonth = startOfMonth(earliestDate)
    const currentDate = new Date()
    const currentMonth = startOfMonth(currentDate)
    
    const months = []
    let monthDate = earliestMonth
    
    // 최대 6개월까지만 표시
    let monthCount = 0
    const maxMonths = 6
    
    while (monthDate <= currentMonth && monthCount < maxMonths) {
      const monthKey = format(monthDate, 'yyyy-MM')
      const monthLabel = format(monthDate, 'yyyy년 MM월')
      
      // 해당 월에 실제 데이터가 있는지 확인 (적금, 투자 포함)
      const hasDataInMonth = 
        savings.some((s) => s.date.startsWith(monthKey)) ||
        monthlyInvestmentSnapshots.has(monthKey)
      
      // 해당 월에 데이터가 없으면 차트에 포함하지 않음
      if (!hasDataInMonth) {
        monthDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)
        continue
      }
      
      // 해당 월 말일까지의 적금/비상금 누적 (전체)
      const savingsUpToMonth = savings
        .filter((s) => s.date <= format(endOfMonth(monthDate), 'yyyy-MM-dd'))
        .reduce((sum, s) => sum + s.amount, 0)
      
      // 해당 월의 월말 투자금 (스냅샷에서 조회)
      const investmentUpToMonth = monthlyInvestmentSnapshots.get(monthKey) || 0
      
      // 월별 총자산 = 적금/비상금 + 투자 (현금 제외)
      const totalAssets = savingsUpToMonth + investmentUpToMonth
      
      months.push({
        month: monthLabel,
        assets: Math.round(totalAssets),
      })
      
      // 다음 달로 이동
      monthDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)
      monthCount++
    }
    
    return months
  }, [salaries, fixedExpenses, livingExpenses, allowances, savings, investments, ledgerTransactions, kisHoldings, monthlyInvestmentSnapshots])

  // 월별 자산 변동 계산
  const monthlyAssetChange = useMemo(() => {
    if (monthlyAssetData.length < 2) {
      // 데이터가 2개 미만이면 변동 없음
      return {
        change: 0,
        changePercent: 0,
      }
    }

    // 가장 최근 달과 그 이전 달 비교
    const currentMonthData = monthlyAssetData[monthlyAssetData.length - 1]
    const previousMonthData = monthlyAssetData[monthlyAssetData.length - 2]

    const change = currentMonthData.assets - previousMonthData.assets
    const changePercent = previousMonthData.assets > 0 
      ? (change / previousMonthData.assets) * 100 
      : 0

    return {
      change,
      changePercent,
    }
  }, [monthlyAssetData])

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">대시보드</h1>
      
      <div className="dashboard-asset-section">
        <Card>
          <div className="dashboard-asset-header">
            <h2>총 자산</h2>
            <AssetAnimation
              currentValue={assets.totalAssets}
              previousValue={monthlyAssetData.length >= 2 
                ? monthlyAssetData[monthlyAssetData.length - 2].assets 
                : assets.totalAssets * 0.95}
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

        <Card title="자산 변동 (월별)">
          <div className={`dashboard-stat-value ${monthlyAssetChange.change >= 0 ? 'positive' : 'negative'}`}>
            {monthlyAssetChange.change >= 0 ? '+' : ''}
            {monthlyAssetChange.change.toLocaleString()}원
            <span className="dashboard-stat-percent">
              ({monthlyAssetChange.changePercent >= 0 ? '+' : ''}
              {monthlyAssetChange.changePercent.toFixed(1)}%)
            </span>
          </div>
        </Card>
      </div>

      {/* 월별 자산 차트 */}
      <Card title="월별 자산 추이">
        <div style={{ width: '100%', height: '300px', marginTop: '1rem' }}>
          <ResponsiveContainer>
            <BarChart data={monthlyAssetData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis 
                tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
              />
              <Tooltip 
                formatter={(value: number) => `${value.toLocaleString()}원`}
                labelStyle={{ color: '#333' }}
              />
              <Bar dataKey="assets" fill="var(--primary-color)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}

export default DashboardPage

