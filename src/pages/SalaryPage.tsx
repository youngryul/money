import { useState } from 'react'
import { format } from 'date-fns'
import { useAuthStore } from '../stores/authStore'
import { useDataStore } from '../stores/dataStore'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import './SalaryPage.css'

const SalaryPage = () => {
  const { user, partner } = useAuthStore()
  const { salaries, addSalary, deleteSalary, isLoading, error } = useDataStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    userId: user?.id || '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    memo: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.userId || !formData.amount) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }
    try {
      await addSalary({
        userId: formData.userId,
        amount: Number(formData.amount),
        date: formData.date,
        memo: formData.memo,
      })
      setFormData({
        userId: user?.id || '',
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        memo: '',
      })
      setIsModalOpen(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '수입 추가 중 오류가 발생했습니다.'
      console.error('수입 추가 오류:', error)
      alert(errorMessage)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('삭제하시겠습니까?')) {
      try {
        await deleteSalary(id)
      } catch (error) {
        alert('수입 삭제 중 오류가 발생했습니다.')
      }
    }
  }

  const getUserName = (userId: string) => {
    if (userId === user?.id) return user.name
    if (userId === partner?.id) return partner?.name
    return ''
  }

  return (
    <div className="salary-page">
      <div className="page-header">
        <h1 className="page-title">수입 기록</h1>
        <Button onClick={() => setIsModalOpen(true)} disabled={isLoading}>
          수입 추가
        </Button>
      </div>

      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <Card>
        <div className="salary-list">
          {isLoading && salaries.length === 0 ? (
            <div className="empty-state">데이터를 불러오는 중...</div>
          ) : salaries.length === 0 ? (
            <div className="empty-state">기록된 수입이 없습니다.</div>
          ) : (
            salaries
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((salary) => (
                <div key={salary.id} className="salary-item">
                  <div className="salary-info">
                    <div className="salary-header">
                      <span className="salary-user">{getUserName(salary.userId)}</span>
                      <span className="salary-date">{format(new Date(salary.date), 'yyyy년 MM월 dd일')}</span>
                    </div>
                    <div className="salary-amount">{salary.amount.toLocaleString()}원</div>
                    {salary.memo && <div className="salary-memo">{salary.memo}</div>}
                  </div>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(salary.id)} disabled={isLoading}>
                    삭제
                  </Button>
                </div>
              ))
          )}
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="수입 추가">
        <form onSubmit={handleSubmit} className="salary-form">
          <div className="form-group">
            <label className="form-label">누구의 수입인가요?</label>
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
            label="금액"
            type="number"
            value={formData.amount}
            onChange={(value) => setFormData({ ...formData, amount: value })}
            placeholder="수입액을 입력하세요"
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
    </div>
  )
}

export default SalaryPage

