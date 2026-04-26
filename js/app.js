// ==========================================
// DATA STORES (Simulating Database)
// ==========================================

// Menu Database
let menuData = {
    groups: [{ id: 1, name: 'Food', printer: 'Kitchen 1' }],
    categories: [{ id: 1, name: 'Main Course', groupId: 1 }],
    taxes: [{ id: 1, name: 'GST 5%', rate: 5, type: 'forward' }],
    variants: [{ id: 1, name: 'Portion Size', options: ['Half', 'Full'] }],
    items: [
        { id: 1, name: 'Butter Chicken', catId: 1, taxId: 1, type: '🔴 Non-Veg', prices: { dinein: 380, takeaway: 380, delivery: 420 } },
        { id: 2, name: 'Garlic Naan', catId: 1, taxId: 1, type: '🟢 Veg', prices: { dinein: 50, takeaway: 50, delivery: 60 } }
    ]
};

// CRM Database
let crmData = [
    { phone: '9876543210', name: 'Rahul Verma', address: 'B-44, Sector 12, Kota' }
];

// Floor & Tables Database
let restaurantFloors = [
    { 
        id: 1, 
        name: "Main Dining", 
        tables: [
            { id: 101, name: "Table 1", status: "free" },
            { id: 102, name: "Table 2", status: "occupied", bill: 1240 },
            { id: 103, name: "Table 3", status: "cleaning" }
        ] 
    },
    { 
        id: 2, 
        name: "Rooftop", 
        tables: [ { id: 201, name: "R-01", status: "free" } ] 
    }
];
let activeFloorId = 1;


// ==========================================
// UI, NAV & TOAST SYSTEM
// ==========================================
setInterval(() => {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString();
}, 1000);

function switchTab(viewId, element) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    
    if(element) {
        element.classList.add('active');
        let titleText = element.innerText.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF] /g, '');
        document.getElementById('page-title').innerText = titleText;
    }
    if(window.innerWidth <= 768) toggleMenu();
}

function toggleMenu() { document.getElementById('sidebar').classList.toggle('open'); }

document.querySelectorAll('.system-form').forEach(form => {
    form.addEventListener('submit', function(e) {
        e.preventDefault(); 
        let successMsg = this.getAttribute('data-success') || "Action completed successfully!";
        triggerToast(successMsg, "success");
        this.reset(); 
    });
});

function triggerToast(message, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderLeftColor = type === 'success' ? 'var(--success)' : 'var(--error)';
    let icon = type === 'success' ? '✅' : '⚠️';
    toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideLeft 0.3s ease reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function logout() {
    triggerToast("Logging out...", "success");
    setTimeout(() => location.reload(), 1000);
}


// ==========================================
// MENU MANAGEMENT LOGIC
// ==========================================
function switchMenuTab(tabId, element) {
    document.querySelectorAll('.menu-sub-view').forEach(v => v.style.display = 'none');
    document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).style.display = 'block';
    if(element) element.classList.add('active');
}

function renderMenuTables() {
    document.getElementById('groups-table-body').innerHTML = menuData.groups.map(g => 
        `<tr><td>${g.name}</td><td><span class="badge bg-yellow">${g.printer}</span></td><td><button class="icon-btn danger" onclick="deleteMenuData('groups', ${g.id})">🗑️</button></td></tr>`
    ).join('');

    document.getElementById('categories-table-body').innerHTML = menuData.categories.map(c => {
        const group = menuData.groups.find(g => g.id == c.groupId)?.name || 'Unknown';
        return `<tr><td>${c.name}</td><td>${group}</td><td><button class="icon-btn danger" onclick="deleteMenuData('categories', ${c.id})">🗑️</button></td></tr>`;
    }).join('');

    document.getElementById('taxes-table-body').innerHTML = menuData.taxes.map(t => {
        const typeBadge = t.type === 'forward' ? '<span class="badge bg-red">Forward (+)</span>' : '<span class="badge bg-green">Backward (Inc)</span>';
        return `<tr><td>${t.name}</td><td>${t.rate}%</td><td>${typeBadge}</td></tr>`;
    }).join('');

    document.getElementById('variants-table-body').innerHTML = menuData.variants.map(v => 
        `<tr><td>${v.name}</td><td>${v.options.map(o => `<span class="badge bg-gray" style="margin-right:5px; border:1px solid #ddd;">${o}</span>`).join('')}</td></tr>`
    ).join('');

    document.getElementById('items-table-body').innerHTML = menuData.items.map(i => {
        const cat = menuData.categories.find(c => c.id == i.catId)?.name || 'N/A';
        return `<tr><td><b>${i.name}</b> <span style="font-size:10px;">${i.type}</span></td><td>${cat}</td><td>₹${i.prices.dinein} / ₹${i.prices.takeaway} / ₹${i.prices.delivery}</td></tr>`;
    }).join('');

    updateMenuDropdowns();
}

function updateMenuDropdowns() {
    const setDropdown = (id, text, array, valKey, txtKey) => {
        const select = document.getElementById(id);
        if(select) select.innerHTML = `<option value="">-- ${text} --</option>` + array.map(i => `<option value="${i[valKey]}">${i[txtKey]}</option>`).join('');
    };
    setDropdown('cat-group', 'Select Group', menuData.groups, 'id', 'name');
    setDropdown('item-category', 'Select Category', menuData.categories, 'id', 'name');
    setDropdown('item-tax', 'Select Tax Profile', menuData.taxes, 'id', 'name');
}

function handleGroupSubmit(e) {
    e.preventDefault();
    menuData.groups.push({ id: Date.now(), name: document.getElementById('group-name').value, printer: document.getElementById('group-printer').value });
    triggerToast("Group Created!", "success"); e.target.reset(); renderMenuTables();
}

function handleCategorySubmit(e) {
    e.preventDefault();
    menuData.categories.push({ id: Date.now(), name: document.getElementById('cat-name').value, groupId: document.getElementById('cat-group').value });
    triggerToast("Category Created!", "success"); e.target.reset(); renderMenuTables();
}

function handleTaxSubmit(e) {
    e.preventDefault();
    menuData.taxes.push({ id: Date.now(), name: document.getElementById('tax-name').value, rate: document.getElementById('tax-rate').value, type: document.getElementById('tax-type').value });
    triggerToast("Tax Saved!", "success"); e.target.reset(); renderMenuTables();
}

function handleVariantSubmit(e) {
    e.preventDefault();
    const opts = document.getElementById('var-options').value.split(',').map(o => o.trim());
    menuData.variants.push({ id: Date.now(), name: document.getElementById('var-name').value, options: opts });
    triggerToast("Variant Created!", "success"); e.target.reset(); renderMenuTables();
}

function handleItemSubmit(e) {
    e.preventDefault();
    menuData.items.push({
        id: Date.now(), name: document.getElementById('item-name').value, catId: document.getElementById('item-category').value,
        taxId: document.getElementById('item-tax').value, type: document.getElementById('item-type').value,
        prices: {
            dinein: parseFloat(document.getElementById('price-dinein').value),
            takeaway: parseFloat(document.getElementById('price-takeaway').value),
            delivery: parseFloat(document.getElementById('price-delivery').value)
        }
    });
    triggerToast("Item saved with tiered pricing!", "success");
    e.target.reset(); renderMenuTables(); renderPOSGrid();
}

function deleteMenuData(type, id) {
    if(type === 'groups' && menuData.categories.some(c => c.groupId == id)) { triggerToast("Cannot delete: Group has categories.", "error"); return; }
    if(type === 'categories' && menuData.items.some(i => i.catId == id)) { triggerToast("Cannot delete: Category has items.", "error"); return; }
    if(confirm(`Delete this ${type.slice(0, -1)}?`)) {
        menuData[type] = menuData[type].filter(item => item.id !== id);
        triggerToast("Deleted", "success"); renderMenuTables();
    }
}


// ==========================================
// FLOOR & TABLE MANAGEMENT LOGIC
// ==========================================
function renderFloors() {
    const container = document.getElementById('floor-tabs');
    container.innerHTML = '';
    
    restaurantFloors.forEach(floor => {
        const tab = document.createElement('div');
        tab.className = `floor-tab ${floor.id === activeFloorId ? 'active' : ''}`;
        tab.innerHTML = `<span>${floor.name}</span>
            <div class="table-actions">
                <button type="button" class="icon-btn" onclick="event.stopPropagation(); showFloorForm(${floor.id})" title="Edit Name">✏️</button>
                <button type="button" class="icon-btn danger" onclick="event.stopPropagation(); deleteFloor(${floor.id})" title="Delete Floor">🗑️</button>
            </div>`;
        tab.onclick = () => { activeFloorId = floor.id; renderFloors(); };
        container.appendChild(tab);
    });
    renderTables(); updateReservationDropdown(); populateDineInTables();
}

function renderTables() {
    const container = document.getElementById('tables-container');
    const title = document.getElementById('active-floor-title');
    container.innerHTML = '';
    
    const floor = restaurantFloors.find(f => f.id === activeFloorId);
    if(!floor) return;
    title.innerText = `${floor.name} - Tables`;

    if (floor.tables.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 30px; color: var(--text-muted); border: 2px dashed var(--border); border-radius: 8px;">No tables created in ${floor.name} yet.</div>`;
        return;
    }

    floor.tables.forEach(table => {
        let borderColor = 'var(--border)', badgeClass = 'bg-green', badgeText = 'Free';
        if(table.status === 'occupied') { borderColor = 'var(--error)'; badgeClass = 'bg-red'; badgeText = `Occupied (₹${table.bill})`; }
        else if(table.status === 'cleaning') { borderColor = 'var(--warning)'; badgeClass = 'bg-yellow'; badgeText = 'Cleaning'; }
        else { borderColor = 'var(--success)'; }

        const card = document.createElement('div');
        card.className = 'card'; card.style.borderLeft = `4px solid ${borderColor}`;
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <h3 style="font-size: 16px; font-weight: 700;">${table.name}</h3>
                <div class="table-actions">
                    <button type="button" class="icon-btn" onclick="showTableForm(${table.id})">✏️</button>
                    <button type="button" class="icon-btn danger" onclick="deleteTable(${table.id})">🗑️</button>
                </div>
            </div>
            <p class="badge ${badgeClass}" style="display: inline-block;">${badgeText}</p>`;
        container.appendChild(card);
    });
}

function showFloorForm(id = null) {
    document.getElementById('floor-form').style.display = 'flex';
    const input = document.getElementById('floor-name'), idInput = document.getElementById('floor-id');
    if(id) { input.value = restaurantFloors.find(f => f.id === id).name; idInput.value = id; } 
    else { input.value = ''; idInput.value = ''; }
}
function hideFloorForm() { document.getElementById('floor-form').style.display = 'none'; }
function handleFloorSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('floor-name').value.trim(), idInput = document.getElementById('floor-id').value;
    if(restaurantFloors.some(f => f.name.toLowerCase() === nameInput.toLowerCase() && f.id != idInput)) { triggerToast("Name exists", "error"); return; }
    
    if(idInput) { restaurantFloors.find(f => f.id == idInput).name = nameInput; triggerToast("Floor updated", "success"); } 
    else { const newId = Date.now(); restaurantFloors.push({ id: newId, name: nameInput, tables: [] }); activeFloorId = newId; triggerToast("Floor added", "success"); }
    hideFloorForm(); renderFloors();
}
function deleteFloor(id) {
    if(restaurantFloors.length === 1) { triggerToast("Need at least one floor.", "error"); return; }
    if(confirm("Delete floor and ALL tables inside?")) {
        restaurantFloors = restaurantFloors.filter(f => f.id !== id);
        if(activeFloorId === id) activeFloorId = restaurantFloors[0].id;
        renderFloors(); triggerToast("Floor deleted", "success");
    }
}

function showTableForm(id = null) {
    document.getElementById('table-form-container').style.display = 'block';
    const input = document.getElementById('table-name'), idInput = document.getElementById('table-id');
    if(id) { input.value = restaurantFloors.find(f => f.id === activeFloorId).tables.find(t => t.id === id).name; idInput.value = id; } 
    else { input.value = ''; idInput.value = ''; }
}
function hideTableForm() { document.getElementById('table-form-container').style.display = 'none'; }
function handleTableSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('table-name').value.trim(), idInput = document.getElementById('table-id').value;
    const floor = restaurantFloors.find(f => f.id === activeFloorId);
    if(floor.tables.some(t => t.name.toLowerCase() === nameInput.toLowerCase() && t.id != idInput)) { triggerToast("Table exists", "error"); return; }
    
    if(idInput) { floor.tables.find(t => t.id == idInput).name = nameInput; triggerToast("Table updated", "success"); } 
    else { floor.tables.push({ id: Date.now(), name: nameInput, status: 'free' }); triggerToast("Table added", "success"); }
    hideTableForm(); renderTables(); updateReservationDropdown(); populateDineInTables();
}
function deleteTable(id) {
    if(confirm("Delete this table?")) {
        const floor = restaurantFloors.find(f => f.id === activeFloorId);
        floor.tables = floor.tables.filter(t => t.id !== id);
        renderTables(); updateReservationDropdown(); populateDineInTables(); triggerToast("Table removed", "success");
    }
}
function updateReservationDropdown() {
    const select = document.getElementById('reservation-table-select');
    if(!select) return;
    select.innerHTML = '<option value="">-- Select Table --</option>';
    restaurantFloors.forEach(floor => {
        if(floor.tables.length > 0) {
            const optgroup = document.createElement('optgroup'); optgroup.label = floor.name;
            floor.tables.forEach(table => { const opt = document.createElement('option'); opt.value = table.id; opt.text = table.name; optgroup.appendChild(opt); });
            select.appendChild(optgroup);
        }
    });
}


// ==========================================
// BILLING & POS CART LOGIC
// ==========================================
let currentBillingMode = 'quick'; // 'quick', 'dinein', 'delivery'
let currentCart = [];

function switchBillingMode(mode, element) {
    currentBillingMode = mode;
    document.getElementById('billing-modes').querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
    element.classList.add('active');

    document.querySelectorAll('.billing-context').forEach(el => el.style.display = 'none');
    document.getElementById(`context-${mode}`).style.display = 'block';

    if(mode === 'dinein') populateDineInTables();
    renderCart(); renderPOSGrid();
}

function populateDineInTables() {
    const select = document.getElementById('di-table');
    if(!select || typeof restaurantFloors === 'undefined') return;
    select.innerHTML = '<option value="">-- Select Active Table --</option>';
    restaurantFloors.forEach(floor => {
        if(floor.tables.length > 0) {
            const optgroup = document.createElement('optgroup'); optgroup.label = floor.name;
            floor.tables.forEach(table => { optgroup.innerHTML += `<option value="${table.name}">${table.name} (${table.status})</option>`; });
            select.appendChild(optgroup);
        }
    });
}

function renderPOSGrid(searchTerm = '') {
    const grid = document.getElementById('pos-menu-grid');
    if(!grid) return; grid.innerHTML = '';

    menuData.items.forEach(item => {
        if(searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return;
        const activePrice = item.prices[currentBillingMode];
        const card = document.createElement('div'); card.className = 'pos-item-card';
        card.onclick = () => addToCart(item.id);
        card.innerHTML = `<div style="font-size: 10px; text-align: left;">${item.type.split(' ')[0]}</div><div class="pos-item-name">${item.name}</div><div class="pos-item-price">₹${activePrice}</div>`;
        grid.appendChild(card);
    });
}

function filterPOSMenu(val) { renderPOSGrid(val); }

function addToCart(itemId) {
    const item = menuData.items.find(i => i.id === itemId);
    const existing = currentCart.find(c => c.id === itemId);
    if(existing) existing.qty++; else currentCart.push({ id: item.id, name: item.name, taxId: item.taxId, qty: 1 });
    renderCart();
}

function updateCartQty(itemId, change) {
    const item = currentCart.find(c => c.id === itemId);
    if(item) {
        item.qty += change;
        if(item.qty <= 0) currentCart = currentCart.filter(c => c.id !== itemId);
        renderCart();
    }
}

function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    if(currentCart.length === 0) {
        cartContainer.innerHTML = `<div style="text-align:center; padding:50px 0; color:var(--text-muted);">Cart is empty. Tap items to add.</div>`;
        updateTotals(0, 0); return;
    }

    let subtotal = 0, totalTax = 0;
    cartContainer.innerHTML = currentCart.map(c => {
        const menuItem = menuData.items.find(i => i.id === c.id);
        const price = menuItem.prices[currentBillingMode];
        const taxProfile = menuData.taxes.find(t => t.id === c.taxId);
        const itemTotal = price * c.qty;
        subtotal += itemTotal;
        if(taxProfile && taxProfile.type === 'forward') totalTax += (itemTotal * taxProfile.rate) / 100;

        return `<div class="cart-item">
            <div style="flex: 1;"><div style="font-weight: 600; font-size: 13px;">${c.name}</div><div style="font-size: 11px; color: var(--text-muted);">₹${price} x ${c.qty}</div></div>
            <div class="cart-qty-ctrl"><button class="cart-qty-btn" onclick="updateCartQty(${c.id}, -1)">-</button><span style="font-size: 13px; font-weight: 600;">${c.qty}</span><button class="cart-qty-btn" onclick="updateCartQty(${c.id}, 1)">+</button></div>
            <div style="font-weight: 600; margin-left: 15px;">₹${itemTotal}</div>
        </div>`;
    }).join('');
    updateTotals(subtotal, totalTax);
}

function updateTotals(subtotal, tax) {
    let dynamicFees = 0, feeLabel = "No Extra Fees";
    if(currentBillingMode === 'delivery') { dynamicFees = 30; feeLabel = "Packaging Fee"; } 
    else if (currentBillingMode === 'dinein') { dynamicFees = subtotal * 0.05; feeLabel = "Service Chg (5%)"; }

    document.getElementById('cart-subtotal').innerText = `₹${subtotal.toFixed(2)}`;
    document.getElementById('cart-taxes').innerText = `₹${tax.toFixed(2)}`;
    document.getElementById('fee-row').innerHTML = `<span>${feeLabel}</span><span id="cart-fees">₹${dynamicFees.toFixed(2)}</span>`;
    document.getElementById('cart-total').innerText = `₹${(subtotal + tax + dynamicFees).toFixed(2)}`;
}

function fireKOT() {
    if(currentCart.length === 0) { triggerToast("Add items before firing KOT", "error"); return; }
    if(currentBillingMode === 'dinein') {
        const table = document.getElementById('di-table').value;
        if(!table) { triggerToast("Please select a table first", "error"); return; }
        triggerToast(`KOT Fired for ${table}! (Table Locked)`, "success");
    } else { triggerToast("KOT Fired to Kitchen!", "success"); }
    currentCart = []; renderCart();
}

function settleBill() {
    if(currentCart.length === 0 && currentBillingMode !== 'dinein') { triggerToast("Cart is empty", "error"); return; }
    if(currentBillingMode === 'delivery') {
        if(!document.getElementById('del-phone').value || !document.getElementById('del-address').value) { triggerToast("Delivery Address & Phone required!", "error"); return; }
    }
    triggerToast(`Bill Settled & Printed Successfully!`, "success");
    currentCart = []; document.querySelectorAll('.billing-context input, .billing-context textarea, .billing-context select').forEach(i => i.value = ''); renderCart();
}

function lookupCRM() {
    const phone = document.getElementById('del-phone').value;
    const customer = crmData.find(c => c.phone === phone);
    if(customer) { document.getElementById('del-name').value = customer.name; document.getElementById('del-address').value = customer.address; triggerToast("CRM Data found and linked!", "success"); } 
    else { triggerToast("New Customer - No history found", "warning"); }
}

function simulateQROrder() { document.getElementById('qr-orders-panel').style.display = 'block'; triggerToast("Incoming QR Order from Table 3!", "warning"); }
function acceptQROrder() { document.getElementById('qr-orders-panel').style.display = 'none'; triggerToast("QR Order Accepted. KOT auto-fired!", "success"); }
function rejectQROrder() { document.getElementById('qr-orders-panel').style.display = 'none'; triggerToast("QR Order Rejected.", "error"); }

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderFloors();
    renderMenuTables();
    renderPOSGrid();
});
