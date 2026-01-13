import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { getReceivedInvitations } from '../services/invitationService'
import Input from '../components/Input'
import Button from '../components/Button'
import './LoginPage.css'

const LoginPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signIn, signUp } = useAuthStore()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 리다이렉트 URL 확인
  const redirectUrl = searchParams.get('redirect')
  const invitationCode = searchParams.get('code')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      if (isSignUp) {
        await signUp(email, password)
        // 회원가입 후 초대장 보내기 페이지로 이동
        navigate('/invite-partner')
      } else {
        await signIn(email, password)
        
        // 리다이렉트 URL이 있으면 해당 페이지로 이동
        if (redirectUrl) {
          const url = invitationCode ? `${redirectUrl}?code=${invitationCode}` : redirectUrl
          navigate(url, { replace: true })
          return
        }

        // 받은 초대장 확인
        try {
          const receivedInvitations = await getReceivedInvitations(email)
          if (receivedInvitations.length > 0) {
            // 가장 최근 초대장으로 이동
            const latestInvitation = receivedInvitations[0]
            navigate(`/accept-invitation?code=${latestInvitation.code}`, { replace: true })
            return
          }
        } catch (error) {
          console.error('초대장 확인 오류:', error)
          // 초대장 확인 실패해도 계속 진행
        }

        // 로그인 성공 후 대시보드로 이동 (파트너가 없으면 자동으로 초대장 페이지로 리다이렉트됨)
        navigate('/')
      }
    } catch (error) {
      console.error('인증 오류:', error)
      const errorMessage = error instanceof Error ? error.message : '인증 중 오류가 발생했습니다.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">부부 돈 관리</h1>
        <p className="login-subtitle">함께하는 가계부</p>
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message" style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}
          <Input
            label="이메일"
            type="email"
            value={email}
            onChange={(value) => setEmail(value)}
            placeholder="이메일을 입력하세요"
            required
          />
          <Input
            label="비밀번호"
            type="password"
            value={password}
            onChange={(value) => setPassword(value)}
            placeholder="비밀번호를 입력하세요"
            required
            minLength={6}
          />
          <Button type="submit" fullWidth disabled={isLoading}>
            {isLoading ? '처리 중...' : isSignUp ? '회원가입' : '로그인'}
          </Button>
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#007bff',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.9rem',
              }}
            >
              {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage

