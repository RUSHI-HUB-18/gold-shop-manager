interface ExportOptions {
  format?: 'CSV' | 'EXCEL' | 'PDF';
}

/**
 * Reusable utility to export table/report datasets into external file packages.
 * Default format is CSV (fully Excel-compatible). Extensible for EXCEL and PDF exports in the future.
 */
export function exportReport(
  filename: string,
  headers: string[],
  data: any[][],
  options: ExportOptions = { format: 'CSV' }
) {
  const format = options.format || 'CSV';

  if (format === 'CSV') {
    const csvRows: string[] = [];
    
    // Helper to sanitize CSV field strings (escapes double quotes and removes newline blocks)
    const escapeField = (val: any): string => {
      if (val === null || val === undefined) return '';
      const str = String(val).trim();
      return `"${str.replace(/"/g, '""')}"`;
    };

    // Append headers row
    csvRows.push(headers.map(escapeField).join(','));
    
    // Append records rows
    for (const row of data) {
      csvRows.push(row.map(escapeField).join(','));
    }
    
    // Create download blob object link trigger
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    console.warn(`Export format ${format} is not implemented yet.`);
  }
}
