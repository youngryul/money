import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { createInvitation, getSentInvitations } from '../services/invitationService'
import Input from '../components/Input'
import Button from '../components/Button'
import Card from '../components/Card'
import './LoginPage.css'

const InvitePartnerPage = () => {
  const navigate = useNavigate()
  const { supabaseUser, partner, setupSoloUser } = useAuthStore()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSoloLoading, setIsSoloLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [invitations, setInvitations] = useState<any[]>([])

  // 이미 파트너가 있으면 대시보드로 이동
  useEffect(() => {
    if (partner) {
      navigate('/', { replace: true })
    }
  }, [partner, navigate])

  // 초대장 목록 로드
  useEffect(() => {
    if (supabaseUser) {
      loadInvitations()
    }
  }, [supabaseUser])

  const loadInvitations = async () => {
    try {
      const sentInvitations = await getSentInvitations()
      setInvitations(sentInvitations)
    } catch (error) {
      console.error('초대장 목록 로드 오류:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('이메일을 입력해주세요.')
      return
    }

    if (!email.includes('@')) {
      setError('올바른 이메일 주소를 입력해주세요.')
      return
    }

    if (!name) {
      setError('이름을 입력해주세요.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      const invitation = await createInvitation(email, name)
      setSuccess(`초대장이 ${email}로 발송되었습니다. 초대 코드: ${invitation.code}`)
      setEmail('')
      setName('')
      await loadInvitations()
    } catch (error) {
      console.error('초대장 발송 오류:', error)
      const errorMessage = error instanceof Error ? error.message : '초대장 발송 중 오류가 발생했습니다.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('초대 코드가 복사되었습니다!')
  }

  const handleSoloUse = async () => {
    if (!name) {
      setError('이름을 입력해주세요.')
      return
    }

    try {
      setIsSoloLoading(true)
      setError(null)
      setSuccess(null)

      await setupSoloUser(name)
      navigate('/', { replace: true })
    } catch (error) {
      console.error('혼자 사용하기 설정 오류:', error)
      const errorMessage = error instanceof Error ? error.message : '설정 중 오류가 발생했습니다.'
      setError(errorMessage)
    } finally {
      setIsSoloLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container" style={{ maxWidth: '600px' }}>
        <h1 className="login-title">파트너 초대</h1>
        <p className="login-subtitle">파트너에게 초대장을 보내서 함께 가계부를 관리하세요</p>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message" style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="error-message" style={{ color: 'green', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {success}
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>내 정보</h3>
            <Input
              label="이름"
              value={name}
              onChange={(value) => setName(value)}
              placeholder="이름을 입력하세요"
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>파트너 정보</h3>
            <Input
              label="파트너 이메일"
              type="email"
              value={email}
              onChange={(value) => setEmail(value)}
              placeholder="파트너의 이메일 주소를 입력하세요"
              required
            />
          </div>

          <Button type="submit" fullWidth disabled={isLoading}>
            {isLoading ? '발송 중...' : '초대장 보내기'}
          </Button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e0e0e0' }}>
          <Button 
            type="button" 
            fullWidth 
            variant="secondary" 
            onClick={handleSoloUse}
            disabled={isSoloLoading || isLoading}
          >
            {isSoloLoading ? '처리 중...' : '혼자 사용하기'}
          </Button>
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#666', textAlign: 'center' }}>
            파트너 없이 혼자 가계부를 관리하고 싶으시면 이 버튼을 눌러주세요
          </p>
        </div>

        {invitations.length > 0 && (
          <Card style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>보낸 초대장</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  style={{
                    padding: '1rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{invitation.inviteeEmail}</div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                      초대 코드: <strong>{invitation.code}</strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.25rem' }}>
                      상태: {invitation.status === 'PENDING' ? '대기 중' : invitation.status === 'ACCEPTED' ? '수락됨' : '거절됨'}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => copyToClipboard(invitation.code)}
                    disabled={invitation.status !== 'PENDING'}
                  >
                    코드 복사
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default InvitePartnerPage
