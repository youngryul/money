import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import Input from '../components/Input'
import Button from '../components/Button'
import './LoginPage.css'

const SetupPartnersPage = () => {
  const navigate = useNavigate()
  const { setupPartners, user, partner } = useAuthStore()
  const [user1, setUser1] = useState({ name: '' })
  const [user2, setUser2] = useState({ name: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 이미 파트너 정보가 있으면 대시보드로 이동
  useEffect(() => {
    if (user && partner) {
      navigate('/', { replace: true })
    }
  }, [user, partner, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user1.name || !user2.name) {
      setError('두 분의 이름을 모두 입력해주세요.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      await setupPartners(user1, user2)
      navigate('/')
    } catch (error) {
      console.error('파트너 설정 오류:', error)
      const errorMessage = error instanceof Error ? error.message : '파트너 설정 중 오류가 발생했습니다.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">파트너 정보 설정</h1>
        <p className="login-subtitle">두 분의 정보를 입력해주세요</p>
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message" style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}
          <div className="login-partner-section">
            <h3 className="login-partner-title">파트너 1</h3>
            <Input
              label="이름"
              value={user1.name}
              onChange={(value) => setUser1({ ...user1, name: value })}
              placeholder="이름을 입력하세요"
              required
            />
          </div>
          <div className="login-partner-section">
            <h3 className="login-partner-title">파트너 2</h3>
            <Input
              label="이름"
              value={user2.name}
              onChange={(value) => setUser2({ ...user2, name: value })}
              placeholder="이름을 입력하세요"
              required
            />
          </div>
          <Button type="submit" fullWidth disabled={isLoading}>
            {isLoading ? '처리 중...' : '시작하기'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default SetupPartnersPage
