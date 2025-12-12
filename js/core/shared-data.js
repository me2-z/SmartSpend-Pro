// js/core/shared-data.js
// ✅ Single source of truth for all data

import { saveToStorage, loadFromStorage } from './storage.js';

let appData = null;

/**
 * Load or initialize app data
 */
export function loadAppData() {
  if (!appData) {
    appData = loadFromStorage();
  }
  return appData;
}

/**
 * Save data to storage
 */
export function saveAppData() {
  if (appData) {
    saveToStorage(appData);
  }
}

/**
 * Get current data (read-only)
 */
export function getAppData() {
  return structuredClone(appData);
}

/**
 * Update expenses in shared data
 */
export function updateExpenses(expenses) {
  if (!appData) loadAppData();
  appData.expenses = expenses;
  saveAppData();
}

/**
 * Update categories in shared data
 */
export function updateCategories(categories) {
  if (!appData) loadAppData();
  appData.categories = categories;
  saveAppData();
}

/**
 * Refresh data from storage
 */
export function refreshAppData() {
  appData = loadFromStorage();
}

/**
 * Get expenses
 */
export function getExpenses() {
  if (!appData) loadAppData();
  return [...appData.expenses];
}

/**
 * Get categories
 */
export function getCategories() {
  if (!appData) loadAppData();
  return {
    default: [...appData.categories.default],
    custom: [...appData.categories.custom]
  };
}