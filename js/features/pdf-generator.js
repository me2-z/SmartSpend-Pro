// js/features/pdf-generator.js
// ✅ jsPDF + AutoTable + Chart embedding

import { getMonthlySummary, filterExpenses } from '../core/expenses.js';
import { getAllCategories, getCategoryTotal } from '../core/categories.js';

/**
 * Generate and download PDF report
 * @returns {Promise<void>}
 */
export async function generatePDF() {
  console.log('Starting PDF generation...');
  
  // Wait for jspdf to be available
  if (typeof window.jspdf === 'undefined') {
    console.error('jspdf not loaded!');
    showToast('PDF library not loaded. Please refresh the page.', 'error');
    return;
  }

  try {
    const jsPDF = window.jspdf.jsPDF;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let y = 20;

    // Logo & Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(37, 99, 235);
    doc.text('SmartSpend Pro', pageWidth / 2, y, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    y += 10;
    const now = new Date();
    const monthName = now.toLocaleString('default', { month: 'long' });
    doc.text(`Expense Report — ${monthName} ${now.getFullYear()}`, pageWidth / 2, y, { align: 'center' });

    y += 20;

    // Summary Stats
    const summary = getMonthlySummary();
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('Monthly Summary', 14, y);
    
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const stats = [
      ['Total Expenses', `₹${summary.total.toFixed(2)}`],
      ['Number of Expenses', summary.count],
      ['Average Expense', `₹${summary.avg.toFixed(2)}`],
      ['Top Category', summary.topCategory || '—']
    ];
    
    doc.autoTable({
      startY: y,
      head: [['Metric', 'Value']],
      body: stats,
      theme: 'grid',
      headStyles: { fillColor: [229, 231, 235], textColor: [30, 41, 59] },
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40, halign: 'right' }
      }
    });
    
    y = doc.lastAutoTable.finalY + 15;

    // Category Summary
    const categories = getAllCategories().filter(c => !c.archived);
    const categoryData = categories.map(cat => {
      const total = getCategoryTotal(cat.id);
      return [
        `${cat.emoji} ${cat.name}`,
        `₹${total.toFixed(2)}`,
        cat.budget > 0 ? `₹${cat.budget.toFixed(2)}` : '—',
        cat.budget > 0 ? `${Math.min(100, (total / cat.budget) * 100).toFixed(1)}%` : '—'
      ];
    }).filter(row => parseFloat(row[1].replace('₹', '')) > 0);

    if (categoryData.length > 0) {
      doc.setFontSize(14);
      doc.text('Category Summary', 14, y);
      y += 10;
      
      doc.autoTable({
        startY: y,
        head: [['Category', 'Spent', 'Budget', 'Usage']],
        body: categoryData,
        theme: 'grid',
        headStyles: { fillColor: [229, 231, 235] },
        styles: { fontSize: 10 },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 3) {
            const percent = parseFloat(data.cell.text[0]);
            if (percent > 100) {
              data.cell.styles.textColor = [239, 68, 68];
            }
          }
        }
      });
      
      y = doc.lastAutoTable.finalY + 15;
    }

    // Expense List
    const expenses = filterExpenses({}).slice(0, 100); // Limit for PDF
    if (expenses.length > 0) {
      doc.setFontSize(14);
      doc.text(`${Math.min(expenses.length, 100)} Recent Expenses`, 14, y);
      y += 10;

      const expenseRows = expenses.map(e => {
        const cat = getAllCategories().find(c => c.id === e.categoryId) || { emoji: '❓', name: 'Unknown' };
        const date = new Date(e.date);
        return [
          date.toLocaleDateString(),
          `${cat.emoji} ${cat.name}`,
          e.description || '—',
          `₹${e.amount.toFixed(2)}`
        ];
      });

      doc.autoTable({
        startY: y,
        head: [['Date', 'Category', 'Description', 'Amount']],
        body: expenseRows,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 40 },
          2: { cellWidth: 70 },
          3: { cellWidth: 25, halign: 'right' }
        }
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(
        `Page ${i} of ${pageCount} • Generated on ${now.toLocaleString()}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save
    const filename = `Expense_Report_${String(now.getMonth() + 1).padStart(2, '0')}_${now.getFullYear()}.pdf`;
    doc.save(filename);
    console.log('PDF generated successfully!');
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    showToast('PDF generation failed: ' + error.message, 'error');
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
  }, 3000);
}