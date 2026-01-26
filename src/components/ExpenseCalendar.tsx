import { useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns'
import { LivingExpense } from '../types'
import './ExpenseCalendar.css'

interface ExpenseCalendarProps {
  expenses: LivingExpense[]
  selectedDate?: Date
  onDateClick?: (date: Date) => void
}

/**
 * 생활비 달력 컴포넌트
 * 일별 지출 금액을 표시하는 달력
 */
const ExpenseCalendar = ({ expenses, selectedDate, onDateClick }: ExpenseCalendarProps) => {
  const currentDate = selectedDate || new Date()
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // 일별 지출 금액 계산
  const dailyExpenses = useMemo(() => {
    const dailyMap = new Map<string, number>()
    
    expenses.forEach((expense) => {
      const expenseDate = format(new Date(expense.date), 'yyyy-MM-dd')
      const current = dailyMap.get(expenseDate) || 0
      dailyMap.set(expenseDate, current + expense.amount)
    })
    
    return dailyMap
  }, [expenses])

  // 요일 헤더
  const weekDays = ['일', '월', '화', '수', '목', '금', '토']

  // 달력 첫 주의 시작일 계산 (빈 칸 채우기)
  const firstDayOfWeek = getDay(monthStart)
  const emptyDays = Array(firstDayOfWeek).fill(null)

  return (
    <div className="expense-calendar">
      <div className="calendar-header">
        <h3>{format(currentDate, 'yyyy년 MM월')}</h3>
      </div>
      <div className="calendar-grid">
        {/* 요일 헤더 */}
        {weekDays.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
        
        {/* 빈 칸 (첫 주 시작 전) */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="calendar-day empty"></div>
        ))}
        
        {/* 날짜 칸 */}
        {daysInMonth.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayExpense = dailyExpenses.get(dateKey) || 0
          const isToday = isSameDay(day, new Date())
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          
          return (
            <div
              key={dateKey}
              className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayExpense > 0 ? 'has-expense' : ''}`}
              onClick={() => onDateClick?.(day)}
            >
              <div className="calendar-day-number">{format(day, 'd')}</div>
              {dayExpense > 0 && (
                <div className="calendar-day-expense">
                  {dayExpense.toLocaleString()}원
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ExpenseCalendar
