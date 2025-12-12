// js/ui/header.js
// ✅ Theme toggle + PDF export + category manager button

import { initCategoryManager } from './category-manager.js';
import { generatePDF } from '../features/pdf-generator.js';

export function initHeader() {
  // Set initial theme
  const savedTheme = localStorage.getItem('smartSpendTheme') || 'light';
  document.body.classList.remove('theme-light', 'theme-dark');
  document.body.classList.add(`theme-${savedTheme}`);
  
  // Update toggle button
  updateThemeButton(savedTheme);

  // Theme toggle
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.body.classList.contains('theme-dark');
      const newTheme = isDark ? 'light' : 'dark';
      
      document.body.classList.remove('theme-light', 'theme-dark');
      document.body.classList.add(`theme-${newTheme}`);
      
      // Update button
      updateThemeButton(newTheme);
      
      // Save preference
      localStorage.setItem('smartSpendTheme', newTheme);
      
      // Dispatch theme change for charts
      document.dispatchEvent(new CustomEvent('theme-changed'));
      
      showToast(`Switched to ${newTheme} mode`, 'success');
    });
  }

  // PDF Export
  const exportPdfBtn = document.getElementById('export-pdf');
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', async () => {
      try {
        exportPdfBtn.disabled = true;
        exportPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        
        await generatePDF();
        showToast('PDF report downloaded!', 'success');
      } catch (e) {
        console.error('PDF generation failed', e);
        showToast('PDF generation failed. Please try again.', 'error');
      } finally {
        exportPdfBtn.disabled = false;
        exportPdfBtn.innerHTML = '<i class="fas fa-file-pdf"></i> PDF Report';
      }
    });
  }

  // Category Manager
  const manageBtn = document.getElementById('manage-categories-btn');
  if (manageBtn) {
    manageBtn.addEventListener('click', () => {
      initCategoryManager();
    });
  }
}

function updateThemeButton(theme) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  
  const isDark = theme === 'dark';
  btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  
  // Update icons
  const moonIcon = btn.querySelector('.fa-moon');
  const sunIcon = btn.querySelector('.fa-sun');
  
  if (moonIcon) moonIcon.style.display = isDark ? 'none' : 'block';
  if (sunIcon) sunIcon.style.display = isDark ? 'block' : 'none';
}

// Helper: Toast
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'check-circle'}"></i>
    ${message}
  `;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}