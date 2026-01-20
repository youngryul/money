import { useState } from 'react'
import { format } from 'date-fns'
import { useAuthStore } from '../stores/authStore'
import { useDataStore } from '../stores/dataStore'
import { TRANSACTION_TYPE } from '../constants'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import './LedgerPage.css'

const LedgerPage = () => {
  const { user, partner } = useAuthStore()
  const { ledgerTransactions, addLedgerTransaction, deleteLedgerTransaction } = useDataStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  type FormDataType = {
    type: typeof TRANSACTION_TYPE[keyof typeof TRANSACTION_TYPE]
    amount: string
    date: string
    category: string
    memo: string
    userId: string
  }

  const [formData, setFormData] = useState<FormDataType>({
    type: TRANSACTION_TYPE.EXPENSE,
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category: '',
    memo: '',
    userId: '',
  })

  const incomeCategories = ['수입', '부수입', '기타 수입']
  const expenseCategories = ['식비', '교통비', '생활용품', '의료비', '교육비', '문화생활', '고정비', '기타']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.amount || !formData.category) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }
    addLedgerTransaction({
      type: formData.type,
      amount: Number(formData.amount),
      date: formData.date,
      category: formData.category,
      memo: formData.memo,
      userId: formData.userId || undefined,
    })
    setFormData({
      type: TRANSACTION_TYPE.EXPENSE,
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      category: '',
      memo: '',
      userId: '',
    })
    setIsModalOpen(false)
  }

  const getUserName = (userId?: string) => {
    if (!userId) return '공동'
    if (userId === user?.id) return user.name
    if (userId === partner?.id) return partner?.name
    return ''
  }

  const transactions = ledgerTransactions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="ledger-page">
      <div className="page-header">
        <h1 className="page-title">가계부</h1>
        <Button onClick={() => setIsModalOpen(true)}>거래 추가</Button>
      </div>

      <Card>
        <div className="ledger-list">
          {transactions.length === 0 ? (
            <div className="empty-state">기록된 거래가 없습니다.</div>
          ) : (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`ledger-item ${transaction.type === TRANSACTION_TYPE.INCOME ? 'income' : 'expense'}`}
              >
                <div className="ledger-info">
                  <div className="ledger-header">
                    <span className="ledger-category">{transaction.category}</span>
                    <span className="ledger-date">{format(new Date(transaction.date), 'yyyy년 MM월 dd일')}</span>
                    {transaction.userId && (
                      <span className="ledger-user">{getUserName(transaction.userId)}</span>
                    )}
                  </div>
                  <div className={`ledger-amount ${transaction.type === TRANSACTION_TYPE.INCOME ? 'income' : 'expense'}`}>
                    {transaction.type === TRANSACTION_TYPE.INCOME ? '+' : '-'}
                    {transaction.amount.toLocaleString()}원
                  </div>
                  {transaction.memo && <div className="ledger-memo">{transaction.memo}</div>}
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (confirm('삭제하시겠습니까?')) {
                      deleteLedgerTransaction(transaction.id)
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="거래 추가">
        <form onSubmit={handleSubmit} className="ledger-form">
          <div className="form-group">
            <label className="form-label">거래 유형</label>
            <select
              className="form-select"
              value={formData.type}
              onChange={(e) => {
                setFormData({ 
                  ...formData, 
                  type: e.target.value as typeof TRANSACTION_TYPE[keyof typeof TRANSACTION_TYPE], 
                  category: '' 
                })
              }}
              required
            >
              <option value={TRANSACTION_TYPE.INCOME}>수입</option>
              <option value={TRANSACTION_TYPE.EXPENSE}>지출</option>
            </select>
          </div>
          <Input
            label="금액"
            type="number"
            value={formData.amount}
            onChange={(value) => setFormData({ ...formData, amount: value })}
            placeholder="금액을 입력하세요"
            required
            min={0}
            step={1000}
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
              {formData.type === TRANSACTION_TYPE.INCOME
                ? incomeCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))
                : expenseCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
            </select>
          </div>
          {formData.type === TRANSACTION_TYPE.EXPENSE && (
            <div className="form-group">
              <label className="form-label">누구의 지출인가요? (선택)</label>
              <select
                className="form-select"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              >
                <option value="">공동 지출</option>
                <option value={user?.id}>{user?.name}</option>
                <option value={partner?.id}>{partner?.name}</option>
              </select>
            </div>
          )}
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

export default LedgerPage

