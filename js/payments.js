// ============================================
// KASHOMBA ELECTRICAL SYSTEM - PAYMENTS LOGIC v7
// Full Payment Process + Edit/Delete Payments
// ============================================

function loadPaymentsTable() {
    const tbody = document.getElementById('paymentsTableBody');
    
    if (!tbody) {
        return;
    }
    
    const payments = allSystemData.payments || [];
    
    if (payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No payments found</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    // Sort by date (newest first)
    payments.sort((a, b) => {
        const dateA = (a['Date'] || '').toString();
        const dateB = (b['Date'] || '').toString();
        return dateB.localeCompare(dateA);
    });
    
    const isAdminUser = isAdmin();
    
    payments.forEach(payment => {
        const row = document.createElement('tr');
        
        const editButton = `<button class="btn btn-primary btn-sm" onclick="openEditPaymentModal('${escapeHtml(payment['Payment ID'])}')">Edit</button>`;
        const deleteButton = isAdminUser 
            ? `<button class="btn btn-danger btn-sm" onclick="deletePayment('${escapeHtml(payment['Payment ID'])}')">Delete</button>`
            : '';
        
        row.innerHTML = `
            <td><strong>${escapeHtml(payment['Payment ID'] || '-')}</strong></td>
            <td>${escapeHtml(payment['Invoice No'] || '-')}</td>
            <td>${formatCurrency(payment['Amount (Tsh)'])}</td>
            <td>${formatDate(payment['Date'])}</td>
            <td>${escapeHtml(payment['Payment Method'] || '-')}</td>
            <td>${escapeHtml(payment['Recorded By'] || '-')}</td>
            <td>
                ${editButton}
                ${deleteButton}
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function openPaymentModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'paymentModal';
    
    // Inaonyesha invoices zote (si zilizo complete tu)
    const activeInvoices = (allSystemData.invoices || []).filter(inv => (Number(inv['Balance']) || 0) > 0);
    
    if (activeInvoices.length === 0) {
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <span class="modal-title">Record Payment</span>
                    <button class="modal-close" onclick="closeModal('paymentModal')">&times;</button>
                </div>
                <div class="alert alert-warning" style="margin: 20px;">
                    No invoices with pending balance found. All invoices are fully paid.
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return;
    }
    
    const invoiceOptions = activeInvoices.map(invoice => {
        const customer = (allSystemData.customers || []).find(c => c['Customer Name'] === invoice['Customer Name']);
        const phone = customer ? customer['Phone Number'] : '';
        const balance = Number(invoice['Balance']) || 0;
        const total = Number(invoice['Total Charges']) || 0;
        const paid = total - balance;
        const percentPaid = total > 0 ? Math.round((paid / total) * 100) : 0;
        
        return `<option value="${escapeHtml(invoice['Invoice No'])}" 
            data-customer="${escapeHtml(invoice['Customer Name'])}" 
            data-phone="${escapeHtml(phone)}" 
            data-balance="${balance}" 
            data-total="${total}"
            data-status="${escapeHtml(invoice['Status'])}"
        >${escapeHtml(invoice['Invoice No'])} - ${escapeHtml(invoice['Customer Name'])} (${escapeHtml(phone)}) - ${percentPaid}% Paid</option>`;
    }).join('');
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <span class="modal-title">Record Payment</span>
                <button class="modal-close" onclick="closeModal('paymentModal')">&times;</button>
            </div>
            
            <form id="paymentForm">
                <div class="form-group">
                    <label>Search Invoice *</label>
                    <input type="text" id="paymentSearch" class="form-control" placeholder="Search by Invoice No, Customer Name, or Phone..." onkeyup="searchPaymentInvoice()">
                </div>
                
                <div class="form-group">
                    <label>Select Invoice *</label>
                    <select id="paymentInvoice" class="form-control" required onchange="updatePaymentInvoiceInfo()">
                        <option value="">-- Select Invoice --</option>
                        ${invoiceOptions}
                    </select>
                </div>
                
                <!-- Invoice Summary -->
                <div id="paymentSummaryContainer"></div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Amount (Tsh) *</label>
                        <input type="number" id="paymentAmount" class="form-control" placeholder="Enter amount" required min="0" oninput="updatePaymentPreview()">
                    </div>
                    <div class="form-group">
                        <label>Payment Method *</label>
                        <select id="paymentMethod" class="form-control" required>
                            <option value="">-- Select Method --</option>
                            ${(PAYMENT_METHODS || ['Cash', 'M-Pesa', 'Bank Transfer', 'Cheque']).map(method => `<option value="${method}">${method}</option>`).join('')}
                        </select>
                    </div>
                </div>
                
                <!-- Payment Preview -->
                <div id="paymentPreviewContainer"></div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Date *</label>
                        <input type="date" id="paymentDate" class="form-control" value="${getTodayDate()}" required>
                    </div>
                    <div class="form-group">
                        <label>Reference Number</label>
                        <input type="text" id="paymentReference" class="form-control" placeholder="Optional reference">
                    </div>
                </div>
                
                <!-- Payment History -->
                <div id="paymentHistoryContainer"></div>
                
                <button type="submit" class="btn btn-primary btn-block" id="savePaymentBtn">Record Payment</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('paymentForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('#savePaymentBtn');
        
        // Prevent double submission
        if (submitButton.disabled) {
            return;
        }
        
        const originalText = submitButton.innerHTML;
        showButtonLoading(submitButton, 'Saving...');
        
        const paymentData = {
            invoiceNo: document.getElementById('paymentInvoice').value,
            amount: Number(document.getElementById('paymentAmount').value) || 0,
            paymentMethod: document.getElementById('paymentMethod').value,
            date: document.getElementById('paymentDate').value,
            referenceNumber: document.getElementById('paymentReference').value.trim(),
            recordedBy: userFullName,
            userId: userId,
            fullName: userFullName
        };
        
        if (!paymentData.invoiceNo || !paymentData.amount || !paymentData.paymentMethod) {
            hideButtonLoading(submitButton, originalText);
            showError('Invoice, Amount, and Payment Method are required');
            return;
        }
        
        if (paymentData.amount <= 0) {
            hideButtonLoading(submitButton, originalText);
            showError('Amount must be greater than zero');
            return;
        }
        
        const selectedInvoice = (allSystemData.invoices || []).find(inv => inv['Invoice No'] === paymentData.invoiceNo);
        if (selectedInvoice) {
            const balance = Number(selectedInvoice['Balance']) || 0;
            if (paymentData.amount > balance) {
                hideButtonLoading(submitButton, originalText);
                showError('Payment amount (' + formatCurrency(paymentData.amount) + ') exceeds invoice balance (' + formatCurrency(balance) + ')');
                return;
            }
        }
        
        const result = await fetchData('addPayment', paymentData);
        
        hideButtonLoading(submitButton, originalText);
        
        if (result.success) {
            showSuccess(result.message);
            closeModal('paymentModal');
            await refreshDataAfterSave();
            loadPaymentsTable();
            loadInvoicesTable();
            loadDashboardStats();
            loadUnpaidInvoicesReminder();
        } else {
            showError(result.message);
        }
    });
}

// ============================================
// OPEN EDIT PAYMENT MODAL
// ============================================
function openEditPaymentModal(paymentId) {
    const payment = (allSystemData.payments || []).find(p => p['Payment ID'] === paymentId);
    
    if (!payment) {
        showError('Payment not found');
        return;
    }
    
    const invoice = (allSystemData.invoices || []).find(inv => inv['Invoice No'] === payment['Invoice No']);
    const currentBalance = invoice ? Number(invoice['Balance']) || 0 : 0;
    const currentAmount = Number(payment['Amount (Tsh)']) || 0;
    const maxAllowed = currentBalance + currentAmount;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'editPaymentModal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <span class="modal-title">Edit Payment - ${escapeHtml(payment['Payment ID'])}</span>
                <button class="modal-close" onclick="closeModal('editPaymentModal')">&times;</button>
            </div>
            
            <form id="editPaymentForm">
                <div class="form-group">
                    <label>Invoice No</label>
                    <input type="text" class="form-control" value="${escapeHtml(payment['Invoice No'] || '')}" readonly>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Amount (Tsh) *</label>
                        <input type="number" id="editPaymentAmount" class="form-control" value="${currentAmount}" required min="0" max="${maxAllowed}">
                        <small style="color: #666;">Max allowed: ${formatCurrency(maxAllowed)} Tsh</small>
                    </div>
                    <div class="form-group">
                        <label>Payment Method *</label>
                        <select id="editPaymentMethod" class="form-control" required>
                            <option value="">-- Select Method --</option>
                            ${(PAYMENT_METHODS || ['Cash', 'M-Pesa', 'Bank Transfer', 'Cheque']).map(method => 
                                `<option value="${method}" ${payment['Payment Method'] === method ? 'selected' : ''}>${method}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Date *</label>
                        <input type="date" id="editPaymentDate" class="form-control" value="${payment['Date'] || getTodayDate()}" required>
                    </div>
                    <div class="form-group">
                        <label>Reference Number</label>
                        <input type="text" id="editPaymentReference" class="form-control" value="${escapeHtml(payment['Reference Number'] || '')}" placeholder="Optional reference">
                    </div>
                </div>
                
                <button type="submit" class="btn btn-primary btn-block" id="updatePaymentBtn">Update Payment</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('editPaymentForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('#updatePaymentBtn');
        
        // Prevent double submission
        if (submitButton.disabled) {
            return;
        }
        
        const originalText = submitButton.innerHTML;
        showButtonLoading(submitButton, 'Updating...');
        
        const newAmount = Number(document.getElementById('editPaymentAmount').value) || 0;
        const paymentMethod = document.getElementById('editPaymentMethod').value;
        const date = document.getElementById('editPaymentDate').value;
        const referenceNumber = document.getElementById('editPaymentReference').value.trim();
        
        if (!newAmount || !paymentMethod || !date) {
            hideButtonLoading(submitButton, originalText);
            showError('Amount, Payment Method, and Date are required');
            return;
        }
        
        if (newAmount <= 0) {
            hideButtonLoading(submitButton, originalText);
            showError('Amount must be greater than zero');
            return;
        }
        
        if (newAmount > maxAllowed) {
            hideButtonLoading(submitButton, originalText);
            showError('Amount exceeds maximum allowed (' + formatCurrency(maxAllowed) + ')');
            return;
        }
        
        const paymentData = {
            paymentId: payment['Payment ID'],
            invoiceNo: payment['Invoice No'],
            amount: newAmount,
            paymentMethod: paymentMethod,
            date: date,
            referenceNumber: referenceNumber,
            recordedBy: userFullName,
            userId: userId,
            fullName: userFullName
        };
        
        const result = await fetchData('updatePayment', paymentData);
        
        hideButtonLoading(submitButton, originalText);
        
        if (result.success) {
            showSuccess(result.message);
            closeModal('editPaymentModal');
            await refreshDataAfterSave();
            loadPaymentsTable();
            loadInvoicesTable();
            loadDashboardStats();
        } else {
            showError(result.message);
        }
    });
}

// ============================================
// DELETE PAYMENT
// ============================================
async function deletePayment(paymentId) {
    if (!isAdmin()) {
        showError('Only Admin can delete payments.');
        return;
    }
    
    if (!confirmAction('Are you sure you want to delete this payment? This will restore the amount to the invoice balance.')) {
        return;
    }
    
    const result = await fetchData('deletePayment', {
        paymentId: paymentId,
        userId: userId,
        fullName: userFullName
    });
    
    if (result.success) {
        showSuccess(result.message);
        await refreshDataAfterSave();
        loadPaymentsTable();
        loadInvoicesTable();
        loadDashboardStats();
    } else {
        showError(result.message);
    }
}

// ============================================
// SEARCH PAYMENT INVOICE
// ============================================
function searchPaymentInvoice() {
    const searchInput = document.getElementById('paymentSearch');
    const select = document.getElementById('paymentInvoice');
    
    if (!searchInput || !select) {
        return;
    }
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    const options = select.options;
    
    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        
        // Skip placeholder option
        if (option.value === '') {
            continue;
        }
        
        const text = option.text.toLowerCase();
        const value = option.value.toLowerCase();
        
        if (!searchTerm || text.includes(searchTerm) || value.includes(searchTerm)) {
            option.style.display = '';
        } else {
            option.style.display = 'none';
        }
    }
}

// ============================================
// UPDATE PAYMENT INVOICE INFO
// ============================================
function updatePaymentInvoiceInfo() {
    const select = document.getElementById('paymentInvoice');
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption && selectedOption.value) {
        const customer = selectedOption.getAttribute('data-customer') || '';
        const balance = Number(selectedOption.getAttribute('data-balance')) || 0;
        const total = Number(selectedOption.getAttribute('data-total')) || 0;
        const invoiceNo = selectedOption.value;
        const currentStatus = selectedOption.getAttribute('data-status') || 'Pending';
        const paid = total - balance;
        const percentPaid = total > 0 ? Math.round((paid / total) * 100) : 0;
        
        // Show invoice summary
        const summaryContainer = document.getElementById('paymentSummaryContainer');
        if (summaryContainer) {
            summaryContainer.innerHTML = `
                <div style="margin-top: 15px; padding: 20px; background: #f8f8f8; border-radius: 10px; border: 1px solid #e0e0e0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="font-size: 14px; font-weight: 600; color: #333;">Customer:</span>
                        <span style="font-size: 14px; font-weight: 700; color: #000;">${escapeHtml(customer)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="font-size: 14px; font-weight: 600; color: #333;">Total Amount:</span>
                        <span style="font-size: 14px; font-weight: 700; color: #000;">${formatCurrency(total)} Tsh</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="font-size: 14px; font-weight: 600; color: #28a745;">Amount Paid:</span>
                        <span style="font-size: 14px; font-weight: 700; color: #28a745;">${formatCurrency(paid)} Tsh</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                        <span style="font-size: 14px; font-weight: 600; color: #dc3545;">Balance Remaining:</span>
                        <span style="font-size: 14px; font-weight: 700; color: #dc3545;">${formatCurrency(balance)} Tsh</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 12px; font-weight: 600; color: #666;">Payment Progress</span>
                        <span style="font-size: 12px; font-weight: 700; color: #28a745;">${percentPaid}% Paid</span>
                    </div>
                    <div style="width: 100%; height: 12px; background: #e0e0e0; border-radius: 6px; overflow: hidden;">
                        <div style="width: ${percentPaid}%; height: 100%; background: linear-gradient(90deg, #28a745, #20c997); border-radius: 6px; transition: width 0.5s ease;"></div>
                    </div>
                    <div style="margin-top: 10px; text-align: center;">
                        <span class="status-badge ${getStatusBadgeClass(currentStatus)}">${escapeHtml(currentStatus)}</span>
                    </div>
                </div>
            `;
        }
        
        // Show payment history
        showPaymentHistory(invoiceNo);
        
        const amountInput = document.getElementById('paymentAmount');
        if (amountInput) {
            amountInput.placeholder = 'Enter amount (Max: ' + formatCurrency(balance) + ' Tsh)';
            amountInput.max = balance;
        }
        
        // Clear preview
        updatePaymentPreview();
    }
}

// ============================================
// UPDATE PAYMENT PREVIEW
// ============================================
function updatePaymentPreview() {
    const previewContainer = document.getElementById('paymentPreviewContainer');
    const select = document.getElementById('paymentInvoice');
    const amountInput = document.getElementById('paymentAmount');
    
    if (!previewContainer || !select || !amountInput) return;
    
    const selectedOption = select.options[select.selectedIndex];
    const amount = Number(amountInput.value) || 0;
    
    if (!selectedOption || !selectedOption.value || amount <= 0) {
        previewContainer.innerHTML = '';
        return;
    }
    
    const balance = Number(selectedOption.getAttribute('data-balance')) || 0;
    
    // Check kama amount exceeds balance
    if (amount > balance) {
        previewContainer.innerHTML = `
            <div style="margin-top: 15px; padding: 15px; background: #f8d7da; border-radius: 8px; border: 1px solid #dc3545;">
                <strong style="color: #dc3545;">⚠️ Warning: Amount exceeds balance!</strong>
                <p style="margin: 5px 0 0; font-size: 13px;">Maximum amount allowed: ${formatCurrency(balance)} Tsh</p>
            </div>
        `;
        return;
    }
    
    const total = Number(selectedOption.getAttribute('data-total')) || 0;
    const paid = total - balance;
    const newBalance = balance - amount;
    const newTotalPaid = paid + amount;
    const newPercentPaid = total > 0 ? Math.round((newTotalPaid / total) * 100) : 0;
    
    let statusAfterPayment = '';
    let statusColor = '';
    
    if (newBalance <= 0) {
        statusAfterPayment = 'Completed';
        statusColor = '#28a745';
    } else {
        statusAfterPayment = 'In Progress';
        statusColor = '#0a6c6c';
    }
    
    previewContainer.innerHTML = `
        <div style="margin-top: 15px; padding: 15px; background: #fff8e7; border-radius: 8px; border: 1px solid #DAA520;">
            <strong style="font-size: 14px;">Payment Preview</strong>
            <div style="margin-top: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span style="font-size: 13px;">New Balance After Payment:</span>
                    <span style="font-size: 13px; font-weight: 700; color: #dc3545;">${formatCurrency(newBalance)} Tsh</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span style="font-size: 13px;">New Total Paid:</span>
                    <span style="font-size: 13px; font-weight: 700; color: #28a745;">${formatCurrency(newTotalPaid)} Tsh</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span style="font-size: 13px;">New Progress:</span>
                    <span style="font-size: 13px; font-weight: 700; color: #28a745;">${newPercentPaid}%</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="font-size: 13px;">Status After Payment:</span>
                    <span style="font-size: 13px; font-weight: 700; color: ${statusColor};">${statusAfterPayment}</span>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// SHOW PAYMENT HISTORY FOR INVOICE
// ============================================
function showPaymentHistory(invoiceNo) {
    const historyContainer = document.getElementById('paymentHistoryContainer');
    
    if (!historyContainer) return;
    
    const invoicePayments = (allSystemData.payments || []).filter(p => p['Invoice No'] === invoiceNo);
    
    if (invoicePayments.length === 0) {
        historyContainer.innerHTML = '';
        return;
    }
    
    // Sort by date (oldest first)
    invoicePayments.sort((a, b) => {
        const dateA = (a['Date'] || '').toString();
        const dateB = (b['Date'] || '').toString();
        return dateA.localeCompare(dateB);
    });
    
    let historyHTML = `
        <div style="margin-top: 15px; padding: 15px; background: #fff8e7; border-radius: 8px; border: 1px solid #DAA520;">
            <strong style="font-size: 14px; color: #000;">Payment History (${invoicePayments.length} payments)</strong>
            <div style="margin-top: 10px;">
    `;
    
    invoicePayments.forEach(payment => {
        historyHTML += `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                <span style="font-size: 13px;">${formatDate(payment['Date'])} - ${escapeHtml(payment['Payment Method'] || '-')}</span>
                <span style="font-size: 13px; font-weight: 700; color: #28a745;">${formatCurrency(payment['Amount (Tsh)'])} Tsh</span>
            </div>
        `;
    });
    
    historyHTML += `
            </div>
        </div>
    `;
    
    historyContainer.innerHTML = historyHTML;
}