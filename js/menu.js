function renderMenuTables() {
    // Groups
    document.getElementById('groups-table-body').innerHTML = restrosDB.groups.map(g => `<tr><td>${g.name}</td><td><button class="icon-btn" onclick="editGroup('${g.id}')">✏️ Edit</button> <button class="icon-btn danger" onclick="deleteGroup('${g.id}')">🗑️ Del</button></td></tr>`).join('');
    
    // Categories
    document.getElementById('cats-table-body').innerHTML = restrosDB.categories.map(c => {
        let groupName = restrosDB.groups.find(g => g.id === c.group)?.name || '-';
        return `<tr><td>${c.name}</td><td>${groupName}</td><td><button class="icon-btn" onclick="editCategory('${c.id}')">✏️ Edit</button> <button class="icon-btn danger" onclick="deleteCategory('${c.id}')">🗑️ Del</button></td></tr>`;
    }).join('');
    
    // Taxes
    document.getElementById('taxes-table-body').innerHTML = restrosDB.taxes.map(t => `<tr><td>${t.name}</td><td>${t.rate}%</td><td>${t.type}</td><td><button class="icon-btn" onclick="editTax('${t.id}')">✏️ Edit</button> <button class="icon-btn danger" onclick="deleteTax('${t.id}')">🗑️ Del</button></td></tr>`).join('');
    
    // Variants & Addons
    document.getElementById('variants-table-body').innerHTML = restrosDB.variants.map(v => `<tr><td>${v.name}</td><td>${v.options.map(o=>o.label).join(', ')}</td><td><button class="icon-btn danger" onclick="deleteVariant('${v.id}')">🗑️ Del</button></td></tr>`).join('');
    document.getElementById('addons-table-body').innerHTML = restrosDB.addons.map(a => `<tr><td>${a.name}</td><td>${a.min}-${a.max}</td><td><button class="icon-btn danger" onclick="deleteAddon('${a.id}')">🗑️ Del</button></td></tr>`).join('');

    // Items
    document.getElementById('items-table-body').innerHTML = restrosDB.items.map(i => {
        let catName = restrosDB.categories.find(c => c.id === i.category)?.name || '-';
        let status = i.active ? '<span class="badge bg-green">Active</span>' : '<span class="badge bg-gray">Inactive</span>';
        return `<tr><td>${i.name}</td><td>${catName}</td><td>₹${i.prices.dinein}/₹${i.prices.takeaway}/₹${i.prices.online}</td><td>${status}</td>
        <td><button class="icon-btn" onclick="editItem('${i.id}')">✏️ Edit</button> <button class="icon-btn danger" onclick="deleteItem('${i.id}')">🗑️ Del</button></td></tr>`;
    }).join('');

    // Dropdowns
    const catSel = document.getElementById('cat-group'); if(catSel) catSel.innerHTML = restrosDB.groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
    const itemCatSel = document.getElementById('item-category'); if(itemCatSel) itemCatSel.innerHTML = restrosDB.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const itemTaxSel = document.getElementById('item-tax'); if(itemTaxSel) itemTaxSel.innerHTML = restrosDB.taxes.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
}

// Groups
function handleGroupSubmit(e) { e.preventDefault(); const id = document.getElementById('group-id').value; const name = document.getElementById('group-name').value; if(id) { restrosDB.groups.find(x => x.id === id).name = name; triggerToast("Updated", "success"); } else { restrosDB.groups.push({ id: "g"+Date.now(), name }); triggerToast("Created", "success"); } saveDB(); e.target.reset(); document.getElementById('group-id').value = ''; renderMenuTables(); }
function editGroup(id) { const g = restrosDB.groups.find(x => x.id === id); document.getElementById('group-id').value = g.id; document.getElementById('group-name').value = g.name; }
function deleteGroup(id) { if(restrosDB.categories.some(c => c.group === id)) { triggerToast("Error: Group has categories.", "error"); return; } if(confirm("Delete Group?")) { restrosDB.groups = restrosDB.groups.filter(x => x.id !== id); saveDB(); renderMenuTables(); triggerToast("Deleted", "success"); } }

// Categories
function handleCategorySubmit(e) { e.preventDefault(); const id = document.getElementById('cat-id').value; const name = document.getElementById('cat-name').value; const group = document.getElementById('cat-group').value; if(id) { const c = restrosDB.categories.find(x => x.id === id); c.name = name; c.group = group; triggerToast("Updated", "success"); } else { restrosDB.categories.push({ id: "c"+Date.now(), name, group }); triggerToast("Created", "success"); } saveDB(); e.target.reset(); document.getElementById('cat-id').value = ''; renderMenuTables(); }
function editCategory(id) { const c = restrosDB.categories.find(x => x.id === id); document.getElementById('cat-id').value = c.id; document.getElementById('cat-name').value = c.name; document.getElementById('cat-group').value = c.group; }
function deleteCategory(id) { if(restrosDB.items.some(i => i.category === id)) { triggerToast("Error: Category has items.", "error"); return; } if(confirm("Delete Category?")) { restrosDB.categories = restrosDB.categories.filter(x => x.id !== id); saveDB(); renderMenuTables(); triggerToast("Deleted", "success"); } }

// Taxes
function handleTaxSubmit(e) { e.preventDefault(); const id = document.getElementById('tax-id').value; const name = document.getElementById('tax-name').value; const rate = document.getElementById('tax-rate').value; const type = document.getElementById('tax-type').value; if(id) { const t = restrosDB.taxes.find(x => x.id === id); t.name = name; t.rate = rate; t.type = type; triggerToast("Updated", "success"); } else { restrosDB.taxes.push({ id: "t"+Date.now(), name, rate, type }); triggerToast("Created", "success"); } saveDB(); e.target.reset(); document.getElementById('tax-id').value = ''; renderMenuTables(); }
function editTax(id) { const t = restrosDB.taxes.find(x => x.id === id); document.getElementById('tax-id').value = t.id; document.getElementById('tax-name').value = t.name; document.getElementById('tax-rate').value = t.rate; document.getElementById('tax-type').value = t.type; }
function deleteTax(id) { if(confirm("Delete Tax?")) { restrosDB.taxes = restrosDB.taxes.filter(x => x.id !== id); saveDB(); renderMenuTables(); triggerToast("Deleted", "success"); } }

// Variants & Addons
function handleVariantSubmit(e) { e.preventDefault(); const opts = document.getElementById('var-options').value.split(',').map(o => {return {label: o.trim(), price: 0}}); restrosDB.variants.push({ id: "v"+Date.now(), name: document.getElementById('var-name').value, options: opts }); saveDB(); e.target.reset(); renderMenuTables(); triggerToast("Variant Saved", "success"); }
function deleteVariant(id) { if(confirm("Delete Variant?")) { restrosDB.variants = restrosDB.variants.filter(x => x.id !== id); saveDB(); renderMenuTables(); triggerToast("Deleted", "success"); } }
function handleAddonSubmit(e) { e.preventDefault(); restrosDB.addons.push({ id: "a"+Date.now(), name: document.getElementById('addon-name').value, min: document.getElementById('addon-min').value, max: document.getElementById('addon-max').value }); saveDB(); e.target.reset(); renderMenuTables(); triggerToast("Addon Saved", "success"); }
function deleteAddon(id) { if(confirm("Delete Addon?")) { restrosDB.addons = restrosDB.addons.filter(x => x.id !== id); saveDB(); renderMenuTables(); triggerToast("Deleted", "success"); } }

// Items
function handleItemSubmit(e) {
    e.preventDefault(); const id = document.getElementById('item-id').value;
    const itemData = {
        name: document.getElementById('item-name').value, code: document.getElementById('item-sku').value, category: document.getElementById('item-category').value, tax: document.getElementById('item-tax').value, foodType: document.getElementById('item-type').value, active: true,
        prices: { dinein: parseFloat(document.getElementById('price-dinein').value), takeaway: parseFloat(document.getElementById('price-takeaway').value), online: parseFloat(document.getElementById('price-online').value||0), quick: parseFloat(document.getElementById('price-quick').value||0) },
        channels: { dinein: document.getElementById('en-dinein').checked, takeaway: document.getElementById('en-takeaway').checked, online: document.getElementById('en-online').checked, quick: document.getElementById('en-quick').checked }
    };
    if(id) { const i = restrosDB.items.find(x => x.id === id); Object.assign(i, itemData); triggerToast("Item Updated", "success"); } 
    else { itemData.id = "i"+Date.now(); restrosDB.items.push(itemData); triggerToast("Item Created", "success"); }
    saveDB(); e.target.reset(); document.getElementById('item-id').value = ''; renderMenuTables(); if(typeof renderPOSGrid === 'function') renderPOSGrid();
}
function editItem(id) { 
    const i = restrosDB.items.find(x => x.id === id); 
    document.getElementById('item-id').value = i.id; document.getElementById('item-name').value = i.name; document.getElementById('item-sku').value = i.code; document.getElementById('item-category').value = i.category; document.getElementById('item-tax').value = i.tax; document.getElementById('item-type').value = i.foodType; 
    document.getElementById('price-dinein').value = i.prices.dinein; document.getElementById('price-takeaway').value = i.prices.takeaway; document.getElementById('price-online').value = i.prices.online; document.getElementById('price-quick').value = i.prices.quick; 
    document.getElementById('en-dinein').checked = i.channels.dinein; document.getElementById('en-takeaway').checked = i.channels.takeaway; document.getElementById('en-online').checked = i.channels.online; document.getElementById('en-quick').checked = i.channels.quick; 
}
function deleteItem(id) { if(confirm("Delete Item?")) { restrosDB.items = restrosDB.items.filter(x => x.id !== id); saveDB(); renderMenuTables(); if(typeof renderPOSGrid === 'function') renderPOSGrid(); triggerToast("Deleted", "success"); } }
