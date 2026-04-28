let activeFloorId = null;

function renderFloorAndTables() {
    if(restrosDB.floors.length > 0 && (!activeFloorId || !restrosDB.floors.find(f=>f.id===activeFloorId))) activeFloorId = restrosDB.floors[0].id;
    
    // Floors
    document.getElementById('floor-tabs').innerHTML = restrosDB.floors.map(f => `
        <div class="floor-tab ${f.id === activeFloorId ? 'active' : ''}" onclick="activeFloorId='${f.id}'; renderFloorAndTables();">
            <span>${f.name}</span>
            <div class="table-actions">
                <button type="button" class="icon-btn" onclick="event.stopPropagation(); editFloor('${f.id}')">✏️</button>
                <button type="button" class="icon-btn danger" onclick="event.stopPropagation(); deleteFloor('${f.id}')">🗑️</button>
            </div>
        </div>`).join('');
    
    // Tables
    const floorTables = restrosDB.tables.filter(t => t.floorId === activeFloorId);
    let activeFloorName = restrosDB.floors.find(f => f.id === activeFloorId)?.name || 'No Floor Selected';
    document.getElementById('active-floor-title').innerText = `${activeFloorName} - Tables`;

    document.getElementById('tables-container').innerHTML = floorTables.map(t => {
        let cls = t.status === 'occupied' ? 'occupied' : t.status === 'reserved' ? 'reserved' : '';
        let badge = t.status === 'occupied' ? '🔴 Occupied' : t.status === 'reserved' ? '🟡 Reserved' : '🟢 Free';
        return `<div class="t-card ${cls}" onclick="openTableOrder('${t.id}')">
            <div style="font-weight: 700; font-size: 16px; margin-bottom: 5px;">${t.name}</div>
            <div style="font-size: 12px; margin-bottom: 5px;">Cap: ${t.capacity || 4}</div>
            <div style="font-size: 12px; margin-bottom: 10px;">${badge}</div>
            <div class="table-actions" style="justify-content: center;">
                <button type="button" class="icon-btn" onclick="event.stopPropagation(); editTable('${t.id}')">✏️ Edit</button>
            </div>
        </div>`;
    }).join('');

    // Update Dropdown for Reservations
    const resSelect = document.getElementById('reservation-table-select');
    if(resSelect) {
        resSelect.innerHTML = restrosDB.tables.filter(t=>t.status==='free').map(t => `<option value="${t.id}">${t.name} (${restrosDB.floors.find(f=>f.id===t.floorId)?.name})</option>`).join('');
    }

    if(typeof renderBillingTableGrid === 'function') renderBillingTableGrid();
}

// Floor Submits
function showFloorForm() { document.getElementById('floor-form').style.display='flex'; document.getElementById('floor-id').value=''; document.getElementById('floor-name').value=''; }

function handleFloorSubmit(e) {
    e.preventDefault(); 
    const id = document.getElementById('floor-id').value; 
    const name = document.getElementById('floor-name').value;
    
    if(id) { 
        restrosDB.floors.find(x => x.id === id).name = name; 
        triggerToast("Floor Updated", "success"); 
    } else { 
        const newId = "f"+Date.now(); 
        restrosDB.floors.push({ id: newId, name }); 
        activeFloorId = newId; 
        triggerToast("Floor Created", "success"); 
    }
    saveDB(); 
    document.getElementById('floor-form').style.display='none'; 
    renderFloorAndTables();
}

function editFloor(id) { 
    document.getElementById('floor-form').style.display='flex'; 
    document.getElementById('floor-id').value = id; 
    document.getElementById('floor-name').value = restrosDB.floors.find(f=>f.id===id).name; 
}
function deleteFloor(id) { if(confirm("Delete floor and ALL its tables?")) { restrosDB.tables = restrosDB.tables.filter(t => t.floorId !== id); restrosDB.floors = restrosDB.floors.filter(f => f.id !== id); activeFloorId = null; saveDB(); renderFloorAndTables(); triggerToast("Deleted", "success"); } }


// Table Submits
function showTableForm() { document.getElementById('table-form').style.display='flex'; document.getElementById('table-id').value=''; document.getElementById('table-name').value=''; }

function handleTableSubmit(e) {
    e.preventDefault(); 
    const id = document.getElementById('table-id').value; 
    const name = document.getElementById('table-name').value; 
    const cap = document.getElementById('table-cap').value;
    
    if(!activeFloorId) { triggerToast("Select a floor first!", "error"); return; }
    
    if(id) { 
        const t = restrosDB.tables.find(x => x.id === id); 
        t.name = name; 
        t.capacity = cap; 
        triggerToast("Table Updated", "success"); 
    } else { 
        restrosDB.tables.push({ id: "t"+Date.now(), floorId: activeFloorId, name, capacity: cap, status: 'free', currentOrderId: null }); 
        triggerToast("Table Created", "success"); 
    }
    saveDB(); 
    document.getElementById('table-form').style.display='none'; 
    renderFloorAndTables();
}

function editTable(id) { 
    document.getElementById('table-form').style.display='flex'; 
    const table = restrosDB.tables.find(t=>t.id===id);
    document.getElementById('table-id').value = id; 
    document.getElementById('table-name').value = table.name; 
    document.getElementById('table-cap').value = table.capacity || 4; 
}

// Reservations
function handleReservationSubmit(e) { e.preventDefault(); const tId = document.getElementById('reservation-table-select').value; const t = restrosDB.tables.find(x => x.id === tId); if(t) { t.status = 'reserved'; saveDB(); renderFloorAndTables(); triggerToast(`Table ${t.name} Reserved!`, "success"); e.target.reset(); } }
