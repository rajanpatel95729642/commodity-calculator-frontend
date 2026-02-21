// ════════════════════════════════════════════════════════════════
//  PREMIUM SYSTEM - Glassmorphism Popup + Payment Flow
//  Place in: commodity-calculator-frontend/js/premium_system.js
// ════════════════════════════════════════════════════════════════

// ⚠️ CONFIGURE YOUR PAYMENT DETAILS HERE
const PAYMENT_CONFIG = {
    upiId: '9898547678@axl',              // ← YOUR UPI ID
    qrCodeUrl: 'assets/payment-qr.png', // ← PATH TO YOUR QR CODE IMAGE
    whatsappNumber: '919898547678',     // ← YOUR WHATSAPP (country code, no + or spaces)
    amount: 1199,
    merchantName: 'Commodity Calculator'
};

const PremiumSystem = {
    
    // Check usage and show banner/popup
    async checkUsageAndShow() {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            const res = await fetch('https://commodity-calculator-api.onrender.com/api/admin/usage', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) return;
            
            const data = await res.json();
            if (!data.success) return;

            const usage = data.usage;
            window._userUsage = usage;

            // Don't show anything if monetization OFF or user is premium
            if (!usage.monetization_enabled || usage.subscription_tier === 'premium') {
                this.hideBanner();
                return;
            }

            // Show banner if usage exists
            if (usage.calculations_remaining !== 'unlimited') {
                this.showBanner(usage);
            }

        } catch (err) {
            console.log('Usage check failed:', err);
        }
    },

    // Top banner (Style A)
    showBanner(usage) {
        const existing = document.getElementById('premium-banner');
        if (existing) existing.remove();

        const used = usage.calculations_used;
        const limit = usage.calculations_limit;
        const remaining = usage.calculations_remaining;
        const resetDate = usage.reset_date ? new Date(usage.reset_date).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'}) : 'next year';

        let bgColor, emoji, message;

        if (remaining === 0) {
            bgColor = 'bg-red-50 border-red-200';
            emoji = '🚫';
            message = `Used all <strong>${limit}</strong> free calculations. Resets <strong>${resetDate}</strong>`;
        } else if (remaining <= 2) {
            bgColor = 'bg-yellow-50 border-yellow-200';
            emoji = '⚠️';
            message = `Only <strong>${remaining}</strong> calculation${remaining === 1 ? '' : 's'} left (${used}/${limit} used)`;
        } else {
            bgColor = 'bg-blue-50 border-blue-200';
            emoji = 'ℹ️';
            message = `Free Plan: <strong>${used}/${limit}</strong> calculations used`;
        }

        const banner = document.createElement('div');
        banner.id = 'premium-banner';
        banner.className = `fixed top-0 left-0 right-0 z-50 border-b px-4 py-3 ${bgColor} flex items-center justify-between shadow-sm`;
        banner.innerHTML = `
            <div class="flex items-center gap-3 text-sm text-gray-700">
                <span class="text-lg">${emoji}</span>
                <span>${message}</span>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="PremiumSystem.showUpgradePopup()" 
                    class="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg whitespace-nowrap">
                    💎 Get Premium ₹${PAYMENT_CONFIG.amount}/yr
                </button>
                <button onclick="this.parentElement.parentElement.remove()" 
                    class="text-gray-400 hover:text-gray-600 text-xl leading-none p-1">✕</button>
            </div>`;

        document.body.insertBefore(banner, document.body.firstChild);
        
        // Add padding to body so content doesn't hide under banner
        document.body.style.paddingTop = banner.offsetHeight + 'px';
    },

    hideBanner() {
        const b = document.getElementById('premium-banner');
        if (b) {
            b.remove();
            document.body.style.paddingTop = '0';
        }
    },

    // Check if user can calculate (call BEFORE saving calculation)
    async canCalculate() {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return true;

            const res = await fetch('https://commodity-calculator-api.onrender.com/api/admin/usage', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) return true;
            
            const data = await res.json();
            if (!data.success) return true;

            const usage = data.usage;
            window._userUsage = usage;

            // Allow if monetization OFF or premium
            if (!usage.monetization_enabled || usage.subscription_tier === 'premium') return true;
            if (usage.calculations_remaining === 'unlimited') return true;
            if (usage.calculations_remaining > 0) return true;

            // BLOCKED - show glassmorphism popup
            this.showLimitReachedPopup(usage);
            return false;

        } catch (err) {
            console.error('Usage check failed:', err);
            return true; // Allow if check fails
        }
    },

    async incrementUsage() {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        await fetch('https://commodity-calculator-api.onrender.com/api/user/increment-usage', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        await this.checkUsageAndShow(); // refresh banner
    } catch (err) {
        console.log('Increment failed:', err);
    }
},

    // Glassmorphism Limit Reached Popup (blocks calculation)
    showLimitReachedPopup(usage) {
        const resetDate = usage.reset_date 
            ? new Date(usage.reset_date).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'}) 
            : 'next year';

        const existing = document.getElementById('limit-popup');
        if (existing) existing.remove();

        const popup = document.createElement('div');
        popup.id = 'limit-popup';
        popup.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
        popup.style.backdropFilter = 'blur(12px)';
        popup.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
        
        popup.innerHTML = `
            <div class="glassmorphism-card max-w-md w-full overflow-hidden animate-popup-in">
                <!-- Header with gradient -->
                <div class="bg-gradient-to-br from-red-500 to-red-600 px-6 py-6 text-center relative overflow-hidden">
                    <div class="absolute inset-0 opacity-20">
                        <div class="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-2xl -translate-x-16 -translate-y-16"></div>
                        <div class="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl translate-x-16 translate-y-16"></div>
                    </div>
                    <div class="relative">
                        <div class="text-5xl mb-2">🚫</div>
                        <h2 class="text-2xl font-bold text-white">Yearly Limit Reached</h2>
                        <p class="text-red-100 text-sm mt-1">You've used all ${usage.calculations_limit} free calculations</p>
                    </div>
                </div>

                <!-- Body -->
                <div class="p-6 bg-white/95 backdrop-blur-xl">
                    <!-- Reset Date Box -->
                    <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-4 text-center border border-gray-200">
                        <p class="text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Your limit resets on</p>
                        <p class="text-xl font-bold text-gray-800">${resetDate}</p>
                    </div>

                    <p class="text-center text-sm text-gray-500 mb-4">Or upgrade to Premium for unlimited access</p>

                    <!-- Premium Features -->
                    <div class="space-y-2 mb-5">
                        <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 transition-colors">
                            <div class="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                <span class="text-white text-xs font-bold">✓</span>
                            </div>
                            <span class="text-sm text-gray-700 font-medium">Unlimited calculations per year</span>
                        </div>
                        <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 transition-colors">
                            <div class="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                <span class="text-white text-xs font-bold">✓</span>
                            </div>
                            <span class="text-sm text-gray-700 font-medium">Unlimited history items</span>
                        </div>
                        <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 transition-colors">
                            <div class="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                <span class="text-white text-xs font-bold">✓</span>
                            </div>
                            <span class="text-sm text-gray-700 font-medium">PDF export enabled</span>
                        </div>
                        <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 transition-colors">
                            <div class="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                <span class="text-white text-xs font-bold">✓</span>
                            </div>
                            <span class="text-sm text-gray-700 font-medium">No limits, no banners</span>
                        </div>
                    </div>

                    <!-- Price Tag -->
                    <div class="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-4 text-center mb-4 relative overflow-hidden">
                        <div class="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                        <div class="relative">
                            <span class="text-3xl font-bold text-white drop-shadow-lg">₹${PAYMENT_CONFIG.amount}</span>
                            <span class="text-white text-sm font-medium ml-1">/ year</span>
                            <p class="text-yellow-50 text-xs mt-1">Less than ₹${Math.floor(PAYMENT_CONFIG.amount/12)}/month!</p>
                        </div>
                    </div>

                    <!-- Buttons -->
                    <button onclick="PremiumSystem.showPaymentModal()" 
                        class="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold py-3.5 rounded-xl mb-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                        💎 Upgrade to Premium — ₹${PAYMENT_CONFIG.amount}/yr
                    </button>
                    <button onclick="document.getElementById('limit-popup').remove()" 
                        class="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-3 rounded-xl text-sm transition-colors">
                        I'll wait until ${resetDate}
                    </button>
                </div>
            </div>`;

        document.body.appendChild(popup);
    },

    // Upgrade Popup (from banner button)
    showUpgradePopup() {
        const usage = window._userUsage || {};
        
        const existing = document.getElementById('upgrade-popup');
        if (existing) existing.remove();

        const popup = document.createElement('div');
        popup.id = 'upgrade-popup';
        popup.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
        popup.style.backdropFilter = 'blur(12px)';
        popup.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
        
        popup.innerHTML = `
            <div class="glassmorphism-card max-w-md w-full overflow-hidden animate-popup-in">
                <!-- Header -->
                <div class="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 px-6 py-6 text-center relative overflow-hidden">
                    <div class="absolute inset-0">
                        <div class="absolute top-0 left-1/4 w-24 h-24 bg-white rounded-full blur-2xl opacity-20 animate-float"></div>
                        <div class="absolute bottom-0 right-1/4 w-32 h-32 bg-white rounded-full blur-2xl opacity-20 animate-float-delayed"></div>
                    </div>
                    <div class="relative">
                        <div class="text-5xl mb-2 animate-bounce-slow">💎</div>
                        <h2 class="text-2xl font-bold text-white drop-shadow-md">Go Premium</h2>
                        <p class="text-yellow-100 text-sm mt-1">Unlock unlimited access</p>
                    </div>
                </div>

                <!-- Body -->
                <div class="p-6 bg-white/95 backdrop-blur-xl">
                    <!-- Feature Cards -->
                    <div class="space-y-3 mb-5">
                        <div class="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                            <span class="text-2xl">♾️</span>
                            <div>
                                <div class="font-semibold text-sm text-gray-800">Unlimited Calculations</div>
                                <div class="text-xs text-gray-500">No yearly limit ever</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                            <span class="text-2xl">💾</span>
                            <div>
                                <div class="font-semibold text-sm text-gray-800">Unlimited History</div>
                                <div class="text-xs text-gray-500">Save as many as you want</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                            <span class="text-2xl">📄</span>
                            <div>
                                <div class="font-semibold text-sm text-gray-800">PDF Export</div>
                                <div class="text-xs text-gray-500">Download your calculations</div>
                            </div>
                        </div>
                    </div>

                    <!-- Price -->
                    <div class="text-center mb-5">
                        <div class="text-4xl font-bold text-gray-800">₹${PAYMENT_CONFIG.amount}<span class="text-lg font-normal text-gray-500">/year</span></div>
                        <div class="text-xs text-gray-400 mt-1">One-time yearly payment • Cancel anytime</div>
                    </div>

                    <!-- Buttons -->
                    <button onclick="PremiumSystem.showPaymentModal()" 
                        class="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold py-3.5 rounded-xl mb-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                        💎 Get Premium Now — ₹${PAYMENT_CONFIG.amount}/yr
                    </button>
                    <button onclick="document.getElementById('upgrade-popup').remove()" 
                        class="w-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-medium py-2.5 rounded-xl text-sm transition-colors">
                        Maybe later
                    </button>
                </div>
            </div>`;

        document.body.appendChild(popup);
    },

    // Payment Modal with QR Code
    showPaymentModal() {
        // Close other modals
        ['limit-popup', 'upgrade-popup'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userEmail = user.email || 'your-email@example.com';

        const popup = document.createElement('div');
        popup.id = 'payment-modal';
        popup.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
        popup.style.backdropFilter = 'blur(12px)';
        popup.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
        
        popup.innerHTML = `
            <div class="glassmorphism-card max-w-md w-full overflow-hidden animate-popup-in">
                <!-- Header -->
                <div class="bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-5 text-center">
                    <div class="text-4xl mb-2">📱</div>
                    <h2 class="text-xl font-bold text-white">Payment Instructions</h2>
                    <p class="text-green-100 text-sm mt-1">Follow these simple steps</p>
                </div>

                <!-- Body -->
                <div class="p-6 bg-white/95 backdrop-blur-xl max-h-[70vh] overflow-y-auto">
                    
                    <!-- Step 1: Scan QR -->
                    <div class="mb-6">
                        <div class="flex items-center gap-2 mb-3">
                            <div class="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">1</div>
                            <h3 class="font-bold text-gray-800">Scan QR Code to Pay</h3>
                        </div>
                        
                        <div class="bg-white rounded-xl p-4 border-2 border-dashed border-gray-300 text-center">
                            <img src="${PAYMENT_CONFIG.qrCodeUrl}" alt="Payment QR Code" 
                                class="w-48 h-48 mx-auto mb-3 rounded-lg shadow-md"
                                onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
                            <div style="display:none;" class="text-gray-400 text-sm p-8">
                                QR Code not found<br>
                                <span class="text-xs">Place your QR code at: ${PAYMENT_CONFIG.qrCodeUrl}</span>
                            </div>
                            <p class="text-sm font-semibold text-gray-700">Amount: <span class="text-green-600 text-lg">₹${PAYMENT_CONFIG.amount}</span></p>
                        </div>

                        <div class="mt-3 text-center text-sm text-gray-600">
                            Or pay directly to:
                        </div>
                        <div class="mt-2 bg-gray-50 rounded-lg p-3 text-center">
                            <div class="text-xs text-gray-500 mb-1">UPI ID</div>
                            <div class="font-mono text-sm font-bold text-gray-800 select-all">${PAYMENT_CONFIG.upiId}</div>
                        </div>
                    </div>

                    <!-- Step 2: Screenshot -->
                    <div class="mb-6">
                        <div class="flex items-center gap-2 mb-3">
                            <div class="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">2</div>
                            <h3 class="font-bold text-gray-800">Take Payment Screenshot</h3>
                        </div>
                        <p class="text-sm text-gray-600 pl-9">After payment, take a screenshot of the success page from your payment app.</p>
                    </div>

                    <!-- Step 3: WhatsApp -->
                    <div class="mb-6">
                        <div class="flex items-center gap-2 mb-3">
                            <div class="w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">3</div>
                            <h3 class="font-bold text-gray-800">Send to WhatsApp</h3>
                        </div>
                        <p class="text-sm text-gray-600 pl-9 mb-3">Send screenshot + your email to our WhatsApp:</p>
                        
                        <div class="bg-green-50 border border-green-200 rounded-lg p-3 pl-9">
                            <div class="text-xs text-green-600 mb-1">Your Email (send this)</div>
                            <div class="font-mono text-sm font-bold text-gray-800 select-all">${userEmail}</div>
                        </div>
                    </div>

                    <!-- WhatsApp Button -->
                    <a href="https://wa.me/${PAYMENT_CONFIG.whatsappNumber}?text=${encodeURIComponent(`Payment done for Premium!\n\nMy Email: ${userEmail}\nAmount: ₹${PAYMENT_CONFIG.amount}\n\n(Attaching screenshot...)`)}" 
                        target="_blank"
                        class="block w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3.5 rounded-xl text-center transition-all shadow-lg hover:shadow-xl mb-2">
                        <span class="text-xl mr-2">📱</span> Open WhatsApp
                    </a>

                    <button onclick="document.getElementById('payment-modal').remove()" 
                        class="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm transition-colors">
                        Done
                    </button>

                    <!-- Note -->
                    <p class="text-xs text-gray-400 text-center mt-4">
                        ✅ Your account will be upgraded to Premium within 24 hours after payment verification
                    </p>
                </div>
            </div>`;

        document.body.appendChild(popup);
    }
};

// Auto-check usage on page load
document.addEventListener('DOMContentLoaded', () => {
    if (API.isLoggedIn()) {
        setTimeout(() => PremiumSystem.checkUsageAndShow(), 1000);
    }
});

// Add CSS for glassmorphism and animations
const style = document.createElement('style');
style.textContent = `
.glassmorphism-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.18);
}

@keyframes popup-in {
    from {
        opacity: 0;
        transform: scale(0.9) translateY(20px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.animate-popup-in {
    animation: popup-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
}

.animate-float {
    animation: float 3s ease-in-out infinite;
}

.animate-float-delayed {
    animation: float 3s ease-in-out infinite;
    animation-delay: 1.5s;
}

@keyframes bounce-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

.animate-bounce-slow {
    animation: bounce-slow 2s ease-in-out infinite;
}
`;
document.head.appendChild(style);

