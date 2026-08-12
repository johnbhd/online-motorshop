import './bootstrap';
import '@fortawesome/fontawesome-free/css/fontawesome.min.css';
import '@fortawesome/fontawesome-free/css/regular.min.css';
import '@fortawesome/fontawesome-free/css/solid.min.css';
import './staff/dashboard';
import './staff/orders';
import './staff/payments';
import './staff/pickups';
import './staff/deliveries';
import './staff/products';
import './staff/messages';
import './staff/customers';
import './staff/reports';

const initializeStaffSidebar = () => {
    const staffSidebar = document.querySelector('[data-staff-sidebar]');
    const openButtons = document.querySelectorAll('[data-staff-sidebar-open]');
    const closeButton = document.querySelector('[data-staff-sidebar-close]');
    const overlay = document.querySelector('[data-staff-sidebar-overlay]');

    if (!staffSidebar || openButtons.length === 0 || !overlay) {
        return;
    }

    let lastOpenButton = null;

    const setSidebarOpen = (isOpen, restoreFocus = true) => {
        staffSidebar.classList.toggle('translate-x-0', isOpen);
        staffSidebar.classList.toggle('-translate-x-full', !isOpen);
        overlay.classList.toggle('hidden', !isOpen);
        document.body.classList.toggle('overflow-hidden', isOpen);

        openButtons.forEach((button) => {
            button.setAttribute('aria-expanded', String(isOpen));
        });

        if (isOpen) {
            window.requestAnimationFrame(() => {
                closeButton?.focus();
            });

            return;
        }

        if (restoreFocus) {
            lastOpenButton?.focus();
        }
    };

    openButtons.forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            lastOpenButton = button;
            setSidebarOpen(true);
        });
    });

    closeButton?.addEventListener('click', () => {
        setSidebarOpen(false);
    });

    overlay.addEventListener('click', () => {
        setSidebarOpen(false);
    });

    staffSidebar.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 1024) {
                setSidebarOpen(false, false);
            }
        });
    });

    document.addEventListener('keydown', (event) => {
        const isOpen = staffSidebar.classList.contains('translate-x-0');

        if (event.key === 'Escape' && isOpen) {
            setSidebarOpen(false);
        }
    });

    window.addEventListener('resize', () => {
        const isOpen = staffSidebar.classList.contains('translate-x-0');

        if (window.innerWidth >= 1024 && isOpen) {
            setSidebarOpen(false, false);
        }
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStaffSidebar);
} else {
    initializeStaffSidebar();
}

const staffProfileDropdown = document.querySelector('[data-staff-profile-dropdown]');

if (staffProfileDropdown) {
    const profileTrigger = staffProfileDropdown.querySelector('[data-staff-profile-trigger]');
    const profileMenu = staffProfileDropdown.querySelector('[data-staff-profile-menu]');
    const profileChevron = staffProfileDropdown.querySelector('[data-staff-profile-chevron]');

    const closeProfileMenu = () => {
        profileMenu?.classList.add('hidden');
        profileChevron?.classList.remove('rotate-180');
        profileTrigger?.setAttribute('aria-expanded', 'false');
    };

    const openProfileMenu = () => {
        profileMenu?.classList.remove('hidden');
        profileChevron?.classList.add('rotate-180');
        profileTrigger?.setAttribute('aria-expanded', 'true');
    };

    profileTrigger?.addEventListener('click', () => {
        const isOpen = profileTrigger.getAttribute('aria-expanded') === 'true';

        if (isOpen) {
            closeProfileMenu();
            return;
        }

        openProfileMenu();
    });

    document.addEventListener('click', (event) => {
        if (!staffProfileDropdown.contains(event.target)) {
            closeProfileMenu();
        }
    });

    document.addEventListener('keydown', (event) => {
        const isOpen = profileTrigger?.getAttribute('aria-expanded') === 'true';

        if (event.key === 'Escape' && isOpen) {
            closeProfileMenu();
            profileTrigger?.focus();
        }
    });
}
