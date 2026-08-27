// ============================================
// KASHOMBA ELECTRICAL SYSTEM - REPORTS LOGIC v5
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
    const timeFilter = timeFilterElement ? timeFilterElement.value : 'today';
    
    const tbody = document.getElementById('reportsTableBody');
    const thead = document.getElementById('reportsTableHead');
    
    if (!tbody || !thead) {
        return;
    }
    
    let filteredData = [];
    let headers = [];
    
    // Get data based on report type
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
            headers = ['Payment ID', 'Invoice No', 'Amount (Tsh)', 'Date', 'Method', 'Recorded By', 'Actions'];
            break;
        case 'expenses':
            filteredData = [...allSystemData.expenses];
            headers = ['Expense ID', 'Invoice No', 'Category', 'Payee', 'Amount (Tsh)', 'Date', 'Status'];
            break;
        default:
            filteredData = [...allSystemData.invoices];
            headers = ['Invoice No', 'Customer', 'Date', 'Total (Tsh)', 'Balance (Tsh)', 'Status', 'Actions'];
    }
    
    // Update table headers
    thead.innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    
    // Get today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Apply time filter
    if (timeFilter === 'today') {
        // Default: taarifa za leo tu
        filteredData = filteredData.filter(item => {
            const itemDate = (item['Date'] || '').toString();
            return itemDate >= todayStr;
        });
    } else if (timeFilter === 'month') {
        const monthStart = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-01';
        filteredData = filteredData.filter(item => (item['Date'] || '') >= monthStart);
    } else if (timeFilter === 'year') {
        const yearStart = today.getFullYear() + '-01-01';
        filteredData = filteredData.filter(item => (item['Date'] || '') >= yearStart);
    } else if (timeFilter === 'all') {
        // No filter - all data
    }
    
    // Apply date range filter (kama user amechagua)
    if (dateFrom) {
        filteredData = filteredData.filter(item => (item['Date'] || '') >= dateFrom);
    }
    
    if (dateTo) {
        filteredData = filteredData.filter(item => (item['Date'] || '') <= dateTo);
    }
    
    // Apply status filter
    if (statusFilter && (currentReportType === 'invoices' || currentReportType === 'expenses')) {
        filteredData = filteredData.filter(item => item['Status'] === statusFilter);
    }
    
    // Store for download
    filteredReportData = filteredData;
    
    // Display results
    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="' + headers.length + '" class="text-center">No data found for today</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    filteredData.forEach(item => {
        const row = document.createElement('tr');
        
        switch(currentReportType) {
            case 'invoices':
                row.innerHTML = `
                    <td><strong>${item['Invoice No']}</strong></td>
                    <td>${item['Customer Name'] || '-'}</td>
                    <td>${formatDate(item['Date'])}</td>
                    <td>${formatCurrency(item['Total Charges'])}</td>
                    <td>${formatCurrency(item['Balance'])}</td>
                    <td><span class="status-badge ${getStatusBadgeClass(item['Status'])}">${item['Status'] || 'Pending'}</span></td>
                    <td><button class="btn btn-primary btn-sm" onclick="viewFullInvoiceReport('${item['Invoice No']}')">📋 Full Report</button></td>
                `;
                break;
            case 'customers':
                row.innerHTML = `
                    <td><strong>${item['Customer ID']}</strong></td>
                    <td>${item['Customer Name'] || '-'}</td>
                    <td>${item['Phone Number'] || '-'}</td>
                    <td>${item['Address / Region'] || '-'}</td>
                    <td>${item['Email'] || '-'}</td>
                    <td>${formatDate(item['Date'])}</td>
                    <td><button class="btn btn-primary btn-sm" onclick="viewCustomerInvoices('${item['Customer Name']}')">📋 View Invoices</button></td>
                `;
                break;
            case 'payments':
                row.innerHTML = `
                    <td><strong>${item['Payment ID']}</strong></td>
                    <td>${item['Invoice No'] || '-'}</td>
                    <td>${formatCurrency(item['Amount (Tsh)'])}</td>
                    <td>${formatDate(item['Date'])}</td>
                    <td>${item['Payment Method'] || '-'}</td>
                    <td>${item['Recorded By'] || '-'}</td>
                    <td></td>
                `;
                break;
            case 'expenses':
                row.innerHTML = `
                    <td><strong>${item['Expense ID']}</strong></td>
                    <td>${item['Invoice No'] || '-'}</td>
                    <td>${item['Category'] || '-'}</td>
                    <td>${item['Payee / Staff Name'] || '-'}</td>
                    <td>${formatCurrency(item['Amount (Tsh)'])}</td>
                    <td>${formatDate(item['Date'])}</td>
                    <td><span class="status-badge ${getStatusBadgeClass(item['Status'])}">${item['Status'] || 'Pending'}</span></td>
                `;
                break;
        }
        
        tbody.appendChild(row);
    });
    
    // Add summary row for totals
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
            summaryHTML = `<td colspan="2" style="text-align: right;">TOTAL:</td><td>${formatCurrency(totalAmount)} Tsh</td><td colspan="4"></td>`;
        } else if (currentReportType === 'expenses') {
            summaryHTML = `<td colspan="4" style="text-align: right;">TOTAL:</td><td>${formatCurrency(totalAmount)} Tsh</td><td colspan="2"></td>`;
        }
        
        summaryRow.innerHTML = summaryHTML;
        tbody.appendChild(summaryRow);
    }
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
// VIEW CUSTOMER INVOICES
// ============================================
function viewCustomerInvoices(customerName) {
    const customerInvoices = allSystemData.invoices.filter(inv => inv['Customer Name'] === customerName);
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'customerInvoicesModal';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <span class="modal-title">Invoices for ${customerName}</span>
                <button class="modal-close" onclick="closeModal('customerInvoicesModal')">&times;</button>
            </div>
            
            <div class="table-wrapper">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Invoice No</th>
                            <th>Date</th>
                            <th>Total (Tsh)</th>
                            <th>Balance (Tsh)</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${customerInvoices.length === 0 
                            ? '<tr><td colspan="6" class="text-center">No invoices found for this customer</td></tr>'
                            : customerInvoices.map(inv => `
                                <tr>
                                    <td><strong>${inv['Invoice No']}</strong></td>
                                    <td>${formatDate(inv['Date'])}</td>
                                    <td>${formatCurrency(inv['Total Charges'])}</td>
                                    <td>${formatCurrency(inv['Balance'])}</td>
                                    <td><span class="status-badge ${getStatusBadgeClass(inv['Status'])}">${inv['Status']}</span></td>
                                    <td><button class="btn btn-primary btn-sm" onclick="closeModal('customerInvoicesModal'); viewFullInvoiceReport('${inv['Invoice No']}')">📋 View</button></td>
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
// DOWNLOAD REPORT CSV
// ============================================
function downloadReportCSV() {
    // Generate report kwanza kama hakuna data
    if (filteredReportData.length === 0) {
        generateReport();
    }
    
    // Check tena
    if (filteredReportData.length === 0) {
        showError('No data found for today to download');
        return;
    }
    
    const csvData = filteredReportData.map(item => {
        switch(currentReportType) {
            case 'invoices':
                return {
                    'Invoice No': item['Invoice No'],
                    'Customer': item['Customer Name'],
                    'Date': item['Date'],
                    'Total (Tsh)': item['Total Charges'],
                    'Balance (Tsh)': item['Balance'],
                    'Status': item['Status']
                };
            case 'customers':
                return {
                    'Customer ID': item['Customer ID'],
                    'Name': item['Customer Name'],
                    'Phone': item['Phone Number'],
                    'Address': item['Address / Region'],
                    'Email': item['Email'],
                    'Date': item['Date']
                };
            case 'payments':
                return {
                    'Payment ID': item['Payment ID'],
                    'Invoice No': item['Invoice No'],
                    'Amount (Tsh)': item['Amount (Tsh)'],
                    'Date': item['Date'],
                    'Method': item['Payment Method'],
                    'Recorded By': item['Recorded By']
                };
            case 'expenses':
                return {
                    'Expense ID': item['Expense ID'],
                    'Invoice No': item['Invoice No'],
                    'Category': item['Category'],
                    'Payee': item['Payee / Staff Name'],
                    'Amount (Tsh)': item['Amount (Tsh)'],
                    'Date': item['Date'],
                    'Status': item['Status']
                };
            default:
                return {};
        }
    });
    
    const filename = getDownloadFilename('csv');
    downloadCSV(csvData, filename);
    showSuccess('Report downloaded: ' + filename);
}

// ============================================
// DOWNLOAD REPORT PDF
// ============================================
function downloadReportPDF() {
    // Generate report kwanza kama hakuna data
    if (filteredReportData.length === 0) {
        generateReport();
    }
    
    // Check tena
    if (filteredReportData.length === 0) {
        showError('No data found for today to download');
        return;
    }
    
    const printWindow = window.open('', '_blank', 'width=900,height=600');
    
    printWindow.document.write('<html><head><title>Kashomba Report</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: Arial, sans-serif; padding: 20px; }');
    printWindow.document.write('h1 { text-align: center; color: #000; }');
    printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 20px; }');
    printWindow.document.write('th { background: #0a0a0a; color: #fff; padding: 10px; text-align: left; font-size: 12px; }');
    printWindow.document.write('td { padding: 8px; border-bottom: 1px solid #ddd; font-size: 12px; }');
    printWindow.document.write('tr:nth-child(even) { background: #f8f8f8; }');
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');
    
    printWindow.document.write('<h1>KASHOMBA ELECTRICAL SOLUTION - ' + currentReportType.toUpperCase() + ' REPORT</h1>');
    printWindow.document.write('<p style="text-align: center;">Generated: ' + new Date().toLocaleString() + '</p>');
    printWindow.document.write('<p style="text-align: center;">Total Records: ' + filteredReportData.length + '</p>');
    
    printWindow.document.write('<table>');
    
    switch(currentReportType) {
        case 'invoices':
            printWindow.document.write('<thead><tr><th>Invoice No</th><th>Customer</th><th>Date</th><th>Total (Tsh)</th><th>Balance (Tsh)</th><th>Status</th></tr></thead><tbody>');
            filteredReportData.forEach(item => {
                printWindow.document.write('<tr>');
                printWindow.document.write('<td>' + item['Invoice No'] + '</td>');
                printWindow.document.write('<td>' + item['Customer Name'] + '</td>');
                printWindow.document.write('<td>' + formatDate(item['Date']) + '</td>');
                printWindow.document.write('<td>' + formatCurrency(item['Total Charges']) + '</td>');
                printWindow.document.write('<td>' + formatCurrency(item['Balance']) + '</td>');
                printWindow.document.write('<td>' + item['Status'] + '</td>');
                printWindow.document.write('</tr>');
            });
            break;
        case 'customers':
            printWindow.document.write('<thead><tr><th>Customer ID</th><th>Name</th><th>Phone</th><th>Address</th><th>Email</th><th>Date</th></tr></thead><tbody>');
            filteredReportData.forEach(item => {
                printWindow.document.write('<tr>');
                printWindow.document.write('<td>' + item['Customer ID'] + '</td>');
                printWindow.document.write('<td>' + item['Customer Name'] + '</td>');
                printWindow.document.write('<td>' + item['Phone Number'] + '</td>');
                printWindow.document.write('<td>' + item['Address / Region'] + '</td>');
                printWindow.document.write('<td>' + item['Email'] + '</td>');
                printWindow.document.write('<td>' + formatDate(item['Date']) + '</td>');
                printWindow.document.write('</tr>');
            });
            break;
        case 'payments':
            printWindow.document.write('<thead><tr><th>Payment ID</th><th>Invoice No</th><th>Amount (Tsh)</th><th>Date</th><th>Method</th><th>Recorded By</th></tr></thead><tbody>');
            filteredReportData.forEach(item => {
                printWindow.document.write('<tr>');
                printWindow.document.write('<td>' + item['Payment ID'] + '</td>');
                printWindow.document.write('<td>' + item['Invoice No'] + '</td>');
                printWindow.document.write('<td>' + formatCurrency(item['Amount (Tsh)']) + '</td>');
                printWindow.document.write('<td>' + formatDate(item['Date']) + '</td>');
                printWindow.document.write('<td>' + item['Payment Method'] + '</td>');
                printWindow.document.write('<td>' + item['Recorded By'] + '</td>');
                printWindow.document.write('</tr>');
            });
            break;
        case 'expenses':
            printWindow.document.write('<thead><tr><th>Expense ID</th><th>Invoice No</th><th>Category</th><th>Payee</th><th>Amount (Tsh)</th><th>Date</th><th>Status</th></tr></thead><tbody>');
            filteredReportData.forEach(item => {
                printWindow.document.write('<tr>');
                printWindow.document.write('<td>' + item['Expense ID'] + '</td>');
                printWindow.document.write('<td>' + item['Invoice No'] + '</td>');
                printWindow.document.write('<td>' + item['Category'] + '</td>');
                printWindow.document.write('<td>' + item['Payee / Staff Name'] + '</td>');
                printWindow.document.write('<td>' + formatCurrency(item['Amount (Tsh)']) + '</td>');
                printWindow.document.write('<td>' + formatDate(item['Date']) + '</td>');
                printWindow.document.write('<td>' + item['Status'] + '</td>');
                printWindow.document.write('</tr>');
            });
            break;
    }
    
    printWindow.document.write('</tbody></table>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

// ============================================
// VIEW FULL INVOICE REPORT
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
    const payments = data.payments;
    const expenses = data.expenses;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'fullInvoiceReportModal';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header">
                <span class="modal-title">Full Invoice Report - ${invoice['Invoice No']}</span>
                <button class="modal-close" onclick="closeModal('fullInvoiceReportModal')">&times;</button>
            </div>
            
            <div class="card" style="box-shadow: none;">
                <h3 style="color: #DAA520; margin-bottom: 15px;">INVOICE INFORMATION</h3>
                <div class="form-row">
                    <div>
                        <p><strong>Invoice No:</strong> ${invoice['Invoice No']}</p>
                        <p><strong>Date:</strong> ${formatDate(invoice['Date'])}</p>
                        <p><strong>Status:</strong> <span class="status-badge ${getStatusBadgeClass(invoice['Status'])}">${invoice['Status']}</span></p>
                    </div>
                    <div>
                        <p><strong>Customer:</strong> ${invoice['Customer Name']}</p>
                        <p><strong>Phone:</strong> ${customer ? customer['Phone Number'] : '-'}</p>
                        <p><strong>Location:</strong> ${invoice['Location'] || '-'}</p>
                    </div>
                    <div>
                        <p><strong>Total Charges:</strong> ${formatCurrency(invoice['Total Charges'])} Tsh</p>
                        <p><strong>Balance:</strong> ${formatCurrency(invoice['Balance'])} Tsh</p>
                        <p><strong>Work Phase:</strong> ${invoice['Work Phase'] || '-'}</p>
                    </div>
                </div>
            </div>
            
            <div class="card" style="box-shadow: none;">
                <h3 style="color: #0a6c6c; margin-bottom: 15px;">PAYMENTS (${payments.length})</h3>
                <div class="table-wrapper">
                    <table class="table">
                        <thead><tr><th>Payment ID</th><th>Amount (Tsh)</th><th>Date</th><th>Method</th><th>Recorded By</th></tr></thead>
                        <tbody>
                            ${payments.length === 0 
                                ? '<tr><td colspan="5" class="text-center">No payments recorded</td></tr>'
                                : payments.map(p => `
                                    <tr>
                                        <td>${p['Payment ID']}</td>
                                        <td>${formatCurrency(p['Amount (Tsh)'])}</td>
                                        <td>${formatDate(p['Date'])}</td>
                                        <td>${p['Payment Method']}</td>
                                        <td>${p['Recorded By']}</td>
                                    </tr>
                                `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="card" style="box-shadow: none;">
                <h3 style="color: #dc3545; margin-bottom: 15px;">EXPENSES (${expenses.length})</h3>
                <div class="table-wrapper">
                    <table class="table">
                        <thead><tr><th>Expense ID</th><th>Category</th><th>Payee</th><th>Amount (Tsh)</th><th>Description</th></tr></thead>
                        <tbody>
                            ${expenses.length === 0 
                                ? '<tr><td colspan="5" class="text-center">No expenses recorded</td></tr>'
                                : expenses.map(e => `
                                    <tr>
                                        <td>${e['Expense ID']}</td>
                                        <td>${e['Category']}</td>
                                        <td>${e['Payee / Staff Name']}</td>
                                        <td>${formatCurrency(e['Amount (Tsh)'])}</td>
                                        <td>${e['Description / Activity'] || '-'}</td>
                                    </tr>
                                `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="card" style="box-shadow: none; background: #f8f8f8;">
                <h3 style="color: #000; margin-bottom: 15px;">SUMMARY</h3>
                <div class="form-row">
                    <div><p><strong>Total Charges:</strong> ${formatCurrency(invoice['Total Charges'])} Tsh</p></div>
                    <div><p><strong>Total Paid:</strong> ${formatCurrency(payments.reduce((sum, p) => sum + (Number(p['Amount (Tsh)']) || 0), 0))} Tsh</p></div>
                    <div><p><strong>Total Expenses:</strong> ${formatCurrency(expenses.reduce((sum, e) => sum + (Number(e['Amount (Tsh)']) || 0), 0))} Tsh</p></div>
                    <div><p><strong>Balance:</strong> ${formatCurrency(invoice['Balance'])} Tsh</p></div>
                </div>
            </div>
            
            <button class="btn btn-gold btn-block" onclick="printFullReport()">🖨️ Print Full Report</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function printFullReport() {
    window.print();
}

// ============================================
// LOAD ACTIVITY LOGS TABLE
// ============================================
function loadActivityLogsTable() {
    const tbody = document.getElementById('activityLogsTableBody');
    
    if (!tbody) return;
    
    const logs = allSystemData.activityLogs;
    
    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No activity logs found</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    const recentLogs = logs.slice(-100).reverse();
    
    recentLogs.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDateTime(log['Date Time'])}</td>
            <td>${log['Full Name'] || '-'}</td>
            <td><strong>${log['Action'] || '-'}</strong></td>
            <td>${log['Module'] || '-'}</td>
            <td>${log['Description'] || '-'}</td>
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
// LOAD USERS TABLE (Admin Only)
// ============================================
function loadUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    
    if (!tbody) return;
    
    const users = allSystemData.users;
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    const isAdminUser = isAdmin();
    
    users.forEach(user => {
        const row = document.createElement('tr');
        
        const deleteButton = (isAdminUser && user['User ID'] !== 'USR-001')
            ? `<button class="btn btn-danger btn-sm delete-btn" onclick="deleteUser('${user['User ID']}')">🗑️ Delete</button>`
            : (user['User ID'] === 'USR-001' ? '<span style="font-size: 11px; color: #DAA520;">Primary Admin</span>' : '');
        
        row.innerHTML = `
            <td><strong>${user['User ID']}</strong></td>
            <td>${user['Full Name'] || '-'}</td>
            <td>${user['Role'] || '-'}</td>
            <td><span class="status-badge ${user['Status'] === 'Active' ? 'status-completed' : 'status-pending'}">${user['Status'] || 'Active'}</span></td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="editUser('${user['User ID']}')">✏️ Edit</button>
                ${deleteButton}
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// ============================================
// OPEN USER MODAL (Admin Only) with Permissions
// ============================================
function openUserModal(userIdValue = null) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'userModal';
    
    let user = null;
    
    if (userIdValue) {
        user = allSystemData.users.find(u => u['User ID'] === userIdValue);
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
                    <input type="text" id="userFullName" class="form-control" value="${user ? user['Full Name'] : ''}" required>
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
                    <input type="text" id="userPassword" class="form-control" value="${user ? user['Password'] : ''}" required>
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

function togglePermissions() {
    const role = document.getElementById('userRole').value;
    const permissionsSection = document.getElementById('permissionsSection');
    
    if (role === 'Secretary') {
        permissionsSection.style.display = 'block';
    } else {
        permissionsSection.style.display = 'none';
    }
}

function editUser(userIdValue) {
    openUserModal(userIdValue);
}

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
// LOAD SETTINGS (Admin Only) + Password Change
// ============================================
function loadSettings() {
    const settings = allSystemData.settings.length > 0 ? allSystemData.settings[0] : DEFAULT_SETTINGS;
    
    document.getElementById('settingCompanyName').value = settings['Company_Name'] || '';
    document.getElementById('settingCompanyTagline').value = settings['Company_Tagline'] || '';
    document.getElementById('settingCompanyPhone').value = settings['Company_Phone'] || '';
    document.getElementById('settingCompanyEmail').value = settings['Company_Email'] || '';
    document.getElementById('settingCompanyAddress').value = settings['Company_Address'] || '';
    document.getElementById('settingBankName').value = settings['Bank_Name'] || '';
    document.getElementById('settingBankAccountNo').value = settings['Bank_Account_No'] || '';
    document.getElementById('settingBankAccountName').value = settings['Bank_Account_Name'] || '';
    document.getElementById('settingMobilePaymentName').value = settings['Mobile_Payment_Name'] || '';
    document.getElementById('settingMobilePaymentNo').value = settings['Mobile_Payment_No'] || '';
    document.getElementById('settingCurrency').value = settings['Currency'] || 'Tsh';
    document.getElementById('settingInvoiceTerms').value = settings['Invoice_Terms'] || '';
    document.getElementById('settingInvoiceValidityDays').value = settings['Invoice_Validity_Days'] || 14;
}

// ============================================
// CHANGE PASSWORD (Admin)
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
                userId: userId,
                fullName: userFullName
            };
            
            const result = await fetchData('updateSettings', settingsData);
            
            if (result.success) {
                showSuccess(result.message);
                await loadAllSystemData();
            } else {
                showError(result.message);
            }
        });
    }
    
    // Password change form
    const passwordForm = document.getElementById('passwordChangeForm');
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (!currentPassword || !newPassword || !confirmPassword) {
                showError('All password fields are required');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showError('New passwords do not match');
                return;
            }
            
            const result = await changePassword(currentPassword, newPassword);
            
            if (result.success) {
                showSuccess(result.message);
                passwordForm.reset();
            } else {
                showError(result.message);
            }
        });
    }
});