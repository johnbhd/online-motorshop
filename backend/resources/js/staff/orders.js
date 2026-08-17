const paymentBadgeClasses = {
    Unpaid: [
        'bg-slate-100',
        'text-slate-700',
        'ring-slate-200',
    ],
    'Waiting for Verification': [
        'bg-blue-50',
        'text-blue-700',
        'ring-blue-200',
    ],
    'Pay at Pickup': [
        'bg-violet-50',
        'text-violet-700',
        'ring-violet-200',
    ],
    Paid: [
        'bg-emerald-50',
        'text-emerald-700',
        'ring-emerald-200',
    ],
    Cancelled: [
        'bg-red-50',
        'text-red-700',
        'ring-red-200',
    ],
};

const statusBadgeClasses = {
    Pending: [
        'bg-orange-50',
        'text-orange-700',
        'ring-orange-200',
    ],
    'Payment Verification': [
        'bg-blue-50',
        'text-blue-700',
        'ring-blue-200',
    ],
    'Preparing Order': [
        'bg-blue-50',
        'text-blue-700',
        'ring-blue-200',
    ],
    'Ready for Pickup': [
        'bg-emerald-50',
        'text-emerald-700',
        'ring-emerald-200',
    ],
    'Waiting for Booking': [
        'bg-orange-50',
        'text-orange-700',
        'ring-orange-200',
    ],
    'In Transit': [
        'bg-blue-50',
        'text-blue-700',
        'ring-blue-200',
    ],
    Completed: [
        'bg-emerald-50',
        'text-emerald-700',
        'ring-emerald-200',
    ],
    Cancelled: [
        'bg-red-50',
        'text-red-700',
        'ring-red-200',
    ],
};

const defaultBadgeClasses = [
    'bg-slate-100',
    'text-slate-700',
    'ring-slate-200',
];

const tabStatusMatches = {
    pending: ['Pending'],
    confirmed: ['Confirmed'],
    preparing: ['Preparing Order'],
    ready_for_pickup: ['Ready for Pickup'],
    delivery: ['Waiting for Booking', 'In Transit'],
    completed: ['Completed'],
    cancelled: ['Cancelled'],
};

const createOrdersElement = (tagName, className, text) => {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (text !== undefined && text !== null) {
        element.textContent = String(text);
    }

    return element;
};

const createBadge = (label, classMap) => {
    const badge = createOrdersElement(
        'span',
        'inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        label,
    );
    const badgeClasses = classMap[label] ?? defaultBadgeClasses;

    badge.classList.add(...badgeClasses);

    return badge;
};

const initializeStaffOrders = () => {
    const page = document.querySelector('[data-staff-orders]');

    if (!page) {
        return;
    }

    const endpoint = page.dataset.ordersEndpoint;
    const panel = page.querySelector('[data-orders-panel]');
    const loadingState = page.querySelector('[data-orders-loading]');
    const contentState = page.querySelector('[data-orders-content]');
    const emptyState = page.querySelector('[data-orders-empty]');
    const errorState = page.querySelector('[data-orders-error]');
    const retryButton = page.querySelector('[data-orders-retry]');
    const ordersBody = page.querySelector('[data-orders-body]');
    const searchInput = page.querySelector('[data-orders-search]');
    const fulfillmentFilter = page.querySelector('[data-orders-fulfillment]');
    const dateFilter = page.querySelector('[data-orders-date]');
    const statusFilter = page.querySelector('[data-orders-status]');
    const sortSelect = page.querySelector('[data-orders-sort]');
    const clearButton = page.querySelector('[data-orders-clear]');
    const showingLabel = page.querySelector('[data-orders-showing]');
    const totalLabel = page.querySelector('[data-orders-total]');
    const panelTotalLabel = page.querySelector('[data-orders-total-label]');
    const attentionCount = page.querySelector('[data-orders-attention-count]');
    const tabButtons = [...page.querySelectorAll('[data-orders-tab]')];

    if (
        !endpoint
        || !panel
        || !loadingState
        || !contentState
        || !emptyState
        || !errorState
        || !retryButton
        || !ordersBody
        || !searchInput
        || !fulfillmentFilter
        || !dateFilter
        || !statusFilter
        || !sortSelect
        || !clearButton
        || !showingLabel
        || !totalLabel
        || !panelTotalLabel
        || !attentionCount
    ) {
        return;
    }

    let orders = [];
    let summary = {};
    let activeTab = 'all';

    const setLoadingState = () => {
        panel.setAttribute('aria-busy', 'true');
        loadingState.classList.remove('hidden');
        contentState.classList.add('hidden');
        emptyState.classList.add('hidden');
        errorState.classList.add('hidden');
        retryButton.disabled = true;
    };

    const setResultsState = (hasResults) => {
        panel.setAttribute('aria-busy', 'false');
        loadingState.classList.add('hidden');
        errorState.classList.add('hidden');
        contentState.classList.toggle('hidden', !hasResults);
        emptyState.classList.toggle('hidden', hasResults);
        retryButton.disabled = false;
    };

    const setErrorState = () => {
        panel.setAttribute('aria-busy', 'false');
        loadingState.classList.add('hidden');
        contentState.classList.add('hidden');
        emptyState.classList.add('hidden');
        errorState.classList.remove('hidden');
        retryButton.disabled = false;
    };

    const updateSummary = () => {
        page.querySelectorAll('[data-orders-summary]').forEach((target) => {
            const key = target.dataset.ordersSummary;

            if (Number.isFinite(Number(summary[key]))) {
                target.textContent = String(Number(summary[key]));
            }
        });

        const total = Number(summary.total) || orders.length;
        const pending = Number(summary.pending) || 0;

        panelTotalLabel.textContent = String(total);
        attentionCount.textContent = String(pending);
    };

    const updateActiveTab = () => {
        tabButtons.forEach((button) => {
            const isActive = button.dataset.ordersTab === activeTab;

            button.classList.toggle('border-orange-500', isActive);
            button.classList.toggle('text-[#0B1930]', isActive);
            button.classList.toggle('border-transparent', !isActive);
            button.classList.toggle('text-slate-500', !isActive);
            button.setAttribute('aria-selected', String(isActive));
        });
    };

    const createOrderRow = (order) => {
        const row = createOrdersElement(
            'tr',
            'transition hover:bg-slate-50/80',
        );
        const orderCell = createOrdersElement(
            'td',
            'whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-[#0B1930]',
            order.reference ?? '',
        );
        const customerCell = createOrdersElement(
            'td',
            'whitespace-nowrap px-5 py-3.5 text-sm font-medium text-slate-700',
            order.customer ?? '',
        );
        const dateCell = createOrdersElement(
            'td',
            'whitespace-nowrap px-5 py-3.5 text-sm text-slate-500',
            order.date ?? '',
        );
        const amountCell = createOrdersElement(
            'td',
            'whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-[#0B1930]',
            order.amount ?? '',
        );
        const fulfillmentCell = createOrdersElement(
            'td',
            'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600',
            order.fulfillment ?? '',
        );
        const paymentCell = createOrdersElement(
            'td',
            'whitespace-nowrap px-5 py-3.5',
        );
        const statusCell = createOrdersElement(
            'td',
            'whitespace-nowrap px-5 py-3.5',
        );
        const actionCell = createOrdersElement(
            'td',
            'whitespace-nowrap px-5 py-3.5',
        );
        const menuCell = createOrdersElement(
            'td',
            'whitespace-nowrap px-5 py-3.5 text-right',
        );

        paymentCell.append(
            createBadge(order.payment ?? '', paymentBadgeClasses),
        );
        statusCell.append(
            createBadge(order.status ?? '', statusBadgeClasses),
        );

        const actionButton = createOrdersElement(
            'button',
            'inline-flex min-h-8 cursor-pointer items-center justify-center rounded-lg border border-orange-400 px-3 text-xs font-semibold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
            order.action ?? 'View Order',
        );
        actionButton.type = 'button';
        actionCell.append(actionButton);

        const menuButton = createOrdersElement(
            'button',
            'inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[#0B1930] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
        );
        const menuIcon = createOrdersElement(
            'i',
            'fa-solid fa-ellipsis-vertical',
        );

        menuButton.type = 'button';
        menuButton.setAttribute(
            'aria-label',
            `More actions for ${order.reference ?? 'order'}`,
        );
        menuIcon.setAttribute('aria-hidden', 'true');
        menuButton.append(menuIcon);
        menuCell.append(menuButton);

        row.append(
            orderCell,
            customerCell,
            dateCell,
            amountCell,
            fulfillmentCell,
            paymentCell,
            statusCell,
            actionCell,
            menuCell,
        );

        return row;
    };

    const getFilteredOrders = () => {
        const searchValue = searchInput.value.trim().toLowerCase();
        const fulfillmentValue = fulfillmentFilter.value;
        const dateValue = dateFilter.value;
        const statusValue = statusFilter.value;
        const activeStatuses = tabStatusMatches[activeTab] ?? [];

        const filteredOrders = orders.filter((order) => {
            const matchesSearch = !searchValue
                || String(order.reference).toLowerCase().includes(searchValue)
                || String(order.customer).toLowerCase().includes(searchValue);
            const matchesFulfillment = fulfillmentValue === 'all'
                || order.fulfillment === fulfillmentValue;
            const matchesDate = dateValue === 'all'
                || order.date_value === dateValue;
            const matchesStatus = statusValue === 'all'
                || order.status === statusValue;
            const matchesTab = activeTab === 'all'
                || activeStatuses.includes(order.status);

            return matchesSearch
                && matchesFulfillment
                && matchesDate
                && matchesStatus
                && matchesTab;
        });

        return filteredOrders.sort((firstOrder, secondOrder) => {
            const firstDate = new Date(firstOrder.date_value).getTime();
            const secondDate = new Date(secondOrder.date_value).getTime();

            return sortSelect.value === 'oldest'
                ? firstDate - secondDate
                : secondDate - firstDate;
        });
    };

    const renderOrders = () => {
        const filteredOrders = getFilteredOrders();
        const hasActiveFilters = activeTab !== 'all'
            || searchInput.value.trim() !== ''
            || fulfillmentFilter.value !== 'all'
            || dateFilter.value !== 'all'
            || statusFilter.value !== 'all';
        const displayedTotal = hasActiveFilters
            ? filteredOrders.length
            : Number(summary.total) || filteredOrders.length;

        ordersBody.replaceChildren(
            ...filteredOrders.map(createOrderRow),
        );
        showingLabel.textContent = filteredOrders.length > 0
            ? `1–${filteredOrders.length}`
            : '0';
        totalLabel.textContent = String(displayedTotal);
        setResultsState(filteredOrders.length > 0);
    };

    const clearFilters = () => {
        activeTab = 'all';
        searchInput.value = '';
        fulfillmentFilter.value = 'all';
        dateFilter.value = 'all';
        statusFilter.value = 'all';
        sortSelect.value = 'newest';
        updateActiveTab();
        renderOrders();
    };

    const loadOrders = async () => {
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
                    `Orders request failed with status ${response.status}.`,
                );
            }

            const data = await response.json();

            if (
                !data
                || !data.summary
                || !Array.isArray(data.orders)
            ) {
                throw new Error('Orders response has an invalid structure.');
            }

            summary = data.summary;
            orders = data.orders;
            updateSummary();
            renderOrders();
        } catch (error) {
            console.error('Unable to load Staff Orders.', error);
            setErrorState();
        }
    };

    tabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            activeTab = button.dataset.ordersTab ?? 'all';
            updateActiveTab();
            renderOrders();
        });
    });

    searchInput.addEventListener('input', renderOrders);
    fulfillmentFilter.addEventListener('change', renderOrders);
    dateFilter.addEventListener('change', renderOrders);
    statusFilter.addEventListener('change', renderOrders);
    sortSelect.addEventListener('change', renderOrders);
    clearButton.addEventListener('click', clearFilters);
    retryButton.addEventListener('click', loadOrders);

    loadOrders();
};

if (document.readyState === 'loading') {
    document.addEventListener(
        'DOMContentLoaded',
        initializeStaffOrders,
    );
} else {
    initializeStaffOrders();
}
