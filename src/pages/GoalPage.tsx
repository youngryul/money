import { useState, useMemo, useEffect } from 'react'
import { format } from 'date-fns'
import { useDataStore } from '../stores/dataStore'
import { getKisConnection } from '../services/kisConnectionService'
import { getKisAccessToken, getKisHoldings, type KisHolding } from '../services/kisApiService'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import './GoalPage.css'

const GoalPage = () => {
  const {
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    salaries,
    fixedExpenses,
    livingExpenses,
    allowances,
    savings,
    investments,
    ledgerTransactions,
  } = useDataStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [kisHoldings, setKisHoldings] = useState<KisHolding[]>([])
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    memo: '',
  })

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
      }
    }

    loadKisHoldings()
  }, [])

  // 총 자산 계산
  const totalAssets = useMemo(() => {
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
    // 현금 잔액 계산 (적금/비상금, 투자 예수금 포함)
    const cashBalance = totalIncome - (monthlyFixedExpense + monthlyLivingExpense + monthlyAllowance + monthlyExpense + monthlySavings + monthlyInvestmentDeposit)
    const totalAssets = cashBalance + totalSavings + totalInvestment

    return totalAssets
  }, [salaries, fixedExpenses, livingExpenses, allowances, savings, investments, ledgerTransactions, kisHoldings])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.targetAmount) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }
    addGoal({
      title: formData.title,
      targetAmount: Number(formData.targetAmount),
      currentAmount: totalAssets, // 총 자산을 현재 금액으로 설정
      deadline: formData.deadline || undefined,
      memo: formData.memo,
    })
    setFormData({
      title: '',
      targetAmount: '',
      currentAmount: '',
      deadline: '',
      memo: '',
    })
    setIsModalOpen(false)
  }

  const handleEdit = (goal: typeof goals[0]) => {
    setEditingId(goal.id)
    setFormData({
      title: goal.title,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: totalAssets.toString(), // 총 자산으로 설정
      deadline: goal.deadline || '',
      memo: goal.memo || '',
    })
    setIsEditModalOpen(true)
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId || !formData.title || !formData.targetAmount) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }
    updateGoal(editingId, {
      title: formData.title,
      targetAmount: Number(formData.targetAmount),
      currentAmount: totalAssets, // 총 자산을 현재 금액으로 설정
      deadline: formData.deadline || undefined,
      memo: formData.memo,
    })
    setFormData({
      title: '',
      targetAmount: '',
      currentAmount: '',
      deadline: '',
      memo: '',
    })
    setEditingId(null)
    setIsEditModalOpen(false)
  }

  const getProgress = (goal: typeof goals[0]) => {
    // 현재 금액 대신 총 자산을 사용하여 진행률 계산
    const currentAmount = totalAssets
    return goal.targetAmount > 0 ? (currentAmount / goal.targetAmount) * 100 : 0
  }

  return (
    <div className="goal-page">
      <div className="page-header">
        <h1 className="page-title">부부 공동 목표</h1>
        <Button onClick={() => setIsModalOpen(true)}>목표 추가</Button>
      </div>

      <div className="goal-list">
        {goals.length === 0 ? (
          <Card>
            <div className="empty-state">등록된 목표가 없습니다.</div>
          </Card>
        ) : (
          goals.map((goal) => {
            const progress = getProgress(goal)
            const currentAmount = totalAssets // 총 자산을 현재 금액으로 사용
            const remaining = goal.targetAmount - currentAmount
            return (
              <Card key={goal.id}>
                <div className="goal-item">
                  <div className="goal-header">
                    <h3 className="goal-title">{goal.title}</h3>
                    <div className="goal-actions">
                      <Button variant="primary" size="sm" onClick={() => handleEdit(goal)}>
                        수정
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          if (confirm('삭제하시겠습니까?')) {
                            deleteGoal(goal.id)
                          }
                        }}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                  <div className="goal-progress">
                    <div className="goal-progress-bar">
                      <div
                        className="goal-progress-fill"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="goal-progress-text">
                      {progress.toFixed(1)}% ({currentAmount.toLocaleString()}원 /{' '}
                      {goal.targetAmount.toLocaleString()}원)
                    </div>
                  </div>
                  <div className="goal-details">
                    <div className="goal-detail-item">
                      <span className="goal-detail-label">목표 금액:</span>
                      <span className="goal-detail-value">{goal.targetAmount.toLocaleString()}원</span>
                    </div>
                    <div className="goal-detail-item">
                      <span className="goal-detail-label">현재 금액 (총 자산):</span>
                      <span className="goal-detail-value">{currentAmount.toLocaleString()}원</span>
                    </div>
                    <div className="goal-detail-item">
                      <span className="goal-detail-label">남은 금액:</span>
                      <span className="goal-detail-value">{remaining.toLocaleString()}원</span>
                    </div>
                    {goal.deadline && (
                      <div className="goal-detail-item">
                        <span className="goal-detail-label">목표일:</span>
                        <span className="goal-detail-value">
                          {format(new Date(goal.deadline), 'yyyy년 MM월 dd일')}
                        </span>
                      </div>
                    )}
                  </div>
                  {goal.memo && <div className="goal-memo">{goal.memo}</div>}
                </div>
              </Card>
            )
          })
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="목표 추가">
        <form onSubmit={handleSubmit} className="goal-form">
          <Input
            label="목표명"
            value={formData.title}
            onChange={(value) => setFormData({ ...formData, title: value })}
            placeholder="예: 신혼여행, 집 마련 등"
            required
          />
          <Input
            label="목표 금액"
            type="number"
            value={formData.targetAmount}
            onChange={(value) => setFormData({ ...formData, targetAmount: value })}
            placeholder="목표 금액을 입력하세요"
            required
            min={0}
            step={1}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Input
              label="현재 금액 (총 자산 자동 반영)"
              type="number"
              value={totalAssets.toString()}
              onChange={() => {}} // 읽기 전용
              placeholder="총 자산이 자동으로 반영됩니다"
              disabled
            />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              * 현재 금액은 총 자산으로 자동 설정됩니다
            </span>
          </div>
          <Input
            label="목표일 (선택)"
            type="date"
            value={formData.deadline}
            onChange={(value) => setFormData({ ...formData, deadline: value })}
          />
          <Input
            label="메모"
            value={formData.memo}
            onChange={(value) => setFormData({ ...formData, memo: value })}
            placeholder="메모를 입력하세요 (선택)"
          />
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              취소
            </Button>
            <Button type="submit">추가</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="목표 수정">
        <form onSubmit={handleUpdate} className="goal-form">
          <Input
            label="목표명"
            value={formData.title}
            onChange={(value) => setFormData({ ...formData, title: value })}
            placeholder="예: 신혼여행, 집 마련 등"
            required
          />
          <Input
            label="목표 금액"
            type="number"
            value={formData.targetAmount}
            onChange={(value) => setFormData({ ...formData, targetAmount: value })}
            placeholder="목표 금액을 입력하세요"
            required
            min={0}
            step={1}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Input
              label="현재 금액 (총 자산 자동 반영)"
              type="number"
              value={totalAssets.toString()}
              onChange={() => {}} // 읽기 전용
              placeholder="총 자산이 자동으로 반영됩니다"
              disabled
            />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              * 현재 금액은 총 자산으로 자동 설정됩니다
            </span>
          </div>
          <Input
            label="목표일 (선택)"
            type="date"
            value={formData.deadline}
            onChange={(value) => setFormData({ ...formData, deadline: value })}
          />
          <Input
            label="메모"
            value={formData.memo}
            onChange={(value) => setFormData({ ...formData, memo: value })}
            placeholder="메모를 입력하세요 (선택)"
          />
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              취소
            </Button>
            <Button type="submit">수정</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default GoalPage

