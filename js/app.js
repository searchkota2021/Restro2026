// ==========================================
// DB WRAPPER & SEEDING (Part 1 & 4)
// ==========================================
const SEED_KEY = 'restros_seeded_v2';
const DB_KEY = 'restros_db';

let restrosDB = { groups: [], categories: [], items: [], variants: [], addons: [], taxes: [], floors: [] };
let activeFloorId = 1;

function initDB() {
    if (!localStorage.getItem(SEED_KEY)) {
        // First visit: Seed Data
        restrosDB = {
            groups: [{ id: "g1", name: "Food", printer: "Kitchen Printer 1", sort: 1, active: true, channels: { dinein: true, takeaway: true, online: true, quickdelivery: true } }],
            categories: [{ id: "c1", name: "Starters", group: "g1", sort: 1, active: true }],
            taxes: [{ id: "t1", name: "GST 5%", rate: 5, type: "forward" }],
            addons: [{ id: "a1", name: "Sauce Selection", type: "optional", min: 0, max: 2, options: [{label: "Mint Chutney", price: 0}, {label: "Garlic Mayo", price: 20}] }],
            items: [
                { id: "i1", name: "Paneer Tikka", code: "PTK-001", category: "c1", tax: "t1", foodType: "veg", active: true, prices: { dinein: 280, takeaway: 280, online: 300, quickdelivery: 280 }, channels: { dinein: true, takeaway: true, online: true, quickdelivery: true } },
                { id: "i8", name: "Egg Bhurji", code: "EBJ-001", category: "c1", tax: "t1", foodType: "egg", active: true, prices: { dinein: 130, takeaway: 130, online: 150, quickdelivery: 130 }, channels: { dinein: true, takeaway: true, online: true, quickdelivery: true } }
            ],
            floors: [
                { id: 1, name: "Main Dining", tables: [{ id: 101, name: "Table 1", status: "free" }, { id: 102, name: "Table 2", status: "occupied", bill: 1240 }] },
                { id: 2, name: "Rooftop", tables: [{ id: 201, name: "R-01", status: "free" }] }
            ]
        };
        saveDB();
        localStorage.setItem(SEED_KEY, 'true');
    } else {
        restrosDB = JSON.parse(localStorage.getItem(DB_KEY));
        // Fallback if floors are missing from an older save
        if(!restrosDB.floors) restrosDB.floors = [{ id: 1, name: "Main Dining", tables: [] }];
    }
    if(restrosDB.floors.length > 0) activeFloorId = restrosDB.floors[0].id;
}

function saveDB() { localStorage.setItem(DB_KEY, JSON.stringify(restrosDB)); }

// ==========================================
// UI INTERACTION & RENDERING
// ==========================================
setInterval(() => { document.getElementById('clock').innerText = new Date().toLocaleTimeString(); }, 1000);

function toggleMenu() { document.getElementById('sidebar').classList.toggle('open'); }

function switchTab(viewId, element) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    if(element) element.classList.add('active');
    if(window.innerWidth <= 767) toggleMenu();
}

function formatIN(amount) { return Number(amount).toLocaleString('en-IN'); }

// Global System Forms (Feedback, Inventory, CRM, etc.)
document.querySelectorAll('.system-form').forEach(form => {
    form.addEventListener('submit', function(e) {
        e.preventDefault(); 
        triggerToast(this.getAttribute('data-success') || "Action completed successfully!", "success");
        this.reset(); 
    });
});

function triggerToast(message, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div'); toast.className = 'toast';
    toast.style.borderLeftColor = type === 'success' ? 'var(--success)' : 'var(--error)';
    toast.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span> <div>${message}</div>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'slideLeft 0.3s ease reverse forwards'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ==========================================
// FLOOR & TABLE MANAGEMENT (RESTORED)
// ==========================================
function renderFloors() {
    const container = document.getElementById('floor-tabs');
    container.innerHTML = '';
    
    restrosDB.floors.forEach(floor => {
        const tab = document.createElement('div');
        tab.className = `floor-tab ${floor.id === activeFloorId ? 'active' : ''}`;
        tab.innerHTML = `<span>${floor.name}</span>
            <div class="table-actions">
                <button type="button" class="icon-btn" onclick="event.stopPropagation(); showFloorForm(${floor.id})">✏️</button>
                <button type="button" class="icon-btn danger" onclick="event.stopPropagation(); deleteFloor(${floor.id})">🗑️</button>
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
    
    const floor = restrosDB.floors.find(f => f.id === activeFloorId);
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

        const card = document.createElement('div'); card.className = 'card'; card.style.borderLeft = `4px solid ${borderColor}`;
        card.innerHTML = `<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <h3 style="font-size: 16px; font-weight: 700;">${table.name}</h3>
                <div class="table-actions"><button type="button" class="icon-btn" onclick="showTableForm(${table.id})">✏️</button><button type="button" class="icon-btn danger" onclick="deleteTable(${table.id})">🗑️</button></div>
            </div><p class="badge ${badgeClass}" style="display: inline-block;">${badgeText}</p>`;
        container.appendChild(card);
    });
}

function showFloorForm(id = null) {
    document.getElementById('floor-form').style.display = 'flex';
    const input = document.getElementById('floor-name'), idInput = document.getElementById('floor-id');
    if(id) { input.value = restrosDB.floors.find(f => f.id === id).name; idInput.value = id; } else { input.value = ''; idInput.value = ''; }
}
function hideFloorForm() { document.getElementById('floor-form').style.display = 'none'; }
function handleFloorSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('floor-name').value.trim(), idInput = document.getElementById('floor-id').value;
    if(idInput) { restrosDB.floors.find(f => f.id == idInput).name = nameInput; triggerToast("Floor updated", "success"); } 
    else { const newId = Date.now(); restrosDB.floors.push({ id: newId, name: nameInput, tables: [] }); activeFloorId = newId; triggerToast("Floor added", "success"); }
    saveDB(); hideFloorForm(); renderFloors();
}
function deleteFloor(id) {
    if(restrosDB.floors.length === 1) { triggerToast("Need at least one floor.", "error"); return; }
    if(confirm("Delete floor and ALL tables inside?")) {
        restrosDB.floors = restrosDB.floors.filter(f => f.id !== id);
        if(activeFloorId === id) activeFloorId = restrosDB.floors[0].id;
        saveDB(); renderFloors(); triggerToast("Floor deleted", "success");
    }
}

function showTableForm(id = null) {
    document.getElementById('table-form-container').style.display = 'block';
    const input = document.getElementById('table-name'), idInput = document.getElementById('table-id');
    if(id) { input.value = restrosDB.floors.find(f => f.id === activeFloorId).tables.find(t => t.id === id).name; idInput.value = id; } else { input.value = ''; idInput.value = ''; }
}
function hideTableForm() { document.getElementById('table-form-container').style.display = 'none'; }
function handleTableSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('table-name').value.trim(), idInput = document.getElementById('table-id').value;
    const floor = restrosDB.floors.find(f => f.id === activeFloorId);
    if(idInput) { floor.tables.find(t => t.id == idInput).name = nameInput; triggerToast("Table updated", "success"); } 
    else { floor.tables.push({ id: Date.now(), name: nameInput, status: 'free' }); triggerToast("Table added", "success"); }
    saveDB(); hideTableForm(); renderTables(); updateReservationDropdown(); populateDineInTables();
}
function deleteTable(id) {
    if(confirm("Delete this table?")) {
        const floor = restrosDB.floors.find(f => f.id === activeFloorId);
        floor.tables = floor.tables.filter(t => t.id !== id);
        saveDB(); renderTables(); updateReservationDropdown(); populateDineInTables(); triggerToast("Table removed", "success");
    }
}
function updateReservationDropdown() {
    const select = document.getElementById('reservation-table-select');
    if(!select) return; select.innerHTML = '<option value="">-- Select Table --</option>';
    restrosDB.floors.forEach(floor => {
        if(floor.tables.length > 0) {
            const optgroup = document.createElement('optgroup'); optgroup.label = floor.name;
            floor.tables.forEach(table => { const opt = document.createElement('option'); opt.value = table.id; opt.text = table.name; optgroup.appendChild(opt); });
            select.appendChild(optgroup);
        }
    });
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
    const tbody = document.getElementById('items-table-body');
    if(tbody) {
        tbody.innerHTML = restrosDB.items.map(i => {
            const cat = restrosDB.categories.find(c => c.id === i.category)?.name || 'N/A';
            let icon = i.foodType === 'veg' ? '🟢' : i.foodType === 'nonveg' ? '🔴' : '🟡';
            let statusBadge = i.active ? '<span class="badge bg-green">Active</span>' : '<span class="badge bg-gray">Inactive</span>';
            return `<tr><td>${i.code || '-'}</td><td><b>${i.name}</b> <span style="font-size:10px;">${icon}</span></td><td>${cat}</td><td>₹${formatIN(i.prices.dinein)} / ₹${formatIN(i.prices.takeaway)} / ₹${formatIN(i.prices.online)} / ₹${formatIN(i.prices.quickdelivery)}</td><td>${statusBadge}</td></tr>`;
        }).join('');
    }
    
    const addonsBody = document.getElementById('addons-table-body');
    if(addonsBody) { addonsBody.innerHTML = restrosDB.addons.map(a => `<tr><td>${a.name}</td><td>${a.type}</td><td>${a.min} - ${a.max}</td></tr>`).join(''); }
    
    const catSelect = document.getElementById('item-category');
    const taxSelect = document.getElementById('item-tax');
    if(catSelect) catSelect.innerHTML = restrosDB.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    if(taxSelect) taxSelect.innerHTML = restrosDB.taxes.map(t => `<option value="${t.id}">${t.name}</option>`).join('');

    document.getElementById('dash-rev').innerText = `₹ ${formatIN(24580)}`;
}

function handleItemSubmit(e) {
    e.preventDefault();
    restrosDB.items.push({
        id: "i" + Date.now(), name: document.getElementById('item-name').value, code: document.getElementById('item-sku').value, category: document.getElementById('item-category').value, foodType: document.getElementById('item-type').value, active: document.getElementById('item-status').value === 'true',
        prices: { dinein: parseFloat(document.getElementById('price-dinein').value), takeaway: parseFloat(document.getElementById('price-takeaway').value), online: parseFloat(document.getElementById('price-online').value), quickdelivery: parseFloat(document.getElementById('price-quick').value) },
        channels: { dinein: document.getElementById('en-dinein').checked, takeaway: document.getElementById('en-takeaway').checked, online: document.getElementById('en-online').checked, quickdelivery: document.getElementById('en-quick').checked }
    });
    saveDB(); e.target.reset(); renderMenuTables(); renderPOSGrid(); triggerToast("Item Saved Successfully!", "success");
}

function handleAddonSubmit(e) {
    e.preventDefault();
    restrosDB.addons.push({ id: "a" + Date.now(), name: document.getElementById('addon-name').value, type: document.getElementById('addon-type').value, min: document.getElementById('addon-min').value, max: document.getElementById('addon-max').value });
    saveDB(); e.target.reset(); renderMenuTables(); triggerToast("Add-on Saved!", "success");
}


// ==========================================
// BILLING & POS WORKFLOWS
// ==========================================
let currentBillingMode = 'quick'; 
let currentCart = [];
let crmData = [{ phone: '9876543210', name: 'Rahul Verma', address: 'B-44, Sector 12, Kota' }];

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
    if(!select || typeof restrosDB.floors === 'undefined') return;
    select.innerHTML = '<option value="">-- Select Active Table --</option>';
    restrosDB.floors.forEach(floor => {
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
    restrosDB.items.forEach(item => {
        if(!item.channels[currentBillingMode] || !item.active) return; 
        if(searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return;
        
        const activePrice = item.prices[currentBillingMode];
        const card = document.createElement('div'); card.className = 'pos-item-card';
        card.onclick = () => addToCart(item.id);
        let icon = item.foodType === 'veg' ? '🟢' : item.foodType === 'nonveg' ? '🔴' : '🟡';
        card.innerHTML = `<div style="font-size: 10px; text-align: left;">${icon}</div><div class="pos-item-name">${item.name}</div><div class="pos-item-price">₹${formatIN(activePrice)}</div>`;
        grid.appendChild(card);
    });
}
function filterPOSMenu(val) { renderPOSGrid(val); }

function addToCart(itemId) {
    const item = restrosDB.items.find(i => i.id === itemId);
    const existing = currentCart.find(c => c.id === itemId);
    if(existing) existing.qty++; else currentCart.push({ id: item.id, name: item.name, taxId: item.tax, qty: 1 });
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
        const menuItem = restrosDB.items.find(i => i.id === c.id);
        const price = menuItem.prices[currentBillingMode];
        const taxProfile = restrosDB.taxes.find(t => t.id === c.taxId);
        const itemTotal = price * c.qty;
        subtotal += itemTotal;
        if(taxProfile && taxProfile.type === 'forward') totalTax += (itemTotal * taxProfile.rate) / 100;

        return `<div class="cart-item"><div style="flex: 1;"><div style="font-weight: 600; font-size: 13px;">${c.name}</div><div style="font-size: 11px; color: var(--text-muted);">₹${formatIN(price)} x ${c.qty}</div></div><div class="cart-qty-ctrl"><button class="cart-qty-btn" onclick="updateCartQty('${c.id}', -1)">-</button><span style="font-size: 13px; font-weight: 600;">${c.qty}</span><button class="cart-qty-btn" onclick="updateCartQty('${c.id}', 1)">+</button></div><div style="font-weight: 600; margin-left: 15px;">₹${formatIN(itemTotal)}</div></div>`;
    }).join('');
    
    let dynamicFees = currentBillingMode === 'delivery' ? 30 : (currentBillingMode === 'dinein' ? subtotal * 0.05 : 0);
    let feeLabel = currentBillingMode === 'delivery' ? "Packaging Fee" : (currentBillingMode === 'dinein' ? "Service Chg (5%)" : "No Extra Fees");

    document.getElementById('cart-subtotal').innerText = `₹${formatIN(subtotal)}`;
    document.getElementById('cart-taxes').innerText = `₹${formatIN(totalTax)}`;
    document.getElementById('fee-row').innerHTML = `<span>${feeLabel}</span><span id="cart-fees">₹${formatIN(dynamicFees)}</span>`;
    document.getElementById('cart-total').innerText = `₹${formatIN(subtotal + totalTax + dynamicFees)}`;
}

function fireKOT() { if(currentCart.length===0) triggerToast("Cart Empty", "error"); else { triggerToast("KOT Fired!", "success"); currentCart=[]; renderCart(); } }
function settleBill() { if(currentCart.length===0) triggerToast("Cart Empty", "error"); else { triggerToast("Bill Settled", "success"); currentCart=[]; renderCart(); } }

function lookupCRM() {
    const phone = document.getElementById('del-phone').value;
    const customer = crmData.find(c => c.phone === phone);
    if(customer) { document.getElementById('del-name').value = customer.name; document.getElementById('del-address').value = customer.address; triggerToast("CRM Data Linked!", "success"); } 
    else { triggerToast("New Customer", "warning"); }
}

function simulateQROrder() { document.getElementById('qr-orders-panel').style.display = 'block'; }
function acceptQROrder() { document.getElementById('qr-orders-panel').style.display = 'none'; triggerToast("QR Order Accepted. KOT Fired!", "success"); }
function rejectQROrder() { document.getElementById('qr-orders-panel').style.display = 'none'; triggerToast("QR Order Rejected.", "error"); }

// Initialize System
document.addEventListener('DOMContentLoaded', () => {
    initDB();
    renderFloors(); // <--- TABLE UI Restored!
    renderMenuTables();
    renderPOSGrid();
});
