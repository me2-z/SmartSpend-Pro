// js/core/expenses.js
// ✅ Expense CRUD with category linking, filtering, sorting
// ✅ Fixed: Now properly saves and updates UI

import { saveToStorage, loadFromStorage } from './storage.js';
import { getCategoryById } from './categories.js';

// Load data once when module loads
let appData = loadFromStorage();

/**
 * Refresh data from storage (call this when other modules might have changed data)
 */
export function refreshData() {
  appData = loadFromStorage();
}

/**
 * Add expense and save to storage
 * @param {number} amount
 * @param {string} description
 * @param {string} categoryId
 * @param {string} date - YYYY-MM-DD
 * @returns {Expense | null}
 */
export function addExpense(amount, description, categoryId, date) {
  console.log('addExpense called:', { amount, description, categoryId, date });
  
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    console.error('Invalid amount:', amount);
    return null;
  }
  
  if (!categoryId) {
    console.error('No category ID provided');
    return null;
  }

  // Validate category exists
  const category = getCategoryById(categoryId);
  if (!category) {
    console.error('Category not found:', categoryId);
    return null;
  }

  /** @type {Expense} */
  const newExpense = {
    id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    amount: parseFloat(numAmount.toFixed(2)),
    description: String(description || '').trim().substring(0, 100),
    categoryId,
    date: date || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };

  console.log('New expense created:', newExpense);
  
  // Add to data and save
  appData.expenses.push(newExpense);
  saveToStorage(appData);
  
  console.log('Expense saved. Total expenses:', appData.expenses.length);
  return newExpense;
}

/**
 * Edit expense
 * @param {string} id
 * @param {Partial<Expense>} updates
 * @returns {boolean}
 */
export function editExpense(id, updates) {
  const idx = appData.expenses.findIndex(e => e.id === id);
  if (idx === -1) return false;

  const current = appData.expenses[idx];
  const newCat = updates.categoryId !== undefined ? updates.categoryId : current.categoryId;
  if (updates.categoryId !== undefined && !getCategoryById(newCat)) return false;

  appData.expenses[idx] = {
    ...current,
    ...updates,
    amount: updates.amount !== undefined ? Math.max(0.01, Number(updates.amount)) : current.amount,
    description: updates.description !== undefined 
      ? String(updates.description).trim().substring(0, 100) 
      : current.description,
    categoryId: newCat,
    date: updates.date !== undefined 
      ? (updates.date.match(/^\d{4}-\d{2}-\d{2}$/) ? updates.date : current.date)
      : current.date
  };

  // Clean up zero/negative
  if (appData.expenses[idx].amount <= 0) {
    appData.expenses.splice(idx, 1);
  }

  saveToStorage(appData);
  return true;
}

/**
 * Delete expense
 * @param {string} id
 * @returns {boolean}
 */
export function deleteExpense(id) {
  const before = appData.expenses.length;
  appData.expenses = appData.expenses.filter(e => e.id !== id);
  const success = appData.expenses.length < before;
  if (success) saveToStorage(appData);
  return success;
}

// Filtering & Sorting
/**
 * Filter expenses
 * @param {Object} options
 * @param {string[]} options.categoryIds
 * @param {string} options.startDate
 * @param {string} options.endDate
 * @param {string} options.search
 * @param {string} options.sortBy
 * @returns {Expense[]}
 */
export function filterExpenses({ categoryIds = [], startDate = '', endDate = '', search = '', sortBy = 'date-desc' }) {
  console.log('filterExpenses called with:', { categoryIds, startDate, endDate, search, sortBy });
  
  let results = [...appData.expenses];
  console.log('Total expenses to filter:', results.length);

  // Category filter
  if (categoryIds.length > 0) {
    results = results.filter(e => categoryIds.includes(e.categoryId));
    console.log('After category filter:', results.length);
  }

  // Date range
  if (startDate) {
    results = results.filter(e => e.date >= startDate);
    console.log('After start date filter:', results.length);
  }
  if (endDate) {
    results = results.filter(e => e.date <= endDate);
    console.log('After end date filter:', results.length);
  }

  // Search
  if (search) {
    const term = search.toLowerCase();
    results = results.filter(e =>
      e.description.toLowerCase().includes(term) ||
      getCategoryById(e.categoryId)?.name.toLowerCase().includes(term)
    );
    console.log('After search filter:', results.length);
  }

  // Sort
  results.sort((a, b) => {
    switch (sortBy) {
      case 'date-asc': return a.date.localeCompare(b.date);
      case 'date-desc': return b.date.localeCompare(a.date);
      case 'amount-asc': return a.amount - b.amount;
      case 'amount-desc': return b.amount - a.amount;
      case 'category': 
        const catA = getCategoryById(a.categoryId)?.name || '';
        const catB = getCategoryById(b.categoryId)?.name || '';
        return catA.localeCompare(catB);
      default: return b.date.localeCompare(a.date);
    }
  });

  console.log('Final filtered results:', results.length);
  return results;
}

/**
 * Get monthly summary
 * @returns {{ total: number, count: number, avg: number, topCategory: string | null }}
 */
export function getMonthlySummary() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const startStr = monthStart.toISOString().split('T')[0];

  console.log('Getting monthly summary from date:', startStr);
  console.log('Total expenses in system:', appData.expenses.length);

  const monthly = appData.expenses.filter(e => {
    const include = e.date >= startStr;
    if (!include) {
      console.log('Excluding expense:', e.date, 'is before', startStr);
    }
    return include;
  });
  
  console.log('Monthly expenses found:', monthly.length);

  const total = monthly.reduce((sum, e) => sum + e.amount, 0);
  const count = monthly.length;
  const avg = count > 0 ? total / count : 0;

  // Top category
  const categoryTotals = {};
  monthly.forEach(e => {
    categoryTotals[e.categoryId] = (categoryTotals[e.categoryId] || 0) + e.amount;
  });
  
  const topCatId = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || null;
  
  const topCategoryName = topCatId ? getCategoryById(topCatId)?.name || null : null;

  console.log('Monthly summary:', { total, count, avg, topCategory: topCategoryName });
  
  return {
    total,
    count,
    avg,
    topCategory: topCategoryName
  };
}

/**
 * Get all expenses (for debugging)
 * @returns {Expense[]}
 */
export function getAllExpenses() {
  return [...appData.expenses];
}

/**
 * Clear all expenses (for debugging)
 */
export function clearAllExpenses() {
  appData.expenses = [];
  saveToStorage(appData);
  console.log('All expenses cleared');
}