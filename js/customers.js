// ============================================
// KASHOMBA ELECTRICAL SYSTEM - CUSTOMERS LOGIC v2
// ============================================

// ============================================
// VALIDATE PHONE NUMBER
// ============================================
function isValidPhoneNumber(phone) {
    if (!phone) {
        return false;
    }
    
    // Remove spaces, dashes, and parentheses
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Check local format: 0XXXXXXXXX (10 digits starting with 0)
    const localRegex = /^0\d{9}$/;
    
    // Check international format: +255XXXXXXXXX (12 digits starting with +255)
    const internationalRegex = /^\+255\d{9}$/;
    
    // Check international without plus: 255XXXXXXXXX (12 digits starting with 255)
    const internationalNoPlusRegex = /^255\d{9}$/;
    
    return localRegex.test(cleanPhone) || internationalRegex.test(cleanPhone) || internationalNoPlusRegex.test(cleanPhone);
}

// ============================================
// LOAD CUSTOMERS TABLE
// ============================================
function loadCustomersTable() {
    const tbody = document.getElementById('customersTableBody');
    
    if (!tbody) {
        return;
    }
    
    const customers = allSystemData.customers;
    
    if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No customers found</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    const isAdminUser = isAdmin();
    
    customers.forEach(customer => {
        const row = document.createElement('tr');
        
        const deleteButton = isAdminUser 
            ? `<button class="btn btn-danger btn-sm delete-btn" onclick="deleteCustomer('${customer['Customer ID']}')">🗑️ Delete</button>`
            : '';
        
        row.innerHTML = `
            <td><strong>${customer['Customer ID']}</strong></td>
            <td>${customer['Customer Name'] || '-'}</td>
            <td>${customer['Phone Number'] || '-'}</td>
            <td>${customer['Address / Region'] || '-'}</td>
            <td>${customer['Email'] || '-'}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="editCustomer('${customer['Customer ID']}')">✏️ Edit</button>
                ${deleteButton}
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// ============================================
// OPEN CUSTOMER MODAL
// ============================================
function openCustomerModal(customerId = null) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'customerModal';
    
    let customer = null;
    
    if (customerId) {
        customer = allSystemData.customers.find(c => c['Customer ID'] === customerId);
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
                    <input type="text" id="customerName" class="form-control" value="${customer ? customer['Customer Name'] : ''}" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Phone Number *</label>
                        <input type="text" id="customerPhone" class="form-control" placeholder="e.g. 0712345678 au +255712345678" value="${customer ? customer['Phone Number'] : ''}" required>
                        <small style="color: #666;">Format: 0XXXXXXXXX au +255XXXXXXXXX</small>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="customerEmail" class="form-control" value="${customer ? customer['Email'] : ''}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Address / Region</label>
                    <input type="text" id="customerAddress" class="form-control" value="${customer ? customer['Address / Region'] : ''}">
                </div>
                
                <div class="form-group">
                    <label>P.O. Box</label>
                    <input type="text" id="customerPOBox" class="form-control" value="${customer ? customer['P.O. Box'] : ''}">
                </div>
                
                <button type="submit" class="btn btn-primary btn-block">
                    ${customer ? 'Update Customer' : 'Save Customer'}
                </button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    document.getElementById('customerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const phoneNumber = document.getElementById('customerPhone').value.trim();
        
        // Validate phone number
        if (!isValidPhoneNumber(phoneNumber)) {
            showError('Invalid phone number. Use format: 0XXXXXXXXX or +255XXXXXXXXX');
            return;
        }
        
        const customerData = {
            customerName: document.getElementById('customerName').value.trim(),
            phoneNumber: phoneNumber,
            email: document.getElementById('customerEmail').value.trim(),
            address: document.getElementById('customerAddress').value.trim(),
            poBox: document.getElementById('customerPOBox').value.trim(),
            userId: userId,
            fullName: userFullName
        };
        
        // Validate
        if (!customerData.customerName || !customerData.phoneNumber) {
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
        
        if (result.success) {
            showSuccess(result.message);
            closeModal('customerModal');
            await loadAllSystemData();
            loadCustomersTable();
            loadDashboardStats();
        } else {
            showError(result.message);
        }
    });
}

// ============================================
// EDIT CUSTOMER
// ============================================
function editCustomer(customerId) {
    openCustomerModal(customerId);
}

// ============================================
// DELETE CUSTOMER (Admin only)
// ============================================
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
        await loadAllSystemData();
        loadCustomersTable();
        loadDashboardStats();
    } else {
        showError(result.message);
    }
}

// ============================================
// CLOSE MODAL
// ============================================
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}