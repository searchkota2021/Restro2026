// Live Clock Update
setInterval(() => {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString();
}, 1000);

// Sidebar Navigation Logic
function switchTab(viewId, element) {
    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    // Remove active state from all nav items
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    // Show the selected view
    document.getElementById(viewId).classList.add('active');
    
    // Add active state to the clicked nav item
    if(element) {
        element.classList.add('active');
        // Format title dynamically based on nav item text
        let titleText = element.innerText.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF] /g, '');
        document.getElementById('page-title').innerText = titleText;
    }

    // Auto-close mobile menu if open
    if(window.innerWidth <= 768) {
        toggleMenu();
    }
}

// Toggle Mobile Sidebar
function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('open');
}

// Global Form Validation & Submission Handler
document.querySelectorAll('.system-form').forEach(form => {
    form.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent page reload
        
        // HTML5 basic validation is handled by 'required' attributes in HTML.
        // If we reach this block, all required fields have been filled.
        
        let successMsg = this.getAttribute('data-success') || "Action completed successfully!";
        triggerToast(successMsg, "success");
        this.reset(); // Clear form fields
    });
});

// Toast Notification System
function triggerToast(message, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderLeftColor = type === 'success' ? 'var(--success)' : 'var(--error)';
    
    let icon = type === 'success' ? '✅' : '⚠️';
    toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;
    
    container.appendChild(toast);

    // Auto-remove the toast after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideLeft 0.3s ease reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================================
// FLOOR & TABLE MANAGEMENT LOGIC
// ==========================================

// Initial Dummy Data
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

// 1. Render Floors (Tabs)
function renderFloors() {
    const container = document.getElementById('floor-tabs');
    container.innerHTML = ''; // Clear existing
    
    restaurantFloors.forEach(floor => {
        const tab = document.createElement('div');
        tab.className = `floor-tab ${floor.id === activeFloorId ? 'active' : ''}`;
        
        // StopPropagation prevents the Edit/Delete clicks from triggering the Tab switch
        tab.innerHTML = `
            <span>${floor.name}</span>
            <div class="table-actions">
                <button type="button" class="icon-btn" onclick="event.stopPropagation(); showFloorForm(${floor.id})" title="Edit Name">✏️</button>
                <button type="button" class="icon-btn danger" onclick="event.stopPropagation(); deleteFloor(${floor.id})" title="Delete Floor">🗑️</button>
            </div>
        `;
        tab.onclick = () => { activeFloorId = floor.id; renderFloors(); };
        container.appendChild(tab);
    });

    renderTables();
    updateReservationDropdown();
}

// 2. Render Tables for Active Floor
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
        card.className = 'card';
        card.style.borderLeft = `4px solid ${borderColor}`;
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <h3 style="font-size: 16px; font-weight: 700;">${table.name}</h3>
                <div class="table-actions">
                    <button type="button" class="icon-btn" onclick="showTableForm(${table.id})" title="Edit Table">✏️</button>
                    <button type="button" class="icon-btn danger" onclick="deleteTable(${table.id})" title="Delete Table">🗑️</button>
                </div>
            </div>
            <p class="badge ${badgeClass}" style="display: inline-block;">${badgeText}</p>
        `;
        container.appendChild(card);
    });
}

// 3. Floor CRUD Operations
function showFloorForm(id = null) {
    document.getElementById('floor-form').style.display = 'flex';
    const input = document.getElementById('floor-name');
    const idInput = document.getElementById('floor-id');
    
    if(id) { // Editing
        const floor = restaurantFloors.find(f => f.id === id);
        input.value = floor.name;
        idInput.value = id;
    } else { // Adding
        input.value = '';
        idInput.value = '';
    }
    input.focus();
}

function hideFloorForm() { document.getElementById('floor-form').style.display = 'none'; }

function handleFloorSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('floor-name').value.trim();
    const idInput = document.getElementById('floor-id').value;

    // Check Duplicate
    const isDuplicate = restaurantFloors.some(f => f.name.toLowerCase() === nameInput.toLowerCase() && f.id != idInput);
    if(isDuplicate) { triggerToast("A floor with this name already exists", "error"); return; }

    if(idInput) { // Update
        const floor = restaurantFloors.find(f => f.id == idInput);
        floor.name = nameInput;
        triggerToast(`Floor updated to ${nameInput}`, "success");
    } else { // Create
        const newId = Date.now();
        restaurantFloors.push({ id: newId, name: nameInput, tables: [] });
        activeFloorId = newId;
        triggerToast("New floor added successfully", "success");
    }
    hideFloorForm();
    renderFloors();
}

function deleteFloor(id) {
    if(restaurantFloors.length === 1) { triggerToast("You must have at least one floor plan.", "error"); return; }
    if(confirm("Are you sure you want to delete this floor? ALL tables inside it will be permanently deleted!")) {
        restaurantFloors = restaurantFloors.filter(f => f.id !== id);
        if(activeFloorId === id) activeFloorId = restaurantFloors[0].id; // Switch view to first available floor
        renderFloors();
        triggerToast("Floor deleted", "success");
    }
}

// 4. Table CRUD Operations
function showTableForm(id = null) {
    document.getElementById('table-form-container').style.display = 'block';
    const input = document.getElementById('table-name');
    const idInput = document.getElementById('table-id');
    
    if(id) { // Editing
        const floor = restaurantFloors.find(f => f.id === activeFloorId);
        const table = floor.tables.find(t => t.id === id);
        input.value = table.name;
        idInput.value = id;
    } else { // Adding
        input.value = '';
        idInput.value = '';
    }
    input.focus();
}

function hideTableForm() { document.getElementById('table-form-container').style.display = 'none'; }

function handleTableSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('table-name').value.trim();
    const idInput = document.getElementById('table-id').value;
    const floor = restaurantFloors.find(f => f.id === activeFloorId);

    // Prevent duplicate table names on the SAME floor
    const isDuplicate = floor.tables.some(t => t.name.toLowerCase() === nameInput.toLowerCase() && t.id != idInput);
    if(isDuplicate) { triggerToast("Table name already exists on this floor", "error"); return; }

    if(idInput) { // Update
        const table = floor.tables.find(t => t.id == idInput);
        table.name = nameInput;
        triggerToast("Table updated successfully", "success");
    } else { // Create
        floor.tables.push({ id: Date.now(), name: nameInput, status: 'free' });
        triggerToast("New table added", "success");
    }
    hideTableForm();
    renderTables();
    updateReservationDropdown();
}

function deleteTable(id) {
    if(confirm("Are you sure you want to delete this table?")) {
        const floor = restaurantFloors.find(f => f.id === activeFloorId);
        floor.tables = floor.tables.filter(t => t.id !== id);
        renderTables();
        updateReservationDropdown();
        triggerToast("Table removed", "success");
    }
}

// 5. Connect Dynamic Tables to Reservation Dropdown
function updateReservationDropdown() {
    const select = document.getElementById('reservation-table-select');
    if(!select) return;
    
    select.innerHTML = '<option value="">-- Select Table --</option>';
    restaurantFloors.forEach(floor => {
        if(floor.tables.length > 0) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = floor.name;
            floor.tables.forEach(table => {
                const opt = document.createElement('option');
                opt.value = table.id;
                opt.text = table.name;
                optgroup.appendChild(opt);
            });
            select.appendChild(optgroup);
        }
    });
}

// Initialize Tables Module on Load
document.addEventListener('DOMContentLoaded', () => {
    renderFloors();
});


// Logout Simulator
function logout() {
    triggerToast("Logging out...", "success");
    setTimeout(() => location.reload(), 1000);
}
