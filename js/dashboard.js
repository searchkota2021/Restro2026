function refreshDashboard() {
    const today = new Date().toDateString();
    
    // Safety check in case bills array is empty
    const todayBills = (restrosDB.bills || []).filter(b => new Date(b.settledAt).toDateString() === today);
    
    const revenue = todayBills.reduce((sum, b) => sum + (b.total || 0), 0);
    document.getElementById('stat-revenue').innerText = '₹' + formatIN(revenue);
    document.getElementById('stat-orders').innerText = todayBills.length;
    
    const tables = restrosDB.tables || [];
    document.getElementById('stat-tables').innerText = `${tables.filter(t => t.status === 'occupied').length} / ${tables.length}`;
    
    const kots = restrosDB.kots || [];
    document.getElementById('stat-kots').innerText = kots.filter(k => k.status === 'pending').length;
}
