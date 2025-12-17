import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { addExpense } from '../../store/expensesSlice';
import { ExpenseCategory, CATEGORY_CONFIG } from '../../types';
import { Input, Button } from '../common';

interface ExpenseFormProps {
  onSuccess?: () => void;
}

const ExpenseForm = ({ onSuccess }: ExpenseFormProps) => {
  const dispatch = useDispatch();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) return;

    dispatch(addExpense({
      amount: parseFloat(amount),
      category,
      description: description || CATEGORY_CONFIG[category].label,
      date,
    }));

    // Reset form
    setAmount('');
    setDescription('');
    setCategory('other');
    setDate(new Date().toISOString().split('T')[0]);

    onSuccess?.();
  }, [amount, category, description, date, dispatch, onSuccess]);

  const categories = Object.entries(CATEGORY_CONFIG) as [ExpenseCategory, typeof CATEGORY_CONFIG[ExpenseCategory]][];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount */}
      <Input
        label="Amount"
        type="number"
        placeholder="0.00"
        min="0.01"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        leftIcon={<span className="text-gray-500 text-lg">$</span>}
      />

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Category
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {categories.map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={`
                p-3 rounded-xl border transition-all duration-200 text-center
                ${
                  category === key
                    ? 'border-accent bg-accent/10 text-white'
                    : 'border-dark-500 bg-dark-700 text-gray-400 hover:border-dark-400'
                }
              `}
            >
              <span className="text-2xl block mb-1">{config.icon}</span>
              <span className="text-xs">{config.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <Input
        label="Description (optional)"
        type="text"
        placeholder={`e.g., ${CATEGORY_CONFIG[category].label}`}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={100}
      />

      {/* Date */}
      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        max={new Date().toISOString().split('T')[0]}
      />

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={!amount || parseFloat(amount) <= 0}
      >
        Add Expense
      </Button>
    </form>
  );
};

export default ExpenseForm;

