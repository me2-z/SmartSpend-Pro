// js/ui/category-manager.js
// ✅ Modal UI for category management

import { 
  getAllCategories, 
  addCustomCategory, 
  editCustomCategory, 
  deleteCustomCategory, 
  reassignCategory,
  validateCategoryName
} from '../core/categories.js';
import { populateCategorySelect } from './sidebar.js';

const MODAL = document.getElementById('category-modal');
const FORM_MODAL = document.getElementById('category-form-modal');
const LIST_CONTAINER = document.getElementById('categories-list');
const FORM = document.getElementById('category-form');
let editingCategory = null;

export function initCategoryManager() {
  if (!MODAL) return;
  
  MODAL.classList.add('show');
  document.body.style.overflow = 'hidden';
  renderCategoryList();
}

// Close modals
['close-category-modal', 'close-category-form', 'close-confirm'].forEach(id => {
  const btn = document.getElementById(id);
  if (btn) {
    btn.addEventListener('click', () => {
      MODAL?.classList.remove('show');
      FORM_MODAL?.classList.remove('show');
      document.getElementById('confirm-modal')?.classList.remove('show');
      document.body.style.overflow = '';
      editingCategory = null;
    });
  }
});

// Add new button
const addBtn = document.getElementById('add-custom-category-btn');
if (addBtn) {
  addBtn.addEventListener('click', () => {
    editingCategory = null;
    document.getElementById('category-form-title').textContent = '➕ Add Custom Category';
    FORM.reset();
    FORM_MODAL.classList.add('show');
  });
}

// Form submission
if (FORM) {
  FORM.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('category-name').value.trim();
    const emoji = document.getElementById('category-emoji').value;
    const color = document.getElementById('category-color').value;
    const budget = parseFloat(document.getElementById('category-budget').value) || 0;

    if (!validateCategoryName(name, editingCategory?.id)) {
      showToast('Category name must be 2-20 letters/numbers, no duplicates.', 'error');
      return;
    }

    let success = false;
    if (editingCategory) {
      success = editCustomCategory(editingCategory.id, { name, emoji, color, budget });
    } else {
      const newCat = addCustomCategory(name, color, emoji, budget);
      success = newCat !== null;
    }

    if (success) {
      FORM_MODAL.classList.remove('show');
      renderCategoryList();
      // Refresh all category selectors
      populateCategorySelect('quick-category');
      document.dispatchEvent(new CustomEvent('data-updated'));
      showToast(editingCategory ? 'Category updated!' : 'Category added!', 'success');
    } else {
      showToast('Failed to save category.', 'error');
    }
  });
}

function renderCategoryList() {
  if (!LIST_CONTAINER) return;
  
  const categories = getAllCategories(true); // include archived
  const customs = categories.filter(c => !c.isDefault);
  
  LIST_CONTAINER.innerHTML = customs.map(cat => {
    const isOver = cat.budget > 0 && (getCategoryTotal(cat.id) > cat.budget);
    const total = getCategoryTotal(cat.id);
    const percent = cat.budget > 0 ? Math.min(100, (total / cat.budget) * 100) : 0;
    
    return `
      <div class="category-item" data-id="${cat.id}">
        <div class="category-info">
          <span class="category-badge" 
                style="--category-bg: ${cat.color}20; --category-text: ${cat.color}">
            ${cat.emoji} ${cat.name}
          </span>
          ${cat.isDefault ? '<span class="badge-system">System</span>' : ''}
          ${cat.archived ? '<span class="badge-system">Archived</span>' : ''}
          ${cat.budget > 0 ? `<span>₹${total.toFixed(0)}/${cat.budget}</span>` : ''}
        </div>
        <div class="category-actions">
          <button class="btn btn-outline edit" data-id="${cat.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-outline ${cat.archived ? 'restore' : 'archive'}" data-id="${cat.id}">
            <i class="fas fa-${cat.archived ? 'undo' : 'archive'}"></i>
          </button>
          <button class="btn btn-outline delete" data-id="${cat.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Bind events
  LIST_CONTAINER.querySelectorAll('.edit').forEach(btn => {
    btn.addEventListener('click', () => editCategory(btn.dataset.id));
  });
  LIST_CONTAINER.querySelectorAll('.archive, .restore').forEach(btn => {
    btn.addEventListener('click', () => archiveCategory(btn.dataset.id, !btn.classList.contains('restore')));
  });
  LIST_CONTAINER.querySelectorAll('.delete').forEach(btn => {
    btn.addEventListener('click', () => confirmDelete(btn.dataset.id));
  });
}

function editCategory(id) {
  const cat = getAllCategories(true).find(c => c.id === id);
  if (!cat || cat.isDefault) return;

  editingCategory = cat;
  document.getElementById('category-form-title').textContent = '✏️ Edit Category';
  document.getElementById('category-name').value = cat.name;
  document.getElementById('category-emoji').value = cat.emoji;
  document.getElementById('category-color').value = cat.color;
  document.getElementById('category-budget').value = cat.budget || '';
  FORM_MODAL.classList.add('show');
}

function archiveCategory(id, archive = true) {
  editCustomCategory(id, { archived: archive });
  renderCategoryList();
  document.dispatchEvent(new CustomEvent('data-updated'));
}

function confirmDelete(id) {
  const result = deleteCustomCategory(id);
  if (result.hasExpenses) {
    // Show reassignment modal
    showReassignModal(id);
  } else if (result.success) {
    renderCategoryList();
    document.dispatchEvent(new CustomEvent('data-updated'));
    showToast('Category deleted.', 'success');
  }
}

function showReassignModal(oldId) {
  const confirmModal = document.getElementById('confirm-modal');
  const message = document.getElementById('confirm-message');
  const proceedBtn = document.getElementById('confirm-proceed');
  
  message.innerHTML = `
    This category has expenses. Reassign them to:
    <select id="reassign-target" style="margin-top:0.5rem; width:100%;">
      ${getAllCategories()
        .filter(c => c.id !== oldId && !c.archived)
        .map(c => `<option value="${c.id}">${c.emoji} ${c.name}</option>`)
        .join('')}
    </select>
  `;
  
  confirmModal.classList.add('show');
  
  const cancelBtn = document.getElementById('confirm-cancel');
  cancelBtn.onclick = () => confirmModal.classList.remove('show');
  
  proceedBtn.onclick = () => {
    const targetId = document.getElementById('reassign-target').value;
    if (targetId) {
      reassignCategory(oldId, targetId);
      deleteCustomCategory(oldId); // now safe
      confirmModal.classList.remove('show');
      renderCategoryList();
      document.dispatchEvent(new CustomEvent('data-updated'));
      showToast('Category deleted & expenses reassigned.', 'success');
    }
  };
}

// Helper
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
  }, 3000);
}