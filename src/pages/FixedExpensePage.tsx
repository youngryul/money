import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useDataStore } from '../stores/dataStore'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import './FixedExpensePage.css'

const FixedExpensePage = () => {
  const { user, partner } = useAuthStore()
  const { fixedExpenses, addFixedExpense, deleteFixedExpense } = useDataStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    userId: user?.id || '',
    name: '',
    amount: '',
    dayOfMonth: '',
    memo: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.userId || !formData.name || !formData.amount || !formData.dayOfMonth) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }
    addFixedExpense({
      userId: formData.userId,
      name: formData.name,
      amount: Number(formData.amount),
      dayOfMonth: Number(formData.dayOfMonth),
      memo: formData.memo,
    })
    setFormData({
      userId: user?.id || '',
      name: '',
      amount: '',
      dayOfMonth: '',
      memo: '',
    })
    setIsModalOpen(false)
  }

  const getUserName = (userId: string) => {
    if (userId === user?.id) return user.name
    if (userId === partner?.id) return partner?.name
    return ''
  }

  return (
    <div className="fixed-expense-page">
      <div className="page-header">
        <h1 className="page-title">고정비 기록</h1>
        <Button onClick={() => setIsModalOpen(true)}>고정비 추가</Button>
      </div>

      <Card>
        <div className="expense-list">
          {fixedExpenses.length === 0 ? (
            <div className="empty-state">기록된 고정비가 없습니다.</div>
          ) : (
            fixedExpenses.map((expense) => (
              <div key={expense.id} className="expense-item">
                <div className="expense-info">
                  <div className="expense-header">
                    <span className="expense-name">{expense.name}</span>
                    <span className="expense-user">{getUserName(expense.userId)}</span>
                  </div>
                  <div className="expense-details">
                    <span className="expense-amount">{expense.amount.toLocaleString()}원</span>
                    <span className="expense-day">매월 {expense.dayOfMonth}일</span>
                  </div>
                  {expense.memo && <div className="expense-memo">{expense.memo}</div>}
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (confirm('삭제하시겠습니까?')) {
                      deleteFixedExpense(expense.id)
                    }
                  }}
                >
                  삭제
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="고정비 추가">
        <form onSubmit={handleSubmit} className="expense-form">
          <div className="form-group">
            <label className="form-label">누구의 고정비인가요?</label>
            <select
              className="form-select"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              required
            >
              <option value="">선택하세요</option>
              <option value={user?.id}>{user?.name}</option>
              <option value={partner?.id}>{partner?.name}</option>
            </select>
          </div>
          <Input
            label="고정비 이름"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            placeholder="예: 통신비, 보험료 등"
            required
          />
          <Input
            label="금액"
            type="number"
            value={formData.amount}
            onChange={(value) => setFormData({ ...formData, amount: value })}
            placeholder="금액을 입력하세요"
            required
            min="0"
            step="1000"
          />
          <Input
            label="매월 지출일"
            type="number"
            value={formData.dayOfMonth}
            onChange={(value) => setFormData({ ...formData, dayOfMonth: value })}
            placeholder="1-31 사이의 숫자"
            required
            min="1"
            max="31"
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
    </div>
  )
}

export default FixedExpensePage

