import { useState } from 'react'
import { format } from 'date-fns'
import { useDataStore } from '../stores/dataStore'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import './InvestmentPage.css'

const InvestmentPage = () => {
  const { investments, addInvestment, updateInvestment, deleteInvestment } = useDataStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    currentValue: '',
    memo: '',
  })

  const investmentTypes = ['주식', '채권', '부동산', '펀드', '암호화폐', '기타']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.type || !formData.amount) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }
    addInvestment({
      name: formData.name,
      type: formData.type,
      amount: Number(formData.amount),
      date: formData.date,
      currentValue: formData.currentValue ? Number(formData.currentValue) : undefined,
      memo: formData.memo,
    })
    setFormData({
      name: '',
      type: '',
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      currentValue: '',
      memo: '',
    })
    setIsModalOpen(false)
  }

  const handleEdit = (investment: typeof investments[0]) => {
    setEditingId(investment.id)
    setFormData({
      name: investment.name,
      type: investment.type,
      amount: investment.amount.toString(),
      date: investment.date,
      currentValue: investment.currentValue?.toString() || '',
      memo: investment.memo || '',
    })
    setIsEditModalOpen(true)
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId || !formData.name || !formData.type || !formData.amount) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }
    updateInvestment(editingId, {
      name: formData.name,
      type: formData.type,
      amount: Number(formData.amount),
      date: formData.date,
      currentValue: formData.currentValue ? Number(formData.currentValue) : undefined,
      memo: formData.memo,
    })
    setFormData({
      name: '',
      type: '',
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      currentValue: '',
      memo: '',
    })
    setEditingId(null)
    setIsEditModalOpen(false)
  }

  const totalInvestment = investments.reduce((sum, i) => sum + (i.currentValue || i.amount), 0)
  const totalCost = investments.reduce((sum, i) => sum + i.amount, 0)
  const profit = totalInvestment - totalCost
  const profitPercent = totalCost > 0 ? (profit / totalCost) * 100 : 0

  return (
    <div className="investment-page">
      <div className="page-header">
        <h1 className="page-title">투자 기록</h1>
        <Button onClick={() => setIsModalOpen(true)}>투자 추가</Button>
      </div>

      <div className="investment-summary">
        <Card>
          <div className="summary-item">
            <span className="summary-label">총 투자금</span>
            <span className="summary-value">{totalCost.toLocaleString()}원</span>
          </div>
        </Card>
        <Card>
          <div className="summary-item">
            <span className="summary-label">현재 가치</span>
            <span className="summary-value">{totalInvestment.toLocaleString()}원</span>
          </div>
        </Card>
        <Card>
          <div className="summary-item">
            <span className="summary-label">손익</span>
            <span className={`summary-value ${profit >= 0 ? 'positive' : 'negative'}`}>
              {profit >= 0 ? '+' : ''}
              {profit.toLocaleString()}원 ({profitPercent >= 0 ? '+' : ''}
              {profitPercent.toFixed(1)}%)
            </span>
          </div>
        </Card>
      </div>

      <Card>
        <div className="investment-list">
          {investments.length === 0 ? (
            <div className="empty-state">기록된 투자가 없습니다.</div>
          ) : (
            investments
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((investment) => {
                const profit = (investment.currentValue || investment.amount) - investment.amount
                const profitPercent = investment.amount > 0 ? (profit / investment.amount) * 100 : 0
                return (
                  <div key={investment.id} className="investment-item">
                    <div className="investment-info">
                      <div className="investment-header">
                        <span className="investment-name">{investment.name}</span>
                        <span className="investment-type">{investment.type}</span>
                        <span className="investment-date">{format(new Date(investment.date), 'yyyy년 MM월 dd일')}</span>
                      </div>
                      <div className="investment-details">
                        <div>
                          <span className="investment-label">투자금: </span>
                          <span>{investment.amount.toLocaleString()}원</span>
                        </div>
                        {investment.currentValue && (
                          <div>
                            <span className="investment-label">현재가: </span>
                            <span>{investment.currentValue.toLocaleString()}원</span>
                          </div>
                        )}
                        {investment.currentValue && (
                          <div>
                            <span className="investment-label">손익: </span>
                            <span className={profit >= 0 ? 'positive' : 'negative'}>
                              {profit >= 0 ? '+' : ''}
                              {profit.toLocaleString()}원 ({profitPercent >= 0 ? '+' : ''}
                              {profitPercent.toFixed(1)}%)
                            </span>
                          </div>
                        )}
                      </div>
                      {investment.memo && <div className="investment-memo">{investment.memo}</div>}
                    </div>
                    <div className="investment-actions">
                      <Button variant="secondary" size="sm" onClick={() => handleEdit(investment)}>
                        수정
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          if (confirm('삭제하시겠습니까?')) {
                            deleteInvestment(investment.id)
                          }
                        }}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                )
              })
          )}
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="투자 추가">
        <form onSubmit={handleSubmit} className="investment-form">
          <Input
            label="투자명"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            placeholder="예: 삼성전자, 아파트 등"
            required
          />
          <div className="form-group">
            <label className="form-label">투자 유형</label>
            <select
              className="form-select"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="">선택하세요</option>
              {investmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="투자금액"
            type="number"
            value={formData.amount}
            onChange={(value) => setFormData({ ...formData, amount: value })}
            placeholder="투자한 금액을 입력하세요"
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
            label="현재 가치 (선택)"
            type="number"
            value={formData.currentValue}
            onChange={(value) => setFormData({ ...formData, currentValue: value })}
            placeholder="현재 가치를 입력하세요"
            min={0}
            step={1}
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

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="투자 수정">
        <form onSubmit={handleUpdate} className="investment-form">
          <Input
            label="투자명"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            placeholder="예: 삼성전자, 아파트 등"
            required
          />
          <div className="form-group">
            <label className="form-label">투자 유형</label>
            <select
              className="form-select"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="">선택하세요</option>
              {investmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="투자금액"
            type="number"
            value={formData.amount}
            onChange={(value) => setFormData({ ...formData, amount: value })}
            placeholder="투자한 금액을 입력하세요"
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
            label="현재 가치 (선택)"
            type="number"
            value={formData.currentValue}
            onChange={(value) => setFormData({ ...formData, currentValue: value })}
            placeholder="현재 가치를 입력하세요"
            min={0}
            step={1}
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

export default InvestmentPage

