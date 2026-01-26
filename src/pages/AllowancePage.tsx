import { useState } from 'react'
import { format } from 'date-fns'
import { useAuthStore } from '../stores/authStore'
import { useDataStore } from '../stores/dataStore'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import './AllowancePage.css'

const AllowancePage = () => {
  const { user, partner } = useAuthStore()
  const { allowances, addAllowance, updateAllowance, deleteAllowance } = useDataStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    userId: user?.id || '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    memo: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.userId || !formData.amount) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }
    addAllowance({
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
  }

  const handleEdit = (allowance: typeof allowances[0]) => {
    setEditingId(allowance.id)
    setFormData({
      userId: allowance.userId,
      amount: allowance.amount.toString(),
      date: allowance.date,
      memo: allowance.memo || '',
    })
    setIsEditModalOpen(true)
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId || !formData.userId || !formData.amount) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }
    updateAllowance(editingId, {
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
    setEditingId(null)
    setIsEditModalOpen(false)
  }

  const getUserName = (userId: string) => {
    if (userId === user?.id) return user.name
    if (userId === partner?.id) return partner?.name
    return ''
  }

  return (
    <div className="allowance-page">
      <div className="page-header">
        <h1 className="page-title">용돈 기록</h1>
        <Button onClick={() => setIsModalOpen(true)}>용돈 추가</Button>
      </div>

      <Card>
        <div className="allowance-list">
          {allowances.length === 0 ? (
            <div className="empty-state">기록된 용돈이 없습니다.</div>
          ) : (
            allowances
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((allowance) => (
                <div key={allowance.id} className="allowance-item">
                  <div className="allowance-info">
                    <div className="allowance-header">
                      <span className="allowance-user">{getUserName(allowance.userId)}</span>
                      <span className="allowance-date">{format(new Date(allowance.date), 'yyyy년 MM월 dd일')}</span>
                    </div>
                    <div className="allowance-amount">{allowance.amount.toLocaleString()}원</div>
                    {allowance.memo && <div className="allowance-memo">{allowance.memo}</div>}
                  </div>
                  <div className="allowance-actions">
                    <Button variant="primary" size="sm" onClick={() => handleEdit(allowance)}>
                      수정
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        if (confirm('삭제하시겠습니까?')) {
                          deleteAllowance(allowance.id)
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="용돈 추가">
        <form onSubmit={handleSubmit} className="allowance-form">
          <div className="form-group">
            <label className="form-label">누구의 용돈인가요?</label>
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
            placeholder="용돈을 입력하세요"
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
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              취소
            </Button>
            <Button type="submit">추가</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="용돈 수정">
        <form onSubmit={handleUpdate} className="allowance-form">
          <div className="form-group">
            <label className="form-label">누구의 용돈인가요?</label>
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
            placeholder="용돈을 입력하세요"
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

export default AllowancePage

