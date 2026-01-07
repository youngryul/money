import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
import { STORAGE_KEYS } from '../constants'

interface DataState {
  // 월급
  salaries: Salary[]
  addSalary: (salary: Omit<Salary, 'id'>) => void
  updateSalary: (id: string, salary: Partial<Salary>) => void
  deleteSalary: (id: string) => void

  // 고정비
  fixedExpenses: FixedExpense[]
  addFixedExpense: (expense: Omit<FixedExpense, 'id'>) => void
  updateFixedExpense: (id: string, expense: Partial<FixedExpense>) => void
  deleteFixedExpense: (id: string) => void

  // 생활비
  livingExpenses: LivingExpense[]
  addLivingExpense: (expense: Omit<LivingExpense, 'id'>) => void
  updateLivingExpense: (id: string, expense: Partial<LivingExpense>) => void
  deleteLivingExpense: (id: string) => void

  // 용돈
  allowances: Allowance[]
  addAllowance: (allowance: Omit<Allowance, 'id'>) => void
  updateAllowance: (id: string, allowance: Partial<Allowance>) => void
  deleteAllowance: (id: string) => void

  // 가계부
  ledgerTransactions: LedgerTransaction[]
  addLedgerTransaction: (transaction: Omit<LedgerTransaction, 'id'>) => void
  updateLedgerTransaction: (id: string, transaction: Partial<LedgerTransaction>) => void
  deleteLedgerTransaction: (id: string) => void

  // 적금/비상금
  savings: Savings[]
  addSavings: (saving: Omit<Savings, 'id'>) => void
  updateSavings: (id: string, saving: Partial<Savings>) => void
  deleteSavings: (id: string) => void

  // 투자
  investments: Investment[]
  addInvestment: (investment: Omit<Investment, 'id'>) => void
  updateInvestment: (id: string, investment: Partial<Investment>) => void
  deleteInvestment: (id: string) => void

  // 목표
  goals: Goal[]
  addGoal: (goal: Omit<Goal, 'id'>) => void
  updateGoal: (id: string, goal: Partial<Goal>) => void
  deleteGoal: (id: string) => void
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      // 월급
      salaries: [],
      addSalary: (salary) =>
        set((state) => ({
          salaries: [...state.salaries, { ...salary, id: generateId() }],
        })),
      updateSalary: (id, salary) =>
        set((state) => ({
          salaries: state.salaries.map((s) => (s.id === id ? { ...s, ...salary } : s)),
        })),
      deleteSalary: (id) =>
        set((state) => ({
          salaries: state.salaries.filter((s) => s.id !== id),
        })),

      // 고정비
      fixedExpenses: [],
      addFixedExpense: (expense) =>
        set((state) => ({
          fixedExpenses: [...state.fixedExpenses, { ...expense, id: generateId() }],
        })),
      updateFixedExpense: (id, expense) =>
        set((state) => ({
          fixedExpenses: state.fixedExpenses.map((e) => (e.id === id ? { ...e, ...expense } : e)),
        })),
      deleteFixedExpense: (id) =>
        set((state) => ({
          fixedExpenses: state.fixedExpenses.filter((e) => e.id !== id),
        })),

      // 생활비
      livingExpenses: [],
      addLivingExpense: (expense) =>
        set((state) => ({
          livingExpenses: [...state.livingExpenses, { ...expense, id: generateId() }],
        })),
      updateLivingExpense: (id, expense) =>
        set((state) => ({
          livingExpenses: state.livingExpenses.map((e) => (e.id === id ? { ...e, ...expense } : e)),
        })),
      deleteLivingExpense: (id) =>
        set((state) => ({
          livingExpenses: state.livingExpenses.filter((e) => e.id !== id),
        })),

      // 용돈
      allowances: [],
      addAllowance: (allowance) =>
        set((state) => ({
          allowances: [...state.allowances, { ...allowance, id: generateId() }],
        })),
      updateAllowance: (id, allowance) =>
        set((state) => ({
          allowances: state.allowances.map((a) => (a.id === id ? { ...a, ...allowance } : a)),
        })),
      deleteAllowance: (id) =>
        set((state) => ({
          allowances: state.allowances.filter((a) => a.id !== id),
        })),

      // 가계부
      ledgerTransactions: [],
      addLedgerTransaction: (transaction) =>
        set((state) => ({
          ledgerTransactions: [...state.ledgerTransactions, { ...transaction, id: generateId() }],
        })),
      updateLedgerTransaction: (id, transaction) =>
        set((state) => ({
          ledgerTransactions: state.ledgerTransactions.map((t) =>
            t.id === id ? { ...t, ...transaction } : t
          ),
        })),
      deleteLedgerTransaction: (id) =>
        set((state) => ({
          ledgerTransactions: state.ledgerTransactions.filter((t) => t.id !== id),
        })),

      // 적금/비상금
      savings: [],
      addSavings: (saving) =>
        set((state) => ({
          savings: [...state.savings, { ...saving, id: generateId() }],
        })),
      updateSavings: (id, saving) =>
        set((state) => ({
          savings: state.savings.map((s) => (s.id === id ? { ...s, ...saving } : s)),
        })),
      deleteSavings: (id) =>
        set((state) => ({
          savings: state.savings.filter((s) => s.id !== id),
        })),

      // 투자
      investments: [],
      addInvestment: (investment) =>
        set((state) => ({
          investments: [...state.investments, { ...investment, id: generateId() }],
        })),
      updateInvestment: (id, investment) =>
        set((state) => ({
          investments: state.investments.map((i) => (i.id === id ? { ...i, ...investment } : i)),
        })),
      deleteInvestment: (id) =>
        set((state) => ({
          investments: state.investments.filter((i) => i.id !== id),
        })),

      // 목표
      goals: [],
      addGoal: (goal) =>
        set((state) => ({
          goals: [...state.goals, { ...goal, id: generateId() }],
        })),
      updateGoal: (id, goal) =>
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...goal } : g)),
        })),
      deleteGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),
    }),
    {
      name: 'money_data',
    }
  )
)

