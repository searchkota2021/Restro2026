// ==========================================
// SECTION A: SHARED DATA LAYER (restrosDB)
// ==========================================
const DB_PREFIX = 'restros_';
const restrosDB = {
    get: (key) => JSON.parse(localStorage.getItem(DB_PREFIX + key) || 'null'),
    set: (key, val) => localStorage.setItem(DB_PREFIX + key, JSON.stringify(val)),
    
    // Data Collections
    groups: () => restrosDB.get('groups') || [],
    categories: () => restrosDB.get('categories') || [],
    items: () => restrosDB.get('items') || [],
    variants: () => restrosDB.get('variants') || [],
    addons: () => restrosDB.get('addons') || [],
    taxes: () => restrosDB.get('taxes') || [],
    tables: () => restrosDB.get('tables') || [],
    floors: () => restrosDB.get('floors') || [],
    orders: () => restrosDB.get('orders') || [],
    kots: () => restrosDB.get('kots') || [],
    bills: () => restrosDB.get('bills') || [],
    customers: () => restrosDB.get('customers') || [],
    inventory: () => restrosDB.get('inventory') || [],
    expenses: () => restrosDB.get('expenses') || [],

    // Event Bus
    listeners: {},
    save: (key, val) => { restrosDB.set(key, val); restrosDB.emit(key); },
    on: (key, fn) => { (restrosDB.listeners[key] = restrosDB.listeners[key] || []).push(fn); },
    emit: (key) => { (restrosDB.listeners[key] || []).forEach(fn => fn()); }
};

// ==========================================
// SECTION D: SEED DATA
// ==========================================
function seedDatabase() {
    if (!localStorage.getItem('restros_seeded_v3')) {
        restrosDB.save('groups', [{ id: "g1", name: "Food", printer: "Kitchen 1", sort: 1, active: true }]);
        restrosDB.save('categories', [{ id: "c1", name: "Starters", group: "g1", sort: 1, active: true }, { id: "c4", name: "Rice & Biryani", group: "g1", sort: 4, active: true }]);
        restrosDB.save('taxes', [{ id: "t1", name: "GST 5%", rate: 5, type: "forward" }]);
        restrosDB.save('variants', [{ id: "v1", name: "Portion Size", type: "mandatory", options: [{label: "Half", price: 0}, {label: "Full", price: 80}] }]);
        restrosDB.save('addons', [{ id: "a1", name: "Sauce Selection", type: "optional", min: 0, max: 2, options: [{label: "Mint Chutney", price: 0}, {label: "Garlic Mayo", price: 20}] }]);
        restrosDB.save('items', [
            { id: "i1", name: "Paneer Tikka", code: "PTK-001", category: "c1", tax: "t1", foodType: "veg", active: true, prices: { dinein: 280, takeaway: 280, online: 300, quickdelivery: 280 }, channels: { dinein: true, takeaway: true, online: true, quickdelivery: true }, variants: ["v1"], addons: ["a1"] },
            { id: "i4", name: "Chicken Biryani", code: "CBR-001", category: "c4", tax: "t1", foodType: "nonveg", active: true, prices: { dinein: 350, takeaway: 350, online: 380, quickdelivery: 350 }, channels: { dinein: true, takeaway: true, online: true, quickdelivery: true }, variants: [], addons: [] },
            { id: "i5", name: "Garlic Naan", code: "GNB-001", category: "c1", tax: "t1", foodType: "veg", active: true, prices: { dinein: 50, takeaway: 50, online: 55, quickdelivery: 55 }, channels: { dinein: true, takeaway: true, online: true, quickdelivery: true }, variants: [], addons: [] }
        ]);
        restrosDB.save('floors', [{ id: "f1", name: "Main Dining" }]);
        restrosDB.save('tables', [
            { id: "t1", floorId: "f1", name: "Table 1", capacity: 4, status: "available" },
            { id: "t2", floorId: "f1", name: "Table 2", capacity: 4, status: "occupied", currentOrderId: "ord1" }
        ]);
        restrosDB.save('customers', [{ id: "cust1", name: "Rahul Verma", phone: "9876543210", visits: 12, totalspent: 15400, loyaltyPoints: 840 }]);
        restrosDB.save('inventory', [{ itemId: "i1", itemName: "Paneer Tikka", availableQty: 45, unit: "pcs", reorderAt: 10 }]);
        
        // Seed an open order & KOT for Table 2
        restrosDB.save('orders', [{ id: "ord1", tableId: "t2", tableName: "Table 2", orderType: "dinein", customerId: "cust1", items: [{itemId:"i1", name:"Paneer Tikka", qty:1, variant:"Full", variantDelta:80, addons:[], addonDelta:0, basePrice:280}], status: "open", openedAt: new Date().toISOString() }]);
        restrosDB.save('kots', [{ kotId: "KOT-001", orderId: "ord1", tableId: "t2", tableName: "Table 2", orderType: "dinein", items: [{itemId:"i1", name:"Paneer Tikka", qty:1, variant:"Full", addons:[]}], status: "pending", firedAt: new Date().toISOString() }]);

        localStorage.setItem('restros_seeded_v3', 'true');
    }
}

// ==========================================
// UI & UTILITIES
// ==========================================
setInterval(() => { document.getElementById('clock').innerText = new Date().toLocaleTimeString('en-IN'); }, 1000);
function toggleMenu() { document.getElementById('sidebar').classList.toggle('open'); }
function switchTab(viewId, element) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    if(element) { element.classList.add('active'); document.getElementById('page-title').innerText = element.innerText.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF] /g, ''); }
    if(window.innerWidth <= 767) toggleMenu();
}
function switchMenuTab(tabId, element) {
    document.querySelectorAll('.menu-sub-view').forEach(v => v.style.display = 'none');
    document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).style.display = 'block';
    if(element) element.classList.add('active');
}
function formatIN(amount) { return Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }); }
function triggerToast(msg, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div'); toast.className = 'toast';
    toast.style.borderLeftColor = type === 'success' ? 'var(--success)' : 'var(--error)';
    toast.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span> <div>${msg}</div>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'slideLeft 0.3s ease reverse forwards'; setTimeout(() => toast.remove(), 300); }, 4000);
}
document.querySelectorAll('.system-form').forEach(form => form.addEventListener('submit', function(e) { e.preventDefault(); triggerToast(this.getAttribute('data-success') || "Done", "success"); this.reset(); }));

// ==========================================
// SECTION C7: DASHBOARD LIVE COMPUTATION
// ==========================================
function refreshDashboard() {
    const today = new Date().toDateString();
    const todayBills = restrosDB.bills().filter(b => new Date(b.settledAt).toDateString() === today);
    
    document.getElementById('stat-revenue').innerText = '₹' + formatIN(todayBills.reduce((s, b) => s + b.total, 0));
    document.getElementById('stat-orders').innerText = todayBills.length;
    
    const tables = restrosDB.tables();
    document.getElementById('stat-tables').innerText = `${tables.filter(t => t.status === 'occupied').length} / ${tables.length}`;
    document.getElementById('stat-kots').innerText = restrosDB.kots().filter(k => k.status === 'pending').length;

    // Build Top Selling Items Table dynamically from bills
    const itemSales = {};
    todayBills.forEach(b => b.items.forEach(i => {
        if (!itemSales[i.name]) itemSales[i.name] = { qty: 0, revenue: 0 };
        itemSales[i.name].qty += i.qty;
        itemSales[i.name].revenue += (i.price * i.qty);
    }));
    
    const topItems = Object.entries(itemSales).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5);
    const tbody = document.getElementById('top-selling-body');
    if(topItems.length > 0) {
        tbody.innerHTML = topItems.map(item => `<tr><td>${item[0]}</td><td>${item[1].qty}</td><td>₹${formatIN(item[1].revenue)}</td></tr>`).join('');
    }
}
restrosDB.on('bills', refreshDashboard);
restrosDB.on('kots', refreshDashboard);
restrosDB.on('tables', refreshDashboard);

// ==========================================
// SECTION B: MENU MANAGEMENT (Read/Write to DB)
// ==========================================
function renderMenuTables() {
    document.getElementById('groups-table-body').innerHTML = restrosDB.groups().map(g => `<tr><td>${g.name}</td><td>${g.printer}</td><td>${g.active?'<span class="badge bg-green">Active</span>':'<span class="badge bg-gray">Inactive</span>'}</td></tr>`).join('');
    document.getElementById('cats-table-body').innerHTML = restrosDB.categories().map(c => `<tr><td>${c.name}</td><td>${restrosDB.groups().find(g=>g.id===c.group)?.name||'-'}</td><td>${c.active?'<span class="badge bg-green">Active</span>':'<span class="badge bg-gray">Inactive</span>'}</td></tr>`).join('');
    document.getElementById('taxes-table-body').innerHTML = restrosDB.taxes().map(t => `<tr><td>${t.name}</td><td>${t.rate}%</td><td>${t.type}</td></tr>`).join('');
    document.getElementById('variants-table-body').innerHTML = restrosDB.variants().map(v => `<tr><td>${v.name}</td><td>${v.options.map(o=>`${o.label}(+₹${o.price})`).join(', ')}</td><td>${v.type}</td></tr>`).join('');
    document.getElementById('addons-table-body').innerHTML = restrosDB.addons().map(a => `<tr><td>${a.name}</td><td>${a.min}-${a.max}</td></tr>`).join('');
    
    document.getElementById('items-table-body').innerHTML = restrosDB.items().map(i => {
        let icon = i.foodType === 'veg' ? '🟢' : i.foodType === 'nonveg' ? '🔴' : '🟡';
        return `<tr><td>${i.code||'-'}</td><td><b>${i.name}</b> <span style="font-size:10px;">${icon}</span></td><td>${restrosDB.categories().find(c=>c.id===i.category)?.name||'-'}</td><td>₹${i.prices.dinein}/₹${i.prices.takeaway}/₹${i.prices.online}/₹${i.prices.quickdelivery}</td><td>${i.type}</td><td>${i.active?'<span class="badge bg-green">Active</span>':'<span class="badge bg-gray">Inactive</span>'}</td></tr>`;
    }).join('');

    const cSel = document.getElementById('item-category'); if(cSel) cSel.innerHTML = restrosDB.categories().map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
    const tSel = document.getElementById('item-tax'); if(tSel) tSel.innerHTML = restrosDB.taxes().map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
}
restrosDB.on('items', renderMenuTables); restrosDB.on('groups', renderMenuTables); restrosDB.on('categories', renderMenuTables);

function handleItemSubmit(e) {
    e.preventDefault();
    const items = restrosDB.items();
    items.push({
        id: "i" + Date.now(), name: document.getElementById('item-name').value, code: document.getElementById('item-sku').value, category: document.getElementById('item-category').value, foodType: document.getElementById('item-type').value, active: document.getElementById('item-status').value === 'true',
        prices: { dinein: parseFloat(document.getElementById('price-dinein').value), takeaway: parseFloat(document.getElementById('price-takeaway').value), online: parseFloat(document.getElementById('price-online').value), quickdelivery: parseFloat(document.getElementById('price-quick').value) },
        channels: { dinein: document.getElementById('en-dinein').checked, takeaway: document.getElementById('en-takeaway').checked, online: document.getElementById('en-online').checked, quickdelivery: document.getElementById('en-quick').checked },
        variants: [], addons: [] // simplified for input
    });
    restrosDB.save('items', items); e.target.reset(); triggerToast("Item Saved!", "success");
}

// ==========================================
// SECTION C3: TABLES & FLOOR PLAN
// ==========================================
let activeFloorId = "f1";
function renderTables() {
    const floors = restrosDB.floors(); const tables = restrosDB.tables();
    document.getElementById('floor-tabs').innerHTML = floors.map(f => `<div class="floor-tab ${f.id === activeFloorId ? 'active' : ''}" onclick="activeFloorId='${f.id}'; renderTables();"><span>${f.name}</span></div>`).join('');
    
    const floorTables = tables.filter(t => t.floorId === activeFloorId);
    document.getElementById('tables-container').innerHTML = floorTables.map(t => {
        let borderColor = 'var(--success)', badgeClass = 'bg-green', badgeText = 'Available', btnText = 'Open Order';
        if(t.status === 'occupied') { borderColor = 'var(--error)'; badgeClass = 'bg-red'; badgeText = `Occupied`; btnText = 'View Order'; }
        
        return `<div class="t-card" style="border-left: 4px solid ${borderColor};">
            <div class="t-card-header"><span>${t.name}</span><span class="badge ${badgeClass}">${badgeText}</span></div>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">Cap: ${t.capacity}</p>
            <button class="btn btn-outline" style="width: 100%; font-size: 12px; height: 32px; min-height: unset;" onclick="openTableOrder('${t.id}')">${btnText}</button>
        </div>`;
    }).join('');
    populateDineInTables();
}
restrosDB.on('tables', renderTables); restrosDB.on('floors', renderTables);

function handleFloorSubmit(e) { e.preventDefault(); const f = restrosDB.floors(); f.push({id: "f"+Date.now(), name: document.getElementById('floor-name').value}); restrosDB.save('floors', f); e.target.style.display='none'; }
function handleTableSubmit(e) { e.preventDefault(); const t = restrosDB.tables(); t.push({id: "t"+Date.now(), floorId: activeFloorId, name: document.getElementById('table-name').value, capacity: document.getElementById('table-cap').value, status: 'available'}); restrosDB.save('tables', t); e.target.parentElement.style.display='none'; }

function openTableOrder(tableId) {
    const table = restrosDB.tables().find(t => t.id === tableId);
    switchTab('billing', document.querySelector('.nav-item:nth-child(2)'));
    switchBillingMode('dinein', document.querySelector('#billing-modes .sub-tab:nth-child(2)'));
    document.getElementById('di-table').value = tableId;
    
    if(table.status === 'occupied' && table.currentOrderId) {
        const order = restrosDB.orders().find(o => o.id === table.currentOrderId);
        currentCart = order ? JSON.parse(JSON.stringify(order.items)) : [];
    } else {
        currentCart = [];
    }
    renderCart();
}

// ==========================================
// SECTION C1 & C2: BILLING, CART & MODALS
// ==========================================
let currentBillingMode = 'quick'; 
let currentCart = [];
let pendingCartItem = null;

function switchBillingMode(mode, element) {
    currentBillingMode = mode;
    document.getElementById('billing-modes').querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
    element.classList.add('active');
    document.querySelectorAll('.billing-context').forEach(el => el.style.display = 'none');
    document.getElementById(`context-${mode}`).style.display = 'block';
    currentCart = []; renderCart(); renderPOSGrid();
}

function populateDineInTables() {
    const select = document.getElementById('di-table'); if(!select) return;
    select.innerHTML = '<option value="">-- Select Active Table --</option>';
    restrosDB.tables().forEach(t => { select.innerHTML += `<option value="${t.id}">${t.name} (${t.status})</option>`; });
}

function renderPOSGrid(searchTerm = '') {
    const grid = document.getElementById('pos-menu-grid'); if(!grid) return; grid.innerHTML = '';
    
    // Group Filters
    const filterContainer = document.getElementById('pos-group-filters');
    if(filterContainer.children.length === 1) { // Populate only once
        restrosDB.groups().forEach(g => {
            const btn = document.createElement('button'); btn.className = 'badge bg-gray'; btn.innerText = g.name;
            btn.onclick = () => renderPOSGridByGroup(g.id);
            filterContainer.appendChild(btn);
        });
    }

    restrosDB.items().forEach(item => {
        if(!item.channels[currentBillingMode] || !item.active) return; // Linking Rule 2
        if(searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return;
        
        // Out of stock logic
        const inv = restrosDB.inventory().find(i => i.itemId === item.id);
        const outOfStock = inv && inv.availableQty <= 0;

        const card = document.createElement('div'); card.className = `pos-item-card ${outOfStock ? 'disabled' : ''}`;
        card.onclick = () => { if(!outOfStock) handleItemClick(item.id); };
        
        let icon = item.foodType === 'veg' ? '🟢' : item.foodType === 'nonveg' ? '🔴' : '🟡';
        card.innerHTML = `<div style="font-size: 10px; text-align: left;">${icon}</div><div class="pos-item-name">${item.name}</div><div class="pos-item-price">${outOfStock ? 'Out of Stock' : '₹'+formatIN(item.prices[currentBillingMode])}</div>`;
        grid.appendChild(card);
    });
}
function filterPOSMenu(val) { renderPOSGrid(val); }
function renderPOSGridByGroup(groupId) { /* Stub: Filter items by group logic */ }
restrosDB.on('items', () => renderPOSGrid());

function handleItemClick(itemId) {
    const item = restrosDB.items().find(i => i.id === itemId);
    pendingCartItem = { itemId: item.id, name: item.name, basePrice: item.prices[currentBillingMode], qty: 1, variant: null, variantDelta: 0, addons: [], addonDelta: 0, taxId: item.tax };
    
    if(item.variants && item.variants.length > 0) {
        openVariantModal(item);
    } else if (item.addons && item.addons.length > 0) {
        openAddonModal(item);
    } else {
        finalizeAddToCart();
    }
}

// C2: Modal Logic
function openVariantModal(item) {
    const vGroup = restrosDB.variants().find(v => v.id === item.variants[0]);
    document.getElementById('modal-title').innerText = `Customize: ${item.name} (${vGroup.name})`;
    document.getElementById('modal-body').innerHTML = vGroup.options.map((o, idx) => `
        <label style="display:block; padding: 10px; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 5px; cursor:pointer;">
            <input type="radio" name="var-opt" value="${o.label}|${o.price}" ${idx===0?'checked':''}> ${o.label} (+₹${o.price})
        </label>`).join('');
    
    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('modal-confirm-btn').onclick = () => {
        const selected = document.querySelector('input[name="var-opt"]:checked').value.split('|');
        pendingCartItem.variant = selected[0]; pendingCartItem.variantDelta = parseFloat(selected[1]);
        if(item.addons && item.addons.length > 0) { openAddonModal(item); } else { finalizeAddToCart(); closeModal(); }
    };
}

function openAddonModal(item) {
    const aGroup = restrosDB.addons().find(a => a.id === item.addons[0]);
    document.getElementById('modal-title').innerText = `Add-ons: ${item.name} (Max ${aGroup.max})`;
    document.getElementById('modal-body').innerHTML = aGroup.options.map((o, idx) => `
        <label style="display:block; padding: 10px; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 5px; cursor:pointer;">
            <input type="checkbox" name="addon-opt" value="${o.label}|${o.price}"> ${o.label} (+₹${o.price})
        </label>`).join('');
    
    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('modal-confirm-btn').onclick = () => {
        const checked = Array.from(document.querySelectorAll('input[name="addon-opt"]:checked'));
        if(checked.length > aGroup.max) { triggerToast(`Max ${aGroup.max} selections allowed!`, "error"); return; }
        
        checked.forEach(cb => {
            const data = cb.value.split('|');
            pendingCartItem.addons.push({name: data[0], price: parseFloat(data[1])});
            pendingCartItem.addonDelta += parseFloat(data[1]);
        });
        finalizeAddToCart(); closeModal();
    };
}

function closeModal() { document.getElementById('modal-overlay').style.display = 'none'; pendingCartItem = null; }

function finalizeAddToCart() {
    const existing = currentCart.find(c => c.itemId === pendingCartItem.itemId && c.variant === pendingCartItem.variant && JSON.stringify(c.addons) === JSON.stringify(pendingCartItem.addons));
    if(existing) existing.qty++; else currentCart.push(pendingCartItem);
    renderCart(); pendingCartItem = null;
}

function updateCartQty(idx, change) {
    currentCart[idx].qty += change; if(currentCart[idx].qty <= 0) currentCart.splice(idx, 1);
    renderCart();
}

function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    if(currentCart.length === 0) {
        cartContainer.innerHTML = `<div style="text-align:center; padding:50px 0; color:var(--text-muted);">Cart is empty. Tap items to add.</div>`;
        document.getElementById('cart-subtotal').innerText = '₹0.00'; document.getElementById('cart-taxes').innerText = '₹0.00'; document.getElementById('cart-total').innerText = '₹0.00';
        return;
    }

    let subtotal = 0, totalTax = 0;
    cartContainer.innerHTML = currentCart.map((c, idx) => {
        const itemTotal = (c.basePrice + c.variantDelta + c.addonDelta) * c.qty;
        subtotal += itemTotal;
        const taxProfile = restrosDB.taxes().find(t => t.id === c.taxId);
        if(taxProfile && taxProfile.type === 'forward') totalTax += (itemTotal * taxProfile.rate) / 100;

        let metaText = [];
        if(c.variant) metaText.push(`Var: ${c.variant} (+₹${c.variantDelta})`);
        if(c.addons.length > 0) metaText.push(`Add-ons: ${c.addons.map(a=>a.name).join(', ')}`);

        return `<div class="cart-item">
            <div style="flex: 1;">
                <div style="font-weight: 600; font-size: 13px;">${c.name}</div>
                ${metaText.length > 0 ? `<div style="font-size: 10px; color: var(--primary);">${metaText.join(' | ')}</div>` : ''}
                <div style="font-size: 11px; color: var(--text-muted);">₹${formatIN(c.basePrice + c.variantDelta + c.addonDelta)} x ${c.qty}</div>
            </div>
            <div class="cart-qty-ctrl"><button class="cart-qty-btn" onclick="updateCartQty(${idx}, -1)">-</button><span style="font-size: 13px; font-weight: 600;">${c.qty}</span><button class="cart-qty-btn" onclick="updateCartQty(${idx}, 1)">+</button></div>
            <div style="font-weight: 600; margin-left: 15px;">₹${formatIN(itemTotal)}</div>
        </div>`;
    }).join('');
    
    let dynamicFees = currentBillingMode === 'delivery' ? 30 : (currentBillingMode === 'dinein' ? subtotal * 0.05 : 0);
    document.getElementById('cart-subtotal').innerText = `₹${formatIN(subtotal)}`; document.getElementById('cart-taxes').innerText = `₹${formatIN(totalTax)}`;
    document.getElementById('cart-fees').innerText = `₹${formatIN(dynamicFees)}`; document.getElementById('cart-total').innerText = `₹${formatIN(subtotal + totalTax + dynamicFees)}`;
}

// C1 & C4: Settlement & KDS Workflows
function fireKOT() { 
    if(currentCart.length===0) { triggerToast("Cart Empty", "error"); return; }
    
    let tableId = null, tableName = "Walk-in";
    if(currentBillingMode === 'dinein') {
        tableId = document.getElementById('di-table').value;
        if(!tableId) { triggerToast("Select a table first", "error"); return; }
        tableName = restrosDB.tables().find(t=>t.id===tableId).name;
    }

    const kot = {
        kotId: "KOT-" + Math.floor(Math.random()*10000), tableId: tableId, tableName: tableName, orderType: currentBillingMode,
        items: JSON.parse(JSON.stringify(currentCart)), status: "pending", firedAt: new Date().toISOString()
    };
    
    const kots = restrosDB.kots(); kots.push(kot); restrosDB.save('kots', kots);

    // Update Table Status
    if(tableId) {
        const tables = restrosDB.tables(); const t = tables.find(x => x.id === tableId);
        t.status = 'occupied';
        // Simplified order linking
        if(!t.currentOrderId) { const ords = restrosDB.orders(); const oId = "ord"+Date.now(); ords.push({id: oId, tableId: t.id, items: currentCart}); restrosDB.save('orders', ords); t.currentOrderId = oId; }
        restrosDB.save('tables', tables);
    }

    triggerToast(`KOT Fired!`, "success"); currentCart=[]; renderCart();
}

function settleBill() { 
    if(currentCart.length===0) { triggerToast("Cart Empty", "error"); return; }
    
    const bills = restrosDB.bills();
    let totalStr = document.getElementById('cart-total').innerText.replace(/[^0-9.-]+/g,"");
    
    bills.push({
        billId: "BILL-" + Math.floor(Math.random()*10000), orderType: currentBillingMode,
        items: JSON.parse(JSON.stringify(currentCart)), total: parseFloat(totalStr), settledAt: new Date().toISOString()
    });
    restrosDB.save('bills', bills);

    // C6: Inventory Deduction
    const inv = restrosDB.inventory();
    currentCart.forEach(c => {
        const stockItem = inv.find(i => i.itemId === c.itemId);
        if(stockItem) { stockItem.availableQty -= c.qty; }
    });
    restrosDB.save('inventory', inv);
    
    // Clear Table if Dine-In
    if(currentBillingMode === 'dinein') {
        let tableId = document.getElementById('di-table').value;
        const tables = restrosDB.tables(); const t = tables.find(x => x.id === tableId);
        if(t) { t.status = 'available'; t.currentOrderId = null; restrosDB.save('tables', tables); }
    }

    triggerToast("Bill Settled", "success"); currentCart=[]; renderCart();
}

// ==========================================
// SECTION C4: KITCHEN DISPLAY SYSTEM (KDS)
// ==========================================
function renderKDS() {
    const container = document.getElementById('kds-container');
    const pendingKots = restrosDB.kots().filter(k => k.status === 'pending');
    
    if(pendingKots.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">No pending orders.</div>`; return;
    }

    container.innerHTML = pendingKots.map(kot => {
        const mins = Math.floor((new Date() - new Date(kot.firedAt)) / 60000);
        return `<div class="card bg-yellow">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;"><b>${kot.tableName} (${kot.kotId})</b> <span style="color:var(--error); font-weight:700;">⏱ ${mins}m</span></div>
            <ul style="margin-left: 20px; line-height: 1.8; font-size: 13px; margin-bottom: 15px;">
                ${kot.items.map(i => `<li>${i.qty}x ${i.name} ${i.variant ? `<br><small style="color:var(--primary)">Var: ${i.variant}</small>` : ''}</li>`).join('')}
            </ul>
            <button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="markKOTReady('${kot.kotId}')">Mark All Ready</button>
        </div>`;
    }).join('');
}
restrosDB.on('kots', renderKDS);
setInterval(renderKDS, 60000); // Update timers

function markKOTReady(kotId) {
    const kots = restrosDB.kots();
    const kot = kots.find(k => k.kotId === kotId);
    if(kot) { kot.status = 'ready'; restrosDB.save('kots', kots); triggerToast(`KOT ${kotId} Ready!`, "success"); }
}


// CRM and QR Logic (Stubs integrated)
function lookupCRM() {
    const phone = document.getElementById('bill-phone').value;
    const customer = restrosDB.customers().find(c => c.phone === phone);
    if(customer) { document.getElementById('active-customer-info').innerText = `${customer.name} | Pts: ${customer.loyaltyPoints}`; triggerToast("CRM Linked!", "success"); } 
    else { document.getElementById('active-customer-info').innerText = `New Customer`; triggerToast("New Customer", "warning"); }
}
function simulateQROrder() { document.getElementById('qr-orders-panel').style.display = 'block'; }
function acceptQROrder() { document.getElementById('qr-orders-panel').style.display = 'none'; triggerToast("QR Order Accepted. KOT Fired!", "success"); }
function rejectQROrder() { document.getElementById('qr-orders-panel').style.display = 'none'; triggerToast("QR Order Rejected.", "error"); }
function renderInventory() { const b = document.getElementById('inventory-table-body'); if(b) b.innerHTML = restrosDB.inventory().map(i=>`<tr><td>${i.itemName}</td><td>${i.availableQty} ${i.unit}</td><td>${i.availableQty<=i.reorderAt?'<span class="badge bg-red">Low Stock</span>':'OK'}</td></tr>`).join(''); }
restrosDB.on('inventory', renderInventory);
function renderCRM() { const b = document.getElementById('crm-table-body'); if(b) b.innerHTML = restrosDB.customers().map(c=>`<tr><td>${c.name}</td><td>${c.phone}</td><td>${c.visits}</td><td>₹${formatIN(c.totalspent)}</td><td>${c.loyaltyPoints}</td></tr>`).join(''); }
restrosDB.on('customers', renderCRM);

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    seedDatabase();
    renderFloors();
    renderMenuTables();
    renderPOSGrid();
    refreshDashboard();
    renderKDS();
    renderInventory();
    renderCRM();
});
