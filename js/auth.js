// ============================================
// KASHOMBA ELECTRICAL SYSTEM - AUTHENTICATION v3
// ============================================

// Current logged in user
let currentUser = null;
let userRole = '';
let userFullName = '';
let userId = '';
let userPermissions = [];

// Auto logout time (5 minutes kwa milliseconds)
const AUTO_LOGOUT_TIME = 5 * 60 * 1000;

// Notification time (1 minute kabla ya logout)
const NOTIFICATION_BEFORE_LOGOUT = 1 * 60 * 1000;

let inactivityTimer = null;
let notificationTimer = null;
let countdownInterval = null;

// ============================================
// LOGIN FUNCTION
// ============================================
async function handleLogin(username, password) {
    if (!username || !password) {
        showLoginError('Please enter both username and password');
        return false;
    }
    
    try {
        const response = await fetch(API_URL + '?action=login', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({
                username: username,
                password: password
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
// GET USER SESSION
// ============================================
function getUserSession() {
    const session = localStorage.getItem(SESSION_KEY);
    
    if (session) {
        return JSON.parse(session);
    }
    
    return null;
}

// ============================================
// CHECK IF LOGGED IN
// ============================================
function isLoggedIn() {
    const session = getUserSession();
    
    if (session) {
        currentUser = session;
        userId = session.userId;
        userFullName = session.fullName;
        userRole = session.role;
        userPermissions = session.permissions ? session.permissions.split(',').map(p => p.trim()) : [];
        return true;
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
    
    if (userRole === ADMIN_ROLE) {
        return true;
    }
    
    if (requiredRole === SECRETARY_ROLE && userRole === SECRETARY_ROLE) {
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
    
    // Admin ana access ya kila module
    if (userRole === ADMIN_ROLE) {
        return true;
    }
    
    // Dashboard inaonekana kwa kila mtu
    if (moduleName === 'dashboard') {
        return true;
    }
    
    // Kwa secretary, check permissions
    return userPermissions.includes(moduleName);
}

// ============================================
// CHECK ADMIN ONLY
// ============================================
function isAdmin() {
    return isLoggedIn() && userRole === ADMIN_ROLE;
}

// ============================================
// CHECK SECRETARY
// ============================================
function isSecretary() {
    return isLoggedIn() && userRole === SECRETARY_ROLE;
}

// ============================================
// CHECK CAN DELETE
// ============================================
function canDelete() {
    return isAdmin();
}

// ============================================
// LOGOUT FUNCTION
// ============================================
async function handleLogout() {
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
    
    clearSession();
    window.location.href = 'index.html';
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
    
    // Remove notification kama ipo
    const notification = document.getElementById('logoutNotification');
    if (notification) {
        notification.remove();
    }
}

// ============================================
// START INACTIVITY TIMER
// ============================================
function startInactivityTimer() {
    // Clear existing timers
    clearAllTimers();
    
    // Set notification timer (1 minute kabla ya logout)
    const notificationTime = AUTO_LOGOUT_TIME - NOTIFICATION_BEFORE_LOGOUT;
    
    notificationTimer = setTimeout(function() {
        showLogoutNotification();
    }, notificationTime);
    
    // Set auto logout timer
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
    }, AUTO_LOGOUT_TIME);
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
            <strong style="color: #DAA520;">⚠️ Inactivity Warning</strong>
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
    
    // Start countdown
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
    
    // Log activity
    logUserActivity(
        'STAY_ACTIVE',
        'Authentication',
        userId,
        'User chose to stay logged in'
    );
}

// ============================================
// LOG USER ACTIVITY
// ============================================
async function logUserActivity(action, module, referenceId, description) {
    try {
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
                description: description
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
// DISPLAY USER INFO
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
    }
}

// ============================================
// SETUP ACTIVITY LISTENERS FOR AUTO LOGOUT
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const events = ['click', 'keypress', 'scroll', 'mousemove', 'touchstart', 'keydown'];
    
    events.forEach(event => {
        document.addEventListener(event, function() {
            if (isLoggedIn()) {
                resetInactivityTimer();
            }
        });
    });
});