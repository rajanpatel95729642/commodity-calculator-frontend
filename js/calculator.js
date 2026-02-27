// calculator.js - All calculation methods (CLOUD ONLY VERSION)

const Calculator = {
    // Default expenses value
    defaultExpenses: 150,
    
    // Initialize from user settings (CLOUD ONLY)
    async init() {
    if (!API.isLoggedIn()) {
        console.log('Not logged in - using defaults');
        return;
    }
    
    try {
        // Fetch fresh data from API instead of localStorage
        const response = await API.getProfile();
        if (response.success && response.user) {
            const user = response.user;
            // Update localStorage with fresh data
            TokenManager.setUser(user);
            this.defaultExpenses = user.settings.default_expenses || 150;
            console.log('Loaded expenses from API:', this.defaultExpenses);
        }
    } catch (error) {
        console.error('Error loading user settings:', error);
        // Fallback to localStorage if API fails
        const user = API.getCurrentUser();
        if (user) {
            this.defaultExpenses = user.default_expenses || 150;
        }
    }
},

    // Simple Calculator Method
    calculateSimple: function(purchasePrice, wastagePercent, includeExpenses = true) {
    const price = parseFloat(purchasePrice);
    const wastage = parseFloat(wastagePercent);

    if (isNaN(price) || isNaN(wastage)) {
        return { error: 'Please fill all fields with valid numbers' };
    }

    const exp = includeExpenses ? parseFloat(this.defaultExpenses) : 0;
    const subtotal = price + exp;
    const wastageAmount = subtotal * (wastage / 100);
    const totalCosting = subtotal + wastageAmount;

    return {
        purchasePrice: price.toFixed(2),
        expenses: exp.toFixed(2),
        includeExpenses: includeExpenses,
        totalCosting: totalCosting.toFixed(2),
        wastagePercent: wastage.toFixed(2)
    };
},

    // SOUFF Calculator - Only Wastage (No Costing)
    calculateSouff: function(purchases, boxWeights, includeCosting = false) {
        // Validate purchases
        if (!purchases || purchases.length === 0) {
            return { error: 'Please provide at least one purchase' };
        }

        // Calculate total purchase weight
        let totalPurchaseWeight = 0;
        let weightedSum = 0;
        let hasPrices = false;

        purchases.forEach(purchase => {
            const weight = parseFloat(purchase.weight);
            const price = parseFloat(purchase.price);
            if (!isNaN(weight)) {
                totalPurchaseWeight += weight;
            }
            if (!isNaN(weight) && !isNaN(price) && weight > 0 && price > 0) {
                weightedSum += (weight * price) / 20;
                hasPrices = true;
            }
        });

        if (totalPurchaseWeight === 0) {
            return { error: 'Total purchase weight cannot be zero' };
        }

        // Validate prices if costing mode is on
        if (includeCosting && !hasPrices) {
            return { error: 'Please enter purchase prices for costing calculation' };
        }

        // Calculate total box weight (Taiyar Weight)
        const boxes = {
            jadoMal: parseFloat(boxWeights.jadoMal) || 0,
            recleaning: parseFloat(boxWeights.recleaning) || 0,
            recleaningBarik: parseFloat(boxWeights.recleaningBarik) || 0,
            miniJadoMal: parseFloat(boxWeights.miniJadoMal) || 0,
            oneNumberBarik: parseFloat(boxWeights.oneNumberBarik) || 0,
            twoNumberBarik: parseFloat(boxWeights.twoNumberBarik) || 0,
            surbhi: parseFloat(boxWeights.surbhi) || 0,
            kachoJadoMal: parseFloat(boxWeights.kachoJadoMal) || 0
        };

        const totalTaiyarWeight = 
            boxes.jadoMal + 
            boxes.recleaning + 
            boxes.recleaningBarik + 
            boxes.miniJadoMal + 
            boxes.oneNumberBarik + 
            boxes.twoNumberBarik + 
            boxes.surbhi + 
            boxes.kachoJadoMal;

        // Calculate wastage
        const wastageWeight = totalPurchaseWeight - totalTaiyarWeight;
        const wastagePercent = (wastageWeight / totalPurchaseWeight) * 100;

        const result = {
            totalPurchaseWeight: totalPurchaseWeight.toFixed(2),
            boxes: boxes,
            totalTaiyarWeight: totalTaiyarWeight.toFixed(2),
            wastageWeight: wastageWeight.toFixed(2),
            wastagePercent: wastagePercent.toFixed(2)
        };

        // ⭐ Calculate Aakho Palo Costing using approxPrice
    if (includeCosting && approxPrice && totalTaiyarWeight > 0) {
        const exp = parseFloat(this.defaultExpenses);
        const beforeCleaningCosting = approxPrice + exp;
        const aakhoPaloCosting = (((beforeCleaningCosting * totalPurchaseWeight) / 20) / totalTaiyarWeight) * 20;

        result.approxPrice = approxPrice.toFixed(2);
        result.beforeCleaningCosting = beforeCleaningCosting.toFixed(2);
        result.aakhoPaloCosting = aakhoPaloCosting.toFixed(2);
        result.includeCosting = true;
    }

    return result;
},

    // Combined Calculator Method (For Jeera, Ajwain, Isabgul)
    calculateCombinedMultiple: function(purchases, taiyarWeight, recleaningWeight, recleaningPrice) {
        const exp = parseFloat(this.defaultExpenses);

        if (isNaN(exp)) {
            return { error: 'Invalid default expenses' };
        }

        if (!purchases || purchases.length === 0) {
            return { error: 'Please provide at least one purchase' };
        }

        let totalWeight = 0;
        let weightedSum = 0;

        purchases.forEach(purchase => {
            const weight = parseFloat(purchase.weight);
            const price = parseFloat(purchase.price);
            
            if (isNaN(weight) || isNaN(price)) {
                return;
            }
            
            totalWeight += weight;
            weightedSum += (weight * price) / 20;
        });

        if (totalWeight === 0) {
            return { error: 'Total weight cannot be zero' };
        }

        const avgPrice = (weightedSum / totalWeight) * 20;
        const beforeCleaningCosting = avgPrice + exp;

        let result = {
            totalWeight: totalWeight.toFixed(2),
            avgPrice: avgPrice.toFixed(2),
            beforeCleaningCosting: beforeCleaningCosting.toFixed(2)
        };

        const taiyarWt = parseFloat(taiyarWeight);

        if (isNaN(taiyarWt) || taiyarWeight === '' || taiyarWt <= 0) {
            return { error: 'Taiyar Weight is required' };
        }

        const wastage = totalWeight - taiyarWt;
        const aakhoPaloCosting = (((beforeCleaningCosting * totalWeight) / 20) / taiyarWt) * 20;
        
        result.aakhoPaloCosting = aakhoPaloCosting.toFixed(2);
        result.wastageWeight = wastage.toFixed(2);
        result.wastagePercent = ((wastage / totalWeight) * 100).toFixed(2);
        result.taiyarWeight = taiyarWt.toFixed(2);

        const recleanWt = parseFloat(recleaningWeight);
        const recleanPrice = parseFloat(recleaningPrice);

        if (!isNaN(recleanWt) && !isNaN(recleanPrice) && recleanWt > 0 && recleanPrice > 0) {
            const totalCostingAmount = (aakhoPaloCosting * taiyarWt) / 20;
            const oneNumberCosting = ((totalCostingAmount - ((recleanPrice * recleanWt) / 20)) / (taiyarWt - recleanWt)) * 20;
            
            result.oneNumberCosting = oneNumberCosting.toFixed(2);
            result.recleaningWeight = recleanWt.toFixed(2);
            result.recleaningPrice = recleanPrice.toFixed(2);
        }

        return result;
    },

    // Set default expenses (CLOUD ONLY)
    setDefaultExpenses: async function(value) {
        const exp = parseFloat(value);
        if (!isNaN(exp) && exp >= 0) {
            this.defaultExpenses = exp;
            
            // Save to cloud only
            if (API.isLoggedIn()) {
                try {
                    const user = API.getCurrentUser();
                    const fontSize = user.font_size || 'medium';
                    await API.updateSettings(exp, fontSize);
                    return true;
                } catch (error) {
                    console.error('Error saving settings to cloud:', error);
                    throw error; // Don't save locally, throw error
                }
            } else {
                console.error('Cannot save settings: Not logged in');
                return false;
            }
        }
        return false;
    },

    // Get default expenses
    getDefaultExpenses: function() {
        return this.defaultExpenses;
    },

    // Save calculation to history (CLOUD ONLY)
    saveToHistory: async function(type, data, commodity = null) {  // ← Add commodity parameter
    if (!API.isLoggedIn()) {
        throw new Error('You must be logged in to save calculations');
    }
    
    try {
        // Use the commodity parameter if provided, otherwise try to get from data
        const commodityToSave = commodity || data.commodityKey || data.commodity || null;
        
        console.log('💾 Saving:', { type, commodity: commodityToSave, data });
        
        const response = await API.saveCalculation(type, data, commodityToSave);
        
        if (response.success) {
            console.log('✅ Saved to cloud:', response.calculation);
            return response.calculation;
        } else {
            throw new Error(response.message || 'Failed to save calculation');
        }
        } catch (error) {
            console.error('❌ Error saving to cloud:', error);
            throw error;
        }
    },

    // Get calculation history (CLOUD ONLY)
    getHistory: async function() {
        // Must be logged in
        if (!API.isLoggedIn()) {
            console.log('Not logged in - returning empty history');
            return [];
        }
        
        try {
            const response = await API.getCalculations({ limit: 50 });
            
            if (response.success) {
                return response.calculations;
            } else {
                throw new Error(response.message || 'Failed to load history');
            }
        } catch (error) {
            console.error('Error loading from cloud:', error);
            throw error; // Don't fall back to localStorage
        }
    },

    // Clear history (CLOUD ONLY)
    clearHistory: async function() {
        // Must be logged in
        if (!API.isLoggedIn()) {
            throw new Error('You must be logged in to clear history');
        }
        
        try {
            await API.clearAllCalculations();
            console.log('History cleared from cloud');
        } catch (error) {
            console.error('Error clearing cloud history:', error);
            throw error;
        }
    },

    // Delete single history entry (CLOUD ONLY)
    deleteHistoryEntry: async function(id) {
        // Must be logged in
        if (!API.isLoggedIn()) {
            throw new Error('You must be logged in to delete calculations');
        }
        
        try {
            await API.deleteCalculation(id);
            console.log('Calculation deleted from cloud:', id);
        } catch (error) {
            console.error('Error deleting from cloud:', error);
            throw error;
        }
    }
};

// Initialize calculator on page load
document.addEventListener('DOMContentLoaded', async () => {
    await Calculator.init();
});
