import { useState } from 'react'
import { format } from 'date-fns'
import { useDataStore } from '../stores/dataStore'
import { useAuthStore } from '../stores/authStore'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import ExpenseCalendar from '../components/ExpenseCalendar'
import './LivingExpensePage.css'

const LivingExpensePage = () => {
  const { user } = useAuthStore()
  const { livingExpenses, addLivingExpense, updateLivingExpense, deleteLivingExpense } = useDataStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category: '',
    memo: '',
  })

  const categories = ['생활비', '식비', '교통비', '생활용품', '의료비', '교육비', '문화생활', '기타']

  // 생활비 잔액 계산
  const livingExpenseSummary = (() => {
    const livingExpenseTotal = livingExpenses
      .filter((e) => e.category === '생활비')
      .reduce((sum, e) => sum + e.amount, 0)

    const otherExpenseTotal = livingExpenses
      .filter((e) => e.category !== '생활비')
      .reduce((sum, e) => sum + e.amount, 0)

    const remaining = livingExpenseTotal - otherExpenseTotal

    return {
      livingExpenseTotal,
      otherExpenseTotal,
      remaining,
    }
  })()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.amount || !formData.category) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }
    if (!user?.id) {
      alert('사용자 정보가 없습니다.')
      return
    }
    addLivingExpense({
      userId: user.id,
      amount: Number(formData.amount),
      date: formData.date,
      category: formData.category,
      memo: formData.memo,
    })
    setFormData({
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      category: '',
      memo: '',
    })
    setIsModalOpen(false)
  }

  const handleEdit = (expense: typeof livingExpenses[0]) => {
    setEditingId(expense.id)
    setFormData({
      amount: expense.amount.toString(),
      date: expense.date,
      category: expense.category,
      memo: expense.memo || '',
    })
    setIsEditModalOpen(true)
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId || !formData.amount || !formData.category) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }
    if (!user?.id) {
      alert('사용자 정보가 없습니다.')
      return
    }
    updateLivingExpense(editingId, {
      userId: user.id,
      amount: Number(formData.amount),
      date: formData.date,
      category: formData.category,
      memo: formData.memo,
    })
    setFormData({
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      category: '',
      memo: '',
    })
    setEditingId(null)
    setIsEditModalOpen(false)
  }

  return (
    <div className="living-expense-page">
      <div className="page-header">
        <h1 className="page-title">공동 생활비 기록</h1>
        <Button onClick={() => setIsModalOpen(true)}>생활비 추가</Button>
      </div>

      {/* 생활비 잔액 요약 */}
      <div className="living-expense-summary">
        <Card>
          <div className="summary-content">
            <div className="summary-item summary-total">
              <span className="summary-label">잔액</span>
              <span className={`summary-value ${livingExpenseSummary.remaining >= 0 ? 'living-expense-amount' : 'other-expense-amount'}`}>
                {livingExpenseSummary.remaining.toLocaleString()}원
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* 생활비 달력 */}
      <Card title="일별 지출 달력">
        <ExpenseCalendar expenses={livingExpenses} />
      </Card>

      <Card>
        <div className="expense-list">
          {livingExpenses.length === 0 ? (
            <div className="empty-state">기록된 생활비가 없습니다.</div>
          ) : (
            livingExpenses
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((expense) => (
                <div key={expense.id} className="expense-item">
                  <div className="expense-info">
                    <div className="expense-header">
                      <span className={`expense-category ${expense.category === '생활비' ? 'living-expense-category' : 'other-expense-category'}`}>
                        {expense.category}
                      </span>
                      <span className="expense-date">{format(new Date(expense.date), 'yyyy년 MM월 dd일')}</span>
                    </div>
                    <div className={`expense-amount ${expense.category === '생활비' ? 'living-expense-amount' : 'other-expense-amount'}`}>
                      {expense.amount.toLocaleString()}원
                    </div>
                    {expense.memo && <div className="expense-memo">{expense.memo}</div>}
                  </div>
                  <div className="expense-actions">
                    <Button variant="primary" size="sm" onClick={() => handleEdit(expense)}>
                      수정
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        if (confirm('삭제하시겠습니까?')) {
                          deleteLivingExpense(expense.id)
                        }
                      }}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              ))
          )}
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="생활비 추가">
        <form onSubmit={handleSubmit} className="expense-form">
          <Input
            label="금액"
            type="number"
            value={formData.amount}
            onChange={(value) => setFormData({ ...formData, amount: value })}
            placeholder="금액을 입력하세요"
            required
            min={0}
            step={1}
          />
          <Input
            label="날짜"
            type="date"
            value={formData.date}
            onChange={(value) => setFormData({ ...formData, date: value })}
            required
          />
          <div className="form-group">
            <label className="form-label">카테고리</label>
            <select
              className="form-select"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">선택하세요</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
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

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="생활비 수정">
        <form onSubmit={handleUpdate} className="expense-form">
          <Input
            label="금액"
            type="number"
            value={formData.amount}
            onChange={(value) => setFormData({ ...formData, amount: value })}
            placeholder="금액을 입력하세요"
            required
            min={0}
            step={1}
          />
          <Input
            label="날짜"
            type="date"
            value={formData.date}
            onChange={(value) => setFormData({ ...formData, date: value })}
            required
          />
          <div className="form-group">
            <label className="form-label">카테고리</label>
            <select
              className="form-select"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">선택하세요</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
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

export default LivingExpensePage

