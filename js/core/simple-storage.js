// Simple storage for debugging
const STORAGE_KEY = 'smartSpendData';

const DEFAULT_DATA = {
  version: '1.0',
  expenses: [],
  categories: {
    default: [
      { id: 'food', name: 'Food', emoji: '🍕', color: '#fecaca', budget: 0, isDefault: true, archived: false },
      { id: 'travel', name: 'Travel', emoji: '✈️', color: '#ffedd5', budget: 0, isDefault: true, archived: false },
      { id: 'shopping', name: 'Shopping', emoji: '🛍️', color: '#fef9c3', budget: 0, isDefault: true, archived: false },
      { id: 'bills', name: 'Bills', emoji: '💳', color: '#dbeafe', budget: 0, isDefault: true, archived: false },
      { id: 'entertainment', name: 'Entertainment', emoji: '🎬', color: '#f0f9ff', budget: 0, isDefault: true, archived: false },
      { id: 'healthcare', name: 'Healthcare', emoji: '⚕️', color: '#fef2f2', budget: 0, isDefault: true, archived: false },
      { id: 'education', name: 'Education', emoji: '📚', color: '#f3e8ff', budget: 0, isDefault: true, archived: false },
      { id: 'others', name: 'Others', emoji: '📦', color: '#e0f2fe', budget: 0, isDefault: true, archived: false }
    ],
    custom: []
  }
};

export function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load from storage:', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_DATA)); // Deep clone
}

export function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('Data saved to storage. Expenses:', data.expenses.length);
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
}

export function initStorage() {
  const data = loadFromStorage();
  console.log('Storage initialized. Expenses:', data.expenses.length);
  return data;
}