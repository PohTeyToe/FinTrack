import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Expense, ExpenseCategory } from '../types';

interface ExpensesState {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
}

// Generate mock expenses for the past 2 months
const generateMockExpenses = (): Expense[] => {
  const expenses: Expense[] = [];
  const categories: ExpenseCategory[] = ['food', 'transport', 'entertainment', 'bills', 'other'];
  const descriptions: Record<ExpenseCategory, string[]> = {
    food: ['Grocery shopping', 'Restaurant dinner', 'Coffee shop', 'Lunch takeout', 'Fast food'],
    transport: ['Gas station', 'Uber ride', 'Bus pass', 'Parking fee', 'Car maintenance'],
    entertainment: ['Movie tickets', 'Netflix subscription', 'Concert tickets', 'Video game', 'Books'],
    bills: ['Electric bill', 'Internet bill', 'Phone bill', 'Water bill', 'Insurance'],
    other: ['Amazon purchase', 'Gift', 'Clothes', 'Home supplies', 'Personal care'],
  };

  const today = new Date();
  
  for (let i = 0; i < 45; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));
    
    const category = categories[Math.floor(Math.random() * categories.length)];
    const descList = descriptions[category];
    const description = descList[Math.floor(Math.random() * descList.length)];
    
    let amount: number;
    switch (category) {
      case 'food':
        amount = 15 + Math.random() * 100;
        break;
      case 'transport':
        amount = 10 + Math.random() * 80;
        break;
      case 'entertainment':
        amount = 10 + Math.random() * 60;
        break;
      case 'bills':
        amount = 50 + Math.random() * 150;
        break;
      default:
        amount = 20 + Math.random() * 100;
    }

    expenses.push({
      id: `exp-${i}`,
      amount: Math.round(amount * 100) / 100,
      category,
      description,
      date: date.toISOString().split('T')[0],
    });
  }

  return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const initialState: ExpensesState = {
  expenses: generateMockExpenses(),
  isLoading: false,
  error: null,
};

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    addExpense: (state, action: PayloadAction<Omit<Expense, 'id'>>) => {
      const newExpense: Expense = {
        ...action.payload,
        id: `exp-${Date.now()}`,
      };
      state.expenses.unshift(newExpense);
      state.expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    updateExpense: (state, action: PayloadAction<Expense>) => {
      const index = state.expenses.findIndex(e => e.id === action.payload.id);
      if (index !== -1) {
        state.expenses[index] = action.payload;
        state.expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    },
    removeExpense: (state, action: PayloadAction<string>) => {
      state.expenses = state.expenses.filter(e => e.id !== action.payload);
    },
    setExpensesLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setExpensesError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setExpenses: (state, action: PayloadAction<Expense[]>) => {
      state.expenses = action.payload;
    },
  },
});

export const {
  addExpense,
  updateExpense,
  removeExpense,
  setExpensesLoading,
  setExpensesError,
  setExpenses,
} = expensesSlice.actions;

export default expensesSlice.reducer;

