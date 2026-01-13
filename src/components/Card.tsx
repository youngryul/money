import './Card.css'

interface CardProps {
  children: React.ReactNode
  title?: string
  className?: string
  style?: React.CSSProperties
}

/**
 * 재사용 가능한 카드 컴포넌트
 */
const Card = ({ children, title, className = '', style }: CardProps) => {
  return (
    <div className={`card ${className}`} style={style}>
      {title && <h2 className="card-title">{title}</h2>}
      <div className="card-content">{children}</div>
    </div>
  )
}

export default Card

