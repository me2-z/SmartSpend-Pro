const CURRENT_VERSION = '1.0';

const DEFAULT_DATA = {
  version: CURRENT_VERSION,
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
  },
  settings: {
    theme: 'light',
    currency: '₹',
    budgetAlerts: true
  }
};

let appData = structuredClone(DEFAULT_DATA);

export function loadFromStorage() {
  try {
    const saved = localStorage.getItem('smartSpendData');
    if (saved) {
      const parsed = JSON.parse(saved);
      
      // Ensure we have all required fields
      const mergedData = {
        ...DEFAULT_DATA,
        ...parsed,
        expenses: parsed.expenses || [],
        categories: {
          default: DEFAULT_DATA.categories.default,
          custom: parsed.categories?.custom || []
        }
      };
      
      console.log('Loaded data from storage. Expenses:', mergedData.expenses.length);
      appData = mergedData;
      return mergedData;
    }
  } catch (e) {
    console.error('Failed to load from storage:', e);
  }
  
  console.log('Using default data');
  return structuredClone(DEFAULT_DATA);
}

export function saveToStorage(data) {
  try {
    appData = structuredClone(data);
    localStorage.setItem('smartSpendData', JSON.stringify(data));
    console.log('Data saved to storage. Expenses:', data.expenses.length);
    return true;
  } catch (e) {
    console.error('Failed to save to storage:', e);
    return false;
  }
}

export function initStorage() {
  return loadFromStorage();
}

// Debug function
export function debugStorage() {
  console.log('Current storage data:', appData);
  return appData;
}