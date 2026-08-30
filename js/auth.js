// ============================================
// KASHOMBA ELECTRICAL SYSTEM - AUTHENTICATION v10
// With Double-click Prevention + Debounce + Error Handling + Device Info + IP Address
// NOTE: AUTO_LOGOUT_TIME na NOTIFICATION_BEFORE_LOGOUT ziko kwenye config.js
// ============================================

// Current logged in user
let currentUser = null;
let userRole = '';
let userFullName = '';
let userId = '';
let userPermissions = [];

// NOTE: AUTO_LOGOUT_TIME na NOTIFICATION_BEFORE_LOGOUT
// Zimehamishwa kwenye config.js — usizidefine hapa tena

let inactivityTimer = null;
let notificationTimer = null;
let countdownInterval = null;

// Avatar color map - kila herufi ina rangi yake
const AVATAR_COLORS = {
    'A': '#e74c3c',
    'B': '#3498db',
    'C': '#2ecc71',
    'D': '#9b59b6',
    'E': '#f39c12',
    'F': '#1abc9c',
    'G': '#e67e22',
    'H': '#34495e',
    'I': '#d35400',
    'J': '#0a6c6c',
    'K': '#DAA520',
    'L': '#c0392b',
    'M': '#8e44ad',
    'N': '#16a085',
    'O': '#d35400',
    'P': '#2c3e50',
    'Q': '#f1c40f',
    'R': '#e74c3c',
    'S': '#3498db',
    'T': '#27ae60',
    'U': '#8e44ad',
    'V': '#d35400',
    'W': '#2980b9',
    'X': '#c0392b',
    'Y': '#f39c12',
    'Z': '#1abc9c'
};

// ============================================
// GET DEVICE INFO
// ============================================
function getDeviceInfo() {
    const userAgent = navigator.userAgent;
    let deviceName = 'Unknown Device';
    let deviceType = 'Desktop';
    
    // Check kama ni Android
    if (userAgent.match(/Android/i)) {
        deviceType = 'Android Phone';
        
        // Extract model
        const modelMatch = userAgent.match(/Android\s[\d.]+;\s([^;]+)/);
        if (modelMatch) {
            deviceName = modelMatch[1].trim();
        } else {
            deviceName = 'Android';
        }
    }
    // Check kama ni iPhone
    else if (userAgent.match(/iPhone/i)) {
        deviceType = 'iPhone';
        deviceName = 'iPhone';
    }
    // Check kama ni iPad
    else if (userAgent.match(/iPad/i)) {
        deviceType = 'iPad';
        deviceName = 'iPad';
    }
    // Check kama ni Windows
    else if (userAgent.match(/Windows/i)) {
        deviceType = 'Windows PC';
        deviceName = 'Windows';
    }
    // Check kama ni Mac
    else if (userAgent.match(/Macintosh/i)) {
        deviceType = 'Mac';
        deviceName = 'Mac';
    }
    // Check kama ni Linux
    else if (userAgent.match(/Linux/i)) {
        deviceType = 'Linux PC';
        deviceName = 'Linux';
    }
    
    // Browser
    let browser = 'Unknown Browser';
    if (userAgent.match(/Chrome/i) && !userAgent.match(/Edg/i)) browser = 'Chrome';
    else if (userAgent.match(/Edg/i)) browser = 'Edge';
    else if (userAgent.match(/Firefox/i)) browser = 'Firefox';
    else if (userAgent.match(/Safari/i) && !userAgent.match(/Chrome/i)) browser = 'Safari';
    else if (userAgent.match(/Opera/i) || userAgent.match(/OPR/i)) browser = 'Opera';
    
    return deviceName + ' (' + deviceType + ') - ' + browser;
}

// ============================================
// GET IP ADDRESS
// ============================================
async function getIpAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip || '';
    } catch (error) {
        console.error('IP fetch error:', error);
        return '';
    }
}

// ============================================
// LOGIN FUNCTION - With Double-click Prevention + Device Info + IP Address
// ============================================
async function handleLogin(username, password) {
    if (!username || !password) {
        showLoginError('Please enter both username and password');
        return false;
    }
    
    const deviceInfo = getDeviceInfo();
    const ipAddress = await getIpAddress();
    
    const loginBtn = document.getElementById('loginBtn') || document.querySelector('button[type="submit"]');
    
    // Prevent double submission
    if (loginBtn && loginBtn.disabled) {
        return false;
    }
    
    if (loginBtn) {
        const originalText = loginBtn.innerHTML;
        loginBtn.classList.add('btn-loading');
        loginBtn.innerHTML = '<span class="spinner"></span> Logging in...';
        loginBtn.disabled = true;
        
        try {
            const response = await fetch(API_URL + '?action=login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    deviceInfo: deviceInfo,
                    ipAddress: ipAddress
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                setUserSession(result.user);
                startInactivityTimer();
                return true;
            } else {
                showLoginError(result.message);
                loginBtn.classList.remove('btn-loading');
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            showLoginError('Failed to connect to server. Please try again.');
            loginBtn.classList.remove('btn-loading');
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
            return false;
        }
    }
    
    // Fallback kama button haipatikani
    try {
        const response = await fetch(API_URL + '?action=login', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({
                username: username,
                password: password,
                deviceInfo: deviceInfo,
                ipAddress: ipAddress
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            setUserSession(result.user);
            startInactivityTimer();
            return true;
        } else {
            showLoginError(result.message);
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        showLoginError('Failed to connect to server. Please try again.');
        return false;
    }
}

// ============================================
// SET USER SESSION
// ============================================
function setUserSession(user) {
    currentUser = user;
    userId = user.userId;
    userFullName = user.fullName;
    userRole = user.role;
    userPermissions = user.permissions ? user.permissions.split(',').map(p => p.trim()) : [];
    
    const sessionData = {
        userId: user.userId,
        fullName: user.fullName,
        role: user.role,
        permissions: user.permissions || '',
        loginTime: new Date().toISOString()
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

// ============================================
// GET USER SESSION - With Error Handling
// ============================================
function getUserSession() {
    try {
        const session = localStorage.getItem(SESSION_KEY);
        
        if (session) {
            return JSON.parse(session);
        }
    } catch (error) {
        console.error('Session parse error:', error);
        localStorage.removeItem(SESSION_KEY);
    }
    
    return null;
}

// ============================================
// CHECK IF LOGGED IN - With Error Handling
// ============================================
function isLoggedIn() {
    try {
        const session = getUserSession();
        
        if (session && session.userId) {
            currentUser = session;
            userId = session.userId;
            userFullName = session.fullName;
            userRole = session.role || 'Secretary';
            userPermissions = session.permissions ? session.permissions.split(',').map(p => p.trim()) : [];
            return true;
        }
    } catch (error) {
        console.error('Session error:', error);
        clearSession();
    }
    
    return false;
}

// ============================================
// CHECK ROLE PERMISSION
// ============================================
function hasPermission(requiredRole) {
    if (!isLoggedIn()) {
        window.location.href = 'index.html';
        return false;
    }
    
    const adminRole = (typeof ADMIN_ROLE !== 'undefined') ? ADMIN_ROLE : 'Admin';
    
    if (userRole === adminRole) {
        return true;
    }
    
    const secretaryRole = (typeof SECRETARY_ROLE !== 'undefined') ? SECRETARY_ROLE : 'Secretary';
    
    if (requiredRole === secretaryRole && userRole === secretaryRole) {
        return true;
    }
    
    return false;
}

// ============================================
// CHECK MODULE PERMISSION
// ============================================
function hasModulePermission(moduleName) {
    if (!isLoggedIn()) {
        return false;
    }
    
    const adminRole = (typeof ADMIN_ROLE !== 'undefined') ? ADMIN_ROLE : 'Admin';
    
    if (userRole === adminRole) {
        return true;
    }
    
    if (moduleName === 'dashboard') {
        return true;
    }
    
    return userPermissions.includes(moduleName);
}

// ============================================
// CHECK ADMIN ONLY
// ============================================
function isAdmin() {
    if (!isLoggedIn()) {
        return false;
    }
    
    const adminRole = (typeof ADMIN_ROLE !== 'undefined') ? ADMIN_ROLE : 'Admin';
    
    return userRole === adminRole;
}

// ============================================
// CHECK SECRETARY
// ============================================
function isSecretary() {
    if (!isLoggedIn()) {
        return false;
    }
    
    const secretaryRole = (typeof SECRETARY_ROLE !== 'undefined') ? SECRETARY_ROLE : 'Secretary';
    
    return userRole === secretaryRole;
}

// ============================================
// CHECK CAN DELETE
// ============================================
function canDelete() {
    return isAdmin();
}

// ============================================
// LOGOUT FUNCTION - WITH SPINNER
// ============================================
async function handleLogout() {
    // Show loading on logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.classList.add('btn-loading');
        logoutBtn.innerHTML = '<span class="spinner"></span> Logging out...';
        logoutBtn.disabled = true;
    }
    
    try {
        await logUserActivity(
            'LOGOUT',
            'Authentication',
            userId,
            'User logged out'
        );
    } catch (error) {
        console.error('Logout logging error:', error);
    }
    
    // Small delay kuonyesha spinner
    setTimeout(() => {
        clearSession();
        window.location.href = 'index.html';
    }, 500);
}

// ============================================
// CLEAR SESSION
// ============================================
function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    
    currentUser = null;
    userId = '';
    userFullName = '';
    userRole = '';
    userPermissions = [];
    
    clearAllTimers();
}

// ============================================
// CLEAR ALL TIMERS
// ============================================
function clearAllTimers() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
    
    if (notificationTimer) {
        clearTimeout(notificationTimer);
        notificationTimer = null;
    }
    
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    const notification = document.getElementById('logoutNotification');
    if (notification) {
        notification.remove();
    }
}

// ============================================
// START INACTIVITY TIMER
// ============================================
function startInactivityTimer() {
    clearAllTimers();
    
    // Use fallback kama constants hazipo kwenye config.js
    const autoLogoutTime = (typeof AUTO_LOGOUT_TIME !== 'undefined') ? AUTO_LOGOUT_TIME : (5 * 60 * 1000);
    const notificationBeforeLogout = (typeof NOTIFICATION_BEFORE_LOGOUT !== 'undefined') ? NOTIFICATION_BEFORE_LOGOUT : (1 * 60 * 1000);
    
    const notificationTime = autoLogoutTime - notificationBeforeLogout;
    
    notificationTimer = setTimeout(function() {
        showLogoutNotification();
    }, notificationTime);
    
    inactivityTimer = setTimeout(async function() {
        try {
            await logUserActivity(
                'AUTO_LOGOUT',
                'Authentication',
                userId,
                'User auto-logged out due to inactivity'
            );
        } catch (error) {
            console.error('Auto logout logging error:', error);
        }
        
        clearSession();
        window.location.href = 'index.html';
    }, autoLogoutTime);
}

// ============================================
// RESET INACTIVITY TIMER
// ============================================
function resetInactivityTimer() {
    if (isLoggedIn()) {
        startInactivityTimer();
    }
}

// ============================================
// SHOW LOGOUT NOTIFICATION
// ============================================
function showLogoutNotification() {
    // Add animation if not exists
    if (!document.getElementById('logoutAnimationStyle')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'logoutAnimationStyle';
        styleSheet.textContent = `
            @keyframes slideDown {
                from {
                    transform: translateY(-100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styleSheet);
    }
    
    const existingNotification = document.getElementById('logoutNotification');
    
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.id = 'logoutNotification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #000000;
        color: #FFFFFF;
        padding: 20px;
        border-radius: 10px;
        border-left: 4px solid #DAA520;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 9999;
        max-width: 350px;
        animation: slideDown 0.4s ease;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong style="color: #DAA520;">Inactivity Warning</strong>
            <button onclick="dismissLogoutNotification()" style="background: none; border: none; color: #fff; font-size: 18px; cursor: pointer;">&times;</button>
        </div>
        <p style="font-size: 14px; margin-bottom: 10px;">You will be logged out due to inactivity.</p>
        <p style="font-size: 24px; font-weight: 800; color: #DAA520; text-align: center;" id="logoutCountdown">60</p>
        <p style="font-size: 12px; color: #999; text-align: center;">seconds remaining</p>
        <button onclick="stayLoggedIn()" style="width: 100%; padding: 10px; background: #0a6c6c; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-weight: 700; margin-top: 10px;">
            I'm Still Here
        </button>
    `;
    
    document.body.appendChild(notification);
    
    let secondsLeft = 60;
    
    countdownInterval = setInterval(function() {
        secondsLeft--;
        
        const countdownElement = document.getElementById('logoutCountdown');
        
        if (countdownElement) {
            countdownElement.textContent = secondsLeft;
        }
        
        if (secondsLeft <= 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);
}

// ============================================
// DISMISS LOGOUT NOTIFICATION
// ============================================
function dismissLogoutNotification() {
    const notification = document.getElementById('logoutNotification');
    
    if (notification) {
        notification.remove();
    }
    
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

// ============================================
// STAY LOGGED IN
// ============================================
function stayLoggedIn() {
    dismissLogoutNotification();
    resetInactivityTimer();
    
    logUserActivity(
        'STAY_ACTIVE',
        'Authentication',
        userId,
        'User chose to stay logged in'
    );
}

// ============================================
// LOG USER ACTIVITY - With Device Info + IP Address
// ============================================
async function logUserActivity(action, module, referenceId, description) {
    try {
        const deviceInfo = getDeviceInfo();
        const ipAddress = await getIpAddress();
        
        await fetch(API_URL + '?action=logActivity', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({
                userId: userId,
                fullName: userFullName,
                action: action,
                module: module,
                referenceId: referenceId,
                description: description,
                deviceInfo: deviceInfo,
                ipAddress: ipAddress
            })
        });
    } catch (error) {
        console.error('Activity logging error:', error);
    }
}

// ============================================
// SHOW LOGIN ERROR
// ============================================
function showLoginError(message) {
    const errorElement = document.getElementById('loginError');
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

// ============================================
// PROTECT PAGE
// ============================================
function protectPage() {
    if (!isLoggedIn()) {
        window.location.href = 'index.html';
        return false;
    }
    
    startInactivityTimer();
    return true;
}

// ============================================
// PROTECT ADMIN PAGE
// ============================================
function protectAdminPage() {
    if (!isLoggedIn()) {
        window.location.href = 'index.html';
        return false;
    }
    
    if (!isAdmin()) {
        alert('You do not have permission to access this page. Admin only.');
        window.location.href = 'dashboard.html';
        return false;
    }
    
    return true;
}

// ============================================
// DISPLAY USER INFO - WITH DYNAMIC AVATAR + COLORS
// ============================================
function displayUserInfo() {
    const session = getUserSession();
    
    if (session) {
        const nameElements = document.querySelectorAll('.user-full-name');
        nameElements.forEach(el => {
            el.textContent = session.fullName;
        });
        
        const roleElements = document.querySelectorAll('.user-role');
        roleElements.forEach(el => {
            el.textContent = session.role;
        });
        
        // Update avatar na herufi ya kwanza ya jina + rangi
        const avatarElements = document.querySelectorAll('.user-avatar');
        avatarElements.forEach(el => {
            const firstName = session.fullName.split(' ')[0];
            const firstLetter = firstName.charAt(0).toUpperCase();
            el.textContent = firstLetter;
            
            // Chagua rangi kulingana na herufi
            el.style.background = AVATAR_COLORS[firstLetter] || '#0a6c6c';
        });
    }
}

// ============================================
// SETUP ACTIVITY LISTENERS FOR AUTO LOGOUT
// With Debounce kuzuia overload
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const events = ['click', 'keypress', 'scroll', 'mousemove', 'touchstart', 'keydown'];
    
    let resetTimeout = null;
    
    events.forEach(event => {
        document.addEventListener(event, function() {
            // Debounce - reset mara moja kila sekunde 5
            if (resetTimeout) {
                clearTimeout(resetTimeout);
            }
            
            resetTimeout = setTimeout(() => {
                if (isLoggedIn()) {
                    resetInactivityTimer();
                }
            }, 5000);
        });
    });
});