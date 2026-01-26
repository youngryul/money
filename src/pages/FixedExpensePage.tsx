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
  const { fixedExpenses, addFixedExpense, updateFixedExpense, deleteFixedExpense, isLoading, error } = useDataStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    userId: user?.id || '',
    name: '',
    amount: '',
    dayOfMonth: '',
    memo: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.userId || !formData.name || !formData.amount || !formData.dayOfMonth) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }
    try {
      await addFixedExpense({
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
    } catch (error) {
      alert('고정비 추가 중 오류가 발생했습니다.')
    }
  }

  const handleEdit = (expense: typeof fixedExpenses[0]) => {
    setEditingId(expense.id)
    setFormData({
      userId: expense.userId,
      name: expense.name,
      amount: expense.amount.toString(),
      dayOfMonth: expense.dayOfMonth.toString(),
      memo: expense.memo || '',
    })
    setIsEditModalOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId || !formData.userId || !formData.name || !formData.amount || !formData.dayOfMonth) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }
    try {
      await updateFixedExpense(editingId, {
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
      setEditingId(null)
      setIsEditModalOpen(false)
    } catch (error) {
      alert('고정비 수정 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('삭제하시겠습니까?')) {
      try {
        await deleteFixedExpense(id)
      } catch (error) {
        alert('고정비 삭제 중 오류가 발생했습니다.')
      }
    }
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
        <Button onClick={() => setIsModalOpen(true)} disabled={isLoading}>
          고정비 추가
        </Button>
      </div>

      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <Card>
        <div className="expense-list">
          {isLoading && fixedExpenses.length === 0 ? (
            <div className="empty-state">데이터를 불러오는 중...</div>
          ) : fixedExpenses.length === 0 ? (
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
                <div className="expense-actions">
                  <Button variant="primary" size="sm" onClick={() => handleEdit(expense)} disabled={isLoading}>
                    수정
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(expense.id)} disabled={isLoading}>
                    삭제
                  </Button>
                </div>
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
            min={0}
            step={1}
          />
          <Input
            label="매월 지출일"
            type="number"
            value={formData.dayOfMonth}
            onChange={(value) => setFormData({ ...formData, dayOfMonth: value })}
            placeholder="1-31 사이의 숫자"
            required
            min={1}
            max="31"
          />
          <Input
            label="메모"
            value={formData.memo}
            onChange={(value) => setFormData({ ...formData, memo: value })}
            placeholder="메모를 입력하세요 (선택)"
          />
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isLoading}>
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '처리 중...' : '추가'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="고정비 수정">
        <form onSubmit={handleUpdate} className="expense-form">
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
            min={0}
            step={1}
          />
          <Input
            label="매월 지출일"
            type="number"
            value={formData.dayOfMonth}
            onChange={(value) => setFormData({ ...formData, dayOfMonth: value })}
            placeholder="1-31 사이의 숫자"
            required
            min={1}
            max="31"
          />
          <Input
            label="메모"
            value={formData.memo}
            onChange={(value) => setFormData({ ...formData, memo: value })}
            placeholder="메모를 입력하세요 (선택)"
          />
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)} disabled={isLoading}>
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '처리 중...' : '수정'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default FixedExpensePage

