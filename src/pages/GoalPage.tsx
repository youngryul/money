import { useState } from 'react'
import { format } from 'date-fns'
import { useDataStore } from '../stores/dataStore'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import './GoalPage.css'

const GoalPage = () => {
  const { goals, addGoal, updateGoal, deleteGoal } = useDataStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    memo: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.targetAmount) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }
    addGoal({
      title: formData.title,
      targetAmount: Number(formData.targetAmount),
      currentAmount: Number(formData.currentAmount) || 0,
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
      currentAmount: goal.currentAmount.toString(),
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
      currentAmount: Number(formData.currentAmount) || 0,
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
    return goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
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
            const remaining = goal.targetAmount - goal.currentAmount
            return (
              <Card key={goal.id}>
                <div className="goal-item">
                  <div className="goal-header">
                    <h3 className="goal-title">{goal.title}</h3>
                    <div className="goal-actions">
                      <Button variant="secondary" size="sm" onClick={() => handleEdit(goal)}>
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
                      {progress.toFixed(1)}% ({goal.currentAmount.toLocaleString()}원 /{' '}
                      {goal.targetAmount.toLocaleString()}원)
                    </div>
                  </div>
                  <div className="goal-details">
                    <div className="goal-detail-item">
                      <span className="goal-detail-label">목표 금액:</span>
                      <span className="goal-detail-value">{goal.targetAmount.toLocaleString()}원</span>
                    </div>
                    <div className="goal-detail-item">
                      <span className="goal-detail-label">현재 금액:</span>
                      <span className="goal-detail-value">{goal.currentAmount.toLocaleString()}원</span>
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
            min="0"
            step="1000"
          />
          <Input
            label="현재 금액"
            type="number"
            value={formData.currentAmount}
            onChange={(value) => setFormData({ ...formData, currentAmount: value })}
            placeholder="현재 모은 금액을 입력하세요"
            min="0"
            step="1000"
          />
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
            min="0"
            step="1000"
          />
          <Input
            label="현재 금액"
            type="number"
            value={formData.currentAmount}
            onChange={(value) => setFormData({ ...formData, currentAmount: value })}
            placeholder="현재 모은 금액을 입력하세요"
            min="0"
            step="1000"
          />
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

