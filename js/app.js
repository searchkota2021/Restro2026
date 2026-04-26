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

// Logout Simulator
function logout() {
    triggerToast("Logging out...", "success");
    setTimeout(() => location.reload(), 1000);
}
