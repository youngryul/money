import './Card.css'

interface CardProps {
  children: React.ReactNode
  title?: string
  className?: string
}

/**
 * 재사용 가능한 카드 컴포넌트
 */
const Card = ({ children, title, className = '' }: CardProps) => {
  return (
    <div className={`card ${className}`}>
      {title && <h2 className="card-title">{title}</h2>}
      <div className="card-content">{children}</div>
    </div>
  )
}

export default Card

