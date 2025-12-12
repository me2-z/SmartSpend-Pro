import { addExpense } from '../core/expenses.js';
import { getAllCategories } from '../core/categories.js';
import { refreshSummary } from './expense-list.js';

export function initSidebar() {
  console.log('Initializing sidebar...');
  
  // Make sure categories are in the dropdown
  const select = document.getElementById('quick-category');
  if (select && select.children.length <= 1) {
    // If no categories, add default ones
    const categories = [
      { id: 'food', name: 'Food', emoji: '🍕' },
      { id: 'travel', name: 'Travel', emoji: '✈️' },
      { id: 'shopping', name: 'Shopping', emoji: '🛍️' },
      { id: 'bills', name: 'Bills', emoji: '💳' },
      { id: 'entertainment', name: 'Entertainment', emoji: '🎬' },
      { id: 'healthcare', name: 'Healthcare', emoji: '⚕️' },
      { id: 'education', name: 'Education', emoji: '📚' },
      { id: 'others', name: 'Others', emoji: '📦' }
    ];
    
    select.innerHTML = '';
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = `${cat.emoji} ${cat.name}`;
      select.appendChild(option);
    });
  }

  const form = document.getElementById('quick-expense-form');
  if (form && !form.dataset.initialized) {
    console.log('Setting up quick expense form...');
    form.dataset.initialized = 'true';

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      console.log('Form submitted!');
      
      const amountInput = document.getElementById('quick-amount');
      const descInput = document.getElementById('quick-desc');
      const categorySelect = document.getElementById('quick-category');
      
      const amount = parseFloat(amountInput.value);
      const description = descInput.value.trim();
      const categoryId = categorySelect.value;

      console.log('Form values:', { amount, description, categoryId });

      if (isNaN(amount) || amount <= 0) {
        console.error('Invalid amount');
        showToast('Please enter a valid amount.', 'error');
        amountInput.focus();
        return;
      }

      if (!categoryId) {
        console.error('No category selected');
        showToast('Please select a category.', 'error');
        categorySelect.focus();
        return;
      }

      const newExpense = addExpense(amount, description, categoryId, '');
      if (newExpense) {
        console.log('Expense added successfully:', newExpense);
        form.reset();
        
        // Show success message
        showToast('✅ Expense added!', 'success');
        
        // CRITICAL: Dispatch event to update ALL UI components
        console.log('Dispatching data-updated event...');
        document.dispatchEvent(new CustomEvent('data-updated', {
          detail: { expenseAdded: true }
        }));
        
        // Also trigger a manual refresh
        setTimeout(() => {
          if (window.refreshExpenseList) {
            window.refreshExpenseList();
          }
        }, 100);
        
        setTimeout(() => amountInput.focus(), 50);
      } else {
        console.error('Failed to save expense');
        showToast('❌ Failed to save expense.', 'error');
      }
    });
  }

  const toggleBtn = document.getElementById('sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      const isShown = sidebar.classList.toggle('show');
      toggleBtn.setAttribute('aria-expanded', String(isShown));
    });
  }

  document.addEventListener('change', (e) => {
    if (e.target.closest('[data-filter="category"]')) {
      triggerFilterUpdate();
    }
  });

  ['#date-from', '#date-to'].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) el.addEventListener('change', triggerFilterUpdate);
  });
  
  console.log('Sidebar initialization complete');
}

function triggerFilterUpdate() {
  document.dispatchEvent(new CustomEvent('filters-updated'));
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'check-circle';
  toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Make refresh function available globally for debugging
window.refreshExpenseList = function() {
  if (window.initExpenseList) {
    window.initExpenseList();
  }
  document.dispatchEvent(new CustomEvent('data-updated'));
};