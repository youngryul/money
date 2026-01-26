import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useDataStore } from '../stores/dataStore'
import { useAuthStore } from '../stores/authStore'
import { getKisAccessToken, getKisHoldings, type KisHolding } from '../services/kisApiService'
import { getKisConnection, saveKisConnection, deleteKisConnection } from '../services/kisConnectionService'
import { saveInvestmentSnapshot } from '../services/investmentSnapshotService'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import './InvestmentPage.css'

const InvestmentPage = () => {
  const { user } = useAuthStore()
  const { investments, addInvestment, updateInvestment } = useDataStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [isKisConnectModalOpen, setIsKisConnectModalOpen] = useState(false)
  const [isKisLoading, setIsKisLoading] = useState(false)
  const [kisHoldings, setKisHoldings] = useState<KisHolding[]>([])
  const [kisError, setKisError] = useState<string | null>(null)
  const [kisConnected, setKisConnected] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [kisConnectData, setKisConnectData] = useState({
    appKey: '',
    appSecret: '',
    accountNumber: '',
    isVirtual: true,
  })

  // 페이지 로드 시 저장된 KIS 연동 정보 불러오기
  useEffect(() => {
    const loadKisConnection = async () => {
      try {
        const connection = await getKisConnection()
        if (connection) {
          setKisConnectData({
            appKey: connection.appKey,
            appSecret: connection.appSecret,
            accountNumber: connection.accountNumber,
            isVirtual: connection.isVirtual,
          })
          setKisConnected(true)
          // 자동으로 보유 종목 조회
          await loadKisHoldings(connection)
        }
      } catch (error) {
        console.error('KIS 연동 정보 로드 오류:', error)
      }
    }

    if (user) {
      loadKisConnection()
    }
  }, [user])

  // 실시간 자동 새로고침 (30초마다)
  useEffect(() => {
    if (!kisConnected || !kisConnectData.accountNumber) {
      return
    }

    const interval = setInterval(async () => {
      try {
        const connection = await getKisConnection()
        if (connection) {
          await loadKisHoldings(connection)
        }
      } catch (error) {
        console.error('자동 새로고침 오류:', error)
      }
    }, 30000) // 30초마다

    return () => clearInterval(interval)
  }, [kisConnected, kisConnectData.accountNumber])


  // KIS 보유 종목 로드 함수
  const loadKisHoldings = async (connection?: { appKey: string; appSecret: string; accountNumber: string; isVirtual: boolean }) => {
    const conn = connection || kisConnectData
    if (!conn.appKey || !conn.appSecret || !conn.accountNumber) {
      return
    }

    setIsKisLoading(true)
    setKisError(null)

    try {
      const tokenData = await getKisAccessToken(conn.appKey, conn.appSecret, conn.isVirtual)
      const holdings = await getKisHoldings(
        tokenData.access_token,
        conn.appKey,
        conn.appSecret,
        conn.accountNumber,
        conn.isVirtual
      )
      setKisHoldings(holdings)
      
      // 투자금 스냅샷 저장 (오후 4시에만)
      const now = new Date()
      const currentHour = now.getHours()
      if (currentHour === 16) {
        try {
          const kisTotalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0)
          const totalInvestment = kisTotalValue > 0 
            ? kisTotalValue 
            : investments.reduce((sum, i) => sum + (i.currentValue || i.amount), 0)
          
          await saveInvestmentSnapshot(totalInvestment, kisTotalValue)
          console.log('투자금 스냅샷 저장 완료:', totalInvestment)
        } catch (error) {
          console.error('투자금 스냅샷 저장 오류:', error)
        }
      }
    } catch (error) {
      console.error('KIS 보유 종목 로드 오류:', error)
      setKisError(error instanceof Error ? error.message : '보유 종목 조회 중 오류가 발생했습니다.')
    } finally {
      setIsKisLoading(false)
    }
  }
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    currentValue: '',
    memo: '',
  })
  const [depositData, setDepositData] = useState({
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })

  const investmentTypes = ['주식', '채권', '부동산', '펀드', '암호화폐', '기타']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.type || !formData.amount) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }
    if (!user?.id) {
      alert('사용자 정보가 없습니다.')
      return
    }
    addInvestment({
      userId: user.id,
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

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!depositData.amount) {
      alert('예수금을 입력해주세요.')
      return
    }
    if (!user?.id) {
      alert('사용자 정보가 없습니다.')
      return
    }
    
    // 이번 달 예수금을 별도 투자 항목으로 저장
    const currentMonth = format(new Date(), 'yyyy-MM')
    
    // 이번 달 예수금 항목이 이미 있는지 확인
    const existingDepositInvestment = investments.find(
      (i) => i.name === '이번 달 예수금' && i.date.startsWith(currentMonth)
    )
    
    if (existingDepositInvestment) {
      // 기존 예수금 항목이 있으면 업데이트
      const existingDeposit = existingDepositInvestment.monthlyDeposit || 0
      await updateInvestment(existingDepositInvestment.id, {
        monthlyDeposit: existingDeposit + Number(depositData.amount),
      })
    } else {
      // 없으면 새로 생성
      await addInvestment({
        userId: user.id,
        name: '이번 달 예수금',
        type: '예수금',
        amount: 0,
        date: depositData.date,
        monthlyDeposit: Number(depositData.amount),
        memo: '이번 달 투자 예수금',
      })
    }
    
    setDepositData({
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    })
    setIsDepositModalOpen(false)
  }

  const handleKisConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!kisConnectData.appKey || !kisConnectData.appSecret || !kisConnectData.accountNumber) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }

    setIsKisLoading(true)
    setKisError(null)

    try {
      // 1. 토큰 발급 (연동 정보 검증)
      const tokenData = await getKisAccessToken(
        kisConnectData.appKey,
        kisConnectData.appSecret,
        kisConnectData.isVirtual
      )

      // 2. 보유 종목 조회 (연동 정보 검증)
      const holdings = await getKisHoldings(
        tokenData.access_token,
        kisConnectData.appKey,
        kisConnectData.appSecret,
        kisConnectData.accountNumber,
        kisConnectData.isVirtual
      )

      // 3. 연동 정보 저장
      await saveKisConnection({
        appKey: kisConnectData.appKey,
        appSecret: kisConnectData.appSecret,
        accountNumber: kisConnectData.accountNumber,
        isVirtual: kisConnectData.isVirtual,
      })

      setKisHoldings(holdings)
      setKisConnected(true)
      setIsKisConnectModalOpen(false)
      
      // 입력 필드 초기화 (보안상 저장 후에는 표시하지 않음)
      setKisConnectData({
        appKey: '',
        appSecret: '',
        accountNumber: kisConnectData.accountNumber, // 계좌번호는 유지
        isVirtual: kisConnectData.isVirtual,
      })
    } catch (error) {
      console.error('KIS 연동 오류:', error)
      setKisError(error instanceof Error ? error.message : 'KIS 연동 중 오류가 발생했습니다.')
    } finally {
      setIsKisLoading(false)
    }
  }

  const handleKisDisconnect = async () => {
    if (!confirm('한국투자증권 연동을 해제하시겠습니까?')) {
      return
    }

    try {
      await deleteKisConnection()
      setKisConnected(false)
      setKisHoldings([])
      setKisConnectData({
        appKey: '',
        appSecret: '',
        accountNumber: '',
        isVirtual: true,
      })
    } catch (error) {
      console.error('KIS 연동 해제 오류:', error)
      alert('연동 해제 중 오류가 발생했습니다.')
    }
  }

  const handleRefreshKis = async () => {
    if (!kisConnected) {
      alert('KIS 계좌 정보가 없습니다. 먼저 계좌를 연동해주세요.')
      return
    }

    // 저장된 연동 정보로 새로고침
    const connection = await getKisConnection()
    if (!connection) {
      alert('KIS 연동 정보를 찾을 수 없습니다.')
      return
    }

    await loadKisHoldings(connection)
  }

  // 이번 달 예수금 계산
  const currentMonth = format(new Date(), 'yyyy-MM')
  const monthlyDeposit = investments
    .filter((i) => i.monthlyDeposit && i.date.startsWith(currentMonth))
    .reduce((sum, i) => sum + (i.monthlyDeposit || 0), 0)

  // KIS 보유 종목 합계 계산
  const kisTotalValue = kisHoldings.reduce((sum, h) => sum + h.totalValue, 0)
  const kisTotalProfit = kisHoldings.reduce((sum, h) => sum + h.profitLoss, 0)
  const kisTotalCost = kisHoldings.reduce((sum, h) => sum + h.averagePrice * h.quantity, 0)
  const kisTotalProfitPercent = kisTotalCost > 0 ? (kisTotalProfit / kisTotalCost) * 100 : 0

  return (
    <div className="investment-page">
      <div className="page-header">
        <h1 className="page-title">투자 기록</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {kisConnected ? (
            <>
              <Button variant="secondary" onClick={handleRefreshKis} disabled={isKisLoading}>
                {isKisLoading ? '새로고침 중...' : 'KIS 새로고침'}
              </Button>
              <Button variant="secondary" onClick={handleKisDisconnect}>
                KIS 연동 해제
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setIsKisConnectModalOpen(true)}>
              한국투자증권 연동
            </Button>
          )}
          <Button variant="secondary" onClick={() => setIsDepositModalOpen(true)}>
            이번 달 예수금 입력
          </Button>
        </div>
      </div>

      <div className="investment-summary">
        <Card>
          <div className="summary-item">
            <span className="summary-label">이번 달 예수금</span>
            <span className="summary-value">{monthlyDeposit.toLocaleString()}원</span>
          </div>
        </Card>
        <Card>
          <div className="summary-item">
            <span className="summary-label">총 평가금액</span>
            <span className="summary-value">{kisTotalValue.toLocaleString()}원</span>
          </div>
        </Card>
        <Card>
          <div className="summary-item">
            <span className="summary-label">손익</span>
            <span className="summary-value" style={{ color: kisTotalProfit >= 0 ? '#ef4444' : '#3b82f6' }}>
              {kisTotalProfit >= 0 ? '+' : ''}
              {kisTotalProfit.toLocaleString()}원 ({kisTotalProfitPercent >= 0 ? '+' : ''}
              {kisTotalProfitPercent.toFixed(1)}%)
            </span>
          </div>
        </Card>
      </div>

      {/* 한국투자증권 현황 */}
      {kisHoldings.length > 0 && (
        <Card title="한국투자증권 현황">
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="secondary" size="sm" onClick={handleRefreshKis} disabled={isKisLoading}>
                {isKisLoading ? '새로고침 중...' : '새로고침'}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setIsKisConnectModalOpen(true)}>
                연동 정보 수정
              </Button>
            </div>
          </div>
          {kisError && (
            <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {kisError}
            </div>
          )}
          <div className="investment-list">
            {kisHoldings.map((holding, index) => (
              <div key={index} className="investment-item">
                <div className="investment-info">
                  <div className="investment-header">
                    <span className="investment-name">{holding.stockName}</span>
                    <span className="investment-type">{holding.stockCode}</span>
                  </div>
                  <div className="investment-details">
                    <div>
                      <span className="investment-label">보유수량: </span>
                      <span>{holding.quantity.toLocaleString()}주</span>
                    </div>
                    <div>
                      <span className="investment-label">평균단가: </span>
                      <span>{holding.averagePrice.toLocaleString()}원</span>
                    </div>
                    <div>
                      <span className="investment-label">현재가: </span>
                      <span>{holding.currentPrice.toLocaleString()}원</span>
                    </div>
                    <div>
                      <span className="investment-label">평가금액: </span>
                      <span>{holding.totalValue.toLocaleString()}원</span>
                    </div>
                    <div>
                      <span className="investment-label">손익: </span>
                      <span style={{ color: holding.profitLoss >= 0 ? '#ef4444' : '#3b82f6' }}>
                        {holding.profitLoss >= 0 ? '+' : ''}
                        {holding.profitLoss.toLocaleString()}원 ({holding.profitLossPercent >= 0 ? '+' : ''}
                        {holding.profitLossPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

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

      <Modal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} title="이번 달 예수금 입력">
        <form onSubmit={handleDepositSubmit} className="investment-form">
          <Input
            label="예수금"
            type="number"
            value={depositData.amount}
            onChange={(value) => setDepositData({ ...depositData, amount: value })}
            placeholder="이번 달 투자 예수금을 입력하세요"
            required
            min={0}
            step={1}
          />
          <Input
            label="날짜"
            type="date"
            value={depositData.date}
            onChange={(value) => setDepositData({ ...depositData, date: value })}
            required
          />
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setIsDepositModalOpen(false)}>
              취소
            </Button>
            <Button type="submit">저장</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isKisConnectModalOpen} onClose={() => setIsKisConnectModalOpen(false)} title={kisConnected ? "한국투자증권 연동 정보 수정" : "한국투자증권 계좌 연동"}>
        <form onSubmit={handleKisConnect} className="investment-form">
          <div className="form-group">
            <label className="form-label">모의투자 여부</label>
            <select
              className="form-select"
              value={kisConnectData.isVirtual ? 'true' : 'false'}
              onChange={(e) => setKisConnectData({ ...kisConnectData, isVirtual: e.target.value === 'true' })}
            >
              <option value="true">모의투자</option>
              <option value="false">실거래</option>
            </select>
          </div>
          <Input
            label="앱키 (App Key)"
            type="text"
            value={kisConnectData.appKey}
            onChange={(value) => setKisConnectData({ ...kisConnectData, appKey: value })}
            placeholder={kisConnected ? "변경하려면 새 앱키를 입력하세요" : "한국투자증권 앱키를 입력하세요"}
            required={!kisConnected}
          />
          <Input
            label="앱시크릿 (App Secret)"
            type="password"
            value={kisConnectData.appSecret}
            onChange={(value) => setKisConnectData({ ...kisConnectData, appSecret: value })}
            placeholder={kisConnected ? "변경하려면 새 앱시크릿을 입력하세요" : "한국투자증권 앱시크릿을 입력하세요"}
            required={!kisConnected}
          />
          <Input
            label="계좌번호"
            type="text"
            value={kisConnectData.accountNumber}
            onChange={(value) => setKisConnectData({ ...kisConnectData, accountNumber: value })}
            placeholder="예: 12345678-01"
            required
          />
          {kisConnected && (
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              이미 연동되어 있습니다. 정보를 변경하려면 모든 필드를 입력해주세요.
            </div>
          )}
          {kisError && (
            <div style={{ color: 'var(--danger-color)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              {kisError}
            </div>
          )}
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setIsKisConnectModalOpen(false)} disabled={isKisLoading}>
              취소
            </Button>
            <Button type="submit" disabled={isKisLoading}>
              {isKisLoading ? '연동 중...' : kisConnected ? '수정' : '연동'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default InvestmentPage

