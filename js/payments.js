// ============================================
// KASHOMBA ELECTRICAL SYSTEM - PAYMENTS LOGIC v2
// ============================================

// ============================================
// LOAD PAYMENTS TABLE
// ============================================
function loadPaymentsTable() {
    const tbody = document.getElementById('paymentsTableBody');
    
    if (!tbody) {
        return;
    }
    
    const payments = allSystemData.payments;
    
    if (payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No payments found</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    payments.forEach(payment => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><strong>${payment['Payment ID']}</strong></td>
            <td>${payment['Invoice No'] || '-'}</td>
            <td>${formatCurrency(payment['Amount (Tsh)'])}</td>
            <td>${formatDate(payment['Date'])}</td>
            <td>${payment['Payment Method'] || '-'}</td>
            <td>${payment['Recorded By'] || '-'}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// ============================================
// OPEN PAYMENT MODAL
// ============================================
function openPaymentModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'paymentModal';
    
    // Get invoices that are not Completed
    const activeInvoices = allSystemData.invoices.filter(inv => inv['Status'] !== 'Completed' && (Number(inv['Balance']) || 0) > 0);
    
    const invoiceOptions = activeInvoices.map(invoice => {
        const customer = allSystemData.customers.find(c => c['Customer Name'] === invoice['Customer Name']);
        const phone = customer ? customer['Phone Number'] : '';
        return `<option value="${invoice['Invoice No']}" data-customer="${invoice['Customer Name']}" data-phone="${phone}" data-balance="${invoice['Balance']}" data-total="${invoice['Total Charges']}">${invoice['Invoice No']} - ${invoice['Customer Name']} (${phone})</option>`;
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
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Customer</label>
                        <input type="text" id="paymentCustomerInfo" class="form-control" readonly>
                    </div>
                    <div class="form-group">
                        <label>Balance (Tsh)</label>
                        <input type="text" id="paymentBalanceInfo" class="form-control" readonly>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Amount (Tsh) *</label>
                        <input type="number" id="paymentAmount" class="form-control" placeholder="Enter amount" required>
                    </div>
                    <div class="form-group">
                        <label>Payment Method *</label>
                        <select id="paymentMethod" class="form-control" required>
                            <option value="">-- Select Method --</option>
                            ${PAYMENT_METHODS.map(method => `<option value="${method}">${method}</option>`).join('')}
                        </select>
                    </div>
                </div>
                
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
                
                <button type="submit" class="btn btn-primary btn-block">Record Payment</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    document.getElementById('paymentForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
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
        
        // Validate
        if (!paymentData.invoiceNo || !paymentData.amount || !paymentData.paymentMethod) {
            showError('Invoice, Amount, and Payment Method are required');
            return;
        }
        
        // Check kama amount inazidi balance
        const selectedInvoice = allSystemData.invoices.find(inv => inv['Invoice No'] === paymentData.invoiceNo);
        if (selectedInvoice) {
            const balance = Number(selectedInvoice['Balance']) || 0;
            if (paymentData.amount > balance) {
                showError('Payment amount (' + formatCurrency(paymentData.amount) + ') exceeds invoice balance (' + formatCurrency(balance) + ')');
                return;
            }
        }
        
        const result = await fetchData('addPayment', paymentData);
        
        if (result.success) {
            showSuccess(result.message);
            closeModal('paymentModal');
            await loadAllSystemData();
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
// SEARCH PAYMENT INVOICE
// ============================================
function searchPaymentInvoice() {
    const searchTerm = document.getElementById('paymentSearch').value.toLowerCase().trim();
    const select = document.getElementById('paymentInvoice');
    
    if (!select) {
        return;
    }
    
    const options = select.options;
    
    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const text = option.text.toLowerCase();
        const value = option.value.toLowerCase();
        
        if (text.includes(searchTerm) || value.includes(searchTerm)) {
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
        const balance = selectedOption.getAttribute('data-balance') || '0';
        
        document.getElementById('paymentCustomerInfo').value = customer;
        document.getElementById('paymentBalanceInfo').value = formatCurrency(balance) + ' Tsh';
        
        const amountInput = document.getElementById('paymentAmount');
        amountInput.placeholder = 'Enter amount (Max: ' + formatCurrency(balance) + ' Tsh)';
        amountInput.max = balance;
    }
}