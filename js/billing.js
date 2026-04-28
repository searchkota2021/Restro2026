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
    restrosDB.floors.forEach(f => { html += `<button class="badge ${f.id === billingActiveFloor ? 'bg-primary' : 'bg-gray'}" style="border:none; padding:6px 12px; cursor:pointer;" onclick="billingActiveFloor='${f.id}'; renderBillingTableGrid()">${f.name}</button>`; });
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

function renderPOSGrid(searchTerm = '') {
    const grid = document.getElementById('pos-menu-grid'); if(!grid) return; grid.innerHTML = '';
    restrosDB.items.forEach(item => {
        if(!item.channels[currentBillingMode] || !item.active) return;
        if(searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return;
        const activePrice = item.prices[currentBillingMode] || item.prices.dinein;
        grid.innerHTML += `<div class="pos-item-card" onclick="addToCart('${item.id}')"><div class="pos-item-name">${item.name}</div><div class="pos-item-price">₹${activePrice}</div></div>`;
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
    let subtotal = 0;
    container.innerHTML = currentCart.map(c => {
        subtotal += (c.price * c.qty);
        return `<div class="cart-item">
            <div style="flex: 1;"><b>${c.name}</b><br><small>₹${c.price} x ${c.qty}</small></div>
            <div class="cart-qty-ctrl"><button class="cart-qty-btn" onclick="updateCartQty('${c.id}', -1)">-</button><span>${c.qty}</span><button class="cart-qty-btn" onclick="updateCartQty('${c.id}', 1)">+</button></div>
            <div style="font-weight: 600; margin-left: 15px;">₹${formatIN(c.price * c.qty)}</div>
        </div>`;
    }).join('');
    document.getElementById('cart-total').innerText = `₹${formatIN(subtotal)}`;
}

function settleBill() { 
    if(currentCart.length===0) { triggerToast("Cart Empty", "error"); return; }
    let totalStr = document.getElementById('cart-total').innerText.replace(/[^0-9.-]+/g,"");
    restrosDB.bills.push({ billId: "BILL-"+Date.now(), items: currentCart, total: parseFloat(totalStr), settledAt: new Date().toISOString() });

    if(currentBillingMode === 'dinein') {
        const table = restrosDB.tables.find(t => t.id === selectedDineInTable);
        table.status = 'free'; table.currentOrderId = null;
        selectedDineInTable = null; document.getElementById('active-billing-table').innerText = 'None';
    }
    
    saveDB(); renderFloorAndTables(); renderBillingTableGrid(); refreshDashboard();
    triggerToast("Bill Settled", "success"); currentCart=[]; renderCart();
}
