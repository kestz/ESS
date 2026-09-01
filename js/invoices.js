// ============================================
// KASHOMBA ELECTRICAL SYSTEM - INVOICES LOGIC v7
// Fixed: Date format for input fields
// Fixed: Default status = Pending for new invoice
// ============================================

let invoiceItemsList = [];

// ============================================
// FORMAT DATE FOR INPUT (yyyy-MM-dd)
// ============================================
function formatDateForInput(dateString) {
    if (!dateString) return '';
    
    // Kama ni datetime, chukua date tu
    if (dateString.includes('T')) {
        return dateString.split('T')[0];
    }
    
    // Kama ni Date object
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
    }
    
    return dateString;
}

function loadInvoicesTable() {
    const tbody = document.getElementById('invoicesTableBody');
    
    if (!tbody) {
        return;
    }
    
    const invoices = allSystemData.invoices;
    
    if (invoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No invoices found</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    const isAdminUser = isAdmin();
    
    invoices.forEach(invoice => {
        const row = document.createElement('tr');
        
        const deleteButton = isAdminUser 
            ? `<button class="btn btn-danger btn-sm delete-btn" onclick="deleteInvoice('${invoice['Invoice No']}')">Delete</button>`
            : '';
        
        row.innerHTML = `
            <td><strong>${invoice['Invoice No']}</strong></td>
            <td>${invoice['Customer Name'] || '-'}</td>
            <td>${formatDate(invoice['Date'])}</td>
            <td>${formatCurrency(invoice['Total Charges'])}</td>
            <td>${formatCurrency(invoice['Balance'])}</td>
            <td><span class="status-badge ${getStatusBadgeClass(invoice['Status'])}">${invoice['Status'] || 'Pending'}</span></td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewInvoice('${invoice['Invoice No']}')">View</button>
                <button class="btn btn-gold btn-sm" onclick="editInvoice('${invoice['Invoice No']}')">Edit</button>
                ${deleteButton}
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function generateNextInvoiceNo() {
    const invoices = allSystemData.invoices;
    let maxNum = 0;
    
    invoices.forEach(inv => {
        const match = inv['Invoice No'].match(/INV-(\d+)/);
        
        if (match) {
            const num = parseInt(match[1]);
            if (num > maxNum) {
                maxNum = num;
            }
        }
    });
    
    const nextNum = maxNum + 1;
    const padded = nextNum.toString().padStart(3, '0');
    
    return 'INV-' + padded;
}

function openInvoiceModal(invoiceNo = null) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'invoiceModal';
    
    let invoice = null;
    
    if (invoiceNo) {
        invoice = allSystemData.invoices.find(i => i['Invoice No'] === invoiceNo);
        invoiceItemsList = invoice && invoice['Items (JSON)'] ? JSON.parse(invoice['Items (JSON)']) : [];
    } else {
        invoiceItemsList = [];
    }
    
    const customers = allSystemData.customers;
    
    const customerOptions = customers.map(customer => {
        const selected = invoice && invoice['Customer Name'] === customer['Customer Name'] ? 'selected' : '';
        return `<option value="${customer['Customer Name']}" data-phone="${customer['Phone Number']}" data-address="${customer['Address / Region'] || ''}" data-pobox="${customer['P.O. Box'] || ''}" ${selected}>${customer['Customer Name']} - ${customer['Phone Number']}</option>`;
    }).join('');
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header">
                <span class="modal-title">${invoice ? 'Edit Invoice' : 'Create New Invoice'}</span>
                <button class="modal-close" onclick="closeModal('invoiceModal')">&times;</button>
            </div>
            
            <form id="invoiceForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Invoice No *</label>
                        <input type="text" id="invoiceNo" class="form-control" value="${invoice ? invoice['Invoice No'] : generateNextInvoiceNo()}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Customer *</label>
                        <select id="invoiceCustomer" class="form-control" required onchange="updateCustomerInfo()">
                            <option value="">-- Select Customer --</option>
                            ${customerOptions}
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Date *</label>
                        <input type="date" id="invoiceDate" class="form-control" value="${invoice ? formatDateForInput(invoice['Date']) : getTodayDate()}" required>
                    </div>
                    <div class="form-group">
                        <label>Work Phase</label>
                        <input type="text" id="invoiceWorkPhase" class="form-control" value="${invoice ? invoice['Work Phase'] : ''}" placeholder="e.g. Phase 2 Wiring">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Location</label>
                        <input type="text" id="invoiceLocation" class="form-control" value="${invoice ? invoice['Location'] : ''}" placeholder="Site location">
                    </div>
                    <div class="form-group">
                        <label>P.O. Box</label>
                        <input type="text" id="invoicePOBox" class="form-control" value="${invoice ? invoice['PO Box'] : ''}" readonly>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Customer Phone</label>
                    <input type="text" id="invoiceCustomerPhone" class="form-control" value="${invoice ? invoice['Phone'] : ''}" readonly>
                </div>
                
                <hr class="mb-20">
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0;">Items</h3>
                    <button type="button" class="btn btn-gold btn-sm" onclick="addInvoiceItem()">Add Item</button>
                </div>
                
                <div class="table-wrapper" style="margin-bottom: 20px;">
                    <table class="table" id="invoiceItemsTable">
                        <thead>
                            <tr>
                                <th style="width: 5%;">S/N</th>
                                <th style="width: 45%;">Description</th>
                                <th style="width: 15%;">Quantity</th>
                                <th style="width: 15%;">Rate (Tsh)</th>
                                <th style="width: 15%;">Amount (Tsh)</th>
                                <th style="width: 5%;"></th>
                            </tr>
                        </thead>
                        <tbody id="invoiceItemsTableBody">
                            ${renderInvoiceItemsRows()}
                        </tbody>
                    </table>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Subtotal (Tsh)</label>
                        <input type="text" id="invoiceSubtotal" class="form-control" readonly>
                    </div>
                    <div class="form-group">
                        <label>Labour Charges (Tsh)</label>
                        <input type="number" id="invoiceLabour" class="form-control" value="${invoice ? invoice['Labour Charges'] : 0}" oninput="calculateInvoiceTotal()">
                    </div>
                    <div class="form-group">
                        <label>Discount (%)</label>
                        <input type="number" id="invoiceDiscount" class="form-control" value="${invoice ? invoice['Discount (%)'] : 0}" min="0" max="100" oninput="calculateInvoiceTotal()">
                    </div>
                    <div class="form-group">
                        <label>Total Charges (Tsh)</label>
                        <input type="text" id="invoiceTotal" class="form-control" readonly>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Status</label>
                        <select id="invoiceStatus" class="form-control">
                            <option value="Pending" ${!invoice || invoice['Status'] === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="In Progress" ${invoice && invoice['Status'] === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Completed" ${invoice && invoice['Status'] === 'Completed' ? 'selected' : ''}>Completed</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Site Start Date</label>
                        <input type="date" id="invoiceStartDate" class="form-control" value="${invoice ? formatDateForInput(invoice['Site Start Date']) : ''}" onchange="calculateTotalDays()">
                    </div>
                    <div class="form-group">
                        <label>Site End Date</label>
                        <input type="date" id="invoiceEndDate" class="form-control" value="${invoice ? formatDateForInput(invoice['Site End Date']) : ''}" onchange="calculateTotalDays()">
                    </div>
                    <div class="form-group">
                        <label>Total Days</label>
                        <input type="text" id="invoiceTotalDays" class="form-control" readonly>
                    </div>
                </div>
                
                <button type="submit" class="btn btn-primary btn-block">
                    ${invoice ? 'Update Invoice' : 'Create Invoice'}
                </button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    calculateInvoiceTotal();
    calculateTotalDays();
    
    if (invoice && invoice['Customer Name']) {
        updateCustomerInfo();
    }
    
    document.getElementById('invoiceForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        showButtonLoading(submitButton, 'Saving...');
        
        const itemsJSON = collectInvoiceItems();
        
        const invoiceData = {
            invoiceNo: document.getElementById('invoiceNo').value.trim(),
            customerName: document.getElementById('invoiceCustomer').value,
            date: document.getElementById('invoiceDate').value,
            items: itemsJSON,
            subtotal: Number(document.getElementById('invoiceSubtotal').value.replace(/,/g, '')) || 0,
            labourCharges: Number(document.getElementById('invoiceLabour').value) || 0,
            discount: Number(document.getElementById('invoiceDiscount').value) || 0,
            totalCharges: Number(document.getElementById('invoiceTotal').value.replace(/,/g, '')) || 0,
            status: document.getElementById('invoiceStatus').value,
            workPhase: document.getElementById('invoiceWorkPhase').value.trim(),
            location: document.getElementById('invoiceLocation').value.trim(),
            siteStartDate: document.getElementById('invoiceStartDate').value,
            siteEndDate: document.getElementById('invoiceEndDate').value,
            totalDays: Number(document.getElementById('invoiceTotalDays').value) || 0,
            createdBy: userFullName,
            balance: Number(document.getElementById('invoiceTotal').value.replace(/,/g, '')) || 0,
            userId: userId,
            fullName: userFullName
        };
        
        if (!invoiceData.customerName) {
            hideButtonLoading(submitButton, originalText);
            showError('Please select a customer');
            return;
        }
        
        if (invoiceItemsList.length === 0) {
            hideButtonLoading(submitButton, originalText);
            showError('Please add at least one item');
            return;
        }
        
        let result;
        
        if (invoice) {
            result = await fetchData('updateInvoice', invoiceData);
        } else {
            result = await fetchData('addInvoice', invoiceData);
        }
        
        hideButtonLoading(submitButton, originalText);
        
        if (result.success) {
            showSuccess(result.message);
            closeModal('invoiceModal');
            await refreshDataAfterSave();
            loadInvoicesTable();
            loadRecentInvoices();
            loadDashboardStats();
            loadUnpaidInvoicesReminder();
        } else {
            showError(result.message);
        }
    });
}

function renderInvoiceItemsRows() {
    if (invoiceItemsList.length === 0) {
        return '<tr><td colspan="6" class="text-center" style="color: #999;">No items yet. Click "Add Item" to start.</td></tr>';
    }
    
    return invoiceItemsList.map((item, index) => `
        <tr id="itemRow_${index}">
            <td>${String(index + 1).padStart(2, '0')}</td>
            <td><input type="text" class="form-control item-description" value="${item.item || ''}" placeholder="Item description" oninput="updateInvoiceItem(${index}, 'item', this.value)"></td>
            <td><input type="number" class="form-control item-qty" value="${item.qty || ''}" min="0" step="any" placeholder="Qty" oninput="updateInvoiceItem(${index}, 'qty', this.value)"></td>
            <td><input type="number" class="form-control item-rate" value="${item.price || ''}" min="0" step="any" placeholder="Rate" oninput="updateInvoiceItem(${index}, 'price', this.value)"></td>
            <td class="item-amount" style="text-align: right; font-weight: 700;">${formatCurrency(calculateItemAmount(item))}</td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="removeInvoiceItem(${index})">Remove</button></td>
        </tr>
    `).join('');
}

function addInvoiceItem() {
    invoiceItemsList.push({
        item: '',
        qty: '',
        price: ''
    });
    
    document.getElementById('invoiceItemsTableBody').innerHTML = renderInvoiceItemsRows();
    calculateInvoiceTotal();
}

function removeInvoiceItem(index) {
    invoiceItemsList.splice(index, 1);
    document.getElementById('invoiceItemsTableBody').innerHTML = renderInvoiceItemsRows();
    calculateInvoiceTotal();
}

function updateInvoiceItem(index, field, value) {
    if (invoiceItemsList[index]) {
        invoiceItemsList[index][field] = value;
        
        const amountCell = document.querySelector(`#itemRow_${index} .item-amount`);
        if (amountCell) {
            amountCell.textContent = formatCurrency(calculateItemAmount(invoiceItemsList[index]));
        }
        
        calculateInvoiceTotal();
    }
}

function calculateItemAmount(item) {
    const qty = parseFloat(item.qty) || 0;
    const rate = Number(item.price) || 0;
    return qty * rate;
}

function collectInvoiceItems() {
    const items = invoiceItemsList.map((item, index) => {
        return {
            sn: String(index + 1).padStart(2, '0'),
            item: item.item || '',
            qty: item.qty || '',
            price: Number(item.price) || 0
        };
    });
    
    return JSON.stringify(items);
}

function updateCustomerInfo() {
    const select = document.getElementById('invoiceCustomer');
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption && selectedOption.value) {
        const phone = selectedOption.getAttribute('data-phone') || '';
        const address = selectedOption.getAttribute('data-address') || '';
        const poBox = selectedOption.getAttribute('data-pobox') || '';
        
        document.getElementById('invoiceCustomerPhone').value = phone;
        document.getElementById('invoiceLocation').value = address;
        document.getElementById('invoicePOBox').value = poBox;
    }
}

function calculateInvoiceTotal() {
    let subtotal = invoiceItemsList.reduce((sum, item) => {
        return sum + calculateItemAmount(item);
    }, 0);
    
    const labour = Number(document.getElementById('invoiceLabour').value) || 0;
    const discount = Number(document.getElementById('invoiceDiscount').value) || 0;
    
    const beforeDiscount = subtotal + labour;
    const discountAmount = beforeDiscount * (discount / 100);
    const total = beforeDiscount - discountAmount;
    
    document.getElementById('invoiceSubtotal').value = formatCurrency(subtotal);
    document.getElementById('invoiceTotal').value = formatCurrency(total);
}

function calculateTotalDays() {
    const startDate = document.getElementById('invoiceStartDate').value;
    const endDate = document.getElementById('invoiceEndDate').value;
    
    const days = calculateDaysBetween(startDate, endDate);
    
    document.getElementById('invoiceTotalDays').value = days;
}

function calculateDaysBetween(startDate, endDate) {
    if (!startDate || !endDate) {
        return 0;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 0;
    }
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

function viewInvoice(invoiceNo) {
    const invoice = allSystemData.invoices.find(i => i['Invoice No'] === invoiceNo);
    
    if (!invoice) {
        showError('Invoice not found');
        return;
    }
    
    const settings = allSystemData.settings.length > 0 ? allSystemData.settings[0] : DEFAULT_SETTINGS;
    const customer = allSystemData.customers.find(c => c['Customer Name'] === invoice['Customer Name']);
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'viewInvoiceModal';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header">
                <span class="modal-title">Proforma Invoice</span>
                <button class="modal-close" onclick="closeModal('viewInvoiceModal')">&times;</button>
            </div>
            
            <div id="invoicePrintableArea" style="padding: 20px; border: 2px solid #DAA520; border-radius: 10px;">
                
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="assets/logo.png" alt="Kashomba Electrical" style="width: 90px; height: auto; margin-bottom: 10px;" onerror="this.style.display='none'">
                    <h1 style="font-size: 1.5rem; font-weight: 800; color: #000; letter-spacing: 2px; margin-bottom: 5px;">${settings['Company_Name'] || 'KASHOMBA ELECTRICAL SOLUTION'}</h1>
                    <p style="font-size: 0.8rem; color: #DAA520; letter-spacing: 3px; font-weight: 600; margin-bottom: 10px;">${settings['Company_Tagline'] || 'Professional Electrical Services'}</p>
                    <p style="font-size: 0.75rem; color: #666;">${settings['Company_Address'] || 'P.O. Box 16112, Dar es salaam, Goba Road Njia Nne'}</p>
                    <p style="font-size: 0.75rem; color: #666;">TEL: ${settings['Company_Phone'] || '+255 763 937 615 / +255 747 397 615'}</p>
                    <p style="font-size: 0.75rem; color: #666;">Email: ${settings['Company_Email'] || 'info@kashombaelectrical.com'} | Web: www.kashombaelectrical.com</p>
                    <p style="font-size: 1rem; font-weight: 700; color: #DAA520; margin-top: 10px; letter-spacing: 5px;">PROFORMA INVOICE</p>
                </div>
                
                <hr style="border: 1px solid #DAA520; margin-bottom: 20px;">
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap;">
                    <div>
                        <p><strong>BILL TO:</strong></p>
                        <p><strong>NAME:</strong> ${invoice['Customer Name']}</p>
                        <p><strong>TEL:</strong> ${customer ? customer['Phone Number'] : '-'}</p>
                        <p><strong>P.O. BOX:</strong> ${customer ? customer['P.O. Box'] : '-'}</p>
                    </div>
                    <div>
                        <p><strong>INVOICE NO:</strong> ${invoice['Invoice No']}</p>
                        <p><strong>ISSUE DATE:</strong> ${formatDate(invoice['Date'])}</p>
                        <p><strong>PHASE:</strong> ${invoice['Work Phase'] || '-'}</p>
                        <p><strong>LOCATION:</strong> ${invoice['Location'] || '-'}</p>
                    </div>
                </div>
                
                <div class="table-wrapper" style="margin-bottom: 20px;">
                    <table class="table" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #0a0a0a; color: #fff;">
                                <th style="padding: 8px; text-align: left; font-size: 0.75rem;">S/N</th>
                                <th style="padding: 8px; text-align: left; font-size: 0.75rem;">DESCRIPTION</th>
                                <th style="padding: 8px; text-align: left; font-size: 0.75rem;">QUANTITY</th>
                                <th style="padding: 8px; text-align: right; font-size: 0.75rem;">RATE</th>
                                <th style="padding: 8px; text-align: right; font-size: 0.75rem;">AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody id="viewInvoiceItemsBody">
                            <tr><td colspan="5" class="text-center">Loading items...</td></tr>
                        </tbody>
                    </table>
                </div>
                
                <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
                    <div style="text-align: right;">
                        <p><strong>SUBTOTAL:</strong> ${formatCurrency(invoice['Subtotal'])} Tsh</p>
                        <p><strong>LABOUR CHARGES:</strong> ${formatCurrency(invoice['Labour Charges'])} Tsh</p>
                        <p><strong>DISCOUNT:</strong> ${invoice['Discount (%)']}%</p>
                        <p style="font-size: 1.2rem; font-weight: 800;"><strong>TOTAL CHARGES:</strong> ${formatCurrency(invoice['Total Charges'])} Tsh</p>
                        <p style="color: #dc3545; font-weight: 700;"><strong>BALANCE:</strong> ${formatCurrency(invoice['Balance'])} Tsh</p>
                    </div>
                </div>
                
                <hr style="border: 1px solid #DAA520; margin-bottom: 20px;">
                
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap; margin-bottom: 20px;">
                    <div>
                        <p style="font-weight: 700; color: #DAA520;">PAYMENT INSTRUCTION</p>
                        <p style="font-size: 0.8rem;"><strong>Bank:</strong> ${settings['Bank_Name'] || 'NMB'}</p>
                        <p style="font-size: 0.8rem;"><strong>Account No:</strong> ${settings['Bank_Account_No'] || '25110000964'}</p>
                        <p style="font-size: 0.8rem;"><strong>Account Name:</strong> ${settings['Bank_Account_Name'] || 'AUGUST KASHOMBA'}</p>
                    </div>
                    <div>
                        <p style="font-weight: 700; color: #DAA520;">MOBILE PAYMENT</p>
                        <p style="font-size: 0.8rem;"><strong>${settings['Mobile_Payment_Name'] || 'M-PESA'}:</strong> ${settings['Mobile_Payment_No'] || '0763937615'}</p>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <p style="font-size: 0.9rem; font-weight: 700; color: #DAA520; letter-spacing: 2px;">LET US LIGHT UP YOUR HOME</p>
                </div>
                
            </div>
            
            <button class="btn btn-primary btn-block mt-20" onclick="printInvoice()">Print / PDF</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    loadViewInvoiceItems(invoice['Items (JSON)']);
}

function loadViewInvoiceItems(itemsJSON) {
    const tbody = document.getElementById('viewInvoiceItemsBody');
    
    if (!tbody) {
        return;
    }
    
    try {
        const items = JSON.parse(itemsJSON);
        
        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No items found</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        
        items.forEach(item => {
            const row = document.createElement('tr');
            const qty = parseFloat(item.qty) || 0;
            const rate = Number(item.price) || 0;
            const amount = qty * rate;
            
            row.innerHTML = `
                <td style="padding: 8px; font-size: 0.75rem;">${item.sn || '-'}</td>
                <td style="padding: 8px; font-size: 0.75rem;">${item.item || '-'}</td>
                <td style="padding: 8px; font-size: 0.75rem;">${item.qty || '-'}</td>
                <td style="padding: 8px; text-align: right; font-size: 0.75rem;">${formatCurrency(rate)}</td>
                <td style="padding: 8px; text-align: right; font-size: 0.75rem;">${formatCurrency(amount)}</td>
            `;
            
            tbody.appendChild(row);
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No items found</td></tr>';
    }
}

function editInvoice(invoiceNo) {
    openInvoiceModal(invoiceNo);
}

async function deleteInvoice(invoiceNo) {
    if (!isAdmin()) {
        showError('Only Admin can delete. Please contact your administrator.');
        return;
    }
    
    if (!confirmAction('Are you sure you want to delete this invoice?')) {
        return;
    }
    
    const result = await fetchData('deleteInvoice', {
        invoiceNo: invoiceNo,
        userId: userId,
        fullName: userFullName
    });
    
    if (result.success) {
        showSuccess(result.message);
        await refreshDataAfterSave();
        loadInvoicesTable();
        loadRecentInvoices();
        loadDashboardStats();
        loadUnpaidInvoicesReminder();
    } else {
        showError(result.message);
    }
}
