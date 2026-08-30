// ============================================
// KASHOMBA ELECTRICAL SYSTEM - REPORTS LOGIC v16
// FAIDA = LABOUR HALISI - MATUMIZI
// ============================================

let filteredReportData = [];
let currentReportType = 'invoices';

// ============================================
// GENERATE REPORT
// ============================================
function generateReport() {
    const reportTypeElement = document.getElementById('reportType');
    const statusFilterElement = document.getElementById('reportStatusFilter');
    const dateFromElement = document.getElementById('reportDateFrom');
    const dateToElement = document.getElementById('reportDateTo');
    const timeFilterElement = document.getElementById('reportTimeFilter');
    
    currentReportType = reportTypeElement ? reportTypeElement.value : 'invoices';
    const statusFilter = statusFilterElement ? statusFilterElement.value : '';
    const dateFrom = dateFromElement ? dateFromElement.value : '';
    const dateTo = dateToElement ? dateToElement.value : '';
    const timeFilter = timeFilterElement ? timeFilterElement.value : 'all';
    
    const tbody = document.getElementById('reportsTableBody');
    const thead = document.getElementById('reportsTableHead');
    
    if (!tbody || !thead) return;
    
    let filteredData = [];
    let headers = [];
    
    if (!allSystemData) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No data available</td></tr>';
        return;
    }
    
    allSystemData.invoices = allSystemData.invoices || [];
    allSystemData.customers = allSystemData.customers || [];
    allSystemData.payments = allSystemData.payments || [];
    allSystemData.expenses = allSystemData.expenses || [];
    
    switch(currentReportType) {
        case 'invoices':
            filteredData = [...allSystemData.invoices];
            headers = ['Invoice No', 'Customer', 'Date', 'Total (Tsh)', 'Balance (Tsh)', 'Status', 'Actions'];
            break;
        case 'customers':
            filteredData = [...allSystemData.customers];
            headers = ['Customer ID', 'Name', 'Phone', 'Address', 'Email', 'Date', 'Actions'];
            break;
        case 'payments':
            filteredData = [...allSystemData.payments];
            headers = ['Payment ID', 'Invoice No', 'Amount (Tsh)', 'Date', 'Method', 'Recorded By'];
            break;
        case 'expenses':
            filteredData = [...allSystemData.expenses];
            headers = ['Expense ID', 'Invoice No', 'Category', 'Payee', 'Amount (Tsh)', 'Date', 'Status'];
            break;
        default:
            filteredData = [...allSystemData.invoices];
            headers = ['Invoice No', 'Customer', 'Date', 'Total (Tsh)', 'Balance (Tsh)', 'Status', 'Actions'];
    }
    
    thead.innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (timeFilter === 'today') {
        const todayStr = getTodayDate();
        filteredData = filteredData.filter(item => {
            const itemDate = (item['Date'] || '').toString();
            return itemDate === todayStr;
        });
    } else if (timeFilter === 'month') {
        const monthStart = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-01';
        filteredData = filteredData.filter(item => (item['Date'] || '') >= monthStart);
    } else if (timeFilter === 'year') {
        const yearStart = today.getFullYear() + '-01-01';
        filteredData = filteredData.filter(item => (item['Date'] || '') >= yearStart);
    }
    
    if (dateFrom) {
        filteredData = filteredData.filter(item => (item['Date'] || '') >= dateFrom);
    }
    
    if (dateTo) {
        filteredData = filteredData.filter(item => (item['Date'] || '') <= dateTo);
    }
    
    if (statusFilter && (currentReportType === 'invoices' || currentReportType === 'expenses')) {
        filteredData = filteredData.filter(item => item['Status'] === statusFilter);
    }
    
    filteredReportData = filteredData;
    
    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="' + headers.length + '" class="text-center">No data found</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    filteredData.sort((a, b) => {
        const dateA = (a['Date'] || '').toString();
        const dateB = (b['Date'] || '').toString();
        return dateB.localeCompare(dateA);
    });
    
    filteredData.forEach(item => {
        const row = document.createElement('tr');
        
        switch(currentReportType) {
            case 'invoices':
                row.innerHTML = `
                    <td><strong>${escapeHtml(item['Invoice No'] || '-')}</strong></td>
                    <td>${escapeHtml(item['Customer Name'] || '-')}</td>
                    <td>${formatDate(item['Date'])}</td>
                    <td>${formatCurrency(item['Total Charges'])}</td>
                    <td>${formatCurrency(item['Balance'])}</td>
                    <td><span class="status-badge ${getStatusBadgeClass(item['Status'])}">${escapeHtml(item['Status'] || 'Pending')}</span></td>
                    <td><button class="btn btn-primary btn-sm" onclick="viewFullInvoiceReport('${escapeHtml(item['Invoice No'])}')">Full Report</button></td>
                `;
                break;
            case 'customers':
                row.innerHTML = `
                    <td><strong>${escapeHtml(item['Customer ID'] || '-')}</strong></td>
                    <td>${escapeHtml(item['Customer Name'] || '-')}</td>
                    <td>${escapeHtml(item['Phone Number'] || '-')}</td>
                    <td>${escapeHtml(item['Address / Region'] || '-')}</td>
                    <td>${escapeHtml(item['Email'] || '-')}</td>
                    <td>${formatDate(item['Date'])}</td>
                    <td><button class="btn btn-primary btn-sm" onclick="viewCustomerInvoices('${escapeHtml(item['Customer Name'])}')">View Invoices</button></td>
                `;
                break;
            case 'payments':
                row.innerHTML = `
                    <td><strong>${escapeHtml(item['Payment ID'] || '-')}</strong></td>
                    <td>${escapeHtml(item['Invoice No'] || '-')}</td>
                    <td>${formatCurrency(item['Amount (Tsh)'])}</td>
                    <td>${formatDate(item['Date'])}</td>
                    <td>${escapeHtml(item['Payment Method'] || '-')}</td>
                    <td>${escapeHtml(item['Recorded By'] || '-')}</td>
                `;
                break;
            case 'expenses':
                row.innerHTML = `
                    <td><strong>${escapeHtml(item['Expense ID'] || '-')}</strong></td>
                    <td>${escapeHtml(item['Invoice No'] || '-')}</td>
                    <td>${escapeHtml(item['Category'] || '-')}</td>
                    <td>${escapeHtml(item['Payee / Staff Name'] || '-')}</td>
                    <td>${formatCurrency(item['Amount (Tsh)'])}</td>
                    <td>${formatDate(item['Date'])}</td>
                    <td><span class="status-badge ${getStatusBadgeClass(item['Status'])}">${escapeHtml(item['Status'] || 'Completed')}</span></td>
                `;
                break;
        }
        
        tbody.appendChild(row);
    });
    
    if (currentReportType === 'invoices' || currentReportType === 'payments' || currentReportType === 'expenses') {
        let totalAmount = 0;
        
        filteredData.forEach(item => {
            if (currentReportType === 'invoices') {
                totalAmount += Number(item['Total Charges']) || 0;
            } else if (currentReportType === 'payments') {
                totalAmount += Number(item['Amount (Tsh)']) || 0;
            } else if (currentReportType === 'expenses') {
                totalAmount += Number(item['Amount (Tsh)']) || 0;
            }
        });
        
        const summaryRow = document.createElement('tr');
        summaryRow.style.background = '#f1f1f1';
        summaryRow.style.fontWeight = '700';
        
        let summaryHTML = '';
        if (currentReportType === 'invoices') {
            summaryHTML = `<td colspan="3" style="text-align: right;">TOTAL:</td><td>${formatCurrency(totalAmount)} Tsh</td><td colspan="3"></td>`;
        } else if (currentReportType === 'payments') {
            summaryHTML = `<td colspan="2" style="text-align: right;">TOTAL:</td><td>${formatCurrency(totalAmount)} Tsh</td><td colspan="3"></td>`;
        } else if (currentReportType === 'expenses') {
            summaryHTML = `<td colspan="4" style="text-align: right;">TOTAL:</td><td>${formatCurrency(totalAmount)} Tsh</td><td colspan="2"></td>`;
        }
        
        summaryRow.innerHTML = summaryHTML;
        tbody.appendChild(summaryRow);
    }
}

// ============================================
// LOAD FINANCIAL SUMMARY (Admin Only) - FAIDA/HASARA + %
// ============================================
async function loadFinancialSummary() {
    const result = await fetchData('getFinancialSummary', {});
    
    if (!result.success) {
        showError(result.message);
        return;
    }
    
    const data = result.data;
    
    const totalRevenueEl = document.getElementById('finTotalRevenue');
    const totalExpensesEl = document.getElementById('finTotalExpenses');
    const totalProfitEl = document.getElementById('finTotalProfit');
    const invoiceCountEl = document.getElementById('finInvoiceCount');
    
    if (totalRevenueEl) totalRevenueEl.textContent = formatCurrency(data.overall.totalRevenue);
    if (totalExpensesEl) totalExpensesEl.textContent = formatCurrency(data.overall.totalExpenses);
    if (totalProfitEl) {
        const isProfit = data.overall.totalProfit >= 0;
        totalProfitEl.textContent = (isProfit ? '🟢 FAIDA: ' : '🔴 HASARA: ') + formatCurrency(Math.abs(data.overall.totalProfit));
        totalProfitEl.style.color = isProfit ? '#28a745' : '#dc3545';
    }
    if (invoiceCountEl) invoiceCountEl.textContent = data.overall.invoiceCount;
    
    const yearlyTbody = document.getElementById('finYearlyTableBody');
    if (yearlyTbody) {
        if (data.yearly.length === 0) {
            yearlyTbody.innerHTML = '<tr><td colspan="5" class="text-center">No data found</td></tr>';
        } else {
            yearlyTbody.innerHTML = '';
            data.yearly.forEach(yearData => {
                const isProfit = yearData.totalProfit >= 0;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${yearData.year}</strong></td>
                    <td>${formatCurrency(yearData.totalRevenue)}</td>
                    <td>${formatCurrency(yearData.totalExpenses)}</td>
                    <td style="font-weight: 700; color: ${isProfit ? '#28a745' : '#dc3545'};">
                        ${isProfit ? '🟢 FAIDA: ' : '🔴 HASARA: '} ${formatCurrency(Math.abs(yearData.totalProfit))}
                    </td>
                    <td>${yearData.invoiceCount}</td>
                `;
                yearlyTbody.appendChild(row);
            });
        }
    }
    
    const invoiceTbody = document.getElementById('finInvoiceTableBody');
    if (invoiceTbody) {
        if (data.invoices.length === 0) {
            invoiceTbody.innerHTML = '<tr><td colspan="8" class="text-center">No data found</td></tr>';
        } else {
            invoiceTbody.innerHTML = '';
            data.invoices.forEach(inv => {
                const labourHalisi = inv.labourHalisi || 0;
                const totalExpenses = inv.totalExpenses || 0;
                const profit = inv.profit || 0;
                const profitPercent = labourHalisi > 0 ? Math.round((profit / labourHalisi) * 100) : 0;
                const isProfit = profit >= 0;
                const profitColor = isProfit ? '#28a745' : '#dc3545';
                const profitIcon = isProfit ? '🟢' : '🔴';
                const profitLabel = isProfit ? 'FAIDA' : 'HASARA';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${escapeHtml(inv.invoiceNo || '-')}</strong></td>
                    <td>${escapeHtml(inv.customerName || '-')}</td>
                    <td><strong>${formatCurrency(labourHalisi)}</strong></td>
                    <td style="color: #dc3545;">${formatCurrency(totalExpenses)}</td>
                    <td>
                        <div style="font-weight: 800; color: ${profitColor}; font-size: 14px;">
                            ${profitIcon} ${profitLabel}
                        </div>
                        <div style="font-weight: 700; color: ${profitColor};">
                            ${formatCurrency(Math.abs(profit))} Tsh
                        </div>
                    </td>
                    <td style="font-weight: 700; color: ${profitColor}; font-size: 16px;">
                        ${profitPercent}%
                    </td>
                    <td><span class="status-badge ${getStatusBadgeClass(inv.status)}">${escapeHtml(inv.status || 'Pending')}</span></td>
                    <td><button class="btn btn-primary btn-sm" onclick="viewFullInvoiceReport('${escapeHtml(inv.invoiceNo)}')">View</button></td>
                `;
                invoiceTbody.appendChild(row);
            });
        }
    }
    
    fetchData('saveFinancialSummary', {}).catch(err => {
        console.error('Error saving financial summary:', err);
    });
}

// ============================================
// GET DOWNLOAD FILENAME
// ============================================
function getDownloadFilename(extension) {
    const today = new Date();
    const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    const timeStr = String(today.getHours()).padStart(2, '0') + '-' + String(today.getMinutes()).padStart(2, '0') + '-' + String(today.getSeconds()).padStart(2, '0');
    
    return 'Kashomba_' + currentReportType + '_' + dateStr + '_' + timeStr + '.' + extension;
}

// ============================================
// LOG REPORT DOWNLOAD
// ============================================
async function logReportDownload(format, fileName) {
    try {
        await fetchData('logReportDownload', {
            reportType: currentReportType,
            generatedBy: userFullName,
            timePeriod: document.getElementById('reportTimeFilter') ? document.getElementById('reportTimeFilter').value : 'all',
            dateFrom: document.getElementById('reportDateFrom') ? document.getElementById('reportDateFrom').value : '',
            dateTo: document.getElementById('reportDateTo') ? document.getElementById('reportDateTo').value : '',
            format: format,
            fileName: fileName,
            userId: userId,
            fullName: userFullName
        });
    } catch (error) {
        console.error('Error logging report:', error);
    }
}

// ============================================
// LOAD REPORT HISTORY
// ============================================
async function loadReportHistory() {
    const tbody = document.getElementById('reportHistoryTableBody');
    
    if (!tbody) return;
    
    try {
        const result = await fetchData('getReportHistory', {});
        
        if (result.success && result.data) {
            const reports = result.data;
            
            if (reports.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">No reports downloaded yet</td></tr>';
                return;
            }
            
            tbody.innerHTML = '';
            
            const recentReports = reports.slice(-20).reverse();
            
            recentReports.forEach(report => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td><strong>${escapeHtml(report['Report ID'] || '-')}</strong></td>
                    <td>${escapeHtml(report['Report Type'] || '-')}</td>
                    <td>${escapeHtml(report['Generated By'] || '-')}</td>
                    <td>${formatDateTime(report['Generated Date'])}</td>
                    <td>${escapeHtml(report['Time Period'] || '-')}</td>
                    <td>${escapeHtml(report['Format'] || '-')}</td>
                    <td><span class="status-badge status-completed">${escapeHtml(report['Status'] || 'Downloaded')}</span></td>
                `;
                
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No reports found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading report history:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading reports</td></tr>';
    }
}

// ============================================
// VIEW FULL INVOICE REPORT - FAIDA = LABOUR HALISI - MATUMIZI
// ============================================
async function viewFullInvoiceReport(invoiceNo) {
    const result = await fetchData('getFullInvoiceReport', { invoiceNo: invoiceNo });
    
    if (!result.success) {
        showError(result.message);
        return;
    }
    
    const data = result.data;
    const invoice = data.invoice;
    const customer = data.customer;
    const payments = data.payments || [];
    const expenses = data.expenses || [];
    const staff = data.staff || [];
    
    const totalPaid = payments.reduce((sum, p) => sum + (Number(p['Amount (Tsh)']) || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e['Amount (Tsh)']) || 0), 0);
    const totalStaffCost = staff.reduce((sum, s) => sum + (Number(s['Total Payment']) || 0), 0);
    const totalAllExpenses = totalExpenses + totalStaffCost;
    const labourCharges = Number(invoice['Labour Charges']) || 0;
    const discount = Number(invoice['Discount (%)']) || 0;
    const labourHalisi = labourCharges - (labourCharges * discount / 100);
    const profit = labourHalisi - totalAllExpenses;
    const profitColor = profit >= 0 ? '#28a745' : '#dc3545';
    const profitIcon = profit >= 0 ? '🟢' : '🔴';
    const profitLabel = profit >= 0 ? 'FAIDA' : 'HASARA';
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'fullInvoiceReportModal';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header">
                <span class="modal-title">Full Invoice Report - ${escapeHtml(invoice['Invoice No'])}</span>
                <button class="modal-close" onclick="closeModal('fullInvoiceReportModal')">&times;</button>
            </div>
            
            <div class="card" style="box-shadow: none; background: #f8f8f8; border: 2px solid #DAA520;">
                <h3 style="color: #000; margin-bottom: 15px; text-align: center;">PROJECT SUMMARY</h3>
                <div class="form-row">
                    <div style="text-align: center; flex: 1;">
                        <p style="font-size: 12px; color: #666; margin: 0;">LABOUR HALISI</p>
                        <p style="font-size: 20px; font-weight: 800; color: #000; margin: 5px 0;">${formatCurrency(labourHalisi)} Tsh</p>
                        ${discount > 0 ? `<p style="font-size: 10px; color: #999; margin: 0;">(Baada ya ${discount}% discount)</p>` : ''}
                    </div>
                    <div style="text-align: center; flex: 1;">
                        <p style="font-size: 12px; color: #666; margin: 0;">TOTAL MATUMIZI</p>
                        <p style="font-size: 20px; font-weight: 800; color: #dc3545; margin: 5px 0;">${formatCurrency(totalAllExpenses)} Tsh</p>
                    </div>
                    <div style="text-align: center; flex: 1;">
                        <p style="font-size: 12px; color: #666; margin: 0;">${profitLabel}</p>
                        <p style="font-size: 20px; font-weight: 800; color: ${profitColor}; margin: 5px 0;">${profitIcon} ${formatCurrency(Math.abs(profit))} Tsh</p>
                    </div>
                </div>
            </div>
            
            <div class="card" style="box-shadow: none;">
                <h3 style="color: #DAA520; margin-bottom: 15px;">INVOICE INFORMATION</h3>
                <div class="form-row">
                    <div style="flex: 1;">
                        <p><strong>Invoice No:</strong> ${escapeHtml(invoice['Invoice No'])}</p>
                        <p><strong>Date:</strong> ${formatDate(invoice['Date'])}</p>
                        <p><strong>Status:</strong> <span class="status-badge ${getStatusBadgeClass(invoice['Status'])}">${escapeHtml(invoice['Status'])}</span></p>
                    </div>
                    <div style="flex: 1;">
                        <p><strong>Customer:</strong> ${escapeHtml(invoice['Customer Name'])}</p>
                        <p><strong>Phone:</strong> ${customer ? escapeHtml(customer['Phone Number']) : '-'}</p>
                        <p><strong>Location:</strong> ${escapeHtml(invoice['Location'] || '-')}</p>
                    </div>
                    <div style="flex: 1;">
                        <p><strong>Labour Charges:</strong> ${formatCurrency(labourCharges)} Tsh</p>
                        <p><strong>Discount:</strong> ${discount}%</p>
                        <p><strong>Labour Halisi:</strong> ${formatCurrency(labourHalisi)} Tsh</p>
                    </div>
                </div>
            </div>
            
            ${staff.length > 0 ? `
            <div class="card" style="box-shadow: none;">
                <h3 style="color: #0a6c6c; margin-bottom: 15px;">MAFUNDI WALIOFANYA KAZI (${staff.length})</h3>
                <div class="table-wrapper">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Fundi</th>
                                <th>Daily Rate</th>
                                <th>Siku</th>
                                <th>Total Payment</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${staff.map(s => `
                                <tr>
                                    <td><strong>${escapeHtml(s['Full Name'] || '-')}</strong></td>
                                    <td>${formatCurrency(s['Daily Rate (Tsh)'])}</td>
                                    <td>${s['Days Worked'] || 0}</td>
                                    <td style="font-weight: 700; color: #28a745;">${formatCurrency(s['Total Payment'])}</td>
                                </tr>
                            `).join('')}
                            <tr style="background: #f1f1f1; font-weight: 700;">
                                <td colspan="3" style="text-align: right;">TOTAL STAFF COST:</td>
                                <td style="color: #28a745;">${formatCurrency(totalStaffCost)} Tsh</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            ` : ''}
            
            ${expenses.length > 0 ? `
            <div class="card" style="box-shadow: none;">
                <h3 style="color: #dc3545; margin-bottom: 15px;">MATUMIZI MENGINE (${expenses.length})</h3>
                <div class="table-wrapper">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Payee</th>
                                <th>Amount</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${expenses.map(e => `
                                <tr>
                                    <td>${escapeHtml(e['Category'] || '-')}</td>
                                    <td>${escapeHtml(e['Payee / Staff Name'] || '-')}</td>
                                    <td style="font-weight: 700;">${formatCurrency(e['Amount (Tsh)'])}</td>
                                    <td>${escapeHtml(e['Description / Activity'] || '-')}</td>
                                </tr>
                            `).join('')}
                            <tr style="background: #f1f1f1; font-weight: 700;">
                                <td colspan="2" style="text-align: right;">TOTAL EXPENSES:</td>
                                <td style="color: #dc3545;">${formatCurrency(totalExpenses)} Tsh</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            ` : ''}
            
            ${payments.length > 0 ? `
            <div class="card" style="box-shadow: none;">
                <h3 style="color: #0a6c6c; margin-bottom: 15px;">MALIPO (${payments.length})</h3>
                <div class="table-wrapper">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Payment ID</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Method</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${payments.map(p => `
                                <tr>
                                    <td>${escapeHtml(p['Payment ID'] || '-')}</td>
                                    <td style="font-weight: 700; color: #28a745;">${formatCurrency(p['Amount (Tsh)'])}</td>
                                    <td>${formatDate(p['Date'])}</td>
                                    <td>${escapeHtml(p['Payment Method'] || '-')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : ''}
            
            <button class="btn btn-gold btn-block" onclick="printFullReport()">Print Full Report</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ============================================
// PRINT FULL REPORT
// ============================================
function printFullReport() {
    const settings = allSystemData.settings && allSystemData.settings.length > 0 
        ? allSystemData.settings[0] 
        : {};
    
    const logoUrl = settings['Company_Logo_URL'] || settings['companyLogoUrl'] || '';
    
    const printStyle = document.createElement('style');
    printStyle.id = 'printLogoStyle';
    printStyle.textContent = `
        @media print {
            .modal-overlay {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                background: white !important;
                padding: 20px !important;
            }
            .modal-content {
                box-shadow: none !important;
                max-width: 100% !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .modal-header, .modal-close, .btn, button {
                display: none !important;
            }
            img {
                max-width: 120px !important;
                max-height: 60px !important;
                width: auto !important;
                height: auto !important;
                object-fit: contain !important;
                display: block !important;
                margin: 0 auto !important;
            }
            .card {
                box-shadow: none !important;
                border: 1px solid #ddd !important;
                page-break-inside: avoid !important;
            }
            body {
                background: white !important;
            }
            table {
                width: 100% !important;
                border-collapse: collapse !important;
            }
            th, td {
                border: 1px solid #ddd !important;
                padding: 8px !important;
                text-align: left !important;
            }
        }
    `;
    
    const existingStyle = document.getElementById('printLogoStyle');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    document.head.appendChild(printStyle);
    
    setTimeout(() => {
        window.print();
    }, 300);
}

// ============================================
// VIEW CUSTOMER INVOICES
// ============================================
function viewCustomerInvoices(customerName) {
    if (!allSystemData || !allSystemData.invoices) return;
    
    const customerInvoices = allSystemData.invoices.filter(inv => inv['Customer Name'] === customerName);
    
    if (customerInvoices.length === 0) {
        showError('No invoices found for this customer');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'customerInvoicesModal';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <span class="modal-title">Invoices for ${escapeHtml(customerName)}</span>
                <button class="modal-close" onclick="closeModal('customerInvoicesModal')">&times;</button>
            </div>
            
            <div class="table-wrapper">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Invoice No</th>
                            <th>Date</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${customerInvoices.map(inv => `
                            <tr>
                                <td><strong>${escapeHtml(inv['Invoice No'])}</strong></td>
                                <td>${formatDate(inv['Date'])}</td>
                                <td>${formatCurrency(inv['Total Charges'])} Tsh</td>
                                <td><span class="status-badge ${getStatusBadgeClass(inv['Status'])}">${escapeHtml(inv['Status'] || 'Pending')}</span></td>
                                <td><button class="btn btn-primary btn-sm" onclick="closeModal('customerInvoicesModal'); viewFullInvoiceReport('${escapeHtml(inv['Invoice No'])}')">View</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ============================================
// LOAD ACTIVITY LOGS TABLE
// ============================================
function loadActivityLogsTable() {
    const tbody = document.getElementById('activityLogsTableBody');
    
    if (!tbody) return;
    
    const logs = allSystemData.activityLogs || [];
    
    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No activity logs found</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    const recentLogs = logs.slice(-100).reverse();
    
    recentLogs.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDateTime(log['Date Time'])}</td>
            <td>${escapeHtml(log['Full Name'] || '-')}</td>
            <td><strong>${escapeHtml(log['Action'] || '-')}</strong></td>
            <td>${escapeHtml(log['Module'] || '-')}</td>
            <td>${escapeHtml(log['Description'] || '-')}</td>
            <td><small style="color: #666;">${escapeHtml(log['Device Info'] || '-')}</small></td>
        `;
        tbody.appendChild(row);
    });
}

// ============================================
// FORMAT DATE TIME
// ============================================
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '-';
    
    const date = new Date(dateTimeString);
    
    if (isNaN(date.getTime())) return dateTimeString;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// ============================================
// LOAD USERS TABLE
// ============================================
function loadUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    
    if (!tbody) return;
    
    const users = allSystemData.users || [];
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    const isAdminUser = isAdmin();
    
    users.forEach(user => {
        const row = document.createElement('tr');
        
        const deleteButton = (isAdminUser && user['User ID'] !== 'USR-001')
            ? `<button class="btn btn-danger btn-sm delete-btn" onclick="deleteUser('${escapeHtml(user['User ID'])}')">Delete</button>`
            : (user['User ID'] === 'USR-001' ? '<span style="font-size: 11px; color: #DAA520;">Primary Admin</span>' : '');
        
        row.innerHTML = `
            <td><strong>${escapeHtml(user['User ID'] || '-')}</strong></td>
            <td>${escapeHtml(user['Full Name'] || '-')}</td>
            <td>${escapeHtml(user['Role'] || '-')}</td>
            <td><span class="status-badge ${user['Status'] === 'Active' ? 'status-completed' : 'status-pending'}">${escapeHtml(user['Status'] || 'Active')}</span></td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="editUser('${escapeHtml(user['User ID'])}')">Edit</button>
                ${deleteButton}
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// ============================================
// OPEN USER MODAL
// ============================================
function openUserModal(userIdValue = null) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'userModal';
    
    let user = null;
    
    if (userIdValue) {
        user = (allSystemData.users || []).find(u => u['User ID'] === userIdValue);
    }
    
    const existingPermissions = user && user['Permissions'] ? user['Permissions'].split(',').map(p => p.trim()) : [];
    
    const modules = ['dashboard', 'customers', 'invoices', 'payments', 'expenses', 'reports'];
    
    const permissionCheckboxes = modules.map(module => {
        const checked = existingPermissions.includes(module) || module === 'dashboard' ? 'checked' : '';
        const disabled = module === 'dashboard' ? 'disabled' : '';
        const note = module === 'dashboard' ? ' <small style="color: #999;">(Always visible)</small>' : '';
        return `
            <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <input type="checkbox" class="permission-checkbox" value="${module}" ${checked} ${disabled}>
                <span>${module.charAt(0).toUpperCase() + module.slice(1)}${note}</span>
            </label>
        `;
    }).join('');
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <span class="modal-title">${user ? 'Edit User' : 'Add New User'}</span>
                <button class="modal-close" onclick="closeModal('userModal')">&times;</button>
            </div>
            
            <form id="userForm">
                <div class="form-group">
                    <label>Full Name *</label>
                    <input type="text" id="userFullName" class="form-control" value="${user ? escapeHtml(user['Full Name']) : ''}" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Role *</label>
                        <select id="userRole" class="form-control" required onchange="togglePermissions()">
                            <option value="">-- Select Role --</option>
                            <option value="Admin" ${user && user['Role'] === 'Admin' ? 'selected' : ''}>Admin</option>
                            <option value="Secretary" ${user && user['Role'] === 'Secretary' ? 'selected' : ''}>Secretary</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="userStatus" class="form-control">
                            <option value="Active" ${user && user['Status'] === 'Active' ? 'selected' : ''}>Active</option>
                            <option value="Inactive" ${user && user['Status'] === 'Inactive' ? 'selected' : ''}>Inactive</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Password *</label>
                    <input type="text" id="userPassword" class="form-control" value="${user ? escapeHtml(user['Password']) : ''}" required>
                </div>
                
                <div class="form-group" id="permissionsSection" style="display: ${user && user['Role'] === 'Secretary' ? 'block' : 'none'};">
                    <label style="font-weight: 700; margin-bottom: 15px;">Module Permissions (Secretary Only)</label>
                    <div style="background: #f8f8f8; padding: 15px; border-radius: 8px;">
                        ${permissionCheckboxes}
                    </div>
                </div>
                
                <button type="submit" class="btn btn-primary btn-block">
                    ${user ? 'Update User' : 'Add User'}
                </button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('userForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        
        if (submitButton.disabled) {
            return;
        }
        
        const originalText = submitButton.innerHTML;
        showButtonLoading(submitButton, 'Saving...');
        
        const selectedRole = document.getElementById('userRole').value;
        let permissions = '';
        
        if (selectedRole === 'Secretary') {
            permissions = 'dashboard';
            const checkedBoxes = document.querySelectorAll('.permission-checkbox:checked');
            checkedBoxes.forEach(cb => {
                if (cb.value !== 'dashboard') {
                    permissions += ',' + cb.value;
                }
            });
        }
        
        const userData = {
            fullName: document.getElementById('userFullName').value.trim(),
            role: selectedRole,
            password: document.getElementById('userPassword').value.trim(),
            status: document.getElementById('userStatus').value,
            permissions: permissions,
            loggedInUserId: userId,
            loggedInFullName: userFullName
        };
        
        if (!userData.fullName || !userData.role || !userData.password) {
            hideButtonLoading(submitButton, originalText);
            showError('Full Name, Role, and Password are required');
            return;
        }
        
        let result;
        
        if (user) {
            userData.userId = user['User ID'];
            result = await fetchData('updateUser', userData);
        } else {
            result = await fetchData('addUser', userData);
        }
        
        hideButtonLoading(submitButton, originalText);
        
        if (result.success) {
            showSuccess(result.message);
            closeModal('userModal');
            await loadAllSystemData();
            loadUsersTable();
        } else {
            showError(result.message);
        }
    });
}

// ============================================
// TOGGLE PERMISSIONS
// ============================================
function togglePermissions() {
    const role = document.getElementById('userRole').value;
    const permissionsSection = document.getElementById('permissionsSection');
    
    if (permissionsSection) {
        if (role === 'Secretary') {
            permissionsSection.style.display = 'block';
        } else {
            permissionsSection.style.display = 'none';
        }
    }
}

// ============================================
// EDIT USER
// ============================================
function editUser(userIdValue) {
    openUserModal(userIdValue);
}

// ============================================
// DELETE USER
// ============================================
async function deleteUser(userIdValue) {
    if (!isAdmin()) {
        showError('Only Admin can delete users.');
        return;
    }
    
    if (userIdValue === 'USR-001') {
        showError('This is the primary admin account. It cannot be deleted.');
        return;
    }
    
    if (!confirmAction('Are you sure you want to delete this user?')) {
        return;
    }
    
    const result = await fetchData('deleteUser', {
        userId: userIdValue,
        loggedInUserId: userId,
        loggedInFullName: userFullName
    });
    
    if (result.success) {
        showSuccess(result.message);
        await loadAllSystemData();
        loadUsersTable();
    } else {
        showError(result.message);
    }
}

// ============================================
// LOAD SETTINGS
// ============================================
function loadSettings() {
    const settings = allSystemData.settings && allSystemData.settings.length > 0 
        ? allSystemData.settings[0] 
        : {};
    
    const setValue = (elementId, value) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value || '';
        }
    };
    
    setValue('settingCompanyName', settings['Company_Name'] || settings['companyName'] || '');
    setValue('settingCompanyTagline', settings['Company_Tagline'] || settings['companyTagline'] || '');
    setValue('settingCompanyPhone', settings['Company_Phone'] || settings['companyPhone'] || '');
    setValue('settingCompanyEmail', settings['Company_Email'] || settings['companyEmail'] || '');
    setValue('settingCompanyAddress', settings['Company_Address'] || settings['companyAddress'] || '');
    setValue('settingBankName', settings['Bank_Name'] || settings['bankName'] || '');
    setValue('settingBankAccountNo', settings['Bank_Account_No'] || settings['bankAccountNo'] || '');
    setValue('settingBankAccountName', settings['Bank_Account_Name'] || settings['bankAccountName'] || '');
    setValue('settingMobilePaymentName', settings['Mobile_Payment_Name'] || settings['mobilePaymentName'] || '');
    setValue('settingMobilePaymentNo', settings['Mobile_Payment_No'] || settings['mobilePaymentNo'] || '');
    setValue('settingCurrency', settings['Currency'] || settings['currency'] || 'TSh');
    setValue('settingInvoiceTerms', settings['Invoice_Terms'] || settings['invoiceTerms'] || '');
    setValue('settingInvoiceValidityDays', settings['Invoice_Validity_Days'] || settings['invoiceValidityDays'] || 14);
}

// ============================================
// CHANGE PASSWORD
// ============================================
async function changePassword(currentPassword, newPassword) {
    const result = await fetchData('changePassword', {
        userId: userId,
        currentPassword: currentPassword,
        newPassword: newPassword
    });
    
    return result;
}

// ============================================
// HANDLE SETTINGS FORM
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const settingsForm = document.getElementById('settingsForm');
    
    if (settingsForm) {
        settingsForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = this.querySelector('button[type="submit"]');
            
            if (submitButton.disabled) {
                return;
            }
            
            const originalText = submitButton.innerHTML;
            showButtonLoading(submitButton, 'Saving...');
            
            const settingsData = {
                companyName: document.getElementById('settingCompanyName').value.trim(),
                companyTagline: document.getElementById('settingCompanyTagline').value.trim(),
                companyPhone: document.getElementById('settingCompanyPhone').value.trim(),
                companyEmail: document.getElementById('settingCompanyEmail').value.trim(),
                companyAddress: document.getElementById('settingCompanyAddress').value.trim(),
                bankName: document.getElementById('settingBankName').value.trim(),
                bankAccountNo: document.getElementById('settingBankAccountNo').value.trim(),
                bankAccountName: document.getElementById('settingBankAccountName').value.trim(),
                mobilePaymentName: document.getElementById('settingMobilePaymentName').value.trim(),
                mobilePaymentNo: document.getElementById('settingMobilePaymentNo').value.trim(),
                currency: document.getElementById('settingCurrency').value.trim(),
                invoiceTerms: document.getElementById('settingInvoiceTerms').value.trim(),
                invoiceValidityDays: document.getElementById('settingInvoiceValidityDays').value,
                companyLogoUrl: '',
                userId: userId,
                fullName: userFullName
            };
            
            const result = await fetchData('updateSettings', settingsData);
            
            hideButtonLoading(submitButton, originalText);
            
            if (result.success) {
                showSuccess(result.message);
                await loadAllSystemData();
            } else {
                showError(result.message);
            }
        });
    }
    
    const passwordForm = document.getElementById('passwordChangeForm');
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = this.querySelector('button[type="submit"]');
            
            if (submitButton.disabled) {
                return;
            }
            
            const originalText = submitButton.innerHTML;
            showButtonLoading(submitButton, 'Changing...');
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (!currentPassword || !newPassword || !confirmPassword) {
                hideButtonLoading(submitButton, originalText);
                showError('All password fields are required');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                hideButtonLoading(submitButton, originalText);
                showError('New passwords do not match');
                return;
            }
            
            const result = await changePassword(currentPassword, newPassword);
            
            hideButtonLoading(submitButton, originalText);
            
            if (result.success) {
                showSuccess(result.message);
                passwordForm.reset();
            } else {
                showError(result.message);
            }
        });
    }
});