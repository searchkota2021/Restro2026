// KDS Logic
function renderKDS() {
    const container = document.getElementById('kds-container');
    if(!container) return;
    const pendingKots = restrosDB.kots.filter(k => k.status === 'pending');
    
    if(pendingKots.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">No pending orders in the kitchen.</div>`; return;
    }

    container.innerHTML = pendingKots.map(kot => {
        const mins = Math.floor((new Date() - new Date(kot.firedAt)) / 60000);
        return `<div class="card bg-yellow">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;"><b>${kot.tableName} (${kot.kotId})</b> <span style="color:var(--error); font-weight:700;">⏱ ${mins}m</span></div>
            <ul style="margin-left: 20px; line-height: 1.8; font-size: 13px; margin-bottom: 15px;">
                ${kot.items.map(i => `<li>${i.qty}x ${i.name}</li>`).join('')}
            </ul>
            <button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="markKOTReady('${kot.kotId}')">Mark All Ready</button>
        </div>`;
    }).join('');
}

function markKOTReady(kotId) {
    const kot = restrosDB.kots.find(k => k.kotId === kotId);
    if(kot) { kot.status = 'ready'; saveDB(); renderKDS(); refreshDashboard(); triggerToast(`KOT ${kotId} Ready!`, "success"); }
}

// Sub-modules Initialization (CRM, QR, Inventory)
function lookupCRM() {
    const phone = document.getElementById('bill-phone').value;
    const customer = restrosDB.customers.find(c => c.phone === phone);
    if(customer) { document.getElementById('active-customer-info').innerText = `${customer.name} | Pts: ${customer.loyaltyPoints}`; triggerToast("CRM Linked!", "success"); } 
    else { document.getElementById('active-customer-info').innerText = `New Customer`; triggerToast("New Customer", "warning"); }
}

function simulateQROrder() { document.getElementById('qr-orders-panel').style.display = 'block'; }
function acceptQROrder() { document.getElementById('qr-orders-panel').style.display = 'none'; triggerToast("QR Order Accepted. KOT Fired!", "success"); }
function rejectQROrder() { document.getElementById('qr-orders-panel').style.display = 'none'; triggerToast("QR Order Rejected.", "error"); }
function closeModal() { document.getElementById('modal-overlay').style.display = 'none'; }


// Main Application Boot Sequence
document.addEventListener('DOMContentLoaded', () => {
    initDB();
    renderMenuTables();
    renderFloorAndTables();
    renderPOSGrid();
    refreshDashboard();
    renderKDS();
});
