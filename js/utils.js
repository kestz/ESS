// ============================================
// KASHOMBA ELECTRICAL SYSTEM - UTILITY FUNCTIONS
// ============================================

// ============================================
// FETCH DATA FROM BACKEND
// ============================================
async function fetchData(action, data = null) {
    try {
        let url = API_URL + '?action=' + action;
        
        const options = {
            method: data ? 'POST' : 'GET',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Fetch error:', error);
        return { success: false, message: 'Imeshindikana kuunganisha na server' };
    }
}

// ============================================
// GET ALL DATA
// ============================================
async function getAllData() {
    return await fetchData('getAllData');
}

// ============================================
// GET SETTINGS
// ============================================
async function getSettings() {
    const result = await fetchData('getSettings');
    
    if (result.success && result.data.length > 0) {
        return result.data[0];
    }
    
    return DEFAULT_SETTINGS;
}

// ============================================
// GET USERS
// ============================================
async function getUsers() {
    return await fetchData('getUsers');
}

// ============================================
// FORMAT CURRENCY (Tsh)
// ============================================
function formatCurrency(amount) {
    if (amount === null || amount === undefined || amount === '') {
        return '0';
    }
    
    const num = Number(amount);
    return num.toLocaleString('en-TZ');
}

// ============================================
// FORMAT DATE (DD/MM/YYYY)
// ============================================
function formatDate(dateString) {
    if (!dateString) {
        return '';
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return dateString;
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}

// ============================================
// GET TODAY DATE (YYYY-MM-DD)
// ============================================
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// ============================================
// GET CURRENT DATE TIME
// ============================================
function getCurrentDateTime() {
    return new Date().toISOString();
}

// ============================================
// GENERATE ID
// ============================================
function generateLocalId(prefix) {
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') +
        now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0');
    
    return prefix + '-' + timestamp;
}

// ============================================
// VALIDATE EMAIL
// ============================================
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ============================================
// VALIDATE PHONE
// ============================================
function isValidPhone(phone) {
    const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
    return phoneRegex.test(phone);
}

// ============================================
// VALIDATE REQUIRED FIELD
// ============================================
function isRequired(value) {
    return value !== null && value !== undefined && value.trim() !== '';
}

// ============================================
// SHOW SUCCESS MESSAGE
// ============================================
function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

// ============================================
// SHOW ERROR MESSAGE
// ============================================
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

// ============================================
// LIVE SEARCH
// ============================================
function liveSearch(inputId, tableId, columnIndex) {
    const input = document.getElementById(inputId);
    const table = document.getElementById(tableId);
    
    if (!input || !table) {
        return;
    }
    
    input.addEventListener('keyup', function() {
        const filter = this.value.toLowerCase();
        const rows = table.getElementsByTagName('tr');
        
        for (let i = 1; i < rows.length; i++) {
            const cell = rows[i].getElementsByTagName('td')[columnIndex];
            
            if (cell) {
                const textValue = cell.textContent || cell.innerText;
                
                if (textValue.toLowerCase().indexOf(filter) > -1) {
                    rows[i].style.display = '';
                } else {
                    rows[i].style.display = 'none';
                }
            }
        }
    });
}

// ============================================
// CONFIRM ACTION
// ============================================
function confirmAction(message) {
    return confirm(message);
}

// ============================================
// PRINT INVOICE
// ============================================
function printInvoice() {
    window.print();
}

// ============================================
// DOWNLOAD CSV
// ============================================
function downloadCSV(data, filename) {
    if (!data || data.length === 0) {
        showError('Hakuna data ya kupakua');
        return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            let cell = row[header] || '';
            if (typeof cell === 'string' && cell.includes(',')) {
                cell = '"' + cell + '"';
            }
            return cell;
        }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ============================================
// CALCULATE TOTAL DAYS
// ============================================
function calculateTotalDays(startDate, endDate) {
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

// ============================================
// CALCULATE TOTAL WITH DISCOUNT
// ============================================
function calculateTotal(subtotal, labourCharges, discountPercent) {
    const subtotalNum = Number(subtotal) || 0;
    const labourNum = Number(labourCharges) || 0;
    const discountNum = Number(discountPercent) || 0;
    
    const beforeDiscount = subtotalNum + labourNum;
    const discountAmount = beforeDiscount * (discountNum / 100);
    const total = beforeDiscount - discountAmount;
    
    return {
        beforeDiscount: beforeDiscount,
        discountAmount: discountAmount,
        total: total
    };
}

// ============================================
// STATUS BADGE CLASS
// ============================================
function getStatusBadgeClass(status) {
    switch(status) {
        case 'Pending':
            return 'status-pending';
        case 'In Progress':
            return 'status-in-progress';
        case 'Completed':
            return 'status-completed';
        default:
            return 'status-default';
    }
}

// ============================================
// EMPTY TABLE BODY
// ============================================
function emptyTable(tableBodyId) {
    const tbody = document.getElementById(tableBodyId);
    if (tbody) {
        tbody.innerHTML = '';
    }
}

// ============================================
// SHOW LOADING
// ============================================
function showLoading(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = true;
        button.textContent = 'Loading...';
    }
}

// ============================================
// HIDE LOADING
// ============================================
function hideLoading(buttonId, originalText) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = false;
        button.textContent = originalText;
    }
}