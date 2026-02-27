// app.js - UI and Event Handling (COMPLETE FIXED VERSION)

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication on page load
    if (!requireAuth()) {
        return; // Will redirect to login if not logged in
    }
    
    // Show welcome message for logged-in users
    const user = API.getCurrentUser();
    if (user) {
        const welcomeMsg = document.getElementById('welcome-message');
        const userName = document.getElementById('user-name');
        const profileBtn = document.getElementById('profile-btn');
        
        if (welcomeMsg && userName) {
            userName.textContent = user.display_name || user.email;
            welcomeMsg.classList.remove('hidden');
        }
        
        if (profileBtn) {
            profileBtn.classList.remove('hidden');
        }
    }
    
    // Initialize calculator with cloud sync
    await Calculator.init();
    
    // Initialize app
    initializeApp();
});

function initializeApp() {
    // Load settings from localStorage
    loadSettings();
    
    // Setup event listeners
    setupEventListeners();
    setupExpenseToggle();
}

function setupExpenseToggle() {
    const toggle = document.getElementById('include-expenses-toggle');
    const track = document.getElementById('toggle-track');
    const thumb = document.getElementById('toggle-thumb');
    const label = document.getElementById('expense-toggle-label');

    if (!toggle) return;

    // Update label with current expenses value
    const toggleValueEl = document.getElementById('expense-toggle-value');
    if (toggleValueEl) toggleValueEl.textContent = Calculator.getDefaultExpenses();

    toggle.addEventListener('change', function() {
        if (this.checked) {
            track.style.background = 'var(--gold)';
            thumb.style.transform = 'translateX(20px)';
            label.innerHTML = '₹<span id="expense-toggle-value">' + Calculator.getDefaultExpenses() + '</span> will be added';
        } else {
            track.style.background = '#cbd5e1';
            thumb.style.transform = 'translateX(0px)';
            label.innerHTML = 'Expenses not included';
        }
    });
}

function setupEventListeners() {
    // Menu
    document.getElementById('menu-btn').addEventListener('click', function(e) {
        e.preventDefault();
        showMenu();
    });

    document.getElementById('close-menu').addEventListener('click', function(e) {
        e.preventDefault();
        hideMenu();
    });

    // Profile
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showProfile();
        });
    }
    
    const closeProfileBtn = document.getElementById('close-profile');
    if (closeProfileBtn) {
        closeProfileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            hideProfile();
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
    
    // Commodity selection
    const commodityItems = document.querySelectorAll('.commodity-item');
    commodityItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const commodity = this.getAttribute('data-commodity');
            showCommodityCalculator(commodity);
        });
    });

    // Back to main
    document.getElementById('back-to-main').addEventListener('click', function(e) {
        e.preventDefault();
        showMainCalculator();
    });

    // Back to main from Souff
    const backToMainSouffBtn = document.getElementById('back-to-main-souff');
    if (backToMainSouffBtn) {
        backToMainSouffBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showMainCalculator();
        });
    }

    // Settings
    document.getElementById('settings-btn').addEventListener('click', function(e) {
        e.preventDefault();
        showSettings();
    });
    
    document.getElementById('close-settings').addEventListener('click', function(e) {
        e.preventDefault();
        hideSettings();
    });
    
    document.getElementById('save-settings').addEventListener('click', async function(e) {
        e.preventDefault();
        await saveSettings();
    });

    // Simple Calculator
    document.getElementById('calculate-simple').addEventListener('click', async function(e) {
    e.preventDefault();
    await calculateSimple();
});
    
    document.getElementById('reset-simple').addEventListener('click', function(e) {
        e.preventDefault();
        resetSimple();
    });

    // Mix Calculator
    document.getElementById('calculate-mix').addEventListener('click', async function(e) {
    e.preventDefault();
    await calculateMix();
    });
    
    document.getElementById('reset-mix').addEventListener('click', function(e) {
        e.preventDefault();
        resetMix();
    });

    // Add Purchase Row
    document.getElementById('add-purchase-row').addEventListener('click', function(e) {
        e.preventDefault();
        addPurchaseRow();
    });

    // Listen for input changes to update summary
    document.getElementById('purchase-rows-container').addEventListener('input', function() {
        updatePurchaseSummary();
    });

    // History
    document.getElementById('history-btn').addEventListener('click', async function(e) {
        e.preventDefault();
        await showHistory();
    });

    document.getElementById('close-history').addEventListener('click', function(e) {
        e.preventDefault();
        hideHistory();
    });

    document.getElementById('clear-history').addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (confirm('Are you sure you want to clear all history?')) {
            try {
                await Calculator.clearHistory();
                await displayHistory();
                alert('✅ History cleared successfully!');
            } catch (error) {
                console.error('Error clearing history:', error);
                alert('❌ Failed to clear history');
            }
        }
    });

    // Export and Save - Mix (Commodity Calculator)
    document.getElementById('export-mix-pdf').addEventListener('click', function(e) {
        e.preventDefault();
        exportMixPDF();
    });

    document.getElementById('save-mix-history').addEventListener('click', function(e) {
        e.preventDefault();
        showNameModal();
    });

    // Name/Vakal Modal
    document.getElementById('cancel-name').addEventListener('click', function(e) {
        e.preventDefault();
        hideNameModal();
    });

    document.getElementById('confirm-name').addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        await confirmSaveToHistory();
    });

    // Commodity Filter
    document.getElementById('commodity-filter').addEventListener('change', async function() {
        await displayHistory();
    });

    // Souff Calculator Event Listeners
    document.getElementById('souff-calculate')?.addEventListener('click', async function(e) {
    e.preventDefault();
    await calculateSouff();
    });

    document.getElementById('souff-reset')?.addEventListener('click', function(e) {
        e.preventDefault();
        resetSouff();
    });

    document.getElementById('souff-add-purchase-row')?.addEventListener('click', function(e) {
        e.preventDefault();
        addSouffPurchaseRow();
    });

    // Listen for box weight changes to update total
    document.querySelectorAll('.souff-box-weight').forEach(input => {
        input.addEventListener('input', updateSouffTaiyarWeight);
    });

    // Listen for purchase changes to update summary
    document.getElementById('souff-purchase-rows-container')?.addEventListener('input', function() {
        updateSouffPurchaseSummary();
    });

    // Souff Save to History
    document.getElementById('souff-save-history')?.addEventListener('click', function(e) {
        e.preventDefault();
        showNameModal();
    });
}

// Global variable to store current commodity
let currentCommodity = '';

// Menu functions
function showMenu() {
    document.getElementById('menu-modal').classList.remove('hidden');
}

function hideMenu() {
    document.getElementById('menu-modal').classList.add('hidden');
}

// Navigation functions
function showMainCalculator() {
    currentCommodity = '';
    document.getElementById('simple-calculator').classList.remove('hidden');
    document.getElementById('commodity-calculator').classList.add('hidden');
    document.getElementById('souff-calculator-section').classList.add('hidden');
    document.getElementById('page-title').textContent = 'Commodity Calculator';
    resetMix();
}

function showCommodityCalculator(commodity) {
    currentCommodity = commodity;
    const commodityNames = {
        'jeera': 'Jeera (Cumin)',
        'souff': 'Souff (Fennel)',
        'ajwain': 'Ajwain',
        'isabgul': 'Isabgul'
    };
    
    document.getElementById('simple-calculator').classList.add('hidden');

    // Check if Souff - show special calculator
    if (commodity === 'souff') {
        document.getElementById('commodity-calculator').classList.add('hidden');
        document.getElementById('souff-calculator-section').classList.remove('hidden');
    } else {
        // Show standard calculator for other commodities
        document.getElementById('commodity-calculator').classList.remove('hidden');
        document.getElementById('souff-calculator-section').classList.add('hidden');
    }
    
    document.getElementById('page-title').textContent = commodityNames[commodity] + ' Calculator';
    hideMenu();
    
    // Reset appropriate calculator
    if (commodity === 'souff') {
        resetSouff();
    } else {
        resetMix();
    }
}

// ========================================
// SOUFF CALCULATOR SPECIFIC FUNCTIONS
// ========================================

// Get Souff purchase data
function getSouffPurchaseData() {
    const rows = document.querySelectorAll('.souff-purchase-row');
    const purchases = [];
    
    rows.forEach(row => {
        const weight = parseFloat(row.querySelector('.souff-purchase-weight').value);
        const price = parseFloat(row.querySelector('.souff-purchase-price').value);
        
        if (!isNaN(weight) && !isNaN(price) && weight > 0 && price > 0) {
            purchases.push({ weight, price });
        }
    });
    
    return purchases;
}

// Get Souff box weights
function getSouffBoxWeights() {
    return {
        jadoMal: document.getElementById('souff-box-jado-mal').value,
        recleaning: document.getElementById('souff-box-recleaning').value,
        recleaningBarik: document.getElementById('souff-box-recleaning-barik').value,
        miniJadoMal: document.getElementById('souff-box-mini-jado-mal').value,
        oneNumberBarik: document.getElementById('souff-box-1-number-barik').value,
        twoNumberBarik: document.getElementById('souff-box-2-number-barik').value,
        surbhi: document.getElementById('souff-box-surbhi').value,
        kachoJadoMal: document.getElementById('souff-box-kacho-jado-mal').value
    };
}

// Update Souff Taiyar Weight (auto-calculate)
function updateSouffTaiyarWeight() {
    const boxWeights = getSouffBoxWeights();
    
    const totalTaiyar = 
        (parseFloat(boxWeights.jadoMal) || 0) +
        (parseFloat(boxWeights.recleaning) || 0) +
        (parseFloat(boxWeights.recleaningBarik) || 0) +
        (parseFloat(boxWeights.miniJadoMal) || 0) +
        (parseFloat(boxWeights.oneNumberBarik) || 0) +
        (parseFloat(boxWeights.twoNumberBarik) || 0) +
        (parseFloat(boxWeights.surbhi) || 0) +
        (parseFloat(boxWeights.kachoJadoMal) || 0);
    
    document.getElementById('souff-total-taiyar-weight').textContent = totalTaiyar.toFixed(2) + ' kg';
}

// Update Souff Purchase Summary
function updateSouffPurchaseSummary() {
    const purchases = getSouffPurchaseData();
    const summary = document.getElementById('souff-purchase-summary');
    
    if (purchases.length > 0) {
        let totalWeight = 0;
        purchases.forEach(p => totalWeight += p.weight);
        
        document.getElementById('souff-summary-total-weight').textContent = totalWeight.toFixed(2) + ' kg';
        summary.classList.remove('hidden');
    } else {
        summary.classList.add('hidden');
    }
}

// Add Souff Purchase Row
function addSouffPurchaseRow() {
    const container = document.getElementById('souff-purchase-rows-container');
    
    const newRow = document.createElement('div');
    newRow.className = 'souff-purchase-row mb-3';
    newRow.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:0.65rem;align-items:end;">
            <div>
                <label class="field-label">Weight (kg)</label>
                <input type="number" class="souff-purchase-weight" placeholder="500">
            </div>
            <div>
                <label class="field-label">Price (₹/20kg)</label>
                <input type="number" class="souff-purchase-price" placeholder="4200">
            </div>
            <button class="souff-remove-row remove-btn" title="Remove">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `;
    
    container.appendChild(newRow);
    
    // Add event listener for remove button
    const removeBtn = newRow.querySelector('.souff-remove-row');
    removeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        removeSouffPurchaseRow(newRow);
    });
    
    updateSouffPurchaseSummary();
}

// Remove Souff Purchase Row
function removeSouffPurchaseRow(row) {
    row.remove();
    updateSouffPurchaseSummary();
}

// Calculate Souff (Wastage Only)
async function calculateSouff() {
    const allowed = await PremiumSystem.canCalculate();
    if (!allowed) return;
    const purchases = getSouffPurchaseData();
    const boxWeights = getSouffBoxWeights();
    
    if (purchases.length === 0) {
        alert('Please enter at least one purchase weight and price');
        return;
    }
    
    const result = Calculator.calculateSouff(purchases, boxWeights);
    
    if (result.error) {
        alert(result.error);
        return;
    }
    
    // Display results
    document.getElementById('souff-result-wastage-weight').textContent = result.wastageWeight + ' kg';
    document.getElementById('souff-result-wastage-percent').textContent = result.wastagePercent + '%';
    document.getElementById('souff-result-purchase-weight').textContent = result.totalPurchaseWeight + ' kg';
    document.getElementById('souff-result-taiyar-weight').textContent = result.totalTaiyarWeight + ' kg';
    
    document.getElementById('souff-result').classList.remove('hidden');
    document.getElementById('souff-export-section').classList.remove('hidden');
    await PremiumSystem.incrementUsage();
}

// Reset Souff Calculator
function resetSouff() {
    // Reset to single purchase row
    const container = document.getElementById('souff-purchase-rows-container');
    container.innerHTML = `
        <div class="souff-purchase-row" style="margin-bottom:0.65rem;">
            <div class="field-row">
                <div>
                    <label class="field-label">Weight (kg)</label>
                    <input type="number" class="souff-purchase-weight" placeholder="1000">
                </div>
                <div>
                    <label class="field-label">Price (₹/20kg)</label>
                    <input type="number" class="souff-purchase-price" placeholder="4200">
                </div>
            </div>
        </div>
    `;
    
    // Reset all box weights
    document.getElementById('souff-box-jado-mal').value = '';
    document.getElementById('souff-box-recleaning').value = '';
    document.getElementById('souff-box-recleaning-barik').value = '';
    document.getElementById('souff-box-mini-jado-mal').value = '';
    document.getElementById('souff-box-1-number-barik').value = '';
    document.getElementById('souff-box-2-number-barik').value = '';
    document.getElementById('souff-box-surbhi').value = '';
    document.getElementById('souff-box-kacho-jado-mal').value = '';
    
    // Hide results
    document.getElementById('souff-result').classList.add('hidden');
    document.getElementById('souff-export-section').classList.add('hidden');
    document.getElementById('souff-purchase-summary').classList.add('hidden');
    
    // Reset taiyar weight
    document.getElementById('souff-total-taiyar-weight').textContent = '0 kg';
}

// Save Souff to History
async function saveSouffToHistory(nameVakal) {
    const purchases = getSouffPurchaseData();
    const boxWeights = getSouffBoxWeights();
    
    const result = Calculator.calculateSouff(purchases, boxWeights);
    
    if (result.error) {
        alert(result.error);
        return;
    }
    
    // Prepare data to save - INCLUDE type field
    let saveData = {
        type: 'souff', // ⭐ IMPORTANT: Add type field
        nameVakal: nameVakal,
        commodity: 'souff',
        purchases: purchases,
        boxes: result.boxes,
        totalPurchaseWeight: result.totalPurchaseWeight,
        totalTaiyarWeight: result.totalTaiyarWeight,
        wastageWeight: result.wastageWeight,
        wastagePercent: result.wastagePercent
    };
    
    try {
        await Calculator.saveToHistory('souff', saveData, 'souff');
        alert('✅ Saved to history!');
    } catch (error) {
        console.error('Error saving to history:', error);
        alert('❌ Failed to save: ' + error.message);
        throw error;
    }
}

// Settings functions
function showSettings() {
    document.getElementById('calculator-screen').classList.add('hidden');
    document.getElementById('settings-screen').classList.remove('hidden');
    
    // Load current values
    document.getElementById('default-expenses').value = Calculator.getDefaultExpenses();
    const fontSize = localStorage.getItem('fontSize') || 'medium';
    document.getElementById('font-size').value = fontSize;
}

function hideSettings() {
    document.getElementById('settings-screen').classList.add('hidden');
    document.getElementById('calculator-screen').classList.remove('hidden');
}

async function saveSettings() {
    const expenses = document.getElementById('default-expenses').value;
    const fontSize = document.getElementById('font-size').value;
    
    try {
        // Save expenses (now syncs to cloud if logged in)
        if (await Calculator.setDefaultExpenses(expenses)) {
            // Save font size
            if (API.isLoggedIn()) {
                try {
                    await API.updateSettings(expenses, fontSize);
                } catch (error) {
                    console.error('Error saving settings to cloud:', error);
                    // Continue anyway - saved locally
                }
            } else {
                localStorage.setItem('fontSize', fontSize);
            }
            
            applyFontSize(fontSize);
            hideSettings();
            alert('✅ Settings saved successfully!');
        } else {
            alert('Please enter a valid positive number for expenses');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('❌ Failed to save settings');
    }
}

function loadSettings() {
    const savedExpenses = localStorage.getItem('defaultExpenses');
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    
    if (savedExpenses) {
        Calculator.setDefaultExpenses(savedExpenses);
    }
    
    applyFontSize(savedFontSize);
}

function applyFontSize(size) {
    const container = document.getElementById('calculator-container');
    container.className = container.className.replace(/font-\w+/g, '');
    container.classList.add('font-' + size);
}

// Simple Calculator functions
async function calculateSimple() {
    const purchasePrice = document.getElementById('purchase-price').value;
    const wastagePercent = document.getElementById('wastage-percent').value;
    const allowed = await PremiumSystem.canCalculate();
    if (!allowed) return;
    
    const toggleEl = document.getElementById('include-expenses-toggle');
    const includeExpenses = toggleEl ? toggleEl.checked : true;
    const result = Calculator.calculateSimple(purchasePrice, wastagePercent, includeExpenses);
    
    if (result.error) {
        alert(result.error);
        return;
    }
    
    // Display result
    document.getElementById('result-purchase-price').textContent = '₹' + result.purchasePrice;
    document.getElementById('result-total-costing').textContent = '₹' + result.totalCosting;
    document.getElementById('result-expenses-row').style.display = includeExpenses ? 'flex' : 'none';
    document.getElementById('result-expenses').textContent = '₹' + result.expenses;
    document.getElementById('simple-result').classList.remove('hidden');
    await PremiumSystem.incrementUsage();
}

function resetSimple() {
    document.getElementById('purchase-price').value = '';
    document.getElementById('wastage-percent').value = '';
    document.getElementById('simple-result').classList.add('hidden');
}

// Purchase Row Management
function addPurchaseRow() {
    const container = document.getElementById('purchase-rows-container');
    
    const newRow = document.createElement('div');
    newRow.className = 'purchase-row mb-3';
    newRow.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:0.65rem;align-items:end;">
            <div>
                <label class="field-label">Weight (kg)</label>
                <input type="number" class="purchase-weight" placeholder="500">
            </div>
            <div>
                <label class="field-label">Price (₹/20kg)</label>
                <input type="number" class="purchase-price" placeholder="4200">
            </div>
            <button class="remove-row remove-btn" title="Remove">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `;
    
    container.appendChild(newRow);
    
    // Add event listener for remove button
    const removeBtn = newRow.querySelector('.remove-row');
    removeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        removePurchaseRow(newRow);
    });
    
    updatePurchaseSummary();
}

function removePurchaseRow(row) {
    row.remove();
    updatePurchaseSummary();
}

function updatePurchaseSummary() {
    const rows = document.querySelectorAll('.purchase-row');
    const summary = document.getElementById('purchase-summary');
    
    // Show summary only if there are 2 or more rows
    if (rows.length > 1) {
        let totalWeight = 0;
        let weightedSum = 0;
        let hasValues = false;
        
        rows.forEach(row => {
            const weight = parseFloat(row.querySelector('.purchase-weight').value) || 0;
            const price = parseFloat(row.querySelector('.purchase-price').value) || 0;
            
            if (weight > 0 && price > 0) {
                hasValues = true;
                totalWeight += weight;
                weightedSum += (weight * price) / 20;
            }
        });
        
        if (hasValues && totalWeight > 0) {
            const avgPrice = (weightedSum / totalWeight) * 20;
            document.getElementById('summary-total-weight').textContent = totalWeight.toFixed(2) + ' kg';
            document.getElementById('summary-avg-price').textContent = '₹' + avgPrice.toFixed(2);
            summary.classList.remove('hidden');
        } else {
            summary.classList.add('hidden');
        }
    } else {
        summary.classList.add('hidden');
    }
}

// Get purchase data from all rows
function getPurchaseData() {
    const rows = document.querySelectorAll('.purchase-row');
    const purchases = [];
    
    rows.forEach(row => {
        const weight = parseFloat(row.querySelector('.purchase-weight').value);
        const price = parseFloat(row.querySelector('.purchase-price').value);
        
        if (!isNaN(weight) && !isNaN(price) && weight > 0 && price > 0) {
            purchases.push({ weight, price });
        }
    });
    
    return purchases;
}

// Mix Calculator functions
async function calculateMix() {
    const allowed = await PremiumSystem.canCalculate();
    if (!allowed) return;
    const purchases = getPurchaseData();
    const taiyarWeight = document.getElementById('taiyar-weight').value;
    const recleaningWeight = document.getElementById('recleaning-weight').value;
    const recleaningPrice = document.getElementById('recleaning-price').value;
    
    if (purchases.length === 0) {
        alert('Please enter at least one purchase weight and price');
        return;
    }
    
    const result = Calculator.calculateCombinedMultiple(purchases, taiyarWeight, recleaningWeight, recleaningPrice);
    
    if (result.error) {
        alert(result.error);
        return;
    }
    
    // Check if 1 Number Costing is calculated
    const hasOneNumber = result.oneNumberCosting !== undefined;

    // Display wastage (Always show)
    document.getElementById('result-wastage-weight').textContent = result.wastageWeight;
    document.getElementById('result-wastage-percent').textContent = result.wastagePercent;
    
    // Display results
    document.getElementById('result-aakho-palo').textContent = '₹' + result.aakhoPaloCosting;
    
    if (hasOneNumber) {
        // Show 1 Number, hide Aakho Palo
        document.getElementById('result-one-number').textContent = '₹' + result.oneNumberCosting;
        document.getElementById('aakho-palo-result').classList.add('hidden');
        document.getElementById('one-number-result').classList.remove('hidden');
    } else {
        // Show Aakho Palo, hide 1 Number
        document.getElementById('aakho-palo-result').classList.remove('hidden');
        document.getElementById('one-number-result').classList.add('hidden');
    }
    
    document.getElementById('mix-result').classList.remove('hidden');
    document.getElementById('mix-export-section').classList.remove('hidden');
    await PremiumSystem.incrementUsage();
}

function resetMix() {
    // Reset to single rowawait PremiumSystem.incrementUsage();
    const container = document.getElementById('purchase-rows-container');
    container.innerHTML = `
        <div class="purchase-row" style="margin-bottom:0.65rem;">
            <div class="field-row">
                <div>
                    <label class="field-label">Weight (kg)</label>
                    <input type="number" class="purchase-weight" placeholder="1000">
                </div>
                <div>
                    <label class="field-label">Price (₹/20kg)</label>
                    <input type="number" class="purchase-price" placeholder="4200">
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('taiyar-weight').value = '';
    document.getElementById('recleaning-weight').value = '';
    document.getElementById('recleaning-price').value = '';
    document.getElementById('mix-result').classList.add('hidden');
    document.getElementById('purchase-summary').classList.add('hidden');
    document.getElementById('mix-export-section').classList.add('hidden');
}

// When opening profile modal, fetch and show subscription
async function openProfileModal() {
    document.getElementById('profile-modal').classList.remove('hidden');

    try {
        const token = localStorage.getItem('access_token');
        const res = await fetch('https://commodity-calculator-api.onrender.com/api/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        console.log('Profile API response:', data); // keep this for now
        if (!data.success) return;

        const user = data.user;

        // Fill basic info — try all possible field names
        document.getElementById('profile-email').textContent = user.email || '—';
        document.getElementById('profile-display-name').textContent = user.display_name || user.name || '—';
        document.getElementById('profile-created').textContent = user.joined || user.created_at || '—';

        // Show correct badge
        if (user.subscription_tier === 'premium') {
            document.getElementById('profile-badge-premium').classList.remove('hidden');
            document.getElementById('profile-badge-free').classList.add('hidden');
            document.getElementById('profile-expiry').textContent = user.premium_expiry || user.subscription_expires || '—';

            if (user.premium_expiry) {
                const diff = Math.ceil((new Date(user.premium_expiry) - new Date()) / 86400000);
                const el = document.getElementById('profile-days-left');
                el.textContent = diff > 0 ? `${diff} days left` : 'Expired';
                if (diff <= 30) el.style.color = '#fca5a5';
            }
        } else {
            document.getElementById('profile-badge-free').classList.remove('hidden');
            document.getElementById('profile-badge-premium').classList.add('hidden');
            const remaining = window._userUsage?.calculations_remaining;
            const limit = window._userUsage?.calculations_limit;
            if (remaining !== undefined) {
                document.getElementById('profile-calcs-left').textContent =
                    `${remaining} of ${limit} calculations remaining`;
            }
        }

    } catch (err) {
        console.error('Profile load error:', err);
    }
}

// History functions
async function showHistory() {
    try {
        document.getElementById('calculator-screen').classList.add('hidden');
        document.getElementById('history-screen').classList.remove('hidden');
        
        const filterContainer = document.getElementById('commodity-filter-container');
        const filter = document.getElementById('commodity-filter');
        
        if (currentCommodity) {
            filterContainer.classList.add('hidden');
            filter.value = currentCommodity;
        } else {
            filterContainer.classList.remove('hidden');
            filter.value = 'all';
        }
        
        await displayHistory();
    } catch (error) {
        console.error('Error showing history:', error);
        alert('❌ Failed to load history');
    }
}

function hideHistory() {
    document.getElementById('history-screen').classList.add('hidden');
    document.getElementById('calculator-screen').classList.remove('hidden');
}

async function displayHistory() {
    try {
        const history = await Calculator.getHistory();
        const historyList = document.getElementById('history-list');
        const historyEmpty = document.getElementById('history-empty');
        const filter = document.getElementById('commodity-filter').value;

        console.log('📊 All history loaded:', history);
        console.log('📊 Number of items:', history.length);

        // Check if empty
        if (!history || history.length === 0) {
            historyEmpty.classList.remove('hidden');
            historyList.innerHTML = '';
            return;
        }

        historyEmpty.classList.add('hidden');

        // Filter history based on selected commodity
        let filteredHistory = history;
        if (filter && filter !== 'all') {
            filteredHistory = history.filter(item => {
                if (filter === 'simple') {
                    return item.type === 'simple';
                } else if (filter === 'souff') {
                    // Check both type and commodity for souff
                    return item.type === 'souff' || item.commodity === 'souff';
                } else {
                    // For other commodities (jeera, ajwain, isabgul)
                    return item.commodity === filter;
                }
            });
        }

        console.log('📊 Filtered history:', filteredHistory.length, 'items');
        console.log('📊 Filtered items:', filteredHistory);
        
        // Render items
        if (filteredHistory.length === 0) {
            historyList.innerHTML = '<p class="text-center text-gray-500 py-8">No calculations match this filter</p>';
        } else {
            const htmlParts = [];
            filteredHistory.forEach(item => {
                const html = renderHistoryItem(item);
                console.log('📊 Generated HTML for item:', html.substring(0, 100) + '...');
                htmlParts.push(html);
            });
            
            const finalHTML = htmlParts.join('');
            console.log('📊 Total HTML length:', finalHTML.length);
            historyList.innerHTML = finalHTML;
            console.log('📊 HTML inserted into DOM');
        }
        
    } catch (error) {
        console.error('Error displaying history:', error);
        const historyList = document.getElementById('history-list');
        const historyEmpty = document.getElementById('history-empty');
        if (historyList && historyEmpty) {
            historyList.innerHTML = '';
            historyEmpty.classList.remove('hidden');
        }
    }
}

function renderHistoryItem(item) {
    console.log('🎨 Rendering:', 'type:', item.type, '| commodity:', item.commodity, '| Data:', item.data);
    
    const date = new Date(item.created_at || item.timestamp).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const commodityNames = {
        'jeera': 'Jeera (Cumin)',
        'souff': 'Souff (Fennel)',
        'ajwain': 'Ajwain',
        'isabgul': 'Isabgul'
    };
    
    const commodityName = item.commodity ? commodityNames[item.commodity] : 'Simple Calculator';
    
    // Determine type - if type is empty/undefined, use commodity field
    let calculationType = item.type;
    
    if (!calculationType || calculationType === '') {
        if (item.commodity === 'souff') {
            calculationType = 'souff';
        } else if (item.commodity) {
            calculationType = 'mix';
        } else {
            calculationType = 'simple';
        }
    }
    
    console.log('🎯 Calculated type:', calculationType);
    
    let detailsHTML = '';
    
    // Handle different calculation types
    if (calculationType === 'souff') {
        console.log('✅ Rendering Souff item:', item.data);
        
        // Build purchase details
        let purchaseHTML = '';
        if (item.data.purchases && item.data.purchases.length > 0) {
            const purchaseItems = item.data.purchases.map((p, i) => 
                `<div class="flex justify-between text-xs">
                    <span class="text-gray-600">• ${p.weight} kg @ ₹${p.price}/20kg</span>
                </div>`
            ).join('');
            
            purchaseHTML = `
                <div class="mb-3 pb-3 border-b border-gray-300">
                    <div class="font-semibold text-gray-700 mb-2 text-sm">Purchases:</div>
                    ${purchaseItems}
                    <div class="flex justify-between mt-2 pt-2 border-t border-gray-200">
                        <span class="text-gray-700 font-semibold text-sm">Total:</span>
                        <span class="font-bold text-gray-800">${item.data.totalPurchaseWeight || 'N/A'} kg</span>
                    </div>
                </div>
            `;
        }
        
        // Build box details
        let boxHTML = '';
        if (item.data.boxes) {
            const boxes = item.data.boxes;
            const boxItems = [];
            
            if (boxes.jadoMal && boxes.jadoMal > 0) boxItems.push(`<div>Jado Mal: <span class="font-semibold">${boxes.jadoMal} kg</span></div>`);
            if (boxes.recleaning && boxes.recleaning > 0) boxItems.push(`<div>Recleaning: <span class="font-semibold">${boxes.recleaning} kg</span></div>`);
            if (boxes.recleaningBarik && boxes.recleaningBarik > 0) boxItems.push(`<div>Recleaning Barik: <span class="font-semibold">${boxes.recleaningBarik} kg</span></div>`);
            if (boxes.miniJadoMal && boxes.miniJadoMal > 0) boxItems.push(`<div>Mini Jado Mal: <span class="font-semibold">${boxes.miniJadoMal} kg</span></div>`);
            if (boxes.oneNumberBarik && boxes.oneNumberBarik > 0) boxItems.push(`<div>1 Number Barik: <span class="font-semibold">${boxes.oneNumberBarik} kg</span></div>`);
            if (boxes.twoNumberBarik && boxes.twoNumberBarik > 0) boxItems.push(`<div>2 Number Barik: <span class="font-semibold">${boxes.twoNumberBarik} kg</span></div>`);
            if (boxes.surbhi && boxes.surbhi > 0) boxItems.push(`<div>Surbhi: <span class="font-semibold">${boxes.surbhi} kg</span></div>`);
            if (boxes.kachoJadoMal && boxes.kachoJadoMal > 0) boxItems.push(`<div>Kacho Jado Mal: <span class="font-semibold">${boxes.kachoJadoMal} kg</span></div>`);
            
            if (boxItems.length > 0) {
                boxHTML = `
                    <div class="mb-3 pb-3 border-b border-gray-300">
                        <div class="font-semibold text-gray-700 mb-2 text-sm">Boxes (Taiyar):</div>
                        <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600">
                            ${boxItems.join('')}
                        </div>
                        <div class="flex justify-between mt-2 pt-2 border-t border-gray-200">
                            <span class="text-gray-700 font-semibold text-sm">Total:</span>
                            <span class="font-bold text-green-600">${item.data.totalTaiyarWeight || 'N/A'} kg</span>
                        </div>
                    </div>
                `;
            }
        }
        
        // Result section with wastage
        detailsHTML = `
            <div class="text-sm">
                ${purchaseHTML}
                ${boxHTML}
                
                <!-- Result Section -->
                <div class="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-3 border-2 border-red-200">
                    <div class="font-semibold text-gray-700 mb-2">Result:</div>
                    <div class="flex justify-between items-center">
                        <span class="text-red-700 font-semibold">❌ Wastage:</span>
                        <div class="text-right">
                            <div class="text-xl font-bold text-red-600">${item.data.wastageWeight || 'N/A'} kg</div>
                            <div class="text-sm text-red-600">(${item.data.wastagePercent || 'N/A'}%)</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (calculationType === 'simple') {
        detailsHTML = `
            <div style="font-size:0.875rem;">
                <div style="display:flex;justify-content:space-between;margin-bottom:0.35rem;">
                    <span style="color:var(--slate);">Purchase Price</span>
                    <span style="font-weight:600;color:var(--navy);">₹${item.data.purchasePrice || 'N/A'}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:0.35rem;">
                    <span style="color:var(--slate);">Wastage</span>
                    <span style="font-weight:600;color:var(--navy);">${item.data.wastagePercent || 'N/A'}%</span>
                </div>
                <div style="display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:0.4rem;margin-top:0.1rem;">
                    <span style="font-weight:700;color:var(--navy);">Total Costing</span>
                    <span style="font-weight:800;color:#92710c;font-size:1rem;">₹${item.data.totalCosting || 'N/A'}</span>
                </div>
            </div>
        `;
    } else if (calculationType === 'mix') {
        detailsHTML = `
            <div style="font-size:0.875rem;">
                <div style="display:flex;justify-content:space-between;margin-bottom:0.35rem;">
                    <span style="color:var(--slate);">Total Weight</span>
                    <span style="font-weight:600;color:var(--navy);">${item.data.totalWeight || 'N/A'} kg</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:0.35rem;">
                    <span style="color:var(--slate);">Taiyar Weight</span>
                    <span style="font-weight:600;color:var(--navy);">${item.data.taiyarWeight || 'N/A'} kg</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:0.35rem;">
                    <span style="color:var(--slate);">Wastage</span>
                    <span style="font-weight:600;color:#92400e;">${item.data.wastageWeight || 'N/A'} kg (${item.data.wastagePercent || 'N/A'}%)</span>
                </div>
                <div style="display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:0.4rem;margin-top:0.1rem;">
                    <span style="font-weight:700;color:var(--navy);">Aakho Palo Costing</span>
                    <span style="font-weight:800;color:#1d4ed8;font-size:1rem;">₹${item.data.aakhoPaloCosting || 'N/A'}</span>
                </div>
                ${item.data.oneNumberCosting ? `
                <div style="display:flex;justify-content:space-between;margin-top:0.35rem;">
                    <span style="font-weight:700;color:var(--navy);">1 Number Costing</span>
                    <span style="font-weight:800;color:#7c3aed;font-size:1rem;">₹${item.data.oneNumberCosting}</span>
                </div>` : ''}
            </div>
        `;
    } else {
        console.error('❌ Unknown type:', calculationType);
        detailsHTML = `<p class="text-red-500 text-sm">Unknown calculation type: ${calculationType}</p>`;
    }
    
    return `
        <div class="history-item">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.65rem;">
                <div>
                    <h3 class="history-meta" style="font-weight:700;font-size:0.95rem;color:var(--navy);">${item.data.nameVakal || 'Unnamed'}</h3>
                    <span class="commodity-tag">${commodityName}</span>
                    <p style="font-size:0.75rem;color:var(--slate);margin-top:4px;">${date}</p>
                </div>
                <button onclick="deleteHistoryItem(${item.id})" style="background:none;border:none;color:#ef4444;cursor:pointer;padding:4px;border-radius:4px;" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
            <div style="border-top:1px solid var(--border);padding-top:0.65rem;">
                ${detailsHTML}
            </div>
        </div>
    `;
}

// Make deleteHistoryItem available globally
window.deleteHistoryItem = async function(id) {
    if (confirm('Delete this calculation?')) {
        try {
            await Calculator.deleteHistoryEntry(id);
            await displayHistory();
        } catch (error) {
            console.error('Error deleting history:', error);
            alert('❌ Failed to delete calculation');
        }
    }
};

// Name/Vakal Modal functions
function showNameModal() {
    document.getElementById('name-vakal-input').value = '';
    document.getElementById('name-modal').classList.remove('hidden');
}

function hideNameModal() {
    document.getElementById('name-modal').classList.add('hidden');
}

async function confirmSaveToHistory() {
    const nameVakal = document.getElementById('name-vakal-input').value.trim();
    
    if (!nameVakal) {
        alert('❌ Name/Vakal is required!');
        return;
    }
    
    try {
        // Check which calculator is active
        if (currentCommodity === 'souff') {
            await saveSouffToHistory(nameVakal);
        } else {
            await saveMixToHistory(nameVakal);
        }
        hideNameModal();
    } catch (error) {
        console.error('Error confirming save:', error);
        alert('❌ Failed to save calculation');
    }
}

// Save to history functions
async function saveMixToHistory(nameVakal) {
    const purchases = getPurchaseData();
    const taiyarWeight = document.getElementById('taiyar-weight').value;
    const recleaningWeight = document.getElementById('recleaning-weight').value;
    const recleaningPrice = document.getElementById('recleaning-price').value;
    
    // Get result from calculator
    const result = Calculator.calculateCombinedMultiple(purchases, taiyarWeight, recleaningWeight, recleaningPrice);
    
    if (result.error) {
        alert(result.error);
        return;
    }
    
    // Prepare data to save
    let saveData = {
        nameVakal: nameVakal,
        commodityKey: currentCommodity,
        purchases: purchases,
        totalWeight: result.totalWeight,
        avgPrice: result.avgPrice,
        beforeCleaningCosting: result.beforeCleaningCosting,
        taiyarWeight: result.taiyarWeight,
        wastageWeight: result.wastageWeight,
        wastagePercent: result.wastagePercent,
        aakhoPaloCosting: result.aakhoPaloCosting
    };
    
    // Add recleaning data if available
    if (result.oneNumberCosting) {
        saveData.recleaningWeight = result.recleaningWeight;
        saveData.recleaningPrice = result.recleaningPrice;
        saveData.oneNumberCosting = result.oneNumberCosting;
    }
    
    try {
        await Calculator.saveToHistory('mix', saveData, currentCommodity);
        alert('✅ Saved to history!');
    } catch (error) {
        console.error('Error saving to history:', error);
        alert('❌ Failed to save: ' + error.message);
        throw error;
    }
}

// Profile functions
function showProfile() {
    openProfileModal(); // just call the function that fetches API + shows premium badge
}

function hideProfile() {
    const profileModal = document.getElementById('profile-modal');
    if (profileModal) {
        profileModal.classList.add('hidden');
    }
}

// Logout function
async function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            await API.logout();
        } catch (error) {
            console.error('Logout error:', error);
            TokenManager.clearTokens();
            window.location.href = 'login.html';
        }
    }
}

// PDF Export functions
function exportMixPDF() {
    try {
        const commodityNames = {
            'jeera': 'Jeera (Cumin)',
            'souff': 'Souff (Fennel)',
            'ajwain': 'Ajwain',
            'isabgul': 'Isabgul'
        };
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const purchases = getPurchaseData();
        const taiyarWeight = document.getElementById('taiyar-weight').value;
        const recleaningWeight = document.getElementById('recleaning-weight').value;
        const recleaningPrice = document.getElementById('recleaning-price').value;
        const date = new Date().toLocaleString();
        
        const result = Calculator.calculateCombinedMultiple(purchases, taiyarWeight, recleaningWeight, recleaningPrice);
        
        if (result.error) {
            alert(result.error);
            return;
        }
        
        // Title
        doc.setFontSize(20);
        doc.text('Commodity Calculator', 105, 20, { align: 'center' });
        
        doc.setFontSize(16);
        doc.text(commodityNames[currentCommodity] + ' Report', 105, 30, { align: 'center' });
        
        // Date
        doc.setFontSize(10);
        doc.text(`Generated: ${date}`, 105, 40, { align: 'center' });
        
        // Line
        doc.line(20, 45, 190, 45);
        
        // Content
        doc.setFontSize(12);
        let y = 60;
        
        // Purchase Details
        if (purchases.length > 1) {
            doc.setFont(undefined, 'bold');
            doc.text('Purchase Details:', 30, y);
            doc.setFont(undefined, 'normal');
            y += 8;
            
            purchases.forEach((p, i) => {
                doc.text(`  Purchase ${i + 1}:`, 35, y);
                doc.text(`${p.weight} kg @ ₹${p.price}`, 150, y, { align: 'right' });
                y += 7;
            });
            
            y += 3;
        }
        
        doc.text('Total Purchase Weight:', 30, y);
        doc.text(`${result.totalWeight} kg`, 150, y, { align: 'right' });
        
        y += 10;
        doc.text('Weighted Avg Price (per 20kg):', 30, y);
        doc.text(`₹${result.avgPrice}`, 150, y, { align: 'right' });
        
        y += 10;
        doc.text('Default Expenses:', 30, y);
        doc.text(`₹${Calculator.getDefaultExpenses()}`, 150, y, { align: 'right' });
        
        y += 10;
        doc.text('Before Cleaning Costing:', 30, y);
        doc.text(`₹${result.beforeCleaningCosting}`, 150, y, { align: 'right' });
        
        y += 10;
        doc.text('Taiyar Weight:', 30, y);
        doc.text(`${result.taiyarWeight} kg`, 150, y, { align: 'right' });
        
        y += 10;
        doc.text(`Wastage Weight:`, 30, y);
        doc.text(`${result.wastageWeight} kg (${result.wastagePercent}%)`, 150, y, { align: 'right' });
        
        // Recleaning details if available
        if (result.oneNumberCosting) {
            y += 10;
            doc.text('Recleaning Weight:', 30, y);
            doc.text(`${result.recleaningWeight} kg`, 150, y, { align: 'right' });
            
            y += 10;
            doc.text('Recleaning Price:', 30, y);
            doc.text(`₹${result.recleaningPrice}`, 150, y, { align: 'right' });
        }
        
        // Line
        y += 10;
        doc.line(20, y, 190, y);
        
        // Results
        y += 15;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        
        if (result.oneNumberCosting) {
            doc.text('1 Number Costing (per 20kg):', 30, y);
            doc.text(`₹${result.oneNumberCosting}`, 150, y, { align: 'right' });
        } else {
            doc.text('Aakho Palo Costing (per 20kg):', 30, y);
            doc.text(`₹${result.aakhoPaloCosting}`, 150, y, { align: 'right' });
        }
        
        // Save
        const fileName = `${commodityNames[currentCommodity].replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        doc.save(fileName);
        
    } catch (error) {
        console.error('Error exporting PDF:', error);
        alert('❌ Failed to export PDF');
    }
}