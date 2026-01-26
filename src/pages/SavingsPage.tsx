import { useState } from 'react'
import { format } from 'date-fns'
import { useDataStore } from '../stores/dataStore'
import { useAuthStore } from '../stores/authStore'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import './SavingsPage.css'

type SavingsType = 'EMERGENCY_FUND' | 'CONDOLENCE' | 'TRAVEL_SAVINGS' | 'HOUSE_SAVINGS' | 'WEEK26_SAVINGS'

const SavingsPage = () => {
  const { user } = useAuthStore()
  const { savings, addSavings, updateSavings, deleteSavings } = useDataStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    type: 'EMERGENCY_FUND' as SavingsType,
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    memo: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.amount) {
      alert('금액을 입력해주세요.')
      return
    }
    if (!user?.id) {
      alert('사용자 정보가 없습니다.')
      return
    }
    addSavings({
      userId: user.id,
      type: formData.type,
      amount: Number(formData.amount),
      date: formData.date,
      memo: formData.memo,
    })
    setFormData({
      type: 'EMERGENCY_FUND',
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      memo: '',
    })
    setIsModalOpen(false)
  }

  const handleEdit = (saving: typeof savings[0]) => {
    setEditingId(saving.id)
    setFormData({
      type: saving.type as SavingsType,
      amount: saving.amount.toString(),
      date: saving.date,
      memo: saving.memo || '',
    })
    setIsEditModalOpen(true)
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId || !formData.amount) {
      alert('금액을 입력해주세요.')
      return
    }
    if (!user?.id) {
      alert('사용자 정보가 없습니다.')
      return
    }
    updateSavings(editingId, {
      userId: user.id,
      type: formData.type,
      amount: Number(formData.amount),
      date: formData.date,
      memo: formData.memo,
    })
    setFormData({
      type: 'EMERGENCY_FUND',
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      memo: '',
    })
    setEditingId(null)
    setIsEditModalOpen(false)
  }

  // 유형별로 필터링
  const emergencyFundList = savings.filter((s) => s.type === 'EMERGENCY_FUND')
  const condolenceList = savings.filter((s) => s.type === 'CONDOLENCE')
  const travelSavingsList = savings.filter((s) => s.type === 'TRAVEL_SAVINGS')
  const houseSavingsList = savings.filter((s) => s.type === 'HOUSE_SAVINGS')
  const week26SavingsList = savings.filter((s) => s.type === 'WEEK26_SAVINGS')

  // 유형별 합계
  const totalEmergencyFund = emergencyFundList.reduce((sum, s) => sum + s.amount, 0)
  const totalCondolence = condolenceList.reduce((sum, s) => sum + s.amount, 0)
  const totalTravelSavings = travelSavingsList.reduce((sum, s) => sum + s.amount, 0)
  const totalHouseSavings = houseSavingsList.reduce((sum, s) => sum + s.amount, 0)
  const totalWeek26Savings = week26SavingsList.reduce((sum, s) => sum + s.amount, 0)
  const totalSavings = totalEmergencyFund + totalCondolence + totalTravelSavings + totalHouseSavings + totalWeek26Savings

  const renderSavingsList = (list: typeof savings, typeLabel: string) => {
    if (list.length === 0) {
      return <div className="empty-state">기록된 {typeLabel}이 없습니다.</div>
    }

    return list
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((saving) => (
        <div key={saving.id} className="savings-item">
          <div className="savings-info">
            <div className="savings-header">
              <span className="savings-type">{typeLabel}</span>
              <span className="savings-date">{format(new Date(saving.date), 'yyyy년 MM월 dd일')}</span>
            </div>
            <div className="savings-amount">{saving.amount.toLocaleString()}원</div>
            {saving.memo && <div className="savings-memo">{saving.memo}</div>}
          </div>
          <div className="savings-actions">
            <Button variant="primary" size="sm" onClick={() => handleEdit(saving)}>
              수정
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (confirm('삭제하시겠습니까?')) {
                  deleteSavings(saving.id)
                }
              }}
            >
              삭제
            </Button>
          </div>
        </div>
      ))
  }

  return (
    <div className="savings-page">
      <div className="page-header">
        <h1 className="page-title">적금/비상금 기록</h1>
        <Button onClick={() => setIsModalOpen(true)}>기록 추가</Button>
      </div>

      <div className="savings-summary">
        <Card>
          <div className="summary-item">
            <span className="summary-label">총 비상금</span>
            <span className="summary-value">{totalEmergencyFund.toLocaleString()}원</span>
          </div>
        </Card>
        <Card>
          <div className="summary-item">
            <span className="summary-label">총 경조사비</span>
            <span className="summary-value">{totalCondolence.toLocaleString()}원</span>
          </div>
        </Card>
        <Card>
          <div className="summary-item">
            <span className="summary-label">총 여행적금</span>
            <span className="summary-value">{totalTravelSavings.toLocaleString()}원</span>
          </div>
        </Card>
        <Card>
          <div className="summary-item">
            <span className="summary-label">총 집마련적금</span>
            <span className="summary-value">{totalHouseSavings.toLocaleString()}원</span>
          </div>
        </Card>
        <Card>
          <div className="summary-item">
            <span className="summary-label">총 26주적금</span>
            <span className="summary-value">{totalWeek26Savings.toLocaleString()}원</span>
          </div>
        </Card>
        <Card>
          <div className="summary-item">
            <span className="summary-label">전체 합계</span>
            <span className="summary-value">{totalSavings.toLocaleString()}원</span>
          </div>
        </Card>
      </div>

      <Card title="비상금 내역">
        <div className="savings-list">{renderSavingsList(emergencyFundList, '비상금')}</div>
      </Card>

      <Card title="경조사비 내역">
        <div className="savings-list">{renderSavingsList(condolenceList, '경조사비')}</div>
      </Card>

      <Card title="여행적금 내역">
        <div className="savings-list">{renderSavingsList(travelSavingsList, '여행적금')}</div>
      </Card>

      <Card title="집마련적금 내역">
        <div className="savings-list">{renderSavingsList(houseSavingsList, '집마련적금')}</div>
      </Card>

      <Card title="26주적금 내역">
        <div className="savings-list">{renderSavingsList(week26SavingsList, '26주적금')}</div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="적금/비상금 추가">
        <form onSubmit={handleSubmit} className="savings-form">
          <div className="form-group">
            <label className="form-label">유형</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="savingsType"
                  value="EMERGENCY_FUND"
                  checked={formData.type === 'EMERGENCY_FUND'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as SavingsType })}
                />
                <span>비상금</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="savingsType"
                  value="CONDOLENCE"
                  checked={formData.type === 'CONDOLENCE'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as SavingsType })}
                />
                <span>경조사비</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="savingsType"
                  value="TRAVEL_SAVINGS"
                  checked={formData.type === 'TRAVEL_SAVINGS'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as SavingsType })}
                />
                <span>여행적금</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="savingsType"
                  value="HOUSE_SAVINGS"
                  checked={formData.type === 'HOUSE_SAVINGS'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as SavingsType })}
                />
                <span>집마련적금</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="savingsType"
                  value="WEEK26_SAVINGS"
                  checked={formData.type === 'WEEK26_SAVINGS'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as SavingsType })}
                />
                <span>26주적금</span>
              </label>
            </div>
          </div>
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

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="적금/비상금 수정">
        <form onSubmit={handleUpdate} className="savings-form">
          <div className="form-group">
            <label className="form-label">유형</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="savingsTypeEdit"
                  value="EMERGENCY_FUND"
                  checked={formData.type === 'EMERGENCY_FUND'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as SavingsType })}
                />
                <span>비상금</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="savingsTypeEdit"
                  value="CONDOLENCE"
                  checked={formData.type === 'CONDOLENCE'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as SavingsType })}
                />
                <span>경조사비</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="savingsTypeEdit"
                  value="TRAVEL_SAVINGS"
                  checked={formData.type === 'TRAVEL_SAVINGS'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as SavingsType })}
                />
                <span>여행적금</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="savingsTypeEdit"
                  value="HOUSE_SAVINGS"
                  checked={formData.type === 'HOUSE_SAVINGS'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as SavingsType })}
                />
                <span>집마련적금</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="savingsTypeEdit"
                  value="WEEK26_SAVINGS"
                  checked={formData.type === 'WEEK26_SAVINGS'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as SavingsType })}
                />
                <span>26주적금</span>
              </label>
            </div>
          </div>
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

export default SavingsPage
