import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import Input from '../components/Input'
import Button from '../components/Button'
import './LoginPage.css'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [user1, setUser1] = useState({ name: '', character: '' })
  const [user2, setUser2] = useState({ name: '', character: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user1.name || !user2.name) {
      alert('두 분의 이름을 모두 입력해주세요.')
      return
    }
    login(user1, user2)
    navigate('/')
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">부부 돈 관리</h1>
        <p className="login-subtitle">함께하는 가계부</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-partner-section">
            <h3 className="login-partner-title">파트너 1</h3>
            <Input
              label="이름"
              value={user1.name}
              onChange={(value) => setUser1({ ...user1, name: value })}
              placeholder="이름을 입력하세요"
              required
            />
            <Input
              label="캐릭터 (선택)"
              value={user1.character}
              onChange={(value) => setUser1({ ...user1, character: value })}
              placeholder="예: 🐻, 👨, 등"
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
            <Input
              label="캐릭터 (선택)"
              value={user2.character}
              onChange={(value) => setUser2({ ...user2, character: value })}
              placeholder="예: 🐰, 👩, 등"
            />
          </div>
          <Button type="submit" fullWidth>
            시작하기
          </Button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage

