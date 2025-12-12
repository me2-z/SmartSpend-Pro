// js/features/import-export.js
// ✅ JSON import/export with validation

import { saveToStorage, loadFromStorage } from '../core/storage.js';

/**
 * Export data as JSON file
 */
export function exportData() {
  const data = loadFromStorage();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `SmartSpend_Data_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast('Data exported!', 'success');
}

/**
 * Import data from JSON file
 * @param {File} file
 */
export function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      
      // Validate
      if (
        !imported ||
        typeof imported !== 'object' ||
        !Array.isArray(imported.expenses) ||
        !imported.categories
      ) {
        throw new Error('Invalid file format');
      }

      if (!confirm('Replace all current data with imported data?')) return;
      
      saveToStorage(imported);
      location.reload(); // Fresh start
    } catch (err) {
      console.error('Import failed', err);
      showToast(`Import failed: ${err.message}`, 'error');
    }
  };
  reader.readAsText(file);
}

// Add file input handler
export function initImportExport() {
  // Add to UI later (e.g., in category manager)
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
  }, 3000);
}