// Update the navigation items to include policy and testimonials
function loadHeader() {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (!headerPlaceholder) return;

    const navItems = [
        { name: 'Dashboard', url: '/dashboard', icon: 'fa-tachometer-alt' },
        { name: 'Employees', url: '/employees', icon: 'fa-users' },
        { name: 'Departments', url: '/departments', icon: 'fa-sitemap' },
        { name: 'Attendance', url: '/attendance', icon: 'fa-calendar-check' },
        { name: 'Leave', url: '/leave', icon: 'fa-calendar-minus' },
        { name: 'Payroll', url: '/payroll', icon: 'fa-money-bill-wave' },
        { name: 'Performance', url: '/performance', icon: 'fa-chart-line' },
        { name: 'Training', url: '/training', icon: 'fa-graduation-cap' },
        { name: 'Recruitment', url: '/recruitment', icon: 'fa-user-plus' },
        { name: 'Documents', url: '/documents', icon: 'fa-file-alt' },
        { name: 'Policies', url: '/policy', icon: 'fa-clipboard-list' },
        { name: 'Testimonials', url: '/testimonials', icon: 'fa-quote-right' },
        { name: 'Settings', url: '/settings', icon: 'fa-cog' }
    ];

    let navHTML = '<nav class="main-nav"><ul>';
    navItems.forEach(item => {
        navHTML += `
            <li>
                <a href="${item.url}">
                    <i class="fas ${item.icon}"></i> ${item.name}
                </a>
            </li>
        `;
    });
    navHTML += '</ul></nav>';

    headerPlaceholder.innerHTML = navHTML;
}