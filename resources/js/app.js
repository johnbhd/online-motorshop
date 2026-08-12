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
import './staff/notifications';
import './staff/customers';
import './staff/reports';
import './staff/reviews';
import './admin/dashboard';

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

const initializeStaffNavbarDropdowns = () => {
    const staffProfileDropdown = document.querySelector('[data-staff-profile-dropdown]');
    const staffNotificationDropdown = document.querySelector('[data-staff-notification-dropdown]');

    if (!staffProfileDropdown && !staffNotificationDropdown) {
        return;
    }

    const profileTrigger = staffProfileDropdown?.querySelector('[data-staff-profile-trigger]');
    const profileMenu = staffProfileDropdown?.querySelector('[data-staff-profile-menu]');
    const profileChevron = staffProfileDropdown?.querySelector('[data-staff-profile-chevron]');
    const notificationTrigger = staffNotificationDropdown?.querySelector('[data-staff-notification-trigger]');
    const notificationMenu = staffNotificationDropdown?.querySelector('[data-staff-notification-menu]');
    const notificationBadge = staffNotificationDropdown?.querySelector('[data-staff-notification-badge]');
    const notificationUnreadLabel = staffNotificationDropdown?.querySelector('[data-staff-notification-unread-label]');

    const updateNotificationBadge = (unreadCount) => {
        const safeUnreadCount = Math.max(0, Number(unreadCount) || 0);
        const badgeLabel = safeUnreadCount > 9 ? '9+' : String(safeUnreadCount);

        notificationBadge?.classList.toggle('hidden', safeUnreadCount === 0);

        if (notificationBadge) {
            notificationBadge.textContent = badgeLabel;
        }

        if (notificationUnreadLabel) {
            notificationUnreadLabel.textContent = `${safeUnreadCount} unread`;
        }

        notificationTrigger?.setAttribute(
            'aria-label',
            safeUnreadCount > 0
                ? `Notifications, ${safeUnreadCount} unread`
                : 'Notifications',
        );
    };

    const closeProfileMenu = () => {
        profileMenu?.classList.add('hidden');
        profileChevron?.classList.remove('rotate-180');
        profileTrigger?.setAttribute('aria-expanded', 'false');
    };

    const closeNotificationMenu = () => {
        notificationMenu?.classList.add('hidden');
        notificationTrigger?.setAttribute('aria-expanded', 'false');
    };

    const openProfileMenu = () => {
        closeNotificationMenu();
        profileMenu?.classList.remove('hidden');
        profileChevron?.classList.add('rotate-180');
        profileTrigger?.setAttribute('aria-expanded', 'true');
    };

    const openNotificationMenu = () => {
        closeProfileMenu();
        notificationMenu?.classList.remove('hidden');
        notificationTrigger?.setAttribute('aria-expanded', 'true');
    };

    profileTrigger?.addEventListener('click', () => {
        const isOpen = profileTrigger.getAttribute('aria-expanded') === 'true';

        if (isOpen) {
            closeProfileMenu();
            return;
        }

        openProfileMenu();
    });

    notificationTrigger?.addEventListener('click', () => {
        const isOpen = notificationTrigger.getAttribute('aria-expanded') === 'true';

        if (isOpen) {
            closeNotificationMenu();
            return;
        }

        openNotificationMenu();
    });

    document.addEventListener('click', (event) => {
        if (!staffProfileDropdown?.contains(event.target)) {
            closeProfileMenu();
        }

        if (!staffNotificationDropdown?.contains(event.target)) {
            closeNotificationMenu();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') {
            return;
        }

        const profileIsOpen = profileTrigger?.getAttribute('aria-expanded') === 'true';
        const notificationsAreOpen = notificationTrigger?.getAttribute('aria-expanded') === 'true';

        closeProfileMenu();
        closeNotificationMenu();

        if (notificationsAreOpen) {
            notificationTrigger?.focus();
        } else if (profileIsOpen) {
            profileTrigger?.focus();
        }
    });

    document.addEventListener('staff-notifications-updated', (event) => {
        updateNotificationBadge(event.detail?.unread);
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStaffNavbarDropdowns);
} else {
    initializeStaffNavbarDropdowns();
}

const initializeAdminSidebar = () => {
    const adminSidebar = document.querySelector('[data-admin-sidebar]');
    const openButtons = document.querySelectorAll('[data-admin-sidebar-open]');
    const closeButton = document.querySelector('[data-admin-sidebar-close]');
    const overlay = document.querySelector('[data-admin-sidebar-overlay]');

    if (!adminSidebar || openButtons.length === 0 || !overlay) {
        return;
    }

    let lastOpenButton = null;

    const setSidebarOpen = (isOpen, restoreFocus = true) => {
        adminSidebar.classList.toggle('translate-x-0', isOpen);
        adminSidebar.classList.toggle('-translate-x-full', !isOpen);
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

    adminSidebar.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 1024) {
                setSidebarOpen(false, false);
            }
        });
    });

    document.addEventListener('keydown', (event) => {
        const isOpen = adminSidebar.classList.contains('translate-x-0');

        if (event.key === 'Escape' && isOpen) {
            setSidebarOpen(false);
        }
    });

    window.addEventListener('resize', () => {
        const isOpen = adminSidebar.classList.contains('translate-x-0');

        if (window.innerWidth >= 1024 && isOpen) {
            setSidebarOpen(false, false);
        }
    });
};

const initializeAdminNavbarDropdowns = () => {
    const adminProfileDropdown = document.querySelector('[data-admin-profile-dropdown]');
    const adminNotificationDropdown = document.querySelector('[data-admin-notification-dropdown]');

    if (!adminProfileDropdown && !adminNotificationDropdown) {
        return;
    }

    const profileTrigger = adminProfileDropdown?.querySelector('[data-admin-profile-trigger]');
    const profileMenu = adminProfileDropdown?.querySelector('[data-admin-profile-menu]');
    const profileChevron = adminProfileDropdown?.querySelector('[data-admin-profile-chevron]');
    const notificationTrigger = adminNotificationDropdown?.querySelector('[data-admin-notification-trigger]');
    const notificationMenu = adminNotificationDropdown?.querySelector('[data-admin-notification-menu]');

    const closeProfileMenu = () => {
        profileMenu?.classList.add('hidden');
        profileChevron?.classList.remove('rotate-180');
        profileTrigger?.setAttribute('aria-expanded', 'false');
    };

    const closeNotificationMenu = () => {
        notificationMenu?.classList.add('hidden');
        notificationTrigger?.setAttribute('aria-expanded', 'false');
    };

    const openProfileMenu = () => {
        closeNotificationMenu();
        profileMenu?.classList.remove('hidden');
        profileChevron?.classList.add('rotate-180');
        profileTrigger?.setAttribute('aria-expanded', 'true');
    };

    const openNotificationMenu = () => {
        closeProfileMenu();
        notificationMenu?.classList.remove('hidden');
        notificationTrigger?.setAttribute('aria-expanded', 'true');
    };

    profileTrigger?.addEventListener('click', () => {
        if (profileTrigger.getAttribute('aria-expanded') === 'true') {
            closeProfileMenu();
            return;
        }

        openProfileMenu();
    });

    notificationTrigger?.addEventListener('click', () => {
        if (notificationTrigger.getAttribute('aria-expanded') === 'true') {
            closeNotificationMenu();
            return;
        }

        openNotificationMenu();
    });

    document.addEventListener('click', (event) => {
        if (!adminProfileDropdown?.contains(event.target)) {
            closeProfileMenu();
        }

        if (!adminNotificationDropdown?.contains(event.target)) {
            closeNotificationMenu();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') {
            return;
        }

        const profileIsOpen = profileTrigger?.getAttribute('aria-expanded') === 'true';
        const notificationsAreOpen = notificationTrigger?.getAttribute('aria-expanded') === 'true';

        closeProfileMenu();
        closeNotificationMenu();

        if (notificationsAreOpen) {
            notificationTrigger?.focus();
        } else if (profileIsOpen) {
            profileTrigger?.focus();
        }
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminSidebar);
    document.addEventListener('DOMContentLoaded', initializeAdminNavbarDropdowns);
} else {
    initializeAdminSidebar();
    initializeAdminNavbarDropdowns();
}
