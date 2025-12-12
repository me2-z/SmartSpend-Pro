// js/core/categories.js
// ✅ Custom category CRUD with validation, reassignment, no duplicates

import { loadAppData, saveAppData, refreshAppData } from './shared-data.js';

/**
 * Get all categories (default + active custom)
 */
export function getAllCategories(includeArchived = false) {
  const appData = loadAppData();
  
  const custom = includeArchived
    ? appData.categories.custom
    : appData.categories.custom.filter(c => !c.archived);
  return [...appData.categories.default, ...custom];
}

/**
 * Get category by ID
 */
export function getCategoryById(id) {
  const appData = loadAppData();
  
  const allCats = [...appData.categories.default, ...appData.categories.custom];
  return allCats.find(c => c.id === id);
}

/**
 * Validate category name
 */
export function validateCategoryName(name, excludeId = '') {
  const appData = loadAppData();
  
  const clean = name.trim();
  if (clean.length < 2 || clean.length > 20) return false;
  if (/[^a-zA-Z0-9\s]/.test(clean)) return false;
  return !appData.categories.custom.some(
    c => c.id !== excludeId && c.name.toLowerCase() === clean.toLowerCase()
  );
}

/**
 * Add custom category
 */
export function addCustomCategory(name, color, emoji, budget = 0) {
  const appData = loadAppData();
  
  if (!validateCategoryName(name)) return null;

  /** @type {Category} */
  const newCat = {
    id: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    name: name.trim(),
    emoji: emoji.substring(0, 2),
    color: /^#[0-9A-F]{6}$/i.test(color) ? color : '#3B82F6',
    budget: Math.max(0, Number(budget) || 0),
    isDefault: false,
    archived: false
  };

  appData.categories.custom.push(newCat);
  saveAppData();
  return newCat;
}

/**
 * Edit custom category
 */
export function editCustomCategory(id, updates) {
  const appData = loadAppData();
  
  const idx = appData.categories.custom.findIndex(c => c.id === id);
  if (idx === -1) return false;

  const current = appData.categories.custom[idx];
  if (updates.name && !validateCategoryName(updates.name, id)) {
    return false;
  }

  appData.categories.custom[idx] = {
    ...current,
    ...updates,
    name: updates.name ? updates.name.trim() : current.name,
    emoji: updates.emoji ? updates.emoji.substring(0, 2) : current.emoji,
    color: updates.color && /^#[0-9A-F]{6}$/i.test(updates.color)
      ? updates.color
      : current.color,
    budget: updates.budget !== undefined ? Math.max(0, Number(updates.budget)) : current.budget,
    archived: updates.archived !== undefined ? Boolean(updates.archived) : current.archived
  };

  saveAppData();
  return true;
}

/**
 * Delete custom category
 */
export function deleteCustomCategory(id) {
  const appData = loadAppData();
  
  const hasExpenses = appData.expenses.some(e => e.categoryId === id);
  if (hasExpenses) {
    return { success: false, hasExpenses: true };
  }

  appData.categories.custom = appData.categories.custom.filter(c => c.id !== id);
  saveAppData();
  return { success: true, hasExpenses: false };
}

/**
 * Reassign expenses from old category to new
 */
export function reassignCategory(oldId, newId) {
  const appData = loadAppData();
  
  let count = 0;
  appData.expenses = appData.expenses.map(exp => {
    if (exp.categoryId === oldId) {
      count++;
      return { ...exp, categoryId: newId };
    }
    return exp;
  });
  saveAppData();
  return count;
}

/**
 * Get category total spending (this month)
 */
export function getCategoryTotal(categoryId) {
  const appData = loadAppData();
  
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const startStr = monthStart.toISOString().split('T')[0];

  return appData.expenses
    .filter(e => 
      e.categoryId === categoryId && 
      e.date >= startStr
    )
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Check if category budget exceeded
 */
export function checkBudgetExceeded(categoryId) {
  const cat = getCategoryById(categoryId);
  if (!cat || cat.budget <= 0) return { exceeded: false, actual: 0, budget: 0 };

  const actual = getCategoryTotal(categoryId);
  return {
    exceeded: actual > cat.budget,
    actual,
    budget: cat.budget
  };
}

export function refreshData() {
  refreshAppData();
}