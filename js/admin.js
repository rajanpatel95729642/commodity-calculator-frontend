// ════════════════════════════════════════════════════════════════
//  admin.js  –  FINAL FIXED VERSION
//  commodity-calculator-frontend/js/admin.js
// ════════════════════════════════════════════════════════════════

const ADMIN_API = 'https://commodity-calculator-api.onrender.com/api/admin';

let growthChartInstance    = null;
let commodityChartInstance = null;
let currentPage = { users: 1, calcs: 1, logs: 1 };
let confirmCallback = null;

// ─── INIT ────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    if (!API.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const token = localStorage.getItem('access_token');

        // Use raw fetch (NOT axios) to avoid interceptor redirect
        const resp = await fetch('https://commodity-calculator-api.onrender.com/api/auth/verify', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();

        if (!data.success) {
            localStorage.clear();
            window.location.href = 'login.html';
            return;
        }

        const user = data.user;
        localStorage.setItem('user', JSON.stringify(user));

        if (!user.is_admin) {
            alert('⛔ Admin access required.');
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('admin-email').textContent = user.email;
        showPage('dashboard');

    } catch (err) {
        console.error('Auth verify failed:', err);
        localStorage.clear();
        window.location.href = 'login.html';
    }
});

// ─── NAVIGATION ──────────────────────────────────────────────────

function showPage(name) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const section = document.getElementById(`page-${name}`);
    if (section) section.classList.remove('hidden');

    const btn = document.querySelector(`[data-page="${name}"]`);
    if (btn) btn.classList.add('active');

    const titles = {
        dashboard: 'Dashboard', users: 'Users', calculations: 'Calculations',
        announcements: 'Announcements', monetization: 'Monetization',
        logs: 'Activity Logs', settings: 'Settings', 'user-detail': 'User Detail'
    };
    document.getElementById('page-title').textContent = titles[name] || name;

    const loaders = {
        dashboard: loadDashboard, users: loadUsers,
        calculations: loadCalculations, announcements: loadAnnouncements,
        monetization: loadMonetization, logs: loadLogs, settings: loadSettings,
    };
    if (loaders[name]) loaders[name]();
}

// ─── SAFE API CALL (uses fetch, bypasses axios interceptor) ──────

async function adminFetch(method, path, body = null) {
    // Try to refresh if token is close to expiring or already expired
    let token = localStorage.getItem('access_token');
    
    const opts = {
        method,
        headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    if (body) opts.body = JSON.stringify(body);
    
    let res = await fetch(`https://commodity-calculator-api.onrender.com/api/admin${path}`, opts);
    
    // If 401, try refreshing the token once
    if (res.status === 401) {
        const refreshed = await tryRefreshToken();
        if (!refreshed) {
            localStorage.clear();
            window.location.href = 'login.html';
            return;
        }
        // Retry with new token
        token = localStorage.getItem('access_token');
        opts.headers['Authorization'] = `Bearer ${token}`;
        res = await fetch(`https://commodity-calculator-api.onrender.com/api/admin${path}`, opts);
    }
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
}

async function tryRefreshToken() {
    try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) return false;
        
        const res = await fetch('https://commodity-calculator-api.onrender.com/api/auth/refresh', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${refreshToken}`
            }
        });
        
        if (!res.ok) return false;
        
        const data = await res.json();
        if (data.access_token) {
            localStorage.setItem('access_token', data.access_token);
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

// ─── DASHBOARD ───────────────────────────────────────────────────

async function loadDashboard() {
    try {
        const data = await adminFetch('GET', '/stats');
        const s    = data.stats;

        document.getElementById('s-total-users').textContent = s.total_users;
        document.getElementById('s-new-week').textContent    = `+${s.new_this_week}`;
        document.getElementById('s-total-calcs').textContent = s.total_calculations;
        document.getElementById('s-calcs-today').textContent = s.calculations_today;
        document.getElementById('s-free').textContent        = s.free_users;
        document.getElementById('s-premium').textContent     = s.premium_users;
        document.getElementById('s-revenue').textContent     = s.monetization_enabled ? `₹${s.yearly_revenue}` : '—';
        document.getElementById('s-mono').textContent        = s.monetization_enabled ? '🟢 ON' : '⚪ OFF';

        loadGrowthChart(30);
        loadCommodityChart(s.commodity_breakdown);
    } catch (err) {
        console.error(err);
        showToast('Failed to load dashboard: ' + err.message, 'error');
    }
}

async function loadGrowthChart(days = 30) {
    document.querySelectorAll('.growth-btn').forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.days) === days);
    });
    try {
        const data = await adminFetch('GET', `/user-growth?days=${days}`);
        const rows = data.growth;

        if (growthChartInstance) growthChartInstance.destroy();
        const ctx = document.getElementById('growthChart').getContext('2d');
        growthChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: rows.map(d => d.date),
                datasets: [
                    { label: 'New Users', data: rows.map(d => d.count), backgroundColor: '#93c5fd', borderRadius: 4 },
                    { label: 'Total Users', data: rows.map(d => d.cumulative), type: 'line',
                      borderColor: '#1d4ed8', backgroundColor: 'transparent', tension: 0.3, pointRadius: 2 }
                ]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
        });
    } catch (err) { console.error(err); }
}

function loadCommodityChart(breakdown = {}) {
    const labels = Object.keys(breakdown);
    const values = Object.values(breakdown);
    const colors = ['#60a5fa','#34d399','#f59e0b','#a78bfa','#f472b6','#94a3b8'];

    if (commodityChartInstance) commodityChartInstance.destroy();
    const ctx = document.getElementById('commodityChart').getContext('2d');
    commodityChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2 }] },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}

// ─── USERS ───────────────────────────────────────────────────────

async function loadUsers(page = 1) {
    currentPage.users = page;
    const search = document.getElementById('user-search')?.value || '';
    const tier   = document.getElementById('user-tier')?.value || '';

    try {
        const data = await adminFetch('GET', `/users?page=${page}&per_page=20&search=${search}&tier=${tier}`);
        const { users, pagination } = data;

        document.getElementById('users-tbody').innerHTML = users.length === 0
            ? '<tr><td colspan="5" class="text-center py-8 text-gray-400">No users found</td></tr>'
            : users.map(u => `<tr>
                <td>
                    <div class="font-medium">${u.email}</div>
                    <div class="text-xs text-gray-400">${u.display_name || ''}</div>
                </td>
                <td><span class="badge-${u.subscription_tier}">${u.subscription_tier.toUpperCase()}</span></td>
                <td>${u.calculations_count}</td>
                <td class="text-xs text-gray-500">${formatDate(u.created_at)}</td>
                <td class="flex gap-2">
                    <button class="btn-sm bg-blue-100 text-blue-700" onclick="viewUser(${u.id})">View</button>
                    <button class="btn-sm bg-red-100 text-red-700" onclick="confirmDeleteUser(${u.id},'${u.email}')">Delete</button>
                </td>
            </tr>`).join('');

        renderPagination('users-pagination', pagination, loadUsers);
    } catch (err) { showToast('Failed to load users: ' + err.message, 'error'); }
}

async function viewUser(uid) {
    try {
        const data = await adminFetch('GET', `/user/${uid}`);
        const { user, recent_calculations, recent_activity } = data;

        const bd = Object.entries(user.commodity_breakdown || {})
            .map(([k,v]) => `<span class="text-xs bg-gray-100 px-2 py-1 rounded">${k}: ${v}</span>`).join(' ');

        document.getElementById('user-detail-content').innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl">👤</div>
                        <div>
                            <h2 class="font-bold text-lg text-gray-800">${user.email}</h2>
                            <p class="text-sm text-gray-500">${user.display_name || 'No name'}</p>
                        </div>
                    </div>
                    <div class="space-y-2 text-sm text-gray-600">
                        <div class="flex justify-between"><span>Plan:</span><span class="badge-${user.subscription_tier}">${user.subscription_tier.toUpperCase()}</span></div>
                        <div class="flex justify-between"><span>Expires:</span><span>${user.subscription_expires || 'N/A'}</span></div>
                        <div class="flex justify-between"><span>Joined:</span><span>${formatDate(user.created_at)}</span></div>
                        <div class="flex justify-between"><span>Calcs this year:</span><span class="font-semibold">${user.calculations_used_this_year}</span></div>
                    </div>
                    <div class="mt-4 flex gap-2 flex-wrap">
                        ${user.subscription_tier === 'free'
                            ? `<button class="btn-sm bg-yellow-100 text-yellow-800" onclick="upgradeUser(${user.id})">⬆️ Upgrade to Premium</button>`
                            : `<button class="btn-sm bg-gray-100 text-gray-700" onclick="downgradeUser(${user.id})">⬇️ Downgrade to Free</button>`}
                        <button class="btn-sm bg-red-100 text-red-700" onclick="confirmDeleteUser(${user.id},'${user.email}')">🗑 Delete</button>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h3 class="font-bold text-gray-700 mb-3">🌾 Commodity Breakdown</h3>
                    <div class="flex flex-wrap gap-2">${bd || '<span class="text-gray-400 text-sm">No calculations yet</span>'}</div>
                </div>
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h3 class="font-bold text-gray-700 mb-3">📝 Recent Calculations</h3>
                    ${recent_calculations.length === 0 ? '<p class="text-gray-400 text-sm">None</p>'
                        : recent_calculations.map(c => `<div class="flex justify-between text-sm py-2 border-b border-gray-100">
                            <span>${c.commodity || c.type || 'simple'}</span>
                            <span class="text-gray-400">${formatDate(c.created_at)}</span>
                        </div>`).join('')}
                </div>
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h3 class="font-bold text-gray-700 mb-3">🔍 Recent Activity</h3>
                    ${recent_activity.length === 0 ? '<p class="text-gray-400 text-sm">None</p>'
                        : recent_activity.map(l => `<div class="flex justify-between text-sm py-2 border-b border-gray-100">
                            <span>${l.action}</span>
                            <span class="text-gray-400">${formatDate(l.created_at)}</span>
                        </div>`).join('')}
                </div>
            </div>`;

        showPage('user-detail');
    } catch (err) { showToast('Failed to load user: ' + err.message, 'error'); }
}

async function upgradeUser(uid) {
    try {
        await adminFetch('POST', `/user/${uid}/subscription`, { action: 'upgrade', years: 1 });
        showToast('User upgraded to Premium ✅');
        viewUser(uid);
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
}

async function downgradeUser(uid) {
    try {
        await adminFetch('POST', `/user/${uid}/subscription`, { action: 'downgrade' });
        showToast('User downgraded to Free');
        viewUser(uid);
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
}

function confirmDeleteUser(uid, email) {
    showConfirm('Delete User', `Delete "${email}"? This cannot be undone.`, async () => {
        try {
            await adminFetch('DELETE', `/user/${uid}`);
            showToast('User deleted');
            showPage('users');
        } catch (err) { showToast('Failed: ' + err.message, 'error'); }
    });
}

// ─── CALCULATIONS ─────────────────────────────────────────────────

async function loadCalculations(page = 1) {
    currentPage.calcs = page;
    const commodity = document.getElementById('calc-commodity')?.value || '';
    try {
        const data = await adminFetch('GET', `/calculations?page=${page}&per_page=20&commodity=${commodity}`);
        const { calculations, pagination } = data;

        document.getElementById('calcs-tbody').innerHTML = calculations.length === 0
            ? '<tr><td colspan="5" class="text-center py-8 text-gray-400">No calculations found</td></tr>'
            : calculations.map(c => `<tr>
                <td class="text-xs text-gray-500">${formatDate(c.created_at)}</td>
                <td class="text-sm">${c.user_email}</td>
                <td><span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">${c.commodity || c.type || 'simple'}</span></td>
                <td>${(c.data && c.data.nameVakal) ? c.data.nameVakal : '—'}</td>
                <td><button class="btn-sm bg-red-100 text-red-700" onclick="confirmDeleteCalc(${c.id})">Delete</button></td>
            </tr>`).join('');

        renderPagination('calcs-pagination', pagination, loadCalculations);
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
}

function confirmDeleteCalc(cid) {
    showConfirm('Delete Calculation', 'Delete this calculation?', async () => {
        try {
            await adminFetch('DELETE', `/calculation/${cid}`);
            showToast('Deleted');
            loadCalculations(currentPage.calcs);
        } catch (err) { showToast('Failed: ' + err.message, 'error'); }
    });
}

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────

async function loadAnnouncements() {
    try {
        const data = await adminFetch('GET', '/announcements');
        const list = document.getElementById('announcements-list');
        list.innerHTML = data.announcements.length === 0
            ? '<p class="text-gray-400 text-sm">No announcements yet</p>'
            : data.announcements.map(a => `
                <div class="ann-${a.type} rounded-lg p-4 mb-3 flex justify-between items-start">
                    <div>
                        <div class="font-semibold text-gray-800">${a.title}</div>
                        <div class="text-sm text-gray-600 mt-1">${a.message}</div>
                        <div class="text-xs text-gray-400 mt-1">${formatDate(a.created_at)} • ${a.active ? '🟢 Active' : '⚫ Inactive'}</div>
                    </div>
                    <div class="flex gap-2 ml-4 flex-shrink-0">
                        <button class="btn-sm ${a.active ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}"
                            onclick="toggleAnn(${a.id}, ${!a.active})">${a.active ? 'Deactivate' : 'Activate'}</button>
                        <button class="btn-sm bg-red-100 text-red-700" onclick="confirmDeleteAnn(${a.id})">Delete</button>
                    </div>
                </div>`).join('');
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
}

async function createAnnouncement() {
    const title   = document.getElementById('ann-title').value.trim();
    const message = document.getElementById('ann-message').value.trim();
    if (!title || !message) { showToast('Title and message required', 'error'); return; }
    try {
        await adminFetch('POST', '/announcement', {
            title, message,
            type:       document.getElementById('ann-type').value,
            send_email: document.getElementById('ann-email').checked
        });
        showToast('Announcement created ✅');
        document.getElementById('ann-title').value   = '';
        document.getElementById('ann-message').value = '';
        loadAnnouncements();
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
}

async function toggleAnn(aid, active) {
    try {
        await adminFetch('PUT', `/announcement/${aid}`, { active });
        showToast(active ? 'Activated' : 'Deactivated');
        loadAnnouncements();
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
}

function confirmDeleteAnn(aid) {
    showConfirm('Delete', 'Delete this announcement?', async () => {
        try { await adminFetch('DELETE', `/announcement/${aid}`); showToast('Deleted'); loadAnnouncements(); }
        catch (err) { showToast('Failed: ' + err.message, 'error'); }
    });
}

// ─── MONETIZATION ────────────────────────────────────────────────

async function loadMonetization() {
    try {
        const data = await adminFetch('GET', '/monetization');
        const { settings, stats } = data;

        const card = document.getElementById('mono-card');
        const btn  = document.getElementById('mono-toggle-btn');
        const text = document.getElementById('mono-status-text');

        if (settings.enabled) {
            card.className   = 'bg-white rounded-xl shadow-sm p-6 mb-6 mono-enabled';
            btn.textContent  = '🔴 Turn OFF Monetization';
            btn.className    = 'btn-danger px-6';
            text.textContent = 'Monetization is ACTIVE — free users have limits';
            document.getElementById('mono-stats').classList.remove('hidden');
            document.getElementById('ms-free').textContent    = stats.free_users;
            document.getElementById('ms-premium').textContent = stats.premium_users;
            document.getElementById('ms-conv').textContent    = `${stats.conversion_rate}%`;
            document.getElementById('ms-rev').textContent     = `₹${stats.yearly_revenue}`;
        } else {
            card.className   = 'bg-white rounded-xl shadow-sm p-6 mb-6 mono-disabled';
            btn.textContent  = '🚀 Turn ON Monetization';
            btn.className    = 'btn-primary px-6';
            text.textContent = 'Monetization is OFF — all users have full access';
            document.getElementById('mono-stats').classList.add('hidden');
        }

        document.getElementById('limit-calcs').value   = settings.free_calculations_limit;
        document.getElementById('limit-history').value = settings.free_history_limit;
        document.getElementById('limit-pdf').checked   = settings.free_pdf_export;
        document.getElementById('premium-price').value = settings.premium_price_yearly;

    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
}

// ────────────────────────────────────────────────────────────────
//  Upgrade User to Premium (called from user detail page)
// ────────────────────────────────────────────────────────────────
async function upgradeToPremium(userId, months = 12) {
    showConfirm(
        'Upgrade to Premium',
        `Upgrade this user to Premium for ${months} months?`,
        async () => {
            try {
                const token = localStorage.getItem('access_token');
                const res = await axios.post(
                    `https://commodity-calculator-api.onrender.com/api/admin/users/${userId}/upgrade`,
                    { months: months },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.data.success) {
                    showToast(`✅ Upgraded! Premium valid until ${res.data.premium_expiry}`);
                    loadUserDetail(userId); // refresh the user detail view
                }
            } catch (err) {
                showToast('❌ Upgrade failed: ' + (err.response?.data?.message || err.message));
            }
        }
    );
}


// ────────────────────────────────────────────────────────────────
//  Downgrade User to Free (called from user detail page)
// ────────────────────────────────────────────────────────────────
async function downgradeToFree(userId) {
    showConfirm(
        'Downgrade to Free',
        'Remove Premium and downgrade this user to Free plan?',
        async () => {
            try {
                const token = localStorage.getItem('access_token');
                const res = await axios.post(
                    `https://commodity-calculator-api.onrender.com/api/admin/users/${userId}/downgrade`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.data.success) {
                    showToast('✅ User downgraded to Free plan');
                    loadUserDetail(userId); // refresh the user detail view
                }
            } catch (err) {
                showToast('❌ Downgrade failed: ' + (err.response?.data?.message || err.message));
            }
        }
    );
}


// ────────────────────────────────────────────────────────────────
//  Render User Detail Page — add this inside your existing
//  loadUserDetail() function where you build the HTML
// ────────────────────────────────────────────────────────────────
function renderSubscriptionSection(user) {
    const isPremium = user.subscription_tier === 'premium';
    const expiryText = user.premium_expiry ? `Valid until <strong>${user.premium_expiry}</strong>` : '';

    return `
    <div class="bg-white rounded-xl shadow-sm p-6 mb-4">
        <h3 class="font-bold text-gray-700 mb-4">💎 Subscription</h3>

        <!-- Current Status -->
        <div class="flex items-center justify-between mb-4 p-4 rounded-xl border
            ${isPremium
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-gray-50 border-gray-200'}">
            <div class="flex items-center gap-3">
                <span class="text-2xl">${isPremium ? '💎' : '🆓'}</span>
                <div>
                    <div class="font-bold ${isPremium ? 'text-yellow-700' : 'text-gray-700'}">
                        ${isPremium ? 'Premium Plan' : 'Free Plan'}
                    </div>
                    ${isPremium
                        ? `<div class="text-xs text-yellow-600 mt-0.5">${expiryText}</div>`
                        : `<div class="text-xs text-gray-400 mt-0.5">Limited calculations per year</div>`
                    }
                </div>
            </div>
            <span class="text-xs font-bold px-3 py-1 rounded-full
                ${isPremium
                    ? 'bg-yellow-400 text-white'
                    : 'bg-gray-200 text-gray-600'}">
                ${isPremium ? 'PREMIUM' : 'FREE'}
            </span>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
            ${!isPremium ? `
                <div class="flex items-center gap-2 flex-1">
                    <select id="upgrade-months" class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        <option value="1">1 Month</option>
                        <option value="3">3 Months</option>
                        <option value="6">6 Months</option>
                        <option value="12" selected>12 Months (1 Year)</option>
                    </select>
                    <button onclick="upgradeToPremium(${user.id}, parseInt(document.getElementById('upgrade-months').value))"
                        class="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600
                               text-white font-bold py-2 px-4 rounded-lg text-sm transition-all shadow-md">
                        💎 Upgrade to Premium
                    </button>
                </div>
            ` : `
                <button onclick="downgradeToFree(${user.id})"
                    class="flex-1 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600
                           font-medium py-2 px-4 rounded-lg text-sm transition-colors border border-gray-200">
                    🔽 Downgrade to Free
                </button>
            `}
        </div>
    </div>`;
}

async function toggleMonetization() {
    try {
        const data  = await adminFetch('POST', '/monetization/toggle');
        const state = data.enabled ? 'ENABLED 🟢' : 'DISABLED ⚪';
        showToast(`Monetization ${state}`);
        loadMonetization();
        loadDashboard();
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
}

async function saveMonetizationSettings() {
    try {
        await adminFetch('PUT', '/monetization/settings', {
            free_calculations_limit: parseInt(document.getElementById('limit-calcs').value),
            free_history_limit:      parseInt(document.getElementById('limit-history').value),
            free_pdf_export:         document.getElementById('limit-pdf').checked,
            premium_price_yearly:    parseInt(document.getElementById('premium-price').value),
        });
        showToast('Settings saved ✅');
        loadMonetization();
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
}

// ─── LOGS ─────────────────────────────────────────────────────────

async function loadLogs(page = 1) {
    currentPage.logs = page;
    try {
        const data = await adminFetch('GET', `/logs?page=${page}&per_page=50`);
        document.getElementById('logs-tbody').innerHTML = data.logs.length === 0
            ? '<tr><td colspan="4" class="text-center py-8 text-gray-400">No logs</td></tr>'
            : data.logs.map(l => `<tr>
                <td class="text-xs text-gray-500 whitespace-nowrap">${formatDate(l.created_at)}</td>
                <td class="text-sm">${l.user_email}</td>
                <td><span class="text-xs bg-gray-100 px-2 py-0.5 rounded">${l.action}</span></td>
                <td class="text-xs text-gray-500">${l.details || '—'}</td>
            </tr>`).join('');
        renderPagination('logs-pagination', data.pagination, loadLogs);
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
}

// ─── SETTINGS ─────────────────────────────────────────────────────

// Track current maintenance state
let _maintenanceEnabled = false;

async function loadSettings() {
    try {
        const data = await adminFetch('GET', '/settings');
        const s = data.settings;
        document.getElementById('set-app-name').value        = s.app_name || '';
        document.getElementById('set-maintenance-msg').value = s.maintenance_message || '';
        
        _maintenanceEnabled = s.maintenance_mode === 'true';
        updateMaintenanceUI(_maintenanceEnabled);
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
}

function updateMaintenanceUI(isOn) {
    const card   = document.getElementById('maintenance-card');
    const icon   = document.getElementById('maintenance-icon');
    const text   = document.getElementById('maintenance-status-text');
    const btn    = document.getElementById('maintenance-toggle-btn');
    const circle = document.getElementById('maintenance-toggle-circle');

    if (isOn) {
        card.style.borderColor   = '#ef4444';
        card.style.background    = '#fff5f5';
        icon.textContent         = '🔴';
        text.textContent         = 'App is UNDER MAINTENANCE — users cannot access';
        text.style.color         = '#dc2626';
        btn.style.background     = '#ef4444';
        circle.style.transform   = 'translateX(1.75rem)';
    } else {
        card.style.borderColor   = '#d1d5db';
        card.style.background    = '#f9fafb';
        icon.textContent         = '🟢';
        text.textContent         = 'App is running normally';
        text.style.color         = '#6b7280';
        btn.style.background     = '#d1d5db';
        circle.style.transform   = 'translateX(0.25rem)';
    }
}

async function toggleMaintenanceMode() {
    _maintenanceEnabled = !_maintenanceEnabled;
    updateMaintenanceUI(_maintenanceEnabled);
    
    // Auto-save immediately
    try {
        await adminFetch('PUT', '/settings', {
            app_name:            document.getElementById('set-app-name').value,
            maintenance_mode:    _maintenanceEnabled ? 'true' : 'false',
            maintenance_message: document.getElementById('set-maintenance-msg').value,
        });
        showToast(_maintenanceEnabled ? '🔴 Maintenance ON — users blocked' : '🟢 Maintenance OFF — app live');
    } catch (err) {
        // Revert on failure
        _maintenanceEnabled = !_maintenanceEnabled;
        updateMaintenanceUI(_maintenanceEnabled);
        showToast('Failed: ' + err.message, 'error');
    }
}

async function saveSettings() {
    try {
        await adminFetch('PUT', '/settings', {
            app_name:            document.getElementById('set-app-name').value,
            maintenance_mode:    _maintenanceEnabled ? 'true' : 'false',
            maintenance_message: document.getElementById('set-maintenance-msg').value,
        });
        showToast('Settings saved ✅');
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
}

// ─── EXPORT ──────────────────────────────────────────────────────

async function exportUsers() {
    try {
        const data = await adminFetch('GET', '/export/users');
        downloadCSV(data.data, 'users_export.csv');
        showToast('Exported ✅');
    } catch (err) { showToast('Export failed: ' + err.message, 'error'); }
}

async function exportCalcs() {
    try {
        const data = await adminFetch('GET', '/export/calculations');
        downloadCSV(data.data, 'calculations_export.csv');
        showToast('Exported ✅');
    } catch (err) { showToast('Export failed: ' + err.message, 'error'); }
}

function downloadCSV(rows, filename) {
    const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

// ─── LOGOUT ──────────────────────────────────────────────────────

async function doLogout() {
    try { await API.logout(); } catch (e) {}
    localStorage.clear();
    window.location.href = 'login.html';
}

// ─── UI HELPERS ──────────────────────────────────────────────────

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className   = `fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-lg z-50 text-sm text-white ${type === 'error' ? 'bg-red-600' : 'bg-gray-800'}`;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3500);
}

function showConfirm(title, message, onOk) {
    document.getElementById('confirm-title').textContent   = title;
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-modal').classList.remove('hidden');
    document.getElementById('confirm-ok').onclick = () => { closeConfirm(); onOk(); };
}

function closeConfirm() {
    document.getElementById('confirm-modal').classList.add('hidden');
}

function renderPagination(containerId, pagination, loadFn) {
    const el = document.getElementById(containerId);
    if (!pagination || pagination.pages <= 1) { el.innerHTML = ''; return; }
    const { page, pages, total } = pagination;
    el.innerHTML = `
        <span>Page ${page} of ${pages} (${total} total)</span>
        <div class="flex gap-2">
            <button ${page<=1?'disabled':''} onclick="${loadFn.name}(${page-1})"
                class="btn-sm bg-gray-100 text-gray-700 disabled:opacity-40">← Prev</button>
            <button ${page>=pages?'disabled':''} onclick="${loadFn.name}(${page+1})"
                class="btn-sm bg-gray-100 text-gray-700 disabled:opacity-40">Next →</button>
        </div>`;
}

function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}