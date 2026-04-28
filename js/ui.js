setInterval(() => { document.getElementById('clock').innerText = new Date().toLocaleTimeString('en-IN'); }, 1000);

function toggleMenu() { document.getElementById('sidebar').classList.toggle('open'); }

function switchTab(viewId, element) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    if(element) {
        element.classList.add('active');
        document.getElementById('page-title').innerText = element.innerText.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF] /g, '');
    }
    if(window.innerWidth <= 767) toggleMenu();
}

function formatIN(amount) { return Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }); }

function triggerToast(msg, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div'); toast.className = 'toast';
    toast.style.borderLeftColor = type === 'success' ? 'var(--success)' : 'var(--error)';
    toast.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span> <div>${msg}</div>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
