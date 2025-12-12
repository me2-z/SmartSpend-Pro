// js/ui/expense-list.js
// ✅ Render expense table, edit/delete, search/sort

import { 
  filterExpenses, 
  editExpense, 
  deleteExpense 
} from '../core/expenses.js';
import { 
  getAllCategories, 
  getCategoryById 
} from '../core/categories.js';
import { getMonthlySummary } from '../core/expenses.js';

const state = {
  filters: {
    categoryIds: [],
    startDate: '',
    endDate: '',
    search: '',
    sortBy: 'date-desc'
  }
};

export function initExpenseList() {
  // Search & sort
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-by');
  
  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        state.filters.search = searchInput.value.trim();
        renderExpenses();
      }, 300);
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      state.filters.sortBy = sortSelect.value;
      renderExpenses();
    });
  }

  // Listen for filter updates from sidebar
  document.addEventListener('filters-updated', () => {
    updateFiltersFromUI();
    renderExpenses();
  });

  // Initial render
  updateFiltersFromUI();
  renderExpenses();
  refreshSummary();
}

function updateFiltersFromUI() {
  // Category checkboxes
  const checks = document.querySelectorAll('input[data-filter="category"]:checked');
  state.filters.categoryIds = Array.from(checks).map(c => c.value);

  // Dates
  state.filters.startDate = document.getElementById('date-from')?.value || '';
  state.filters.endDate = document.getElementById('date-to')?.value || '';
}

export function renderExpenses() {
  const tbody = document.getElementById('expenses-table-body');
  if (!tbody) return;

  const expenses = filterExpenses(state.filters);
  
  if (expenses.length === 0) {
    tbody.innerHTML = '<tr class="no-data"><td colspan="5">No expenses match your filters.</td></tr>';
    return;
  }

  tbody.innerHTML = expenses.map(exp => {
    const cat = getCategoryById(exp.categoryId) || { name: 'Unknown', emoji: '❓', color: '#94a3b8' };
    const date = new Date(exp.date);
    const displayDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    
    return `
      <tr>
        <td>${displayDate}</td>
        <td>
          <span class="category-cell" 
                data-category-id="${exp.categoryId}"
                style="--category-bg: ${cat.color}20; --category-text: ${cat.color}">
            ${cat.emoji} ${cat.name}
          </span>
        </td>
        <td>${exp.description || '—'}</td>
        <td>₹${exp.amount.toFixed(2)}</td>
        <td>
          <button class="action-btn edit" data-id="${exp.id}" title="Edit">
            <i class="fas fa-edit" aria-hidden="true"></i>
          </button>
          <button class="action-btn delete" data-id="${exp.id}" title="Delete">
            <i class="fas fa-trash" aria-hidden="true"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Rebind events (delegated would be better, but for clarity)
  tbody.querySelectorAll('.edit').forEach(btn => {
    btn.addEventListener('click', () => handleEdit(btn.dataset.id));
  });
  tbody.querySelectorAll('.delete').forEach(btn => {
    btn.addEventListener('click', () => handleDelete(btn.dataset.id));
  });
}

async function handleEdit(id) {
  // TODO: Open edit modal (future enhancement)
  showToast('Edit feature coming soon!', 'warning');
}

async function handleDelete(id) {
  if (!confirm('Delete this expense? This cannot be undone.')) return;
  if (deleteExpense(id)) {
    renderExpenses();
    refreshSummary();
    showToast('Expense deleted.', 'success');
  }
}

export function refreshSummary() {
  const summary = getMonthlySummary();
  
  // Sidebar summary
  document.getElementById('total-spent').textContent = `₹${summary.total.toFixed(2)}`;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const avgDaily = summary.total / daysInMonth;
  document.getElementById('avg-daily').textContent = `₹${avgDaily.toFixed(2)}`;
  
  // Stats cards
  document.getElementById('stat-total').textContent = `₹${summary.total.toFixed(2)}`;
  document.getElementById('stat-count').textContent = summary.count;
  document.getElementById('stat-top').textContent = summary.topCategory || '—';
  document.getElementById('stat-avg').textContent = `₹${summary.avg > 0 ? summary.avg.toFixed(2) : '0.00'}`;
}