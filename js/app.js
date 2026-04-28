// ==========================================
// DB WRAPPER (localStorage)
// ==========================================
const DB_KEY = 'restros_db_v2_2';
let restrosDB = { groups: [], categories: [], items: [], taxes: [], floors: [], tables: [], variants: [], addons: [], kots: [], bills: [], orders: [], inventory: [], customers: [] };

function initDB() {
    if (!localStorage.getItem(DB_KEY)) {
        restrosDB = {
            groups: [{ id: "g1", name: "Food" }, { id: "g2", name: "Beverages" }],
            categories: [{ id: "c1", name: "Starters", group: "g1" }, { id: "c2", name: "Cold Drinks", group: "g2" }],
            taxes: [{ id: "t1", name: "GST 5%", rate: 5, type: "forward" }],
            variants: [{ id: "v1", name: "Portion", options: [{label:"Half", price:0}, {label:"Full", price:80}], type: "mandatory" }],
            addons: [{ id: "a1", name: "Sauces", min: 0, max: 2 }],
            items: [
                { id: "i1", name: "Paneer Tikka", code: "PTK", category: "c1", tax: "t1", foodType: "veg", active: true, prices: { dinein: 280, takeaway: 280, online: 300, quick: 280 }, channels: {dinein:true, takeaway:true, online:true, quick:true} },
                { id: "i2", name: "Coke", code: "COK", category: "c2", tax: "t1", foodType: "veg", active: true, prices: { dinein: 60, takeaway: 60, online: 70, quick: 60 }, channels: {dinein:true, takeaway:true, online:true, quick:true} }
            ],
            floors: [{ id: "f1", name: "Main Dining" }, { id: "f2", name: "Rooftop" }],
            tables: [
                { id: "t1", floorId: "f1", name: "Table 1", capacity: 4, status: "free", currentOrderId: null },
                { id: "t2", floorId: "f1", name: "Table 2", capacity: 4, status: "free", currentOrderId: null }
            ],
            kots: [], bills: [], orders: [],
            inventory: [{ itemId: "i1", itemName: "Paneer Tikka", availableQty: 50, reorderAt: 10, unit: "pcs" }],
            customers: [{ id: "cust1", name: "Rahul Verma", phone: "9876543210", visits: 12, totalspent: 15400, loyaltyPoints: 840 }]
        };
        saveDB();
    } else {
        restrosDB = JSON.parse(localStorage.getItem(DB_KEY));
    }
}
function saveDB() { localStorage.setItem(DB_KEY, JSON.stringify(restrosDB)); }

// ==========================================
// UI UTILITIES
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
function formatIN(amount) { return Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }); }

document.querySelectorAll('.system-form').forEach(f => f.addEventListener('submit', function(e){ e.preventDefault(); triggerToast(this.getAttribute('data-success')||"Done","success"); this.reset(); }));

// ==========================================
// DASHBOARD LOGIC (FIXED)
// ==========================================
function refreshDashboard() {
    const today = new Date().toDateString();
    const todayBills = restrosDB.bills.filter(b => new Date(b.settledAt).toDateString() === today);
    
    // Revenue & Orders
    const revenue = todayBills.reduce((s, b) => s + (b.total || 0), 0);
    document.getElementById('stat-revenue').innerText = '₹' + formatIN(revenue);
    document.getElementById('stat-orders').innerText = todayBills.length;
    
    // Tables
    const tables = restrosDB.tables;
    document.getElementById('stat-tables').innerText = `${tables.filter(t => t.status === 'occupied').length} / ${tables.length}`;
    
    // KOTs
    document.getElementById('stat-kots').innerText = restrosDB.kots.filter(k => k.status === 'pending').length;

    // Top Selling Items
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
    } else {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">Awaiting settled bills...</td></tr>`;
    }
}

// ==========================================
// MENU CRUD (Groups, Categories, Taxes, Items)
// ==========================================
function renderMenuTables() {
    document.getElementById('groups-table-body').innerHTML = restrosDB.groups.map(g => `<tr><td>${g.name}</td><td><button class="icon-btn" onclick="editGroup('${g.id}')">✏️</button> <button class="icon-btn danger" onclick="deleteGroup('${g.id}')">🗑️</button></td></tr>`).join('');
    document.getElementById('cats-table-body').innerHTML = restrosDB.categories.map(c => {
        let groupName = restrosDB.groups.find(g => g.id === c.group)?.name || '-';
        return `<tr><td>${c.name}</td><td>${groupName}</td><td><button class="icon-btn" onclick="editCategory('${c.id}')">✏️</button> <button class="icon-btn danger" onclick="deleteCategory('${c.id}')">🗑️</button></td></tr>`;
    }).join('');
    document.getElementById('taxes-table-body').innerHTML = restrosDB.taxes.map(t => `<tr><td>${t.name}</td><td>${t.rate}%</td><td>${t.type}</td><td><button class="icon-btn" onclick="editTax('${t.id}')">✏️</button> <button class="icon-btn danger" onclick="deleteTax('${t.id}')">🗑️</button></td></tr>`).join('');
    document.getElementById('variants-table-body').innerHTML = restrosDB.variants.map(v => `<tr><td>${v.name}</td><td>${v.options.map(o=>o.label).join(', ')}</td><td><button class="icon-btn danger" onclick="deleteVariant('${v.id}')">🗑️</button></td></tr>`).join('');
    document.getElementById('addons-table-body').innerHTML = restrosDB.addons.map(a => `<tr><td>${a.name}</td><td>${a.min}-${a.max}</td><td><button class="icon-btn danger" onclick="deleteAddon('${a.id}')">🗑️</button></td></tr>`).join('');

    document.getElementById('items-table-body').innerHTML = restrosDB.items.map(i => {
        let catName = restrosDB.categories.find(c => c.id === i.category)?.name || '-';
        let status = i.active ? '<span class="badge bg-green">Active</span>' : '<span class="badge bg-gray">Inactive</span>';
        return `<tr><td>${i.name}</td><td>${catName}</td><td>₹${i.prices.dinein}/₹${i.prices.takeaway}/₹${i.prices.online}</td><td>${status}</td>
        <td><button class="icon-btn" onclick="editItem('${i.id}')">✏️</button> <button class="icon-btn danger" onclick="deleteItem('${i.id}')">🗑️</button></td></tr>`;
    }).join('');

    document.getElementById('cat-group').innerHTML = restrosDB.groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
    document.getElementById('item-category').innerHTML = restrosDB.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    document.getElementById('item-tax').innerHTML = restrosDB.taxes.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
}

// Submits for Menu
function handleGroupSubmit(e) { e.preventDefault(); const id = document.getElementById('group-id').value; const name = document.getElementById('group-name').value; if(id) { restrosDB.groups.find(x => x.id === id).name = name; triggerToast("Updated", "success"); } else { restrosDB.groups.push({ id: "g"+Date.now(), name }); triggerToast("Created", "success"); } saveDB(); e.target.reset(); document.getElementById('group-id').value = ''; renderMenuTables(); }
function editGroup(id) { const g = restrosDB.groups.find(x => x.id === id); document.getElementById('group-id').value = g.id; document.getElementById('group-name').value = g.name; }
function deleteGroup(id) { if(restrosDB.categories.some(c => c.group === id)) { triggerToast("Error: Group has categories.", "error"); return; } if(confirm("Delete Group?")) { restrosDB.groups = restrosDB.groups.filter(x => x.id !== id); saveDB(); renderMenuTables(); triggerToast("Deleted", "success"); } }

function handleCategorySubmit(e) { e.preventDefault(); const id = document.getElementById('cat-id').value; const name = document.getElementById('cat-name').value; const group = document.getElementById('cat-group').value; if(id) { const c = restrosDB.categories.find(x => x.id === id); c.name = name; c.group = group; triggerToast("Updated", "success"); } else { restrosDB.categories.push({ id: "c"+Date.now(), name, group }); triggerToast("Created", "success"); } saveDB(); e.target.reset(); document.getElementById('cat-id').value = ''; renderMenuTables(); }
function editCategory(id) { const c = restrosDB.categories.find(x => x.id === id); document.getElementById('cat-id').value = c.id; document.getElementById('cat-name').value = c.name; document.getElementById('cat-group').value = c.group; }
function deleteCategory(id) { if(restrosDB.items.some(i => i.category === id)) { triggerToast("Error: Category has items.", "error"); return; } if(confirm("Delete Category?")) { restrosDB.categories = restrosDB.categories.filter(x => x.id !== id); saveDB(); renderMenuTables(); triggerToast("Deleted", "success"); } }

function handleTaxSubmit(e) { e.preventDefault(); const id = document.getElementById('tax-id').value; const name = document.getElementById('tax-name').value; const rate = document.getElementById('tax-rate').value; const type = document.getElementById('tax-type').value; if(id) { const t = restrosDB.taxes.find(x => x.id === id); t.name = name; t.rate = rate; t.type = type; triggerToast("Updated", "success"); } else { restrosDB.taxes.push({ id: "t"+Date.now(), name, rate, type }); triggerToast("Created", "success"); } saveDB(); e.target.reset(); document.getElementById('tax-id').value = ''; renderMenuTables(); }
function editTax(id) { const t = restrosDB.taxes.find(x => x.id === id); document.getElementById('tax-id').value = t.id; document.getElementById('tax-name').value = t.name; document.getElementById('tax-rate').value = t.rate; document.getElementById('tax-type').value = t.type; }
function deleteTax(id) { if(confirm("Delete Tax?")) { restrosDB.taxes = restrosDB.taxes.filter(x => x.id !== id); saveDB(); renderMenuTables(); triggerToast("Deleted", "success"); } }

function handleVariantSubmit(e) { e.preventDefault(); const opts = document.getElementById('var-options').value.split(',').map(o => {return {label: o.trim(), price: 0}}); restrosDB.variants.push({ id: "v"+Date.now(), name: document.getElementById('var-name').value, options: opts }); saveDB(); e.target.reset(); renderMenuTables(); triggerToast("Variant Saved", "success"); }
function deleteVariant(id) { if(confirm("Delete Variant?")) { restrosDB.variants = restrosDB.variants.filter(x => x.id !== id); saveDB(); renderMenuTables(); triggerToast("Deleted", "success"); } }

function handleAddonSubmit(e) { e.preventDefault(); restrosDB.addons.push({ id: "a"+Date.now(), name: document.getElementById('addon-name').value, min: document.getElementById('addon-min').value, max: document.getElementById('addon-max').value }); saveDB(); e.target.reset(); renderMenuTables(); triggerToast("Addon Saved", "success"); }
function deleteAddon(id) { if(confirm("Delete Addon?")) { restrosDB.addons = restrosDB.addons.filter(x => x.id !== id); saveDB(); renderMenuTables(); triggerToast("Deleted", "success"); } }

function handleItemSubmit(e) {
    e.preventDefault(); const id = document.getElementById('item-id').value;
    const itemData = {
        name: document.getElementById('item-name').value, code: document.getElementById('item-sku').value, category: document.getElementById('item-category').value, tax: document.getElementById('item-tax').value, foodType: document.getElementById('item-type').value, active: true,
        prices: { dinein: parseFloat(document.getElementById('price-dinein').value), takeaway: parseFloat(document.getElementById('price-takeaway').value), online: parseFloat(document.getElementById('price-online').value||0), quick: parseFloat(document.getElementById('price-quick').value||0) },
        channels: { dinein: document.getElementById('en-dinein').checked, takeaway: document.getElementById('en-takeaway').checked, online: document.getElementById('en-online').checked, quick: document.getElementById('en-quick').checked }
    };
    if(id) { const i = restrosDB.items.find(x => x.id === id); Object.assign(i, itemData); triggerToast("Item Updated", "success"); } 
    else { itemData.id = "i"+Date.now(); restrosDB.items.push(itemData); triggerToast("Item Created", "success"); }
    saveDB(); e.target.reset(); document.getElementById('item-id').value = ''; renderMenuTables(); renderPOSGrid();
}
function editItem(id) { 
    const i = restrosDB.items.find(x => x.id === id); 
    document.getElementById('item-id').value = i.id; document.getElementById('item-name').value = i.name; document.getElementById('item-sku').value = i.code; document.getElementById('item-category').value = i.category; document.getElementById('item-tax').value = i.tax; document.getElementById('item-type').value = i.foodType; 
    document.getElementById('price-dinein').value = i.prices.dinein; document.getElementById('price-takeaway').value = i.prices.takeaway; document.getElementById('price-online').value = i.prices.online; document.getElementById('price-quick').value = i.prices.quick; 
    document.getElementById('en-dinein').checked = i.channels.dinein; document.getElementById('en-takeaway').checked = i.channels.takeaway; document.getElementById('en-online').checked = i.channels.online; document.getElementById('en-quick').checked = i.channels.quick; 
}
function deleteItem(id) { if(confirm("Delete Item?")) { restrosDB.items = restrosDB.items.filter(x => x.id !== id); saveDB(); renderMenuTables(); renderPOSGrid(); triggerToast("Deleted", "success"); } }


// ==========================================
// TABLE & FLOOR CRUD (FIXED)
// ==========================================
let activeFloorId = null;

function renderFloorAndTables() {
    if(restrosDB.floors.length > 0 && (!activeFloorId || !restrosDB.floors.find(f=>f.id===activeFloorId))) activeFloorId = restrosDB.floors[0].id;
    
    // Render Floor Tabs
    document.getElementById('floor-tabs').innerHTML = restrosDB.floors.map(f => `
        <div class="floor-tab ${f.id === activeFloorId ? 'active' : ''}" onclick="activeFloorId='${f.id}'; renderFloorAndTables();">
            <span>${f.name}</span>
            <div class="table-actions">
                <button type="button" class="icon-btn" onclick="event.stopPropagation(); editFloor('${f.id}')">✏️</button>
                <button type="button" class="icon-btn danger" onclick="event.stopPropagation(); deleteFloor('${f.id}')">🗑️</button>
            </div>
        </div>`).join('');
    
    // Render Tables
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

    // Reservations
    document.getElementById('reservation-table-select').innerHTML = restrosDB.tables.filter(t=>t.status==='free').map(t => `<option value="${t.id}">${t.name} (${restrosDB.floors.find(f=>f.id===t.floorId)?.name})</option>`).join('');
    renderBillingTableGrid();
}

function showFloorForm() { document.getElementById('floor-form').style.display='flex'; document.getElementById('floor-id').value=''; document.getElementById('floor-name').value=''; }
function handleFloorSubmit(e) {
    e.preventDefault(); const id = document.getElementById('floor-id').value; const name = document.getElementById('floor-name').value;
    if(id) { restrosDB.floors.find(x => x.id === id).name = name; triggerToast("Floor Updated", "success"); } 
    else { const newId = "f"+Date.now(); restrosDB.floors.push({ id: newId, name }); activeFloorId = newId; triggerToast("Floor Created", "success"); }
    saveDB(); document.getElementById('floor-form').style.display='none'; renderFloorAndTables();
}
function editFloor(id) { document.getElementById('floor-form').style.display='flex'; document.getElementById('floor-id').value = id; document.getElementById('floor-name').value = restrosDB.floors.find(f=>f.id===id).name; }
function deleteFloor(id) { if(confirm("Delete floor and ALL its tables?")) { restrosDB.tables = restrosDB.tables.filter(t => t.floorId !== id); restrosDB.floors = restrosDB.floors.filter(f => f.id !== id); activeFloorId = null; saveDB(); renderFloorAndTables(); triggerToast("Deleted", "success"); } }

function showTableForm() { document.getElementById('table-form-container').style.display='block'; document.getElementById('table-form').reset(); document.getElementById('table-id').value=''; }
function handleTableSubmit(e) {
    e.preventDefault(); const id = document.getElementById('table-id').value; const name = document.getElementById('table-name').value; const cap = document.getElementById('table-cap').value;
    if(!activeFloorId) { triggerToast("Select a floor first!", "error"); return; }
    if(id) { const t = restrosDB.tables.find(x => x.id === id); t.name = name; t.capacity = cap; triggerToast("Table Updated", "success"); } 
    else { restrosDB.tables.push({ id: "t"+Date.now(), floorId: activeFloorId, name, capacity: cap, status: 'free', currentOrderId: null }); triggerToast("Table Created", "success"); }
    saveDB(); document.getElementById('table-form-container').style.display='none'; renderFloorAndTables();
}
function editTable(id) { 
    document.getElementById('table-form-container').style.display='block'; 
    const table = restrosDB.tables.find(t=>t.id===id);
    document.getElementById('table-id').value = id; 
    document.getElementById('table-name').value = table.name; 
    document.getElementById('table-cap').value = table.capacity || 4; 
}
function deleteTable(id) { if(confirm("Delete Table?")) { restrosDB.tables = restrosDB.tables.filter(t => t.id !== id); saveDB(); renderFloorAndTables(); triggerToast("Deleted", "success"); } }
function handleReservationSubmit(e) { e.preventDefault(); const tId = document.getElementById('reservation-table-select').value; const t = restrosDB.tables.find(x => x.id === tId); if(t) { t.status = 'reserved'; saveDB(); renderFloorAndTables(); triggerToast(`Table ${t.name} Reserved!`, "success"); e.target.reset(); } }


// ==========================================
// BILLING & POS
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
    if(!billingActiveFloor || !restrosDB.floors.find(f=>f.id===billingActiveFloor)) billingActiveFloor = restrosDB.floors[0].id;

    let html = `<div style="display:flex; gap:10px; margin-bottom:10px; overflow-x:auto;">`;
    restrosDB.floors.forEach(f => { html += `<button class="badge ${f.id === billingActiveFloor ? 'bg-primary' : 'bg-gray'}" style="border:none; font-size:14px; padding:6px 12px; cursor:pointer;" onclick="billingActiveFloor='${f.id}'; renderBillingTableGrid()">${f.name}</button>`; });
    html += `</div>`;

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
    renderBillingTableGrid();

    if(table.status === 'occupied' && table.currentOrderId) {
        const order = restrosDB.orders.find(o => o.id === table.currentOrderId);
        currentCart = order ? JSON.parse(JSON.stringify(order.items)) : [];
        triggerToast(`Loaded active order for ${table.name}`, "success");
    } else { currentCart = []; }
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
        if(!item.channels[currentBillingMode] || !item.active) return;
        if(searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return;
        const activePrice = item.prices[currentBillingMode] || item.prices.dinein;
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
    
    // Check if variant exists (Stubs to add item directly for now to keep cart fast)
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
            <div style="font-weight: 600; margin-left: 15px;">₹${formatIN(itemTotal)}</div>
        </div>`;
    }).join('');
    
    document.getElementById('cart-subtotal').innerText = `₹${formatIN(subtotal)}`; document.getElementById('cart-taxes').innerText = `₹${formatIN(totalTax)}`;
    document.getElementById('cart-total').innerText = `₹${formatIN(subtotal + totalTax)}`;
}

function fireKOT() { 
    if(currentCart.length===0) { triggerToast("Cart Empty", "error"); return; }
    
    let tableId = null, tableName = "Walk-in";
    if(currentBillingMode === 'dinein') {
        tableId = selectedDineInTable;
        const table = restrosDB.tables.find(t => t.id === tableId);
        tableName = table.name;
        table.status = 'occupied';
        if(!table.currentOrderId) { const oId = "ord"+Date.now(); restrosDB.orders.push({id: oId, tableId: table.id, items: JSON.parse(JSON.stringify(currentCart))}); table.currentOrderId = oId; }
        else { const order = restrosDB.orders.find(o => o.id === table.currentOrderId); order.items = JSON.parse(JSON.stringify(currentCart)); }
    }

    const kot = { kotId: "KOT-" + Math.floor(Math.random()*10000), tableId, tableName, items: JSON.parse(JSON.stringify(currentCart)), status: "pending", firedAt: new Date().toISOString() };
    restrosDB.kots.push(kot); saveDB(); renderFloorAndTables(); renderBillingTableGrid(); renderKDS(); refreshDashboard();
    triggerToast(`KOT Fired!`, "success"); currentCart=[]; renderCart();
}

function settleBill() { 
    if(currentCart.length===0) { triggerToast("Cart Empty", "error"); return; }
    
    let totalStr = document.getElementById('cart-total').innerText.replace(/[^0-9.-]+/g,"");
    restrosDB.bills.push({ billId: "BILL-" + Math.floor(Math.random()*10000), items: JSON.parse(JSON.stringify(currentCart)), total: parseFloat(totalStr), settledAt: new Date().toISOString() });

    if(currentBillingMode === 'dinein') {
        const table = restrosDB.tables.find(t => t.id === selectedDineInTable);
        table.status = 'free';
        restrosDB.orders = restrosDB.orders.filter(o => o.id !== table.currentOrderId);
        table.currentOrderId = null; selectedDineInTable = null; document.getElementById('active-billing-table').innerText = 'None Selected';
    }
    
    saveDB(); renderFloorAndTables(); renderBillingTableGrid(); refreshDashboard(); triggerToast("Bill Settled Successfully", "success"); currentCart=[]; renderCart();
}

// CRM & Additional Utilities
function lookupCRM() { const phone = document.getElementById('bill-phone').value; const customer = restrosDB.customers.find(c => c.phone === phone); if(customer) { document.getElementById('active-customer-info').innerText = `${customer.name} | Pts: ${customer.loyaltyPoints}`; triggerToast("CRM Linked!", "success"); } else { document.getElementById('active-customer-info').innerText = `New Customer`; triggerToast("New Customer", "warning"); } }
function simulateQROrder() { document.getElementById('qr-orders-panel').style.display = 'block'; }
function acceptQROrder() { document.getElementById('qr-orders-panel').style.display = 'none'; triggerToast("QR Order Accepted. KOT Fired!", "success"); }
function rejectQROrder() { document.getElementById('qr-orders-panel').style.display = 'none'; triggerToast("QR Order Rejected.", "error"); }
function closeModal() { document.getElementById('modal-overlay').style.display = 'none'; }

// KDS Logic
function renderKDS() {
    const container = document.getElementById('kds-container');
    const pendingKots = restrosDB.kots.filter(k => k.status === 'pending');
    if(pendingKots.length === 0) { container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">No pending orders in the kitchen.</div>`; return; }
    container.innerHTML = pendingKots.map(kot => {
        const mins = Math.floor((new Date() - new Date(kot.firedAt)) / 60000);
        return `<div class="card bg-yellow"><div style="display:flex; justify-content:space-between; margin-bottom:10px;"><b>${kot.tableName} (${kot.kotId})</b> <span style="color:var(--error); font-weight:700;">⏱ ${mins}m</span></div><ul style="margin-left: 20px; line-height: 1.8; font-size: 13px; margin-bottom: 15px;">${kot.items.map(i => `<li>${i.qty}x ${i.name}</li>`).join('')}</ul><button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="markKOTReady('${kot.kotId}')">Mark All Ready</button></div>`;
    }).join('');
}
function markKOTReady(id) { const kot = restrosDB.kots.find(k => k.kotId === id); if(kot) { kot.status = 'ready'; saveDB(); renderKDS(); refreshDashboard(); triggerToast(`KOT Ready!`, "success"); } }

function renderInventory() { document.getElementById('inventory-table-body').innerHTML = restrosDB.inventory.map(i=>`<tr><td>${i.itemName}</td><td>${i.availableQty} ${i.unit}</td><td>${i.availableQty<=i.reorderAt?'<span class="badge bg-red">Low Stock</span>':'OK'}</td></tr>`).join(''); }
function renderCRM() { document.getElementById('crm-table-body').innerHTML = restrosDB.customers.map(c=>`<tr><td>${c.name}</td><td>${c.phone}</td><td>${c.visits}</td><td>₹${formatIN(c.totalspent)}</td><td>${c.loyaltyPoints}</td></tr>`).join(''); }

// Init
document.addEventListener('DOMContentLoaded', () => {
    initDB();
    renderMenuTables();
    renderFloorAndTables();
    renderPOSGrid();
    refreshDashboard();
    renderKDS();
    renderInventory();
    renderCRM();
});
