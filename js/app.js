import { initStorage } from './core/storage.js';
import { refreshData as refreshCategories } from './core/categories.js';
import { refreshData as refreshExpenses } from './core/expenses.js';
import { initHeader } from './ui/header.js';
import { initSidebar } from './ui/sidebar.js';
import { initExpenseList } from './ui/expense-list.js';
import { initCharts } from './ui/charts.js';
import { initBudgetMonitor } from './features/budget-monitor.js';

// Initialize storage first
console.log('Initializing storage...');
initStorage();

// Initialize data
refreshCategories();
refreshExpenses();

// Initialize sidebar (has the form)
console.log('Initializing sidebar...');
initSidebar();

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing UI components...');
  
  // Initialize other UI components
  initHeader();
  initExpenseList();
  initCharts();
  initBudgetMonitor();

  // Listen for data updates
  document.addEventListener('data-updated', (event) => {
    console.log('data-updated event received', event.detail);
    
    // Refresh data from storage
    refreshCategories();
    refreshExpenses();
    
    // Update all UI components
    initExpenseList();
    initCharts();
    initBudgetMonitor();
  });

  // Also listen for filter updates
  document.addEventListener('filters-updated', () => {
    console.log('filters-updated event received');
    initExpenseList();
  });

  // Debug: Add test function
  window.testAddExpense = function(amount = 100, description = "Test", category = "food") {
    console.log('Test: Adding expense...');
    const { addExpense } = require('./core/expenses.js');
    const result = addExpense(amount, description, category, '');
    if (result) {
      document.dispatchEvent(new CustomEvent('data-updated'));
      console.log('Test expense added!', result);
    } else {
      console.error('Failed to add test expense');
    }
  };

  console.log('SmartSpend Pro initialized!');
  
  // Initial render
  document.dispatchEvent(new CustomEvent('data-updated'));
});