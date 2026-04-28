// ==========================================
// DB WRAPPER
// ==========================================
const DB_KEY = 'restros_db_v2';
let restrosDB = { groups: [], categories: [], items: [], taxes: [], floors: [], tables: [], kots: [], bills: [] };

function initDB() {
    if (!localStorage.getItem(DB_KEY)) {
        restrosDB = {
            groups: [{ id: "g1", name: "Food" }, { id: "g2", name: "Beverages" }],
            categories: [{ id: "c1", name: "Starters", group: "g1" }, { id: "c2", name: "Cold Drinks", group: "g2" }],
            taxes: [{ id: "t1", name: "GST 5%", rate: 5, type: "forward" }],
            items: [
                { id: "i1", name: "Paneer Tikka", category: "c1", tax: "t1", foodType: "veg", prices: { dinein: 280, takeaway: 280 } },
                { id: "i2", name: "Coke", category: "c2", tax: "t1", foodType: "veg", prices: { dinein: 60, takeaway: 60 } }
            ],
            floors: [{ id: "f1", name: "Main Dining" }, { id: "f2", name: "Rooftop" }],
            tables: [
                { id: "t1", floorId: "f1", name: "Table 1", capacity: 4, status: "free", currentOrderId: null },
                { id: "t2", floorId: "f1", name: "Table 2", capacity: 4, status: "occupied", currentOrderId: "ord1" },
                { id: "t3", floorId: "f2", name: "Roof 1", capacity: 2, status: "free", currentOrderId: null }
            ],
            kots: [], bills: [], orders: [
                { id: "ord1", tableId: "t2", items: [{ id: "i1", name: "Paneer Tikka", qty: 2, price: 280 }] }
            ]
        };
        saveDB();
    } else {
        restrosDB = JSON.parse(localStorage.getItem(DB_KEY));
        if(!restrosDB.orders) restrosDB.orders = [];
    }
}
function saveDB() { localStorage.setItem(DB_KEY, JSON.stringify(restrosDB)); }

// ==========================================
// UI UTILS
// ==========================================
setInterval(() => { document.getElementById('clock').innerText = new Date().toLocaleTimeString('en-IN'); }, 1000);
function toggleMenu() { document.getElementById('sidebar').classList.toggle('open'); }
function switchTab(viewId, element) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    if(element) element.classList.add('active');
    if(window.innerWidth <= 767) toggleMenu();
}
function switchMenuTab(tabId, element) {
    document.querySelectorAll('.menu-sub-view').forEach(v => v.style.display = 'none');
    document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).style.display = 'block';
    if(element) element.classList.add('active');
}
function triggerToast(msg, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div'); toast.className = 'toast';
    toast.style.borderLeftColor = type === 'success' ? 'var(--success)' : 'var(--error)';
    toast.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span> <div>${msg}</div>`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

// ==========================================
// MENU CRUD (Groups, Categories, Taxes, Items)
// ==========================================
function renderMenuTables() {
    // Render Groups
    document.getElementById('groups-table-body').innerHTML = restrosDB.groups.map(g => `<tr><td>${g.name}</td>
        <td><button class="icon-btn" onclick="editGroup('${g.id}')">✏️ Edit</button> <button class="icon-btn danger" onclick="deleteGroup('${g.id}')">🗑️ Del</button></td></tr>`).join('');
    
    // Render Categories
    document.getElementById('cats-table-body').innerHTML = restrosDB.categories.map(c => {
        let groupName = restrosDB.groups.find(g => g.id === c.group)?.name || '-';
        return `<tr><td>${c.name}</td><td>${groupName}</td>
        <td><button class="icon-btn" onclick="editCategory('${c.id}')">✏️ Edit</button> <button class="icon-btn danger" onclick="deleteCategory('${c.id}')">🗑️ Del</button></td></tr>`;
    }).join('');

    // Render Taxes
    document.getElementById('taxes-table-body').innerHTML = restrosDB.taxes.map(t => `<tr><td>${t.name}</td><td>${t.rate}%</td><td>${t.type}</td>
        <td><button class="icon-btn" onclick="editTax('${t.id}')">✏️ Edit</button> <button class="icon-btn danger" onclick="deleteTax('${t.id}')">🗑️ Del</button></td></tr>`).join('');

    // Render Items
    document.getElementById('items-table-body').innerHTML = restrosDB.items.map(i => {
        let catName = restrosDB.categories.find(c => c.id === i.category)?.name || '-';
        return `<tr><td>${i.name}</td><td>${catName}</td><td>₹${i.prices.dinein} / ₹${i.prices.takeaway}</td>
        <td><button class="icon-btn" onclick="editItem('${i.id}')">✏️ Edit</button> <button class="icon-btn danger" onclick="deleteItem('${i.id}')">🗑️ Del</button></td></tr>`;
    }).join('');

    // Update Form Selects
    document.getElementById('cat-group').innerHTML = restrosDB.groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
    document.getElementById('item-category').innerHTML = restrosDB.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    document.getElementById('item-tax').innerHTML = restrosDB.taxes.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
}

// Group Submits
function handleGroupSubmit(e) {
    e.preventDefault(); const id = document.getElementById('group-id').value; const name = document.getElementById('group-name').value;
    if(id) { const g = restrosDB.groups.find(x => x.id === id); g.name = name; triggerToast("Group Updated", "success"); } 
    else { restrosDB.groups.push({ id: "g"+Date.now(), name }); triggerToast("Group Created", "success"); }
    saveDB(); e.target.reset(); document.getElementById('group-id').value = ''; renderMenuTables();
}
function editGroup(id) { const g = restrosDB.groups.find(x => x.id === id); document.getElementById('group-id').value = g.id; document.getElementById('group-name').value = g.name; }
function deleteGroup(id) { if(restrosDB.categories.some(c => c.group === id)) { triggerToast("Cannot delete: Group has categories.", "error"); return; } if(confirm("Delete Group?")) { restrosDB.groups = restrosDB.groups.filter(x => x.id !== id); saveDB(); renderMenuTables(); triggerToast("Deleted", "success"); } }

// Category Submits
function handleCategorySubmit(e) {
    e.preventDefault(); const id = document.getElementById('cat-id').value; const name = document.getElementById('cat-name').value; const group = document.getElementById('cat-group').value;
    if(id) { const c = restrosDB.categories.find(x => x.id === id); c.name = name; c.group = group; triggerToast("Category Updated", "success"); } 
    else { restrosDB.categories.push({ id: "c"+Date.now(), name, group }); triggerToast("Category Created", "success"); }
    saveDB(); e.target.reset(); document.getElementById('cat-id').value = ''; renderMenuTables();
}
function editCategory(id) { const c = restrosDB.categories.find(x => x.id === id); document.getElementById('cat-id').value = c.id; document.getElementById('cat-name').value = c.name; document.getElementById('cat-group').value = c.group; }
function deleteCategory(id) { if(restrosDB.items.some(i => i.category === id)) { triggerToast("Cannot delete: Category has items.", "error"); return; } if(confirm("Delete Category?")) { restrosDB.categories = restrosDB.categories.filter(x => x.id !== id); saveDB(); renderMenuTables(); triggerToast("Deleted", "success"); } }

// Tax Submits
function handleTaxSubmit(e) {
    e.preventDefault(); const id = document.getElementById('tax-id').value; const name = document.getElementById('tax-name').value; const rate = document.getElementById('tax-rate').value; const type = document.getElementById('tax-type').value;
    if(id) { const t = restrosDB.taxes.find(x => x.id === id); t.name = name; t.rate = rate; t.type = type; triggerToast("Tax Updated", "success"); } 
    else { restrosDB.taxes.push({ id: "t"+Date.now(), name, rate, type }); triggerToast("Tax Created", "success"); }
    saveDB(); e.target.reset(); document.getElementById('tax-id').value = ''; renderMenuTables();
}
function editTax(id) { const t = restrosDB.taxes.find(x => x.id === id); document.getElementById('tax-id').value = t.id; document.getElementById('tax-name').value = t.name; document.getElementById('tax-rate').value = t.rate; document.getElementById('tax-type').value = t.type; }
function deleteTax(id) { if(confirm("Delete Tax?")) { restrosDB.taxes = restrosDB.taxes.filter(x => x.id !== id); saveDB(); renderMenuTables(); triggerToast("Deleted", "success"); } }

// Item Submits
function handleItemSubmit(e) {
    e.preventDefault(); const id = document.getElementById('item-id').value;
    const itemData = {
        name: document.getElementById('item-name').value, category: document.getElementById('item-category').value, tax: document.getElementById('item-tax').value, foodType: document.getElementById('item-type').value,
        prices: { dinein: parseFloat(document.getElementById('price-dinein').value), takeaway: parseFloat(document.getElementById('price-takeaway').value) }
    };
    if(id) { const i = restrosDB.items.find(x => x.id === id); Object.assign(i, itemData); triggerToast("Item Updated", "success"); } 
    else { itemData.id = "i"+Date.now(); restrosDB.items.push(itemData); triggerToast("Item Created", "success"); }
    saveDB(); e.target.reset(); document.getElementById('item-id').value = ''; renderMenuTables(); renderPOSGrid();
}
function editItem(id) { const i = restrosDB.items.find(x => x.id === id); document.getElementById('item-id').value = i.id; document.getElementById('item-name').value = i.name; document.getElementById('item-category').value = i.category; document.getElementById('item-tax').value = i.tax; document.getElementById('item-type').value = i.foodType; document.getElementById('price-dinein').value = i.prices.dinein; document.getElementById('price-takeaway').value = i.prices.takeaway; }
function deleteItem(id) { if(confirm("Delete Item?")) { restrosDB.items = restrosDB.items.filter(x => x.id !== id); saveDB(); renderMenuTables(); renderPOSGrid(); triggerToast("Deleted", "success"); } }


// ==========================================
// TABLE & FLOOR CRUD + RESERVATIONS
// ==========================================
let activeFloorId = null;

function renderFloorAndTables() {
    if(restrosDB.floors.length > 0 && !activeFloorId) activeFloorId = restrosDB.floors[0].id;
    
    // Render Floor Tabs
    document.getElementById('floor-tabs').innerHTML = restrosDB.floors.map(f => `
        <div class="floor-tab ${f.id === activeFloorId ? 'active' : ''}" onclick="activeFloorId='${f.id}'; renderFloorAndTables();">
            <span>${f.name}</span>
            <div class="table-actions">
                <button type="button" class="icon-btn" onclick="event.stopPropagation(); editFloor('${f.id}')">✏️</button>
                <button type="button" class="icon-btn danger" onclick="event.stopPropagation(); deleteFloor('${f.id}')">🗑️</button>
            </div>
        </div>`).join('');
    
    // Render Table Cards for active floor
    const floorTables = restrosDB.tables.filter(t => t.floorId === activeFloorId);
    let activeFloorName = restrosDB.floors.find(f => f.id === activeFloorId)?.name || 'No Floor Selected';
    document.getElementById('active-floor-title').innerText = `${activeFloorName} - Tables`;

    document.getElementById('tables-container').innerHTML = floorTables.map(t => {
        let cls = t.status === 'occupied' ? 'occupied' : t.status === 'reserved' ? 'reserved' : '';
        let badge = t.status === 'occupied' ? '🔴 Occupied' : t.status === 'reserved' ? '🟡 Reserved' : '🟢 Free';
        return `<div class="t-card ${cls}" onclick="openTableOrder('${t.id}')">
            <div style="font-weight: 700; font-size: 16px; margin-bottom: 5px;">${t.name}</div>
            <div style="font-size: 12px; margin-bottom: 10px;">${badge}</div>
            <div class="table-actions" style="justify-content: center;">
                <button type="button" class="icon-btn" onclick="event.stopPropagation(); editTable('${t.id}')">✏️</button>
                <button type="button" class="icon-btn danger" onclick="event.stopPropagation(); deleteTable('${t.id}')">🗑️</button>
            </div>
        </div>`;
    }).join('');

    // Update Reservation Select
    document.getElementById('reservation-table-select').innerHTML = restrosDB.tables.filter(t=>t.status==='free').map(t => `<option value="${t.id}">${t.name} (${restrosDB.floors.find(f=>f.id===t.floorId)?.name})</option>`).join('');
    renderBillingTableGrid();
}

// Floor Submits
function showFloorForm() { document.getElementById('floor-form').style.display='flex'; document.getElementById('floor-id').value=''; document.getElementById('floor-name').value=''; }
function handleFloorSubmit(e) {
    e.preventDefault(); const id = document.getElementById('floor-id').value; const name = document.getElementById('floor-name').value;
    if(id) { restrosDB.floors.find(x => x.id === id).name = name; triggerToast("Floor Updated", "success"); } 
    else { const newId = "f"+Date.now(); restrosDB.floors.push({ id: newId, name }); activeFloorId = newId; triggerToast("Floor Created", "success"); }
    saveDB(); e.target.style.display='none'; renderFloorAndTables();
}
function editFloor(id) { document.getElementById('floor-form').style.display='flex'; document.getElementById('floor-id').value = id; document.getElementById('floor-name').value = restrosDB.floors.find(f=>f.id===id).name; }
function deleteFloor(id) { if(confirm("Delete floor and ALL its tables?")) { restrosDB.tables = restrosDB.tables.filter(t => t.floorId !== id); restrosDB.floors = restrosDB.floors.filter(f => f.id !== id); activeFloorId = null; saveDB(); renderFloorAndTables(); triggerToast("Deleted", "success"); } }

// Table Submits
function showTableForm() { document.getElementById('table-form-container').style.display='block'; document.getElementById('table-form').reset(); document.getElementById('table-id').value=''; }
function handleTableSubmit(e) {
    e.preventDefault(); const id = document.getElementById('table-id').value; const name = document.getElementById('table-name').value;
    if(!activeFloorId) { triggerToast("Select a floor first!", "error"); return; }
    if(id) { restrosDB.tables.find(x => x.id === id).name = name; triggerToast("Table Updated", "success"); } 
    else { restrosDB.tables.push({ id: "t"+Date.now(), floorId: activeFloorId, name, status: 'free', currentOrderId: null }); triggerToast("Table Created", "success"); }
    saveDB(); e.target.parentElement.style.display='none'; renderFloorAndTables();
}
function editTable(id) { document.getElementById('table-form-container').style.display='block'; document.getElementById('table-id').value = id; document.getElementById('table-name').value = restrosDB.tables.find(t=>t.id===id).name; }
function deleteTable(id) { if(confirm("Delete Table?")) { restrosDB.tables = restrosDB.tables.filter(t => t.id !== id); saveDB(); renderFloorAndTables(); triggerToast("Deleted", "success"); } }

// Reservation Submit
function handleReservationSubmit(e) {
    e.preventDefault(); const tableId = document.getElementById('reservation-table-select').value;
    const table = restrosDB.tables.find(t => t.id === tableId);
    if(table) { table.status = 'reserved'; saveDB(); renderFloorAndTables(); triggerToast(`Table ${table.name} Reserved!`, "success"); e.target.reset(); }
}


// ==========================================
// BILLING & POS VISUAL GRID
// ==========================================
let currentBillingMode = 'quick'; 
let currentCart = [];
let selectedDineInTable = null;
let billingActiveFloor = null;

function switchBillingMode(mode, element) {
    currentBillingMode = mode;
    document.getElementById('billing-modes').querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
    element.classList.add('active');
    document.querySelectorAll('.billing-context').forEach(el => el.style.display = 'none');
    document.getElementById(`context-${mode}`).style.display = 'block';
    if(mode === 'dinein') { renderBillingTableGrid(); }
    currentCart = []; selectedDineInTable = null; renderCart(); renderPOSGrid();
}

function renderBillingTableGrid() {
    const container = document.getElementById('billing-table-container');
    if(restrosDB.floors.length === 0) { container.innerHTML = '<p>No floors setup.</p>'; return; }
    if(!billingActiveFloor) billingActiveFloor = restrosDB.floors[0].id;

    // Filter Tabs
    let html = `<div style="display:flex; gap:10px; margin-bottom:10px; overflow-x:auto;">`;
    restrosDB.floors.forEach(f => { html += `<button class="badge ${f.id === billingActiveFloor ? 'bg-green' : 'bg-gray'}" style="border:none; font-size:14px; padding:6px 12px; cursor:pointer;" onclick="billingActiveFloor='${f.id}'; renderBillingTableGrid()">${f.name}</button>`; });
    html += `</div>`;

    // Table Grid
    html += `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap:10px;">`;
    restrosDB.tables.filter(t => t.floorId === billingActiveFloor).forEach(t => {
        let color = t.status === 'occupied' ? 'var(--error)' : t.status === 'reserved' ? 'var(--warning)' : 'var(--success)';
        let isSelected = selectedDineInTable === t.id ? 'box-shadow: 0 0 0 3px rgba(255,90,31,0.5);' : '';
        html += `<div style="border: 2px solid ${color}; border-radius: 8px; padding: 10px; text-align: center; cursor: pointer; background: var(--white); ${isSelected}" onclick="selectBillingTable('${t.id}')">
            <h4 style="margin:0; font-size:14px;">${t.name}</h4><small style="font-size:10px; color:var(--text-muted);">${t.status}</small>
        </div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
}

function selectBillingTable(tableId) {
    selectedDineInTable = tableId;
    const table = restrosDB.tables.find(t => t.id === tableId);
    document.getElementById('active-billing-table').innerText = `${table.name} (${table.status})`;
    renderBillingTableGrid(); // refresh border highlight

    if(table.status === 'occupied' && table.currentOrderId) {
        const order = restrosDB.orders.find(o => o.id === table.currentOrderId);
        currentCart = order ? JSON.parse(JSON.stringify(order.items)) : [];
        triggerToast(`Loaded active order for ${table.name}`, "success");
    } else {
        currentCart = [];
    }
    renderCart();
}

function openTableOrder(tableId) {
    switchTab('billing', document.querySelector('.nav-item:nth-child(2)'));
    switchBillingMode('dinein', document.querySelector('#billing-modes .sub-tab:nth-child(2)'));
    const table = restrosDB.tables.find(t => t.id === tableId);
    billingActiveFloor = table.floorId;
    selectBillingTable(tableId);
}

function renderPOSGrid(searchTerm = '') {
    const grid = document.getElementById('pos-menu-grid'); if(!grid) return; grid.innerHTML = '';
    restrosDB.items.forEach(item => {
        if(searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return;
        const activePrice = item.prices[currentBillingMode] || item.prices.dinein; // Fallback
        const card = document.createElement('div'); card.className = 'pos-item-card';
        card.onclick = () => addToCart(item.id);
        let icon = item.foodType === 'veg' ? '🟢' : item.foodType === 'nonveg' ? '🔴' : '🟡';
        card.innerHTML = `<div style="font-size: 10px; text-align: left;">${icon}</div><div class="pos-item-name">${item.name}</div><div class="pos-item-price">₹${activePrice}</div>`;
        grid.appendChild(card);
    });
}
function filterPOSMenu(val) { renderPOSGrid(val); }

function addToCart(itemId) {
    if(currentBillingMode === 'dinein' && !selectedDineInTable) { triggerToast("Please select a table first!", "error"); return; }
    const item = restrosDB.items.find(i => i.id === itemId);
    const existing = currentCart.find(c => c.id === itemId);
    if(existing) existing.qty++; else currentCart.push({ id: item.id, name: item.name, price: item.prices[currentBillingMode]||item.prices.dinein, taxId: item.tax, qty: 1 });
    renderCart();
}

function updateCartQty(itemId, change) {
    const item = currentCart.find(c => c.id === itemId);
    if(item) { item.qty += change; if(item.qty <= 0) currentCart = currentCart.filter(c => c.id !== itemId); renderCart(); }
}

function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    if(currentCart.length === 0) {
        cartContainer.innerHTML = `<div style="text-align:center; padding:50px 0; color:var(--text-muted);">Cart is empty. Tap items to add.</div>`;
        document.getElementById('cart-subtotal').innerText = '₹0.00'; document.getElementById('cart-taxes').innerText = '₹0.00'; document.getElementById('cart-total').innerText = '₹0.00';
        return;
    }

    let subtotal = 0, totalTax = 0;
    cartContainer.innerHTML = currentCart.map(c => {
        const itemTotal = c.price * c.qty; subtotal += itemTotal;
        const taxProfile = restrosDB.taxes.find(t => t.id === c.taxId);
        if(taxProfile && taxProfile.type === 'forward') totalTax += (itemTotal * taxProfile.rate) / 100;

        return `<div class="cart-item">
            <div style="flex: 1;"><div style="font-weight: 600; font-size: 13px;">${c.name}</div><div style="font-size: 11px; color: var(--text-muted);">₹${c.price} x ${c.qty}</div></div>
            <div class="cart-qty-ctrl"><button class="cart-qty-btn" onclick="updateCartQty('${c.id}', -1)">-</button><span style="font-size: 13px; font-weight: 600;">${c.qty}</span><button class="cart-qty-btn" onclick="updateCartQty('${c.id}', 1)">+</button></div>
            <div style="font-weight: 600; margin-left: 15px;">₹${itemTotal}</div>
        </div>`;
    }).join('');
    
    document.getElementById('cart-subtotal').innerText = `₹${subtotal}`; document.getElementById('cart-taxes').innerText = `₹${totalTax}`;
    document.getElementById('cart-total').innerText = `₹${(subtotal + totalTax)}`;
}

function fireKOT() { 
    if(currentCart.length===0) { triggerToast("Cart Empty", "error"); return; }
    
    if(currentBillingMode === 'dinein') {
        const table = restrosDB.tables.find(t => t.id === selectedDineInTable);
        table.status = 'occupied';
        if(!table.currentOrderId) { const oId = "ord"+Date.now(); restrosDB.orders.push({id: oId, tableId: table.id, items: currentCart}); table.currentOrderId = oId; }
        else { const order = restrosDB.orders.find(o => o.id === table.currentOrderId); order.items = JSON.parse(JSON.stringify(currentCart)); }
        saveDB(); renderFloorAndTables(); renderBillingTableGrid();
        triggerToast(`KOT Fired for ${table.name}!`, "success");
    } else {
        triggerToast(`KOT Fired!`, "success");
    }
    currentCart=[]; renderCart();
}

function settleBill() { 
    if(currentCart.length===0) { triggerToast("Cart Empty", "error"); return; }
    if(currentBillingMode === 'dinein') {
        const table = restrosDB.tables.find(t => t.id === selectedDineInTable);
        table.status = 'free'; table.currentOrderId = null;
        restrosDB.orders = restrosDB.orders.filter(o => o.id !== table.currentOrderId);
        saveDB(); renderFloorAndTables(); renderBillingTableGrid(); document.getElementById('active-billing-table').innerText = 'None Selected'; selectedDineInTable=null;
    }
    triggerToast("Bill Settled Successfully", "success"); currentCart=[]; renderCart();
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    initDB();
    renderMenuTables();
    renderFloorAndTables();
    renderPOSGrid();
});
