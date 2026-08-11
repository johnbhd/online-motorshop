const statusToneClasses = {
    orange: [
        'bg-orange-50',
        'text-orange-700',
        'ring-orange-200',
    ],
    blue: [
        'bg-blue-50',
        'text-blue-700',
        'ring-blue-200',
    ],
    green: [
        'bg-emerald-50',
        'text-emerald-700',
        'ring-emerald-200',
    ],
    violet: [
        'bg-violet-50',
        'text-violet-700',
        'ring-violet-200',
    ],
    slate: [
        'bg-slate-100',
        'text-slate-700',
        'ring-slate-200',
    ],
};

const createDashboardElement = (tagName, className, text) => {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (text !== undefined && text !== null) {
        element.textContent = String(text);
    }

    return element;
};

const createTableCell = (className) => {
    return createDashboardElement('td', className);
};

const safeSameOriginUrl = (value) => {
    if (!value || value === '#') {
        return '#';
    }

    try {
        const url = new URL(value, window.location.origin);

        if (url.origin !== window.location.origin) {
            return '#';
        }

        return `${url.pathname}${url.search}${url.hash}`;
    } catch {
        return '#';
    }
};

const initializeStaffDashboard = () => {
    const dashboard = document.querySelector('[data-staff-dashboard]');

    if (!dashboard) {
        return;
    }

    const endpoint = dashboard.dataset.dashboardEndpoint;
    const summaryLoading = dashboard.querySelector(
        '[data-dashboard-summary-loading]',
    );
    const summaryContent = dashboard.querySelector(
        '[data-dashboard-summary-content]',
    );
    const ordersLoading = dashboard.querySelector(
        '[data-dashboard-orders-loading]',
    );
    const ordersContent = dashboard.querySelector(
        '[data-dashboard-orders-content]',
    );
    const ordersBody = dashboard.querySelector(
        '[data-dashboard-orders-body]',
    );
    const errorState = dashboard.querySelector('[data-dashboard-error]');
    const retryButton = dashboard.querySelector('[data-dashboard-retry]');

    if (
        !endpoint
        || !summaryLoading
        || !summaryContent
        || !ordersLoading
        || !ordersContent
        || !ordersBody
        || !errorState
        || !retryButton
    ) {
        return;
    }

    const setLoadingState = () => {
        dashboard.setAttribute('aria-busy', 'true');
        summaryLoading.classList.remove('hidden');
        ordersLoading.classList.remove('hidden');
        summaryContent.classList.add('hidden');
        ordersContent.classList.add('hidden');
        errorState.classList.add('hidden');
        retryButton.disabled = true;
    };

    const setSuccessState = () => {
        dashboard.setAttribute('aria-busy', 'false');
        summaryLoading.classList.add('hidden');
        ordersLoading.classList.add('hidden');
        summaryContent.classList.remove('hidden');
        ordersContent.classList.remove('hidden');
        errorState.classList.add('hidden');
        retryButton.disabled = false;
    };

    const setErrorState = () => {
        dashboard.setAttribute('aria-busy', 'false');
        summaryLoading.classList.add('hidden');
        ordersLoading.classList.add('hidden');
        summaryContent.classList.add('hidden');
        ordersContent.classList.add('hidden');
        errorState.classList.remove('hidden');
        retryButton.disabled = false;
    };

    const renderSummary = (summary) => {
        dashboard
            .querySelectorAll('[data-dashboard-value]')
            .forEach((target) => {
                const key = target.dataset.dashboardValue;
                const value = summary[key];

                target.textContent = Number.isFinite(Number(value))
                    ? String(Number(value))
                    : '0';
            });
    };

    const renderRecentOrders = (orders) => {
        ordersBody.replaceChildren();

        if (orders.length === 0) {
            const row = document.createElement('tr');
            const cell = createTableCell(
                'px-6 py-10 text-center text-sm text-slate-500',
            );

            cell.colSpan = 6;
            cell.textContent = 'No recent orders found.';
            row.append(cell);
            ordersBody.append(row);

            return;
        }

        orders.forEach((order) => {
            const row = createDashboardElement(
                'tr',
                'transition hover:bg-slate-50/80',
            );
            const referenceCell = createTableCell(
                'whitespace-nowrap px-6 py-4 text-sm font-semibold text-[#0B1930]',
            );
            const customerCell = createTableCell(
                'whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-700',
            );
            const requestCell = createTableCell(
                'px-6 py-4 text-sm text-slate-600',
            );
            const statusCell = createTableCell(
                'whitespace-nowrap px-6 py-4',
            );
            const timeCell = createTableCell(
                'whitespace-nowrap px-6 py-4 text-sm text-slate-500',
            );
            const actionCell = createTableCell(
                'whitespace-nowrap px-6 py-4',
            );

            referenceCell.textContent = order.reference ?? '';
            customerCell.textContent = order.customer ?? '';

            const requestText = createDashboardElement(
                'span',
                'font-medium text-slate-700',
                order.request ?? '',
            );
            requestCell.append(requestText);

            if (order.fulfillment) {
                requestCell.append(
                    document.createTextNode(' / '),
                    createDashboardElement(
                        'span',
                        null,
                        order.fulfillment,
                    ),
                );
            }

            const statusTone = statusToneClasses[order.status?.tone]
                ?? statusToneClasses.slate;
            const statusBadge = createDashboardElement(
                'span',
                'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
                order.status?.label ?? '',
            );
            statusBadge.classList.add(...statusTone);
            statusCell.append(statusBadge);

            timeCell.textContent = order.time ?? '';

            const actionLink = createDashboardElement(
                'a',
                'text-sm font-semibold text-blue-700 transition hover:text-blue-900 focus:outline-none focus-visible:underline',
                order.action?.label ?? 'View Order',
            );
            actionLink.href = safeSameOriginUrl(order.action?.url);
            actionCell.append(actionLink);

            row.append(
                referenceCell,
                customerCell,
                requestCell,
                statusCell,
                timeCell,
                actionCell,
            );
            ordersBody.append(row);
        });
    };

    const loadDashboard = async () => {
        setLoadingState();

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
                throw new Error(
                    `Dashboard request failed with status ${response.status}.`,
                );
            }

            const data = await response.json();

            if (
                !data
                || typeof data.summary !== 'object'
                || !Array.isArray(data.recent_orders)
            ) {
                throw new Error('Dashboard response has an invalid structure.');
            }

            renderSummary(data.summary);
            renderRecentOrders(data.recent_orders);
            setSuccessState();
        } catch (error) {
            console.error('Unable to load the Staff Dashboard.', error);
            setErrorState();
        }
    };

    retryButton.addEventListener('click', loadDashboard);
    loadDashboard();
};

if (document.readyState === 'loading') {
    document.addEventListener(
        'DOMContentLoaded',
        initializeStaffDashboard,
    );
} else {
    initializeStaffDashboard();
}
