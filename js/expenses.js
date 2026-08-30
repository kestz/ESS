// ============================================
// KASHOMBA ELECTRICAL SYSTEM - EXPENSES LOGIC v13
// TOTAL PROJECT + DISCOUNT + LABOUR CHARGES + FAIDA
// ============================================

function loadExpensesTable() {
    const tbody = document.getElementById('expensesTableBody');
    
    if (!tbody) return;
    
    const invoices = allSystemData.invoices || [];
    const expenses = allSystemData.expenses || [];
    const today = new Date();
    
    if (invoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No invoices found</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    const processedInvoices = new Set();
    
    invoices.forEach(invoice => {
        if (processedInvoices.has(invoice['Invoice No'])) {
            return;
        }
        
        const invoiceExpenses = expenses.filter(e => e['Invoice No'] === invoice['Invoice No']);
        
        if (invoiceExpenses.length === 0) {
            return;
        }
        
        processedInvoices.add(invoice['Invoice No']);
        
        const totalExpenses = invoiceExpenses.reduce((sum, e) => {
            return sum + (Number(e['Amount (Tsh)']) || 0);
        }, 0);
        
        const categories = [...new Set(invoiceExpenses.map(e => e['Category']))].join(', ');
        
        const lastExpenseDate = invoiceExpenses.reduce((latest, e) => {
            const expDate = new Date(e['Date']);
            return expDate > latest ? expDate : latest;
        }, new Date(0));
        
        const daysSinceLastExpense = Math.floor((today - lastExpenseDate) / (1000 * 60 * 60 * 24));
        const canEdit = isAdmin() || daysSinceLastExpense <= 3;
        
        const editButton = canEdit 
            ? `<button class="btn btn-primary btn-sm" onclick="openExpenseModal('${escapeHtml(invoice['Invoice No'])}')">Edit</button>`
            : `<button class="btn btn-primary btn-sm" disabled style="opacity: 0.5;">Edit (Expired)</button>`;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${escapeHtml(invoice['Invoice No'])}</strong></td>
            <td>${escapeHtml(invoice['Customer Name'] || '-')}</td>
            <td>${formatDate(invoice['Date'])}</td>
            <td>${categories || '-'}</td>
            <td style="font-weight: 700; color: #dc3545;">${formatCurrency(totalExpenses)}</td>
            <td>
                <button class="btn btn-black btn-sm" onclick="viewInvoiceExpenses('${escapeHtml(invoice['Invoice No'])}')">View</button>
                ${editButton}
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    if (tbody.innerHTML === '') {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No expenses recorded yet</td></tr>';
    }
}

// ============================================
// VIEW INVOICE EXPENSES - TOTAL + DISCOUNT + LABOUR + FAIDA
// ============================================
function viewInvoiceExpenses(invoiceNo) {
    const invoice = allSystemData.invoices.find(inv => inv['Invoice No'] === invoiceNo);
    const expenses = allSystemData.expenses.filter(e => e['Invoice No'] === invoiceNo);
    const payments = allSystemData.payments.filter(p => p['Invoice No'] === invoiceNo);
    
    if (!invoice) {
        showError('Invoice not found');
        return;
    }
    
    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e['Amount (Tsh)']) || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + (Number(p['Amount (Tsh)']) || 0), 0);
    const totalCharges = Number(invoice['Total Charges']) || 0;
    const labourCharges = Number(invoice['Labour Charges']) || 0;
    const discount = Number(invoice['Discount (%)']) || 0;
    const discountAmount = labourCharges * discount / 100;
    const labourHalisi = labourCharges - discountAmount;
    const profit = labourHalisi - totalExpenses;
    const profitColor = profit >= 0 ? '#28a745' : '#dc3545';
    const profitIcon = profit >= 0 ? '🟢' : '🔴';
    const profitLabel = profit >= 0 ? 'FAIDA' : 'HASARA';
    
    const printButton = isAdmin() 
        ? `<button class="btn btn-gold btn-block" onclick="printFullReport()">Print / PDF</button>`
        : `<div class="alert alert-warning" style="margin-top: 10px;">Admin only can print or download this report.</div>`;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'viewInvoiceExpensesModal';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header">
                <span class="modal-title">Invoice Expenses - ${escapeHtml(invoiceNo)}</span>
                <button class="modal-close" onclick="closeModal('viewInvoiceExpensesModal')">&times;</button>
            </div>
            
            <div class="card" style="box-shadow: none; background: #f8f8f8; border: 2px solid #DAA520;">
                <h3 style="color: #000; margin-bottom: 15px; text-align: center;">PROJECT SUMMARY</h3>
                <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px;">
                    <div style="text-align: center;">
                        <p style="font-size: 12px; color: #666;">TOTAL PROJECT</p>
                        <p style="font-size: 18px; font-weight: 800; color: #000;">${formatCurrency(totalCharges)} Tsh</p>
                    </div>
                    <div style="text-align: center;">
                        <p style="font-size: 12px; color: #666;">DISCOUNT (${discount}%)</p>
                        <p style="font-size: 18px; font-weight: 800; color: #DAA520;">-${formatCurrency(discountAmount)} Tsh</p>
                    </div>
                    <div style="text-align: center;">
                        <p style="font-size: 12px; color: #666;">LABOUR CHARGES</p>
                        <p style="font-size: 18px; font-weight: 800; color: #0a6c6c;">${formatCurrency(labourHalisi)} Tsh</p>
                    </div>
                    <div style="text-align: center;">
                        <p style="font-size: 12px; color: #666;">TOTAL EXPENSES</p>
                        <p style="font-size: 18px; font-weight: 800; color: #dc3545;">${formatCurrency(totalExpenses)} Tsh</p>
                    </div>
                </div>
                <div style="margin-top: 15px; text-align: center; padding: 10px; background: ${profit >= 0 ? '#d4edda' : '#f8d7da'}; border-radius: 8px;">
                    <p style="font-size: 12px; color: #666; margin: 0;">${profitLabel}</p>
                    <p style="font-size: 24px; font-weight: 800; color: ${profitColor}; margin: 5px 0;">${profitIcon} ${formatCurrency(Math.abs(profit))} Tsh</p>
                </div>
            </div>
            
            <div class="card" style="box-shadow: none;">
                <div class="card-header">
                    <span class="card-title">All Expenses (${expenses.length})</span>
                    <button class="btn btn-gold btn-sm" onclick="closeModal('viewInvoiceExpensesModal'); openExpenseModal('${escapeHtml(invoiceNo)}')">+ Add More</button>
                </div>
                
                ${expenses.length > 0 ? `
                <div class="table-wrapper">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Payee / Staff</th>
                                <th>Date</th>
                                <th>Amount (Tsh)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${expenses.map(expense => `
                                <tr>
                                    <td><strong>${escapeHtml(expense['Category'] || '-')}</strong></td>
                                    <td>${escapeHtml(expense['Payee / Staff Name'] || '-')}</td>
                                    <td>${formatDate(expense['Date'])}</td>
                                    <td style="font-weight: 700;">${formatCurrency(expense['Amount (Tsh)'])}</td>
                                </tr>
                            `).join('')}
                            <tr style="background: #f1f1f1; font-weight: 700;">
                                <td colspan="3" style="text-align: right;">TOTAL EXPENSES:</td>
                                <td style="color: #dc3545;">${formatCurrency(totalExpenses)} Tsh</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                ` : `
                <p class="text-center" style="color: #999;">No expenses recorded for this invoice yet.</p>
                `}
            </div>
            
            ${payments.length > 0 ? `
            <div class="card" style="box-shadow: none;">
                <h3 style="color: #0a6c6c; margin-bottom: 15px;">Payments (${payments.length})</h3>
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
            
            ${printButton}
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ============================================
// OPEN EXPENSE MODAL
// ============================================
function openExpenseModal(preselectedInvoiceNo = null) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'expenseModal';
    
    const invoices = allSystemData.invoices || [];
    const expenses = allSystemData.expenses || [];
    const today = new Date();
    
    const availableInvoices = invoices.filter(invoice => {
        const invoiceExpenses = expenses.filter(e => e['Invoice No'] === invoice['Invoice No']);
        
        if (invoiceExpenses.length === 0) {
            return true;
        }
        
        if (isAdmin()) {
            return true;
        }
        
        const lastExpenseDate = invoiceExpenses.reduce((latest, e) => {
            const expDate = new Date(e['Date']);
            return expDate > latest ? expDate : latest;
        }, new Date(0));
        
        const daysSinceLastExpense = Math.floor((today - lastExpenseDate) / (1000 * 60 * 60 * 24));
        
        return daysSinceLastExpense <= 3;
    });
    
    const invoiceOptions = availableInvoices.map(invoice => {
        const customer = (allSystemData.customers || []).find(c => c['Customer Name'] === invoice['Customer Name']);
        const phone = customer ? customer['Phone Number'] : '';
        const selected = preselectedInvoiceNo && preselectedInvoiceNo === invoice['Invoice No'] ? 'selected' : '';
        return `<option value="${escapeHtml(invoice['Invoice No'])}" data-customer="${escapeHtml(invoice['Customer Name'])}" data-phone="${escapeHtml(phone)}" ${selected}>${escapeHtml(invoice['Invoice No'])} - ${escapeHtml(invoice['Customer Name'])} (${escapeHtml(phone)})</option>`;
    }).join('');
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <span class="modal-title">Add New Expense</span>
                <button class="modal-close" onclick="closeModal('expenseModal')">&times;</button>
            </div>
            
            <form id="expenseForm">
                <div class="form-group">
                    <label>Select Invoice *</label>
                    <select id="expenseInvoice" class="form-control" required onchange="updateExpenseInvoiceInfo()">
                        <option value="">-- Select Invoice --</option>
                        ${invoiceOptions}
                    </select>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Customer</label>
                        <input type="text" id="expenseCustomerInfo" class="form-control" readonly>
                    </div>
                    <div class="form-group">
                        <label>Customer Phone</label>
                        <input type="text" id="expensePhoneInfo" class="form-control" readonly>
                    </div>
                </div>
                
                <hr class="mb-20">
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Category *</label>
                        <select id="expenseCategory" class="form-control" required onchange="toggleCategoryFields()" ${preselectedInvoiceNo ? '' : 'disabled'}>
                            <option value="">-- Select Category --</option>
                            ${(EXPENSE_CATEGORIES || ['Staff Salary', 'Transport', 'Food', 'Emergency', 'Materials', 'Equipment', 'Other']).map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Date *</label>
                        <input type="date" id="expenseDate" class="form-control" value="${getTodayDate()}" required>
                    </div>
                </div>
                
                <div id="dynamicFieldsContainer"></div>
                
                <div class="form-group">
                    <label>Amount (Tsh) *</label>
                    <input type="number" id="expenseAmount" class="form-control" placeholder="Enter amount" required>
                </div>
                
                <div class="form-group">
                    <label>Description / Activity</label>
                    <textarea id="expenseDescription" class="form-control" placeholder="Describe the expense or activity"></textarea>
                </div>
                
                <div id="expenseSuccessMessage" style="display: none;"></div>
                
                <button type="submit" class="btn btn-primary btn-block" id="saveExpenseBtn">Save Expense</button>
                
                <button type="button" class="btn btn-gold btn-block mt-10" id="addAnotherBtn" style="display: none;" onclick="resetExpenseForm()">
                    + Add Another Expense
                </button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    if (preselectedInvoiceNo) {
        updateExpenseInvoiceInfo();
    }
    
    document.getElementById('expenseForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('#saveExpenseBtn');
        
        if (submitButton.disabled) {
            return;
        }
        
        const originalText = submitButton.innerHTML;
        showButtonLoading(submitButton, 'Saving...');
        
        const category = document.getElementById('expenseCategory').value;
        let amount = Number(document.getElementById('expenseAmount').value) || 0;
        let payeeName = '';
        let daysWorked = 0;
        let dailyRate = 0;
        
        if (category === 'Staff Salary') {
            const staffNameInput = document.getElementById('dynamicStaffName');
            daysWorked = Number(document.getElementById('dynamicDaysWorked').value) || 0;
            dailyRate = Number(document.getElementById('dynamicDailyRate').value) || 0;
            
            if (staffNameInput && staffNameInput.value) {
                payeeName = staffNameInput.value.trim();
            }
            
            if (daysWorked > 0 && dailyRate > 0) {
                amount = daysWorked * dailyRate;
                document.getElementById('expenseAmount').value = amount;
            }
        } else if (category === 'Transport') {
            payeeName = 'Transport';
        } else if (category === 'Materials') {
            const itemDesc = document.getElementById('dynamicItemDesc') ? document.getElementById('dynamicItemDesc').value : '';
            payeeName = itemDesc || 'Materials';
            
            const qty = Number(document.getElementById('dynamicQuantity').value) || 0;
            const unitPrice = Number(document.getElementById('dynamicUnitPrice').value) || 0;
            
            if (qty > 0 && unitPrice > 0) {
                amount = qty * unitPrice;
                document.getElementById('expenseAmount').value = amount;
            }
        } else if (category === 'Food') {
            payeeName = 'Food';
        } else if (category === 'Emergency') {
            payeeName = 'Emergency';
        } else if (category === 'Other') {
            payeeName = document.getElementById('expenseDescription').value.trim() || 'Other';
        }
        
        const expenseData = {
            invoiceNo: document.getElementById('expenseInvoice').value,
            date: document.getElementById('expenseDate').value,
            category: category,
            payeeName: payeeName,
            daysWorked: daysWorked,
            dailyRate: dailyRate,
            amount: amount,
            description: document.getElementById('expenseDescription').value.trim(),
            status: 'Completed',
            userId: userId,
            fullName: userFullName
        };
        
        if (!expenseData.invoiceNo) {
            hideButtonLoading(submitButton, originalText);
            showError('Invoice No is required');
            return;
        }
        
        if (!expenseData.category || !expenseData.amount) {
            hideButtonLoading(submitButton, originalText);
            showError('Category and Amount are required');
            return;
        }
        
        const result = await fetchData('addExpense', expenseData);
        
        hideButtonLoading(submitButton, originalText);
        
        if (result.success) {
            const successMsg = document.getElementById('expenseSuccessMessage');
            if (successMsg) {
                successMsg.style.display = 'block';
                successMsg.innerHTML = `
                    <div class="alert alert-success" style="margin-bottom: 10px;">
                        ${result.message}
                    </div>
                `;
            }
            
            const addAnotherBtn = document.getElementById('addAnotherBtn');
            if (addAnotherBtn) {
                addAnotherBtn.style.display = 'block';
            }
            
            submitButton.style.display = 'none';
            
            await refreshDataAfterSave();
            loadExpensesTable();
            loadDashboardStats();
        } else {
            showError(result.message);
        }
    });
}

// ============================================
// RESET EXPENSE FORM
// ============================================
function resetExpenseForm() {
    document.getElementById('expenseCategory').value = '';
    document.getElementById('expenseCategory').disabled = false;
    document.getElementById('dynamicFieldsContainer').innerHTML = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseDescription').value = '';
    document.getElementById('expenseSuccessMessage').style.display = 'none';
    document.getElementById('addAnotherBtn').style.display = 'none';
    document.getElementById('saveExpenseBtn').style.display = 'block';
}

// ============================================
// UPDATE EXPENSE INVOICE INFO
// ============================================
function updateExpenseInvoiceInfo() {
    const select = document.getElementById('expenseInvoice');
    const selectedOption = select.options[select.selectedIndex];
    const categorySelect = document.getElementById('expenseCategory');
    
    if (selectedOption && selectedOption.value) {
        const customer = selectedOption.getAttribute('data-customer') || '';
        const phone = selectedOption.getAttribute('data-phone') || '';
        
        document.getElementById('expenseCustomerInfo').value = customer;
        document.getElementById('expensePhoneInfo').value = phone;
        categorySelect.disabled = false;
    } else {
        document.getElementById('expenseCustomerInfo').value = '';
        document.getElementById('expensePhoneInfo').value = '';
        categorySelect.disabled = true;
        categorySelect.value = '';
        document.getElementById('dynamicFieldsContainer').innerHTML = '';
    }
}

// ============================================
// TOGGLE CATEGORY FIELDS
// ============================================
function toggleCategoryFields() {
    const category = document.getElementById('expenseCategory').value;
    const container = document.getElementById('dynamicFieldsContainer');
    
    if (!container) return;
    
    switch(category) {
        case 'Staff Salary':
            container.innerHTML = `
                <h4 class="mb-10">Staff Salary Details</h4>
                <div class="form-group">
                    <label>Staff Name *</label>
                    <input type="text" id="dynamicStaffName" class="form-control" placeholder="Enter staff name">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Days Worked *</label>
                        <input type="number" id="dynamicDaysWorked" class="form-control" min="0" value="0" oninput="calculateDynamicAmount()">
                    </div>
                    <div class="form-group">
                        <label>Daily Rate (Tsh) *</label>
                        <input type="number" id="dynamicDailyRate" class="form-control" min="0" value="0" oninput="calculateDynamicAmount()">
                    </div>
                </div>
            `;
            break;
            
        case 'Materials':
            container.innerHTML = `
                <h4 class="mb-10">Materials Details</h4>
                <div class="form-group">
                    <label>Item Description</label>
                    <input type="text" id="dynamicItemDesc" class="form-control" placeholder="e.g. Tronic cable 2.5mm">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Quantity *</label>
                        <input type="number" id="dynamicQuantity" class="form-control" min="0" value="0" oninput="calculateDynamicAmount()">
                    </div>
                    <div class="form-group">
                        <label>Unit Price (Tsh) *</label>
                        <input type="number" id="dynamicUnitPrice" class="form-control" min="0" value="0" oninput="calculateDynamicAmount()">
                    </div>
                </div>
            `;
            break;
            
        case 'Transport':
            container.innerHTML = `
                <h4 class="mb-10">Transport Details</h4>
                <div class="form-group">
                    <label>Total Transport Cost (Tsh)</label>
                    <input type="number" id="dynamicTransportAmount" class="form-control" placeholder="Enter total transport amount" oninput="fillAmountFromField(this)">
                </div>
            `;
            break;
            
        case 'Food':
            container.innerHTML = `
                <h4 class="mb-10">Food Details</h4>
                <div class="form-group">
                    <label>Total Food Cost (Tsh)</label>
                    <input type="number" id="dynamicFoodAmount" class="form-control" placeholder="Enter total food amount" oninput="fillAmountFromField(this)">
                </div>
            `;
            break;
            
        case 'Emergency':
            container.innerHTML = `
                <h4 class="mb-10">Emergency Details</h4>
                <div class="form-group">
                    <label>Emergency Amount (Tsh)</label>
                    <input type="number" id="dynamicEmergencyAmount" class="form-control" placeholder="Enter emergency amount" oninput="fillAmountFromField(this)">
                </div>
            `;
            break;
            
        case 'Other':
            container.innerHTML = `
                <h4 class="mb-10">Other Details</h4>
                <div class="form-group">
                    <label>Amount (Tsh)</label>
                    <input type="number" id="dynamicOtherAmount" class="form-control" placeholder="Enter amount" oninput="fillAmountFromField(this)">
                </div>
            `;
            break;
            
        default:
            container.innerHTML = '';
            break;
    }
}

// ============================================
// FILL AMOUNT FROM DYNAMIC FIELD
// ============================================
function fillAmountFromField(input) {
    const amountInput = document.getElementById('expenseAmount');
    if (amountInput && input.value) {
        amountInput.value = input.value;
    }
}

// ============================================
// CALCULATE DYNAMIC AMOUNT
// ============================================
function calculateDynamicAmount() {
    const category = document.getElementById('expenseCategory').value;
    const amountInput = document.getElementById('expenseAmount');
    
    if (category === 'Staff Salary') {
        const daysWorked = Number(document.getElementById('dynamicDaysWorked').value) || 0;
        const dailyRate = Number(document.getElementById('dynamicDailyRate').value) || 0;
        const total = daysWorked * dailyRate;
        amountInput.value = total;
    } else if (category === 'Materials') {
        const qty = Number(document.getElementById('dynamicQuantity').value) || 0;
        const unitPrice = Number(document.getElementById('dynamicUnitPrice').value) || 0;
        const total = qty * unitPrice;
        amountInput.value = total;
    }
}