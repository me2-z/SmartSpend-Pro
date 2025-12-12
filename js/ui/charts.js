// js/ui/charts.js
// ✅ Chart.js integration with custom category colors

import { getMonthlySummary, filterExpenses } from '../core/expenses.js';
import { getAllCategories, getCategoryTotal } from '../core/categories.js';

let categoryChart = null;
let trendChart = null;

export function initCharts() {
  renderCategoryChart();
  renderTrendChart();
  
  // Refresh on data change
  document.addEventListener('data-updated', () => {
    renderCategoryChart();
    renderTrendChart();
  });
}

function renderCategoryChart() {
  const ctx = document.getElementById('category-chart');
  if (!ctx) return;

  // Destroy existing
  if (categoryChart) {
    categoryChart.destroy();
  }

  const categories = getAllCategories().filter(c => !c.archived);
  const data = categories.map(cat => ({
    category: cat,
    total: getCategoryTotal(cat.id)
  })).filter(item => item.total > 0);

  if (data.length === 0) {
    ctx.parentElement.innerHTML = '<p>No spending data this month.</p>';
    return;
  }

  const labels = data.map(d => `${d.category.emoji} ${d.category.name}`);
  const totals = data.map(d => d.total);
  const colors = data.map(d => d.category.color);
  const bgColors = data.map(d => d.category.color + '40');
  
  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: totals,
        backgroundColor: bgColors,
        borderColor: colors,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.raw / total) * 100).toFixed(1);
              return `${context.label}: ₹${context.raw.toFixed(2)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function renderTrendChart() {
  const ctx = document.getElementById('trend-chart');
  if (!ctx) return;

  if (trendChart) {
    trendChart.destroy();
  }

  // Last 30 days
  const today = new Date();
  const dates = [];
  const amounts = [];
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dates.push(date.toLocaleDateString(undefined, { day: 'numeric' }));
    
    const dayTotal = filterExpenses({ 
      startDate: dateStr, 
      endDate: dateStr 
    }).reduce((sum, e) => sum + e.amount, 0);
    amounts.push(dayTotal);
  }

  trendChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dates,
      datasets: [{
        label: 'Daily Spending (₹)',
        data: amounts,
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (val) => `₹${val}`
          }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}