import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { getInvitationByCode, acceptInvitation } from '../services/invitationService'
import Input from '../components/Input'
import Button from '../components/Button'
import './LoginPage.css'

const AcceptInvitationPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { supabaseUser, partner, loadPartners } = useAuthStore()
  const [code, setCode] = useState(searchParams.get('code') || '')
  const [name, setName] = useState('')
  const [character, setCharacter] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invitationInfo, setInvitationInfo] = useState<any>(null)

  // 이미 파트너가 있으면 대시보드로 이동
  useEffect(() => {
    if (partner) {
      navigate('/', { replace: true })
    }
  }, [partner, navigate])

  // 코드가 있으면 초대장 확인 (로그인 여부와 관계없이)
  useEffect(() => {
    if (code) {
      if (supabaseUser) {
        checkInvitation()
      } else {
        // 로그인하지 않았으면 초대장 정보만 확인 (이메일 체크는 하지 않음)
        checkInvitationWithoutAuth()
      }
    }
  }, [code, supabaseUser])

  const checkInvitationWithoutAuth = async () => {
    if (!code) return

    try {
      setIsChecking(true)
      setError(null)
      const invitation = await getInvitationByCode(code)
      if (invitation) {
        setInvitationInfo(invitation)
      } else {
        setError('유효하지 않거나 만료된 초대장입니다.')
      }
    } catch (error) {
      console.error('초대장 확인 오류:', error)
      setError('초대장을 확인하는 중 오류가 발생했습니다.')
    } finally {
      setIsChecking(false)
    }
  }

  const checkInvitation = async () => {
    if (!code || !supabaseUser) return

    try {
      setIsChecking(true)
      setError(null)
      const invitation = await getInvitationByCode(code)
      if (invitation) {
        setInvitationInfo(invitation)
        if (invitation.inviteeEmail !== supabaseUser.email) {
          setError('이 초대장은 다른 이메일 주소로 발송되었습니다.')
        }
      } else {
        setError('유효하지 않거나 만료된 초대장입니다.')
      }
    } catch (error) {
      console.error('초대장 확인 오류:', error)
      setError('초대장을 확인하는 중 오류가 발생했습니다.')
    } finally {
      setIsChecking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 로그인하지 않았으면 로그인 페이지로 이동
    if (!supabaseUser) {
      navigate(`/login?redirect=/accept-invitation&code=${code}`, { replace: true })
      return
    }

    if (!code) {
      setError('초대 코드를 입력해주세요.')
      return
    }
    if (!name) {
      setError('이름을 입력해주세요.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      await acceptInvitation(code, name, character)
      await loadPartners()
      navigate('/', { replace: true })
    } catch (error) {
      console.error('초대장 수락 오류:', error)
      const errorMessage = error instanceof Error ? error.message : '초대장 수락 중 오류가 발생했습니다.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">초대장 수락</h1>
        <p className="login-subtitle">파트너의 초대를 수락하고 함께 가계부를 관리하세요</p>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message" style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <Input
            label="초대 코드"
            value={code}
            onChange={(value) => setCode(value.toUpperCase())}
            placeholder="초대 코드를 입력하세요"
            required
            disabled={!!searchParams.get('code')}
          />

          {isChecking && (
            <div style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>초대장 확인 중...</div>
          )}

          {invitationInfo && (
            <>
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ fontSize: '0.9rem', color: '#666' }}>초대장 정보</div>
                <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
                  {invitationInfo.inviteeEmail}로 발송된 초대장입니다.
                </div>
                {supabaseUser && invitationInfo.inviteeEmail !== supabaseUser.email && (
                  <div style={{ marginTop: '0.5rem', color: 'red', fontSize: '0.9rem' }}>
                    ⚠️ 이 초대장은 다른 이메일 주소로 발송되었습니다.
                  </div>
                )}
              </div>

              {!supabaseUser ? (
                <div>
                  <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
                    초대장을 수락하려면 로그인이 필요합니다.
                  </div>
                  <Button
                    type="button"
                    fullWidth
                    onClick={() => navigate(`/login?redirect=/accept-invitation&code=${code}`)}
                  >
                    로그인하기
                  </Button>
                </div>
              ) : invitationInfo.inviteeEmail === supabaseUser.email ? (
                <>
                  <Input
                    label="이름"
                    value={name}
                    onChange={(value) => setName(value)}
                    placeholder="이름을 입력하세요"
                    required
                  />

                  <Input
                    label="캐릭터 (선택)"
                    value={character}
                    onChange={(value) => setCharacter(value)}
                    placeholder="예: 🐰, 👩, 등"
                  />

                  <Button type="submit" fullWidth disabled={isLoading || isChecking}>
                    {isLoading ? '처리 중...' : '초대장 수락하기'}
                  </Button>
                </>
              ) : (
                <div style={{ padding: '1rem', color: 'red' }}>
                  이 초대장은 {invitationInfo.inviteeEmail}로 발송되었습니다. 해당 이메일로 로그인해주세요.
                </div>
              )}
            </>
          )}

          {!invitationInfo && !isChecking && code && (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <Button
                type="button"
                onClick={supabaseUser ? checkInvitation : checkInvitationWithoutAuth}
                disabled={isChecking}
              >
                초대장 확인
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default AcceptInvitationPage
