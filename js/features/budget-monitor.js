// js/features/budget-monitor.js
// ✅ Real-time budget progress bars & alerts

import { getAllCategories, checkBudgetExceeded, getCategoryTotal } from '../core/categories.js';

export function initBudgetMonitor() {
  renderBudgetProgress();
  
  // Refresh on data change
  document.addEventListener('data-updated', renderBudgetProgress);
}

function renderBudgetProgress() {
  const container = document.getElementById('budget-progress-list');
  if (!container) return;

  const categories = getAllCategories().filter(c => c.budget > 0 && !c.archived);
  if (categories.length === 0) {
    container.innerHTML = '<p>No budgets set.</p>';
    return;
  }

  container.innerHTML = categories.map(cat => {
    const { exceeded, actual, budget } = checkBudgetExceeded(cat.id);
    const percent = budget > 0 ? Math.min(100, (actual / budget) * 100) : 0;
    
    return `
      <div class="budget-item ${exceeded ? 'budget-over' : ''}">
        <div class="budget-header">
          <span class="budget-label">
            <span class="category-badge" 
                  style="--category-bg: ${cat.color}20; --category-text: ${cat.color}">
              ${cat.emoji} ${cat.name}
            </span>
          </span>
          <span>₹${actual.toFixed(0)} / ₹${budget}</span>
        </div>
        <div class="budget-progress-bar">
          <div class="budget-progress-fill" 
               style="width: ${percent}%; background-color: ${exceeded ? '#ef4444' : cat.color};">
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Show alerts for exceeded budgets
  const exceeded = categories.filter(c => checkBudgetExceeded(c.id).exceeded);
  if (exceeded.length > 0 && localStorage.getItem('smartSpendBudgetAlertShown') !== 'true') {
    showToast(
      `⚠️ Budget exceeded for: ${exceeded.map(c => c.name).join(', ')}`,
      'warning'
    );
    // Show once per session
    localStorage.setItem('smartSpendBudgetAlertShown', 'true');
  }
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'check-circle'}"></i> ${message}`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}