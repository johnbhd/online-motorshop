const adminStatusClasses = {
    Pending: ['bg-orange-50', 'text-orange-700', 'ring-orange-200'],
    'Payment Verification': ['bg-orange-50', 'text-orange-700', 'ring-orange-200'],
    Preparing: ['bg-blue-50', 'text-blue-700', 'ring-blue-200'],
    'Ready for Pickup': ['bg-emerald-50', 'text-emerald-700', 'ring-emerald-200'],
    'Waiting for Booking': ['bg-violet-50', 'text-violet-700', 'ring-violet-200'],
};

const adminToneClasses = {
    orange: ['bg-orange-50', 'text-orange-600'],
    green: ['bg-emerald-50', 'text-emerald-700'],
    blue: ['bg-blue-50', 'text-blue-700'],
    slate: ['bg-slate-100', 'text-slate-600'],
};

const createAdminElement = (tagName, className = '', text = null) => {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (text !== null) {
        element.textContent = String(text);
    }

    return element;
};

const createAdminEmptyMessage = (message) => createAdminElement(
    'p',
    'px-5 py-10 text-center text-sm text-slate-500 sm:px-6',
    message,
);

const initializeAdminDashboard = () => {
    const dashboard = document.querySelector('[data-admin-dashboard]');

    if (!dashboard) {
        return;
    }

    const endpoint = dashboard.dataset.adminDashboardEndpoint;
    const summaryLoading = dashboard.querySelector('[data-admin-dashboard-summary-loading]');
    const summaryContent = dashboard.querySelector('[data-admin-dashboard-summary-content]');
    const contentLoading = dashboard.querySelector('[data-admin-dashboard-loading]');
    const content = dashboard.querySelector('[data-admin-dashboard-content]');
    const error = dashboard.querySelector('[data-admin-dashboard-error]');
    const retry = dashboard.querySelector('[data-admin-dashboard-retry]');
    const orders = dashboard.querySelector('[data-admin-dashboard-orders]');
    const attention = dashboard.querySelector('[data-admin-dashboard-attention]');
    const branches = dashboard.querySelector('[data-admin-dashboard-branches]');
    const activity = dashboard.querySelector('[data-admin-dashboard-activity]');

    if (!endpoint || !summaryLoading || !summaryContent || !contentLoading || !content || !error || !retry || !orders || !attention || !branches || !activity) {
        return;
    }

    const setLoading = () => {
        dashboard.setAttribute('aria-busy', 'true');
        summaryLoading.classList.remove('hidden');
        summaryContent.classList.add('hidden');
        contentLoading.classList.remove('hidden');
        content.classList.add('hidden');
        error.classList.add('hidden');
        retry.disabled = true;
    };

    const setResults = () => {
        dashboard.setAttribute('aria-busy', 'false');
        summaryLoading.classList.add('hidden');
        summaryContent.classList.remove('hidden');
        contentLoading.classList.add('hidden');
        content.classList.remove('hidden');
        error.classList.add('hidden');
        retry.disabled = false;
    };

    const setError = () => {
        dashboard.setAttribute('aria-busy', 'false');
        summaryLoading.classList.add('hidden');
        summaryContent.classList.add('hidden');
        contentLoading.classList.add('hidden');
        content.classList.add('hidden');
        error.classList.remove('hidden');
        retry.disabled = false;
    };

    const renderSummary = (summary) => {
        dashboard.querySelectorAll('[data-admin-dashboard-summary]').forEach((target) => {
            const value = Number(summary[target.dataset.adminDashboardSummary]);

            target.textContent = Number.isFinite(value) ? String(value) : '0';
        });
    };

    const renderOrders = (items) => {
        if (items.length === 0) {
            const row = document.createElement('tr');
            const cell = createAdminElement('td', 'px-5 py-10 text-center text-sm text-slate-500', 'No recent orders.');

            cell.colSpan = 7;
            row.append(cell);
            orders.replaceChildren(row);
            return;
        }

        orders.replaceChildren(...items.map((order) => {
            const row = createAdminElement('tr', 'transition hover:bg-slate-50/80');
            const cells = [
                createAdminElement('td', 'whitespace-nowrap px-5 py-4 text-sm font-semibold text-[#0B1930]', order.reference),
                createAdminElement('td', 'whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-700', order.customer),
                createAdminElement('td', 'whitespace-nowrap px-5 py-4 text-sm text-slate-600', order.branch),
                createAdminElement('td', 'whitespace-nowrap px-5 py-4 text-sm font-semibold text-[#0B1930]', order.amount),
                createAdminElement('td', 'whitespace-nowrap px-5 py-4 text-sm text-slate-600', order.fulfillment),
                createAdminElement('td', 'whitespace-nowrap px-5 py-4'),
                createAdminElement('td', 'whitespace-nowrap px-5 py-4'),
            ];
            const badge = createAdminElement('span', 'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', order.status);
            const action = createAdminElement('button', 'inline-flex min-h-8 cursor-pointer items-center justify-center rounded-lg border border-orange-300 px-3 text-xs font-semibold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500', 'View');

            badge.classList.add(...(adminStatusClasses[order.status] ?? ['bg-slate-100', 'text-slate-600', 'ring-slate-200']));
            action.type = 'button';
            action.dataset.adminOrderReference = order.reference;
            cells[5].append(badge);
            cells[6].append(action);
            row.append(...cells);

            return row;
        }));
    };

    const renderAttention = (items) => {
        if (items.length === 0) {
            attention.replaceChildren(createAdminEmptyMessage('Nothing needs attention.'));
            return;
        }

        attention.replaceChildren(...items.map((item) => {
            const row = createAdminElement('div', 'flex items-center gap-3 px-5 py-4 sm:px-6');
            const iconWrap = createAdminElement('span', 'inline-flex size-9 shrink-0 items-center justify-center rounded-lg');
            const icon = createAdminElement('i', `${item.icon} text-sm`);
            const details = createAdminElement('div', 'min-w-0 flex-1');
            const title = createAdminElement('h3', 'text-sm font-semibold text-[#0B1930]', item.title);
            const description = createAdminElement('p', 'mt-1 text-xs leading-5 text-slate-500', item.description);
            const action = createAdminElement('button', 'shrink-0 text-sm font-semibold text-orange-600 transition hover:text-orange-700 focus:outline-none focus-visible:underline', item.action);

            icon.setAttribute('aria-hidden', 'true');
            iconWrap.classList.add(...(adminToneClasses[item.tone] ?? adminToneClasses.slate));
            action.type = 'button';
            action.dataset.adminAttention = item.title;
            iconWrap.append(icon);
            details.append(title, description);
            row.append(iconWrap, details, action);

            return row;
        }));
    };

    const renderBranches = (items) => {
        if (items.length === 0) {
            branches.replaceChildren(createAdminEmptyMessage('No branch activity available.'));
            return;
        }

        branches.replaceChildren(...items.map((branch) => {
            const row = createAdminElement('button', 'flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none sm:px-6');
            const iconWrap = createAdminElement('span', 'inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600');
            const icon = createAdminElement('i', 'fa-regular fa-building text-sm');
            const details = createAdminElement('div', 'min-w-0 flex-1');
            const name = createAdminElement('h3', 'text-sm font-semibold text-[#0B1930]', branch.name);
            const counts = createAdminElement('p', 'mt-1 text-xs leading-5 text-slate-500', `${branch.orders} Orders · ${branch.pickup} Pickup · ${branch.delivery} Delivery`);
            const chevron = createAdminElement('i', 'fa-solid fa-chevron-right text-xs text-slate-400');

            row.type = 'button';
            row.dataset.adminBranch = branch.name;
            icon.setAttribute('aria-hidden', 'true');
            chevron.setAttribute('aria-hidden', 'true');
            iconWrap.append(icon);
            details.append(name, counts);
            row.append(iconWrap, details, chevron);

            return row;
        }));
    };

    const renderActivity = (items) => {
        if (items.length === 0) {
            activity.replaceChildren(createAdminEmptyMessage('No recent activity.'));
            return;
        }

        activity.replaceChildren(...items.map((item) => {
            const row = createAdminElement('div', 'flex items-start gap-3 px-5 py-4 sm:px-6');
            const iconWrap = createAdminElement('span', 'inline-flex size-8 shrink-0 items-center justify-center rounded-full');
            const icon = createAdminElement('i', `${item.icon} text-xs`);
            const details = createAdminElement('div', 'min-w-0 flex-1');
            const description = createAdminElement('p', 'text-sm font-medium leading-5 text-slate-700', item.description);
            const metadata = createAdminElement('p', 'mt-1 text-xs text-slate-500', `${item.actor} · ${item.time}`);

            icon.setAttribute('aria-hidden', 'true');
            iconWrap.classList.add(...(adminToneClasses[item.tone] ?? adminToneClasses.slate));
            iconWrap.append(icon);
            details.append(description, metadata);
            row.append(iconWrap, details);

            return row;
        }));
    };

    const loadDashboard = async () => {
        setLoading();

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
                throw new Error(`Admin dashboard request failed with status ${response.status}.`);
            }

            const data = await response.json();

            if (!data?.summary || !Array.isArray(data.recent_orders) || !Array.isArray(data.needs_attention) || !Array.isArray(data.branches) || !Array.isArray(data.recent_activity)) {
                throw new Error('Admin dashboard response has an invalid structure.');
            }

            renderSummary(data.summary);
            renderOrders(data.recent_orders);
            renderAttention(data.needs_attention);
            renderBranches(data.branches);
            renderActivity(data.recent_activity);
            setResults();
        } catch (loadError) {
            console.error('Unable to load Admin Dashboard.', loadError);
            setError();
        }
    };

    retry.addEventListener('click', loadDashboard);
    loadDashboard();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminDashboard);
} else {
    initializeAdminDashboard();
}
