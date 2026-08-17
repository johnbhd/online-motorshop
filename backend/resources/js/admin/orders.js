const adminOrderStatusClasses = {
    Pending: ['bg-orange-50', 'text-orange-700', 'ring-orange-200'],
    'Under Review': ['bg-blue-50', 'text-blue-700', 'ring-blue-200'],
    Confirmed: ['bg-emerald-50', 'text-emerald-700', 'ring-emerald-200'],
    Preparing: ['bg-blue-50', 'text-blue-700', 'ring-blue-200'],
    'Ready for Pickup': ['bg-emerald-50', 'text-emerald-700', 'ring-emerald-200'],
    'Waiting for Booking': ['bg-violet-50', 'text-violet-700', 'ring-violet-200'],
    'In Transit': ['bg-blue-50', 'text-blue-700', 'ring-blue-200'],
    Completed: ['bg-emerald-50', 'text-emerald-700', 'ring-emerald-200'],
    Cancelled: ['bg-slate-100', 'text-slate-600', 'ring-slate-200'],
};

const statusByOrderTab = {
    all: null,
    pending: 'Pending',
    under_review: 'Under Review',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready_for_pickup: 'Ready for Pickup',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

const createAdminOrderElement = (tagName, className = '', text = null) => {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (text !== null) {
        element.textContent = String(text);
    }

    return element;
};

const initializeAdminOrders = () => {
    const page = document.querySelector('[data-admin-orders]');

    if (!page) {
        return;
    }

    const endpoint = page.dataset.adminOrdersEndpoint;
    const panel = page.querySelector('[data-admin-orders-panel]');
    const loading = page.querySelector('[data-admin-orders-loading]');
    const content = page.querySelector('[data-admin-orders-content]');
    const empty = page.querySelector('[data-admin-orders-empty]');
    const error = page.querySelector('[data-admin-orders-error]');
    const retry = page.querySelector('[data-admin-orders-retry]');
    const body = page.querySelector('[data-admin-orders-body]');
    const search = page.querySelector('[data-admin-orders-search]');
    const branch = page.querySelector('[data-admin-orders-branch]');
    const fulfillment = page.querySelector('[data-admin-orders-fulfillment]');
    const assignedStaff = page.querySelector('[data-admin-orders-staff]');
    const status = page.querySelector('[data-admin-orders-status]');
    const date = page.querySelector('[data-admin-orders-date]');
    const sort = page.querySelector('[data-admin-orders-sort]');
    const clear = page.querySelector('[data-admin-orders-clear]');
    const attention = page.querySelector('[data-admin-orders-attention]');
    const totalLabel = page.querySelector('[data-admin-orders-total-label]');
    const showing = page.querySelector('[data-admin-orders-showing]');
    const total = page.querySelector('[data-admin-orders-total]');
    const tabs = [...page.querySelectorAll('[data-admin-orders-tab]')];

    if (!endpoint || !panel || !loading || !content || !empty || !error || !retry || !body || !search || !branch || !fulfillment || !assignedStaff || !status || !date || !sort || !clear || !attention || !totalLabel || !showing || !total) {
        return;
    }

    let orders = [];
    let summary = {};
    let activeTab = 'all';

    const setLoading = () => {
        page.setAttribute('aria-busy', 'true');
        panel.setAttribute('aria-busy', 'true');
        loading.classList.remove('hidden');
        content.classList.add('hidden');
        empty.classList.add('hidden');
        error.classList.add('hidden');
        retry.disabled = true;
    };

    const setResults = (hasResults) => {
        page.setAttribute('aria-busy', 'false');
        panel.setAttribute('aria-busy', 'false');
        loading.classList.add('hidden');
        content.classList.toggle('hidden', !hasResults);
        empty.classList.toggle('hidden', hasResults);
        error.classList.add('hidden');
        retry.disabled = false;
    };

    const setError = () => {
        page.setAttribute('aria-busy', 'false');
        panel.setAttribute('aria-busy', 'false');
        loading.classList.add('hidden');
        content.classList.add('hidden');
        empty.classList.add('hidden');
        error.classList.remove('hidden');
        retry.disabled = false;
    };

    const updateSummary = () => {
        page.querySelectorAll('[data-admin-orders-tab-count]').forEach((target) => {
            const value = Number(summary[target.dataset.adminOrdersTabCount]);

            target.textContent = Number.isFinite(value) ? String(value) : '0';
        });

        attention.textContent = String(Number(summary.pending) || 0);
        totalLabel.textContent = String(Number(summary.total) || orders.length);
    };

    const updateTabs = () => {
        tabs.forEach((tab) => {
            const isActive = tab.dataset.adminOrdersTab === activeTab;

            tab.classList.toggle('border-orange-500', isActive);
            tab.classList.toggle('text-[#0B1930]', isActive);
            tab.classList.toggle('border-transparent', !isActive);
            tab.classList.toggle('text-slate-500', !isActive);
            tab.setAttribute('aria-selected', String(isActive));
        });
    };

    const createAssignedStaff = (staffName) => {
        if (staffName === 'Unassigned') {
            const badge = createAdminOrderElement('span', 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 ring-1 ring-inset ring-orange-200');
            const icon = createAdminOrderElement('i', 'fa-regular fa-user text-[10px]');

            icon.setAttribute('aria-hidden', 'true');
            badge.append(icon, document.createTextNode(staffName));

            return badge;
        }

        const assigned = createAdminOrderElement('span', 'inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-slate-700');
        const icon = createAdminOrderElement('i', 'fa-regular fa-user text-xs text-slate-400');

        icon.setAttribute('aria-hidden', 'true');
        assigned.append(icon, document.createTextNode(staffName));

        return assigned;
    };

    const createOrderRow = (order) => {
        const row = createAdminOrderElement('tr', 'transition hover:bg-slate-50/80');
        const cells = [
            createAdminOrderElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-[#0B1930]', order.reference),
            createAdminOrderElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm font-medium text-slate-700', order.customer),
            createAdminOrderElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600', order.branch),
            createAdminOrderElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-[#0B1930]', order.amount),
            createAdminOrderElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600', order.fulfillment),
            createAdminOrderElement('td', 'whitespace-nowrap px-5 py-3.5'),
            createAdminOrderElement('td', 'whitespace-nowrap px-5 py-3.5'),
            createAdminOrderElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-500', order.updated),
            createAdminOrderElement('td', 'whitespace-nowrap px-5 py-3.5'),
        ];
        const statusBadge = createAdminOrderElement('span', 'inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', order.status);
        const action = createAdminOrderElement('button', 'inline-flex min-h-8 cursor-pointer items-center justify-center rounded-lg border border-orange-400 px-3 text-xs font-semibold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500', order.action);

        statusBadge.classList.add(...(adminOrderStatusClasses[order.status] ?? ['bg-slate-100', 'text-slate-600', 'ring-slate-200']));
        action.type = 'button';
        action.dataset.orderId = String(order.id);
        action.setAttribute('aria-label', `${order.action} ${order.reference}`);
        cells[5].append(createAssignedStaff(order.assigned_staff));
        cells[6].append(statusBadge);
        cells[8].append(action);
        row.append(...cells);

        return row;
    };

    const getFilteredOrders = () => {
        const searchValue = search.value.trim().toLowerCase();
        const tabStatus = statusByOrderTab[activeTab];

        return orders.filter((order) => {
            const matchesSearch = !searchValue
                || order.reference.toLowerCase().includes(searchValue)
                || order.customer.toLowerCase().includes(searchValue);
            const matchesBranch = branch.value === 'all' || order.branch === branch.value;
            const matchesFulfillment = fulfillment.value === 'all' || order.fulfillment === fulfillment.value;
            const matchesStaff = assignedStaff.value === 'all' || order.assigned_staff === assignedStaff.value;
            const matchesStatus = status.value === 'all' || order.status === status.value;
            const matchesDate = date.value === 'all' || order.date_value.startsWith(date.value);
            const matchesTab = activeTab === 'delivery'
                ? order.fulfillment === 'Lalamove Delivery'
                : (!tabStatus || order.status === tabStatus);

            return matchesSearch && matchesBranch && matchesFulfillment && matchesStaff && matchesStatus && matchesDate && matchesTab;
        }).sort((firstOrder, secondOrder) => {
            if (sort.value === 'reference') {
                return firstOrder.reference.localeCompare(secondOrder.reference);
            }

            const timeDifference = new Date(secondOrder.date_value).getTime() - new Date(firstOrder.date_value).getTime();

            return sort.value === 'oldest' ? timeDifference * -1 : timeDifference;
        });
    };

    const renderOrders = () => {
        const filteredOrders = getFilteredOrders();
        const hasFilters = activeTab !== 'all'
            || search.value.trim() !== ''
            || branch.value !== 'all'
            || fulfillment.value !== 'all'
            || assignedStaff.value !== 'all'
            || status.value !== 'all'
            || date.value !== 'all';

        body.replaceChildren(...filteredOrders.map(createOrderRow));
        showing.textContent = filteredOrders.length > 0 ? `1–${filteredOrders.length}` : '0';
        total.textContent = String(hasFilters
            ? filteredOrders.length
            : (Number(summary.total) || filteredOrders.length));
        setResults(filteredOrders.length > 0);
    };

    const clearFilters = () => {
        activeTab = 'all';
        search.value = '';
        branch.value = 'all';
        fulfillment.value = 'all';
        assignedStaff.value = 'all';
        status.value = 'all';
        date.value = 'all';
        sort.value = 'newest';
        updateTabs();
        renderOrders();
    };

    const loadOrders = async () => {
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
                throw new Error(`Admin orders request failed with status ${response.status}.`);
            }

            const data = await response.json();

            if (!data?.summary || !Array.isArray(data.orders)) {
                throw new Error('Admin orders response has an invalid structure.');
            }

            summary = data.summary;
            orders = data.orders;
            updateSummary();
            renderOrders();
        } catch (loadError) {
            console.error('Unable to load Admin Orders.', loadError);
            setError();
        }
    };

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            activeTab = tab.dataset.adminOrdersTab ?? 'all';
            updateTabs();
            renderOrders();
        });
    });

    search.addEventListener('input', renderOrders);
    branch.addEventListener('change', renderOrders);
    fulfillment.addEventListener('change', renderOrders);
    assignedStaff.addEventListener('change', renderOrders);
    status.addEventListener('change', renderOrders);
    date.addEventListener('change', renderOrders);
    sort.addEventListener('change', renderOrders);
    clear.addEventListener('click', clearFilters);
    retry.addEventListener('click', loadOrders);

    loadOrders();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminOrders);
} else {
    initializeAdminOrders();
}
