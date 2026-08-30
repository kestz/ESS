// ============================================
// KASHOMBA ELECTRICAL SYSTEM - CUSTOMERS LOGIC v5
// With Double-click Prevention + Improved Validation
// ============================================

function isValidPhoneNumber(phone) {
    if (!phone) {
        return false;
    }
    
    // Remove spaces, dashes, parentheses, dots
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    
    const localRegex = /^0\d{9}$/;
    const internationalRegex = /^\+255\d{9}$/;
    const internationalNoPlusRegex = /^255\d{9}$/;
    
    return localRegex.test(cleanPhone) || internationalRegex.test(cleanPhone) || internationalNoPlusRegex.test(cleanPhone);
}

function loadCustomersTable() {
    const tbody = document.getElementById('customersTableBody');
    
    if (!tbody) {
        return;
    }
    
    const customers = allSystemData.customers || [];
    
    if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No customers found</td></tr>';
        return;
    }
    
    // Sort by Customer ID (newest first)
    customers.sort((a, b) => {
        const idA = (a['Customer ID'] || '').toString();
        const idB = (b['Customer ID'] || '').toString();
        return idB.localeCompare(idA);
    });
    
    tbody.innerHTML = '';
    
    const isAdminUser = isAdmin();
    
    customers.forEach(customer => {
        const row = document.createElement('tr');
        
        const deleteButton = isAdminUser 
            ? `<button class="btn btn-danger btn-sm delete-btn" onclick="deleteCustomer('${escapeHtml(customer['Customer ID'])}')">Delete</button>`
            : '';
        
        row.innerHTML = `
            <td><strong>${escapeHtml(customer['Customer ID'] || '-')}</strong></td>
            <td>${escapeHtml(customer['Customer Name'] || '-')}</td>
            <td>${escapeHtml(customer['Phone Number'] || '-')}</td>
            <td>${escapeHtml(customer['Address / Region'] || '-')}</td>
            <td>${escapeHtml(customer['Email'] || '-')}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="editCustomer('${escapeHtml(customer['Customer ID'])}')">Edit</button>
                ${deleteButton}
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function openCustomerModal(customerId = null) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'customerModal';
    
    let customer = null;
    
    if (customerId) {
        customer = (allSystemData.customers || []).find(c => c['Customer ID'] === customerId);
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <span class="modal-title">${customer ? 'Edit Customer' : 'Add New Customer'}</span>
                <button class="modal-close" onclick="closeModal('customerModal')">&times;</button>
            </div>
            
            <form id="customerForm">
                <div class="form-group">
                    <label>Customer Name *</label>
                    <input type="text" id="customerName" class="form-control" value="${customer ? escapeHtml(customer['Customer Name']) : ''}" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Phone Number *</label>
                        <input type="text" id="customerPhone" class="form-control" placeholder="e.g. 0712345678 or +255712345678" value="${customer ? escapeHtml(customer['Phone Number']) : ''}" required>
                        <small style="color: #666;">Format: 0XXXXXXXXX or +255XXXXXXXXX</small>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="customerEmail" class="form-control" value="${customer ? escapeHtml(customer['Email']) : ''}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Address / Region</label>
                    <input type="text" id="customerAddress" class="form-control" value="${customer ? escapeHtml(customer['Address / Region']) : ''}">
                </div>
                
                <div class="form-group">
                    <label>P.O. Box</label>
                    <input type="text" id="customerPOBox" class="form-control" value="${customer ? escapeHtml(customer['P.O. Box']) : ''}">
                </div>
                
                <button type="submit" class="btn btn-primary btn-block" id="saveCustomerBtn">
                    ${customer ? 'Update Customer' : 'Save Customer'}
                </button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('customerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('#saveCustomerBtn');
        
        // Prevent double submission
        if (submitButton.disabled) {
            return;
        }
        
        const originalText = submitButton.innerHTML;
        showButtonLoading(submitButton, 'Saving...');
        
        const phoneNumber = document.getElementById('customerPhone').value.trim();
        
        if (!isValidPhoneNumber(phoneNumber)) {
            hideButtonLoading(submitButton, originalText);
            showError('Invalid phone number. Use format: 0XXXXXXXXX or +255XXXXXXXXX');
            return;
        }
        
        const email = document.getElementById('customerEmail').value.trim();
        
        // Validate email kama imejazwa
        if (email && !isValidEmail(email)) {
            hideButtonLoading(submitButton, originalText);
            showError('Invalid email format. Please enter a valid email address.');
            return;
        }
        
        const customerData = {
            customerName: document.getElementById('customerName').value.trim(),
            phoneNumber: phoneNumber,
            email: email,
            address: document.getElementById('customerAddress').value.trim(),
            poBox: document.getElementById('customerPOBox').value.trim(),
            userId: userId,
            fullName: userFullName
        };
        
        if (!customerData.customerName || !customerData.phoneNumber) {
            hideButtonLoading(submitButton, originalText);
            showError('Customer Name and Phone Number are required');
            return;
        }
        
        let result;
        
        if (customer) {
            customerData.customerId = customer['Customer ID'];
            result = await fetchData('updateCustomer', customerData);
        } else {
            result = await fetchData('addCustomer', customerData);
        }
        
        hideButtonLoading(submitButton, originalText);
        
        if (result.success) {
            showSuccess(result.message);
            closeModal('customerModal');
            await refreshDataAfterSave();
            loadCustomersTable();
            loadDashboardStats();
        } else {
            showError(result.message);
        }
    });
}

function editCustomer(customerId) {
    openCustomerModal(customerId);
}

async function deleteCustomer(customerId) {
    if (!isAdmin()) {
        showError('Only Admin can delete. Please contact your administrator.');
        return;
    }
    
    if (!confirmAction('Are you sure you want to delete this customer?')) {
        return;
    }
    
    const result = await fetchData('deleteCustomer', {
        customerId: customerId,
        userId: userId,
        fullName: userFullName
    });
    
    if (result.success) {
        showSuccess(result.message);
        await refreshDataAfterSave();
        loadCustomersTable();
        loadDashboardStats();
    } else {
        showError(result.message);
    }
}