// ============================================
// KASHOMBA ELECTRICAL SYSTEM - EXPENSES LOGIC v2
// ============================================

// ============================================
// LOAD EXPENSES TABLE
// ============================================
function loadExpensesTable() {
    const tbody = document.getElementById('expensesTableBody');
    
    if (!tbody) {
        return;
    }
    
    const expenses = allSystemData.expenses;
    
    if (expenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No expenses found</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    expenses.forEach(expense => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><strong>${expense['Expense ID']}</strong></td>
            <td>${expense['Invoice No'] || '-'}</td>
            <td>${formatDate(expense['Date'])}</td>
            <td>${expense['Category'] || '-'}</td>
            <td>${expense['Payee / Staff Name'] || '-'}</td>
            <td>${formatCurrency(expense['Amount (Tsh)'])}</td>
            <td><span class="status-badge ${getStatusBadgeClass(expense['Status'])}">${expense['Status'] || 'Pending'}</span></td>
        `;
        
        tbody.appendChild(row);
    });
}

// ============================================
// OPEN EXPENSE MODAL
// ============================================
function openExpenseModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'expenseModal';
    
    // Get all invoices for dropdown
    const invoices = allSystemData.invoices;
    
    const invoiceOptions = invoices.map(invoice => {
        const customer = allSystemData.customers.find(c => c['Customer Name'] === invoice['Customer Name']);
        const phone = customer ? customer['Phone Number'] : '';
        return `<option value="${invoice['Invoice No']}" data-customer="${invoice['Customer Name']}" data-phone="${phone}">${invoice['Invoice No']} - ${invoice['Customer Name']} (${phone})</option>`;
    }).join('');
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <span class="modal-title">Add New Expense</span>
                <button class="modal-close" onclick="closeModal('expenseModal')">&times;</button>
            </div>
            
            <form id="expenseForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Category *</label>
                        <select id="expenseCategory" class="form-control" required onchange="toggleSalaryFields()">
                            <option value="">-- Select Category --</option>
                            ${EXPENSE_CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Date *</label>
                        <input type="date" id="expenseDate" class="form-control" value="${getTodayDate()}" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Search Invoice</label>
                    <input type="text" id="expenseSearch" class="form-control" placeholder="Search by Invoice No, Customer Name, or Phone..." onkeyup="searchExpenseInvoice()">
                </div>
                
                <div class="form-group">
                    <label>Invoice No (Optional)</label>
                    <select id="expenseInvoice" class="form-control" onchange="updateExpenseInvoiceInfo()">
                        <option value="">-- No Invoice / General Expense --</option>
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
                
                <div class="form-group">
                    <label>Payee / Staff Name *</label>
                    <input type="text" id="expensePayee" class="form-control" placeholder="Enter name of payee or staff" required>
                </div>
                
                <div class="form-row" id="salaryFields" style="display: none;">
                    <div class="form-group">
                        <label>Days Worked</label>
                        <input type="number" id="expenseDaysWorked" class="form-control" min="0" value="0" oninput="calculateExpenseAmount()">
                    </div>
                    <div class="form-group">
                        <label>Daily Rate (Tsh)</label>
                        <input type="number" id="expenseDailyRate" class="form-control" min="0" value="0" oninput="calculateExpenseAmount()">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Amount (Tsh) *</label>
                    <input type="number" id="expenseAmount" class="form-control" placeholder="Enter amount" required>
                </div>
                
                <div class="form-group">
                    <label>Description / Activity</label>
                    <textarea id="expenseDescription" class="form-control" placeholder="Describe the expense or activity"></textarea>
                </div>
                
                <div class="form-group">
                    <label>Status</label>
                    <select id="expenseStatus" class="form-control">
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
                
                <button type="submit" class="btn btn-primary btn-block">Save Expense</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    document.getElementById('expenseForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const category = document.getElementById('expenseCategory').value;
        const daysWorked = Number(document.getElementById('expenseDaysWorked').value) || 0;
        const dailyRate = Number(document.getElementById('expenseDailyRate').value) || 0;
        let amount = Number(document.getElementById('expenseAmount').value) || 0;
        
        // If salary category with days and rate, calculate amount
        if (category === 'Staff Salary' && daysWorked > 0 && dailyRate > 0) {
            amount = daysWorked * dailyRate;
        }
        
        const expenseData = {
            invoiceNo: document.getElementById('expenseInvoice').value,
            date: document.getElementById('expenseDate').value,
            category: category,
            payeeName: document.getElementById('expensePayee').value.trim(),
            daysWorked: daysWorked,
            dailyRate: dailyRate,
            amount: amount,
            description: document.getElementById('expenseDescription').value.trim(),
            status: document.getElementById('expenseStatus').value,
            userId: userId,
            fullName: userFullName
        };
        
        // Validate
        if (!expenseData.category || !expenseData.payeeName || !expenseData.amount) {
            showError('Category, Payee Name, and Amount are required');
            return;
        }
        
        const result = await fetchData('addExpense', expenseData);
        
        if (result.success) {
            showSuccess(result.message);
            closeModal('expenseModal');
            await loadAllSystemData();
            loadExpensesTable();
            loadDashboardStats();
        } else {
            showError(result.message);
        }
    });
}

// ============================================
// SEARCH EXPENSE INVOICE
// ============================================
function searchExpenseInvoice() {
    const searchTerm = document.getElementById('expenseSearch').value.toLowerCase().trim();
    const select = document.getElementById('expenseInvoice');
    
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
// UPDATE EXPENSE INVOICE INFO
// ============================================
function updateExpenseInvoiceInfo() {
    const select = document.getElementById('expenseInvoice');
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption && selectedOption.value) {
        const customer = selectedOption.getAttribute('data-customer') || '';
        const phone = selectedOption.getAttribute('data-phone') || '';
        
        document.getElementById('expenseCustomerInfo').value = customer;
        document.getElementById('expensePhoneInfo').value = phone;
    } else {
        document.getElementById('expenseCustomerInfo').value = '';
        document.getElementById('expensePhoneInfo').value = '';
    }
}

// ============================================
// TOGGLE SALARY FIELDS
// ============================================
function toggleSalaryFields() {
    const category = document.getElementById('expenseCategory').value;
    const salaryFields = document.getElementById('salaryFields');
    
    if (category === 'Staff Salary') {
        salaryFields.style.display = 'grid';
    } else {
        salaryFields.style.display = 'none';
        document.getElementById('expenseDaysWorked').value = 0;
        document.getElementById('expenseDailyRate').value = 0;
    }
}

// ============================================
// CALCULATE EXPENSE AMOUNT
// ============================================
function calculateExpenseAmount() {
    const category = document.getElementById('expenseCategory').value;
    
    if (category === 'Staff Salary') {
        const daysWorked = Number(document.getElementById('expenseDaysWorked').value) || 0;
        const dailyRate = Number(document.getElementById('expenseDailyRate').value) || 0;
        
        const total = daysWorked * dailyRate;
        
        document.getElementById('expenseAmount').value = total;
    }
}