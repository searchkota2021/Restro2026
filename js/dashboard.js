function refreshDashboard() {
    const today = new Date().toDateString();
    
    // Safety check in case bills array is empty or undefined
    const todayBills = (restrosDB.bills || []).filter(b => new Date(b.settledAt).toDateString() === today);
    
    const revenue = todayBills.reduce((sum, b) => sum + (b.total || 0), 0);
    document.getElementById('stat-revenue').innerText = '₹' + formatIN(revenue);
    document.getElementById('stat-orders').innerText = todayBills.length;
    
    const tables = restrosDB.tables || [];
    document.getElementById('stat-tables').innerText = `${tables.filter(t => t.status === 'occupied').length} / ${tables.length}`;
    
    const kots = restrosDB.kots || [];
    document.getElementById('stat-kots').innerText = kots.filter(k => k.status === 'pending').length;

    // Top Selling Items table population
    const itemSales = {};
    todayBills.forEach(b => {
        b.items.forEach(i => {
            if (!itemSales[i.name]) itemSales[i.name] = { qty: 0, revenue: 0 };
            itemSales[i.name].qty += i.qty;
            itemSales[i.name].revenue += (i.price * i.qty);
        });
    });

    const topItems = Object.entries(itemSales).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5);
    const tbody = document.getElementById('top-selling-body');
    if(topItems.length > 0) {
        tbody.innerHTML = topItems.map(item => `<tr><td>${item[0]}</td><td>${item[1].qty}</td><td>₹${formatIN(item[1].revenue)}</td></tr>`).join('');
    } else {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">Awaiting settled bills...</td></tr>`;
    }
}
