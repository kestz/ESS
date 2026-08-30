// ============================================
// KASHOMBA ELECTRICAL SYSTEM - UTILITY FUNCTIONS v7
// With Cache Buster + Fresh Data Fetch + Blocking Loading Overlay
// ============================================

// ============================================
// FETCH DATA - WITH BLOCKING LOADING OVERLAY
// ============================================
async function fetchData(action, data = null, retryCount = 0) {
    // Show loading overlay kwa kila fetch (retry ya kwanza tu)
    if (retryCount === 0) {
        showLoadingOverlay('Loading data...');
    }
    
    try {
        // Ongeza timestamp kuzuia browser cache
        const timestamp = new Date().getTime();
        let url = API_URL + '?action=' + action + '&_t=' + timestamp;
        
        const options = {
            method: data ? 'POST' : 'GET',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        // Timeout baada ya sekunde 30
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        options.signal = controller.signal;
        
        const response = await fetch(url, options);
        clearTimeout(timeoutId);
        
        const result = await response.json();
        
        // Ficha loading overlay
        hideLoadingOverlay();
        
        return result;
    } catch (error) {
        console.error('Fetch error:', error);
        
        // Ficha loading overlay
        hideLoadingOverlay();
        
        if (retryCount < 2) {
            console.log('Retrying... Attempt ' + (retryCount + 1));
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchData(action, data, retryCount + 1);
        }
        
        return { 
            success: false, 
            message: 'Failed to connect to server. Please check your internet connection.' 
        };
    }
}

// ============================================
// GET ALL DATA - FRESH FETCH
// ============================================
async function getAllData() {
    console.log('🔄 Fetching fresh data from server...');
    return await fetchData('getAllData');
}

// ============================================
// GET SETTINGS
// ============================================
async function getSettings() {
    const result = await fetchData('getSettings');
    
    if (result.success && result.data && result.data.length > 0) {
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
// REFRESH DATA AFTER SAVE - FORCE FRESH
// ============================================
async function refreshDataAfterSave() {
    try {
        console.log('🔄 Refreshing data after save...');
        const result = await getAllData();
        
        console.log('📦 Refresh result:', result);
        
        if (result.success) {
            allSystemData = result.data;
            dataLoaded = true;
            console.log('✅ Data refreshed! Customers:', allSystemData.customers ? allSystemData.customers.length : 0);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Refresh error:', error);
        return false;
    }
}

// ============================================
// SHOW LOADING OVERLAY - BLOCKING
// ============================================
function showLoadingOverlay(message = 'Loading data...') {
    // Remove existing overlay
    hideLoadingOverlay();
    
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: all;
        cursor: wait;
    `;
    
    overlay.innerHTML = `
        <div class="loading-spinner-box">
            <div class="loading-spinner-large"></div>
            <p class="loading-text">${message}</p>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

// ============================================
// HIDE LOADING OVERLAY
// ============================================
function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// ============================================
// CHECK IF CURRENT USER IS ADMIN
// ============================================
function isAdmin() {
    return userRole === 'Admin' || userRole === 'admin' || userRole === 'ADMIN';
}

// ============================================
// FORMAT CURRENCY (Tsh)
// ============================================
function formatCurrency(amount) {
    if (amount === null || amount === undefined || amount === '') {
        return '0';
    }
    
    const num = Number(amount);
    
    if (isNaN(num)) {
        return '0';
    }
    
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
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
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
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ============================================
// VALIDATE PHONE
// ============================================
function isValidPhone(phone) {
    if (!phone) return false;
    const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
    return phoneRegex.test(phone);
}

// ============================================
// VALIDATE REQUIRED FIELD
// ============================================
function isRequired(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
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
// SHOW CONFIRM DIALOG
// ============================================
function showConfirm(message, onConfirm, onCancel = null) {
    if (confirm(message)) {
        if (onConfirm && typeof onConfirm === 'function') {
            onConfirm();
        }
    } else {
        if (onCancel && typeof onCancel === 'function') {
            onCancel();
        }
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
// DEBOUNCE
// ============================================
function debounce(func, wait) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
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
        showError('No data to download');
        return;
    }
    
    const headers = [...new Set(data.flatMap(row => Object.keys(row)))];
    
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            let cell = row[header] || '';
            cell = String(cell);
            
            if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                cell = '"' + cell.replace(/"/g, '""') + '"';
            }
            
            return cell;
        }).join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
// BUTTON LOADING STATE
// ============================================
function showButtonLoading(button, text) {
    if (button) {
        if (!button.getAttribute('data-original-text')) {
            button.setAttribute('data-original-text', button.innerHTML);
        }
        
        button.classList.add('btn-loading');
        button.innerHTML = '<span class="spinner"></span> ' + text;
        button.disabled = true;
    }
}

function hideButtonLoading(button, originalText) {
    if (button) {
        button.classList.remove('btn-loading');
        
        const textToRestore = originalText || button.getAttribute('data-original-text') || 'Save';
        button.innerHTML = textToRestore;
        button.disabled = false;
        
        button.removeAttribute('data-original-text');
    }
}

// ============================================
// SHOW LOADING (By ID)
// ============================================
function showLoading(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
        showButtonLoading(button, 'Loading...');
    }
}

// ============================================
// HIDE LOADING (By ID)
// ============================================
function hideLoading(buttonId, originalText) {
    const button = document.getElementById(buttonId);
    if (button) {
        hideButtonLoading(button, originalText);
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

// ============================================
// OPEN MODAL
// ============================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

// ============================================
// ESCAPE HTML
// ============================================
function escapeHtml(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// PARSE JSON SAFELY
// ============================================
function parseJsonSafely(jsonString, defaultValue = []) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('JSON Parse error:', error);
        return defaultValue;
    }
}

// ============================================
// GET URL PARAMETER
// ============================================
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// ============================================
// CAPITALIZE FIRST LETTER
// ============================================
function capitalizeFirstLetter(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// ============================================
// TRUNCATE TEXT
// ============================================
function truncateText(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// ============================================
// FORMAT NUMBER WITH COMMAS
// ============================================
function formatNumber(number) {
    return Number(number || 0).toLocaleString('en-TZ');
}

// ============================================
// CHECK IF VALUE IS EMPTY
// ============================================
function isEmpty(value) {
    return value === null || value === undefined || value === '' || value === 0;
}

// ============================================
// GET MONTH NAME
// ============================================
function getMonthName(monthNumber) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const index = Number(monthNumber) - 1;
    return months[index] || '';
}

// ============================================
// GET YEAR FROM DATE
// ============================================
function getYearFromDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return dateString.substring(0, 4);
    }
    
    return date.getFullYear().toString();
}

// ============================================
// GET MONTH FROM DATE
// ============================================
function getMonthFromDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return '';
    }
    
    return (date.getMonth() + 1).toString();
}

// ============================================
// SORT ARRAY BY KEY
// ============================================
function sortByKey(array, key, ascending = true) {
    return array.sort((a, b) => {
        const valueA = a[key] || '';
        const valueB = b[key] || '';
        
        if (valueA < valueB) return ascending ? -1 : 1;
        if (valueA > valueB) return ascending ? 1 : -1;
        return 0;
    });
}

// ============================================
// FILTER ARRAY BY KEY
// ============================================
function filterByKey(array, key, value) {
    return array.filter(item => item[key] === value);
}

// ============================================
// SUM ARRAY BY KEY
// ============================================
function sumByKey(array, key) {
    return array.reduce((sum, item) => {
        return sum + (Number(item[key]) || 0);
    }, 0);
}

// ============================================
// GROUP ARRAY BY KEY
// ============================================
function groupByKey(array, key) {
    return array.reduce((groups, item) => {
        const groupKey = item[key] || 'Unknown';
        
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        
        groups[groupKey].push(item);
        return groups;
    }, {});
}

// ============================================
// GET UNIQUE VALUES FROM ARRAY
// ============================================
function getUniqueValues(array) {
    return [...new Set(array)];
}

// ============================================
// CHECK IF ARRAY HAS DUPLICATES
// ============================================
function hasDuplicates(array) {
    return new Set(array).size !== array.length;
}