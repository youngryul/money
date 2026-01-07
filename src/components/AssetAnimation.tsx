import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import './AssetAnimation.css'

interface AssetAnimationProps {
  currentValue: number
  previousValue: number
}

/**
 * 자산 변동을 애니메이션으로 표시하는 컴포넌트
 */
const AssetAnimation = ({ currentValue, previousValue }: AssetAnimationProps) => {
  const [displayValue, setDisplayValue] = useState(previousValue)
  const change = currentValue - previousValue
  const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0

  useEffect(() => {
    const duration = 1000
    const steps = 60
    const stepValue = (currentValue - previousValue) / steps
    const stepDuration = duration / steps

    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      if (currentStep >= steps) {
        setDisplayValue(currentValue)
        clearInterval(interval)
      } else {
        setDisplayValue(previousValue + stepValue * currentStep)
      }
    }, stepDuration)

    return () => clearInterval(interval)
  }, [currentValue, previousValue])

  return (
    <div className="asset-animation">
      <motion.div
        className="asset-animation-value"
        initial={{ scale: 1 }}
        animate={{ scale: change !== 0 ? [1, 1.1, 1] : 1 }}
        transition={{ duration: 0.5 }}
      >
        {Math.round(displayValue).toLocaleString()}원
      </motion.div>
      {change !== 0 && (
        <motion.div
          className={`asset-animation-change ${change >= 0 ? 'positive' : 'negative'}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {change >= 0 ? '↑' : '↓'} {Math.abs(change).toLocaleString()}원
          <span className="asset-animation-percent">
            ({changePercent >= 0 ? '+' : ''}
            {changePercent.toFixed(1)}%)
          </span>
        </motion.div>
      )}
    </div>
  )
}

export default AssetAnimation

