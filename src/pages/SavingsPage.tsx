import { useState } from 'react'
import { format } from 'date-fns'
import { useDataStore } from '../stores/dataStore'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import './SavingsPage.css'

const SavingsPage = () => {
  const { savings, addSavings, deleteSavings } = useDataStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    type: 'SAVINGS' as 'SAVINGS' | 'EMERGENCY_FUND',
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
    addSavings({
      type: formData.type,
      amount: Number(formData.amount),
      date: formData.date,
      memo: formData.memo,
    })
    setFormData({
      type: 'SAVINGS',
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      memo: '',
    })
    setIsModalOpen(false)
  }

  const savingsList = savings.filter((s) => s.type === 'SAVINGS')
  const emergencyFundList = savings.filter((s) => s.type === 'EMERGENCY_FUND')

  const totalSavings = savingsList.reduce((sum, s) => sum + s.amount, 0)
  const totalEmergencyFund = emergencyFundList.reduce((sum, s) => sum + s.amount, 0)

  return (
    <div className="savings-page">
      <div className="page-header">
        <h1 className="page-title">적금/비상금 기록</h1>
        <Button onClick={() => setIsModalOpen(true)}>기록 추가</Button>
      </div>

      <div className="savings-summary">
        <Card>
          <div className="summary-item">
            <span className="summary-label">총 적금</span>
            <span className="summary-value">{totalSavings.toLocaleString()}원</span>
          </div>
        </Card>
        <Card>
          <div className="summary-item">
            <span className="summary-label">총 비상금</span>
            <span className="summary-value">{totalEmergencyFund.toLocaleString()}원</span>
          </div>
        </Card>
      </div>

      <Card title="적금 내역">
        <div className="savings-list">
          {savingsList.length === 0 ? (
            <div className="empty-state">기록된 적금이 없습니다.</div>
          ) : (
            savingsList
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((saving) => (
                <div key={saving.id} className="savings-item">
                  <div className="savings-info">
                    <div className="savings-header">
                      <span className="savings-type">적금</span>
                      <span className="savings-date">{format(new Date(saving.date), 'yyyy년 MM월 dd일')}</span>
                    </div>
                    <div className="savings-amount">{saving.amount.toLocaleString()}원</div>
                    {saving.memo && <div className="savings-memo">{saving.memo}</div>}
                  </div>
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
              ))
          )}
        </div>
      </Card>

      <Card title="비상금 내역">
        <div className="savings-list">
          {emergencyFundList.length === 0 ? (
            <div className="empty-state">기록된 비상금이 없습니다.</div>
          ) : (
            emergencyFundList
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((saving) => (
                <div key={saving.id} className="savings-item">
                  <div className="savings-info">
                    <div className="savings-header">
                      <span className="savings-type emergency">비상금</span>
                      <span className="savings-date">{format(new Date(saving.date), 'yyyy년 MM월 dd일')}</span>
                    </div>
                    <div className="savings-amount">{saving.amount.toLocaleString()}원</div>
                    {saving.memo && <div className="savings-memo">{saving.memo}</div>}
                  </div>
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
              ))
          )}
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="적금/비상금 추가">
        <form onSubmit={handleSubmit} className="savings-form">
          <div className="form-group">
            <label className="form-label">유형</label>
            <select
              className="form-select"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'SAVINGS' | 'EMERGENCY_FUND' })}
              required
            >
              <option value="SAVINGS">적금</option>
              <option value="EMERGENCY_FUND">비상금</option>
            </select>
          </div>
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
    </div>
  )
}

export default SavingsPage

