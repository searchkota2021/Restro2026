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
    if(!billingActiveFloor && restrosDB.floors.length > 0) billingActiveFloor = restrosDB.floors[0].id;

    let html = `<div style="display:flex; gap:10px; margin-bottom:10px; overflow-x:auto;">`;
    restrosDB.floors.forEach(f => { html += `<button type="button" class="badge ${f.id === billingActiveFloor ? 'bg-primary' : 'bg-gray'}" style="border:none; padding:6px 12px; cursor:pointer;" onclick="billingActiveFloor='${f.id}'; renderBillingTableGrid()">${f.name}</button>`; });
    html += `</div>`;

    html += `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap:10px;">`;
    restrosDB.tables.filter(t => t.floorId === billingActiveFloor).forEach(t => {
        let color = t.status === 'occupied' ? 'var(--error)' : 'var(--success)';
        let isSel = selectedDineInTable === t.id ? 'box-shadow: 0 0 0 3px rgba(255,90,31,0.5);' : '';
        html += `<div style="border: 2px solid ${color}; border-radius: 8px; padding: 10px; text-align: center; cursor: pointer; background: var(--white); ${isSel}" onclick="selectBillingTable('${t.id}')">
            <h4 style="margin:0; font-size:14px;">${t.name}</h4><small style="font-size:10px; color:var(--text-muted);">${t.status}</small>
        </div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
}

function selectBillingTable(tableId) {
    selectedDineInTable = tableId;
    const table = restrosDB.tables.find(t => t.id === tableId);
    document.getElementById('active-billing-table').innerText = `${table.name}`;
    renderBillingTableGrid();

    if(table.status === 'occupied' && table.currentOrderId) {
        const order = restrosDB.orders.find(o => o.id === table.currentOrderId);
        currentCart = order ? JSON.parse(JSON.stringify(order.items)) : [];
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
        let icon = item.foodType === 'veg' ? '🟢' : item.foodType === 'nonveg' ? '🔴' : '🟡';
        grid.innerHTML += `<div class="pos-item-card" onclick="addToCart('${item.id}')"><div style="font-size: 10px; text-align: left;">${icon}</div><div class="pos-item-name">${item.name}</div><div class="pos-item-price">₹${activePrice}</div></div>`;
    });
}
function filterPOSMenu(val) { renderPOSGrid(val); }

function addToCart(itemId) {
    if(currentBillingMode === 'dinein' && !selectedDineInTable) { triggerToast("Select a table first!", "error"); return; }
    const item = restrosDB.items.find(i => i.id === itemId);
    const existing = currentCart.find(c => c.id === itemId);
    if(existing) existing.qty++; else currentCart.push({ id: item.id, name: item.name, price: item.prices[currentBillingMode]||item.prices.dinein, qty: 1 });
    renderCart();
}

function updateCartQty(itemId, change) {
    const item = currentCart.find(c => c.id === itemId);
    if(item) { item.qty += change; if(item.qty <= 0) currentCart = currentCart.filter(c => c.id !== itemId); renderCart(); }
}

function renderCart() {
    const container = document.getElementById('cart-items');
    if(currentCart.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:50px 0; color:var(--text-muted);">Cart is empty. Tap items to add.</div>`;
        document.getElementById('cart-subtotal').innerText = '₹0.00'; document.getElementById('cart-taxes').innerText = '₹0.00'; document.getElementById('cart-total').innerText = '₹0.00';
        return;
    }

    let subtotal = 0;
    container.innerHTML = currentCart.map(c => {
        subtotal += (c.price * c.qty);
        return `<div class="cart-item">
            <div style="flex: 1;"><b>${c.name}</b><br><small style="color:var(--text-muted)">₹${c.price} x ${c.qty}</small></div>
            <div class="cart-qty-ctrl"><button class="cart-qty-btn" onclick="updateCartQty('${c.id}', -1)">-</button><span>${c.qty}</span><button class="cart-qty-btn" onclick="updateCartQty('${c.id}', 1)">+</button></div>
            <div style="font-weight: 600; margin-left: 15px;">₹${formatIN(c.price * c.qty)}</div>
        </div>`;
    }).join('');
    
    document.getElementById('cart-subtotal').innerText = `₹${formatIN(subtotal)}`;
    document.getElementById('cart-total').innerText = `₹${formatIN(subtotal)}`;
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
    restrosDB.kots.push(kot); saveDB(); renderFloorAndTables(); renderBillingTableGrid(); if(typeof renderKDS === 'function') renderKDS(); refreshDashboard();
    triggerToast(`KOT Fired!`, "success"); currentCart=[]; renderCart();
}

function settleBill() { 
    if(currentCart.length===0) { triggerToast("Cart Empty", "error"); return; }
    let totalStr = document.getElementById('cart-total').innerText.replace(/[^0-9.-]+/g,"");
    restrosDB.bills.push({ billId: "BILL-"+Date.now(), items: JSON.parse(JSON.stringify(currentCart)), total: parseFloat(totalStr), settledAt: new Date().toISOString() });

    if(currentBillingMode === 'dinein') {
        const table = restrosDB.tables.find(t => t.id === selectedDineInTable);
        table.status = 'free'; 
        restrosDB.orders = restrosDB.orders.filter(o => o.id !== table.currentOrderId);
        table.currentOrderId = null; selectedDineInTable = null; document.getElementById('active-billing-table').innerText = 'None';
    }
    
    saveDB(); renderFloorAndTables(); renderBillingTableGrid(); refreshDashboard();
    triggerToast("Bill Settled", "success"); currentCart=[]; renderCart();
}
