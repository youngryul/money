import './Input.css'

interface InputProps {
  label?: string
  type?: 'text' | 'number' | 'date' | 'email' | 'password'
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  error?: string
}

/**
 * 재사용 가능한 입력 컴포넌트
 */
const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  min,
  max,
  step,
  disabled = false,
  error,
}: InputProps) => {
  return (
    <div className="input-group">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <input
        type={type}
        className={`input ${error ? 'input-error' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
      {error && <span className="input-error-message">{error}</span>}
    </div>
  )
}

export default Input

