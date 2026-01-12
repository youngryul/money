import { create } from 'zustand'
import {
  Salary,
  FixedExpense,
  LivingExpense,
  Allowance,
  LedgerTransaction,
  Savings,
  Investment,
  Goal,
} from '../types'
import {
  getSalaries,
  createSalary,
  updateSalary,
  deleteSalary,
  getFixedExpenses,
  createFixedExpense,
  updateFixedExpense,
  deleteFixedExpense,
  getLivingExpenses,
  createLivingExpense,
  updateLivingExpense,
  deleteLivingExpense,
  getAllowances,
  createAllowance,
  updateAllowance,
  deleteAllowance,
  getLedgerTransactions,
  createLedgerTransaction,
  updateLedgerTransaction,
  deleteLedgerTransaction,
  getSavings,
  createSavings,
  updateSavings,
  deleteSavings,
  getInvestments,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} from '../services'

interface DataState {
  // 로딩 상태
  isLoading: boolean
  error: string | null

  // 월급
  salaries: Salary[]
  addSalary: (salary: Omit<Salary, 'id'>) => Promise<void>
  updateSalary: (id: string, salary: Partial<Salary>) => Promise<void>
  deleteSalary: (id: string) => Promise<void>

  // 고정비
  fixedExpenses: FixedExpense[]
  addFixedExpense: (expense: Omit<FixedExpense, 'id'>) => Promise<void>
  updateFixedExpense: (id: string, expense: Partial<FixedExpense>) => Promise<void>
  deleteFixedExpense: (id: string) => Promise<void>

  // 생활비
  livingExpenses: LivingExpense[]
  addLivingExpense: (expense: Omit<LivingExpense, 'id'>) => Promise<void>
  updateLivingExpense: (id: string, expense: Partial<LivingExpense>) => Promise<void>
  deleteLivingExpense: (id: string) => Promise<void>

  // 용돈
  allowances: Allowance[]
  addAllowance: (allowance: Omit<Allowance, 'id'>) => Promise<void>
  updateAllowance: (id: string, allowance: Partial<Allowance>) => Promise<void>
  deleteAllowance: (id: string) => Promise<void>

  // 가계부
  ledgerTransactions: LedgerTransaction[]
  addLedgerTransaction: (transaction: Omit<LedgerTransaction, 'id'>) => Promise<void>
  updateLedgerTransaction: (id: string, transaction: Partial<LedgerTransaction>) => Promise<void>
  deleteLedgerTransaction: (id: string) => Promise<void>

  // 적금/비상금
  savings: Savings[]
  addSavings: (saving: Omit<Savings, 'id'>) => Promise<void>
  updateSavings: (id: string, saving: Partial<Savings>) => Promise<void>
  deleteSavings: (id: string) => Promise<void>

  // 투자
  investments: Investment[]
  addInvestment: (investment: Omit<Investment, 'id'>) => Promise<void>
  updateInvestment: (id: string, investment: Partial<Investment>) => Promise<void>
  deleteInvestment: (id: string) => Promise<void>

  // 목표
  goals: Goal[]
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>
  deleteGoal: (id: string) => Promise<void>

  // 데이터 로딩
  loadAllData: () => Promise<void>
  clearError: () => void
}

export const useDataStore = create<DataState>((set, get) => ({
  // 초기 상태
  isLoading: false,
  error: null,

  // 월급
  salaries: [],
  addSalary: async (salary) => {
    try {
      set({ isLoading: true, error: null })
      const newSalary = await createSalary(salary)
      set((state) => ({
        salaries: [...state.salaries, newSalary],
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '월급 추가 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },
  updateSalary: async (id, salary) => {
    try {
      set({ isLoading: true, error: null })
      const updatedSalary = await updateSalary(id, salary)
      set((state) => ({
        salaries: state.salaries.map((s) => (s.id === id ? updatedSalary : s)),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '월급 수정 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },
  deleteSalary: async (id) => {
    try {
      set({ isLoading: true, error: null })
      await deleteSalary(id)
      set((state) => ({
        salaries: state.salaries.filter((s) => s.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '월급 삭제 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  // 고정비
  fixedExpenses: [],
  addFixedExpense: async (expense) => {
    try {
      set({ isLoading: true, error: null })
      const newExpense = await createFixedExpense(expense)
      set((state) => ({
        fixedExpenses: [...state.fixedExpenses, newExpense],
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '고정비 추가 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },
  updateFixedExpense: async (id, expense) => {
    try {
      set({ isLoading: true, error: null })
      const updatedExpense = await updateFixedExpense(id, expense)
      set((state) => ({
        fixedExpenses: state.fixedExpenses.map((e) => (e.id === id ? updatedExpense : e)),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '고정비 수정 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },
  deleteFixedExpense: async (id) => {
    try {
      set({ isLoading: true, error: null })
      await deleteFixedExpense(id)
      set((state) => ({
        fixedExpenses: state.fixedExpenses.filter((e) => e.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '고정비 삭제 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  // 생활비
  livingExpenses: [],
  addLivingExpense: async (expense) => {
    try {
      set({ isLoading: true, error: null })
      const newExpense = await createLivingExpense(expense)
      set((state) => ({
        livingExpenses: [...state.livingExpenses, newExpense],
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '생활비 추가 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },
  updateLivingExpense: async (id, expense) => {
    try {
      set({ isLoading: true, error: null })
      const updatedExpense = await updateLivingExpense(id, expense)
      set((state) => ({
        livingExpenses: state.livingExpenses.map((e) => (e.id === id ? updatedExpense : e)),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '생활비 수정 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },
  deleteLivingExpense: async (id) => {
    try {
      set({ isLoading: true, error: null })
      await deleteLivingExpense(id)
      set((state) => ({
        livingExpenses: state.livingExpenses.filter((e) => e.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '생활비 삭제 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  // 용돈
  allowances: [],
  addAllowance: async (allowance) => {
    try {
      set({ isLoading: true, error: null })
      const newAllowance = await createAllowance(allowance)
      set((state) => ({
        allowances: [...state.allowances, newAllowance],
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '용돈 추가 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },
  updateAllowance: async (id, allowance) => {
    try {
      set({ isLoading: true, error: null })
      const updatedAllowance = await updateAllowance(id, allowance)
      set((state) => ({
        allowances: state.allowances.map((a) => (a.id === id ? updatedAllowance : a)),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '용돈 수정 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },
  deleteAllowance: async (id) => {
    try {
      set({ isLoading: true, error: null })
      await deleteAllowance(id)
      set((state) => ({
        allowances: state.allowances.filter((a) => a.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '용돈 삭제 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  // 가계부
  ledgerTransactions: [],
  addLedgerTransaction: async (transaction) => {
    try {
      set({ isLoading: true, error: null })
      const newTransaction = await createLedgerTransaction(transaction)
      set((state) => ({
        ledgerTransactions: [...state.ledgerTransactions, newTransaction],
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '거래 내역 추가 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },
  updateLedgerTransaction: async (id, transaction) => {
    try {
      set({ isLoading: true, error: null })
      const updatedTransaction = await updateLedgerTransaction(id, transaction)
      set((state) => ({
        ledgerTransactions: state.ledgerTransactions.map((t) =>
          t.id === id ? updatedTransaction : t
        ),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '거래 내역 수정 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },
  deleteLedgerTransaction: async (id) => {
    try {
      set({ isLoading: true, error: null })
      await deleteLedgerTransaction(id)
      set((state) => ({
        ledgerTransactions: state.ledgerTransactions.filter((t) => t.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '거래 내역 삭제 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  // 적금/비상금
  savings: [],
  addSavings: async (saving) => {
    try {
      set({ isLoading: true, error: null })
      const newSaving = await createSavings(saving)
      set((state) => ({
        savings: [...state.savings, newSaving],
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '적금/비상금 추가 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },
  updateSavings: async (id, saving) => {
    try {
      set({ isLoading: true, error: null })
      const updatedSaving = await updateSavings(id, saving)
      set((state) => ({
        savings: state.savings.map((s) => (s.id === id ? updatedSaving : s)),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '적금/비상금 수정 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },
  deleteSavings: async (id) => {
    try {
      set({ isLoading: true, error: null })
      await deleteSavings(id)
      set((state) => ({
        savings: state.savings.filter((s) => s.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '적금/비상금 삭제 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  // 투자
  investments: [],
  addInvestment: async (investment) => {
    try {
      set({ isLoading: true, error: null })
      const newInvestment = await createInvestment(investment)
      set((state) => ({
        investments: [...state.investments, newInvestment],
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '투자 정보 추가 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },
  updateInvestment: async (id, investment) => {
    try {
      set({ isLoading: true, error: null })
      const updatedInvestment = await updateInvestment(id, investment)
      set((state) => ({
        investments: state.investments.map((i) => (i.id === id ? updatedInvestment : i)),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '투자 정보 수정 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },
  deleteInvestment: async (id) => {
    try {
      set({ isLoading: true, error: null })
      await deleteInvestment(id)
      set((state) => ({
        investments: state.investments.filter((i) => i.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '투자 정보 삭제 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  // 목표
  goals: [],
  addGoal: async (goal) => {
    try {
      set({ isLoading: true, error: null })
      const newGoal = await createGoal(goal)
      set((state) => ({
        goals: [...state.goals, newGoal],
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '목표 추가 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },
  updateGoal: async (id, goal) => {
    try {
      set({ isLoading: true, error: null })
      const updatedGoal = await updateGoal(id, goal)
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? updatedGoal : g)),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '목표 수정 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },
  deleteGoal: async (id) => {
    try {
      set({ isLoading: true, error: null })
      await deleteGoal(id)
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '목표 삭제 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  // 데이터 로딩
  loadAllData: async () => {
    try {
      set({ isLoading: true, error: null })
      const [salaries, fixedExpenses, livingExpenses, allowances, ledgerTransactions, savings, investments, goals] =
        await Promise.all([
          getSalaries(),
          getFixedExpenses(),
          getLivingExpenses(),
          getAllowances(),
          getLedgerTransactions(),
          getSavings(),
          getInvestments(),
          getGoals(),
        ])

      set({
        salaries,
        fixedExpenses,
        livingExpenses,
        allowances,
        ledgerTransactions,
        savings,
        investments,
        goals,
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '데이터 로딩 중 오류가 발생했습니다.'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  // 에러 초기화
  clearError: () => set({ error: null }),
}))
