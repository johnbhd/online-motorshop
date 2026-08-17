const createNotificationElement = (tagName, className = '', text = null) => {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (text !== null) {
        element.textContent = String(text);
    }

    return element;
};

const initializeStaffNotifications = () => {
    const page = document.querySelector('[data-staff-notifications]');

    if (!page) {
        return;
    }

    const endpoint = page.dataset.notificationsEndpoint;
    const panel = page.querySelector('[data-notifications-panel]');
    const loading = page.querySelector('[data-notifications-loading]');
    const content = page.querySelector('[data-notifications-content]');
    const empty = page.querySelector('[data-notifications-empty]');
    const error = page.querySelector('[data-notifications-error]');
    const emptyTitle = page.querySelector('[data-notifications-empty-title]');
    const emptyDescription = page.querySelector('[data-notifications-empty-description]');
    const search = page.querySelector('[data-notifications-search]');
    const type = page.querySelector('[data-notifications-type]');
    const markAll = page.querySelector('[data-notifications-mark-all]');
    const retry = page.querySelector('[data-notifications-retry]');
    const headerUnread = page.querySelector('[data-notifications-header-unread]');
    const tabs = [...page.querySelectorAll('[data-notifications-tab]')];

    if (!endpoint || !panel || !loading || !content || !empty || !error || !emptyTitle || !emptyDescription || !search || !type || !markAll || !retry || !headerUnread) {
        return;
    }

    let notifications = [];
    let summary = { total: 0, unread: 0, read: 0 };
    let activeTab = 'all';

    const dispatchUnreadCount = () => {
        document.dispatchEvent(new CustomEvent('staff-notifications-updated', {
            detail: { unread: summary.unread },
        }));
    };

    const setState = (state) => {
        const isLoading = state === 'loading';

        panel.setAttribute('aria-busy', String(isLoading));
        loading.classList.toggle('hidden', !isLoading);
        content.classList.toggle('hidden', state !== 'content');
        empty.classList.toggle('hidden', state !== 'empty');
        error.classList.toggle('hidden', state !== 'error');
        retry.disabled = isLoading;
    };

    const updateActiveTab = () => {
        tabs.forEach((tab) => {
            const isActive = tab.dataset.notificationsTab === activeTab;

            tab.classList.toggle('border-orange-500', isActive);
            tab.classList.toggle('text-[#0B1930]', isActive);
            tab.classList.toggle('border-transparent', !isActive);
            tab.classList.toggle('text-slate-500', !isActive);
            tab.setAttribute('aria-selected', String(isActive));
        });
    };

    const updateSummary = () => {
        page.querySelectorAll('[data-notifications-tab-count]').forEach((target) => {
            const value = Number(summary[target.dataset.notificationsTabCount]);

            target.textContent = Number.isFinite(value) ? String(value) : '0';
        });

        headerUnread.textContent = String(summary.unread);
        markAll.disabled = summary.unread === 0;
        markAll.classList.toggle('cursor-not-allowed', summary.unread === 0);
        markAll.classList.toggle('opacity-50', summary.unread === 0);
        dispatchUnreadCount();
    };

    const createNotificationRow = (notification) => {
        const row = createNotificationElement(
            'button',
            'flex w-full cursor-pointer items-start gap-3 px-5 py-4 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none sm:px-6',
        );
        const icon = createNotificationElement(
            'span',
            notification.unread
                ? 'inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600'
                : 'inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500',
        );
        const iconGraphic = createNotificationElement('i', `${notification.icon} text-sm`);
        const details = createNotificationElement('span', 'min-w-0 flex-1');
        const heading = createNotificationElement('span', 'flex items-start justify-between gap-3');
        const titleWrap = createNotificationElement('span', 'flex min-w-0 items-center gap-2');
        const title = createNotificationElement(
            'span',
            notification.unread
                ? 'truncate text-sm font-bold text-[#0B1930]'
                : 'truncate text-sm font-semibold text-slate-700',
            notification.title,
        );
        const time = createNotificationElement('span', 'shrink-0 whitespace-nowrap text-xs font-medium text-slate-400', notification.time);
        const description = createNotificationElement('span', 'mt-1 block text-sm leading-5 text-slate-500', notification.description);
        const typeLabel = createNotificationElement('span', 'mt-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500', notification.type);

        row.type = 'button';
        row.dataset.notificationId = String(notification.id);
        row.setAttribute('aria-label', `${notification.title}. ${notification.unread ? 'Unread.' : 'Read.'}`);
        iconGraphic.setAttribute('aria-hidden', 'true');
        icon.append(iconGraphic);

        if (notification.unread) {
            const unreadDot = createNotificationElement('span', 'size-1.5 shrink-0 rounded-full bg-orange-500');
            unreadDot.setAttribute('aria-label', 'Unread');
            titleWrap.append(unreadDot);
        }

        titleWrap.append(title);
        heading.append(titleWrap, time);
        details.append(heading, description, typeLabel);
        row.append(icon, details);

        row.addEventListener('click', () => {
            markNotificationRead(notification.id);
        });

        return row;
    };

    const getFilteredNotifications = () => {
        const searchValue = search.value.trim().toLowerCase();

        return notifications.filter((notification) => {
            const matchesSearch = !searchValue || [
                notification.title,
                notification.description,
                notification.type,
            ].some((value) => String(value).toLowerCase().includes(searchValue));
            const matchesType = type.value === 'all' || notification.type === type.value;
            const matchesTab = activeTab === 'all'
                || (activeTab === 'unread' && notification.unread)
                || (activeTab === 'read' && !notification.unread);

            return matchesSearch && matchesType && matchesTab;
        });
    };

    const renderNotifications = () => {
        const filteredNotifications = getFilteredNotifications();

        if (filteredNotifications.length === 0) {
            const hasNotifications = notifications.length > 0;
            const noUnreadNotifications = activeTab === 'unread' && summary.unread === 0;

            emptyTitle.textContent = noUnreadNotifications
                ? 'No unread notifications'
                : hasNotifications
                    ? 'No notifications found'
                    : 'No notifications';
            emptyDescription.textContent = noUnreadNotifications || !hasNotifications
                ? "You're all caught up."
                : 'Try changing your search or filters.';
            setState('empty');
            return;
        }

        content.replaceChildren(...filteredNotifications.map(createNotificationRow));
        setState('content');
    };

    const markNotificationRead = (notificationId) => {
        const notification = notifications.find((item) => Number(item.id) === Number(notificationId));

        if (!notification || !notification.unread) {
            return;
        }

        notification.unread = false;
        summary.unread = Math.max(0, Number(summary.unread) - 1);
        summary.read = Math.min(Number(summary.total), Number(summary.read) + 1);
        updateSummary();
        renderNotifications();
    };

    const markAllAsRead = () => {
        if (summary.unread === 0) {
            return;
        }

        notifications.forEach((notification) => {
            notification.unread = false;
        });
        summary.unread = 0;
        summary.read = Number(summary.total);
        updateSummary();
        renderNotifications();
    };

    const loadNotifications = async () => {
        setState('loading');

        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error(`Notifications request failed with status ${response.status}.`);
            }

            const payload = await response.json();

            if (!payload?.summary || !Array.isArray(payload.notifications)) {
                throw new Error('Notifications response has an invalid structure.');
            }

            summary = payload.summary;
            notifications = payload.notifications;
            updateSummary();
            renderNotifications();
        } catch (loadError) {
            console.error('Unable to load Staff Notifications.', loadError);
            setState('error');
        }
    };

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            activeTab = tab.dataset.notificationsTab ?? 'all';
            updateActiveTab();
            renderNotifications();
        });
    });

    search.addEventListener('input', renderNotifications);
    type.addEventListener('change', renderNotifications);
    markAll.addEventListener('click', markAllAsRead);
    retry.addEventListener('click', loadNotifications);

    loadNotifications();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStaffNotifications);
} else {
    initializeStaffNotifications();
}
