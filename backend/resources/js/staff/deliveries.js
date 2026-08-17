const deliveryStatusClasses = {
    'Waiting for Booking': ['bg-orange-50', 'text-orange-700', 'ring-orange-200'],
    Booked: ['bg-blue-50', 'text-blue-700', 'ring-blue-200'],
    'Picked Up': ['bg-blue-100', 'text-blue-800', 'ring-blue-200'],
    'In Transit': ['bg-orange-50', 'text-orange-700', 'ring-orange-200'],
    Delivered: ['bg-emerald-50', 'text-emerald-700', 'ring-emerald-200'],
    Failed: ['bg-red-50', 'text-red-700', 'ring-red-200'],
    Cancelled: ['bg-slate-100', 'text-slate-600', 'ring-slate-200'],
};

const deliveryTabStatuses = {
    waiting_for_booking: ['Waiting for Booking'],
    booked: ['Booked'],
    picked_up: ['Picked Up'],
    in_transit: ['In Transit'],
    delivered: ['Delivered'],
    failed: ['Failed'],
    cancelled: ['Cancelled'],
};

const createDeliveryElement = (tagName, className, text) => {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (text !== undefined && text !== null) {
        element.textContent = String(text);
    }

    return element;
};

const initializeStaffDeliveries = () => {
    const page = document.querySelector('[data-staff-deliveries]');

    if (!page) {
        return;
    }

    const endpoint = page.dataset.deliveriesEndpoint;
    const panel = page.querySelector('[data-deliveries-panel]');
    const loadingState = page.querySelector('[data-deliveries-loading]');
    const contentState = page.querySelector('[data-deliveries-content]');
    const emptyState = page.querySelector('[data-deliveries-empty]');
    const errorState = page.querySelector('[data-deliveries-error]');
    const retryButton = page.querySelector('[data-deliveries-retry]');
    const body = page.querySelector('[data-deliveries-body]');
    const searchInput = page.querySelector('[data-deliveries-search]');
    const statusFilter = page.querySelector('[data-deliveries-status]');
    const branchFilter = page.querySelector('[data-deliveries-branch]');
    const dateFilter = page.querySelector('[data-deliveries-date]');
    const sortSelect = page.querySelector('[data-deliveries-sort]');
    const clearButton = page.querySelector('[data-deliveries-clear]');
    const showingLabel = page.querySelector('[data-deliveries-showing]');
    const totalLabel = page.querySelector('[data-deliveries-total]');
    const panelTotalLabel = page.querySelector('[data-deliveries-total-label]');
    const activeCount = page.querySelector('[data-deliveries-active-count]');
    const tabButtons = [...page.querySelectorAll('[data-deliveries-tab]')];

    if (!endpoint || !panel || !loadingState || !contentState || !emptyState || !errorState || !retryButton || !body || !searchInput || !statusFilter || !branchFilter || !dateFilter || !sortSelect || !clearButton || !showingLabel || !totalLabel || !panelTotalLabel || !activeCount) {
        return;
    }

    let deliveries = [];
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
        contentState.classList.toggle('hidden', !hasResults);
        emptyState.classList.toggle('hidden', hasResults);
        errorState.classList.add('hidden');
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
        page.querySelectorAll('[data-deliveries-summary]').forEach((target) => {
            const value = Number(summary[target.dataset.deliveriesSummary]);

            if (Number.isFinite(value)) {
                target.textContent = String(value);
            }
        });

        panelTotalLabel.textContent = String(Number(summary.total) || deliveries.length);
        activeCount.textContent = String(Number(summary.active) || 0);
    };

    const updateActiveTab = () => {
        tabButtons.forEach((button) => {
            const isActive = button.dataset.deliveriesTab === activeTab;

            button.classList.toggle('border-orange-500', isActive);
            button.classList.toggle('text-[#0B1930]', isActive);
            button.classList.toggle('border-transparent', !isActive);
            button.classList.toggle('text-slate-500', !isActive);
            button.setAttribute('aria-selected', String(isActive));
        });
    };

    const createStatusBadge = (status) => {
        const badge = createDeliveryElement('span', 'inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', status);
        badge.classList.add(...(deliveryStatusClasses[status] ?? ['bg-slate-100', 'text-slate-700', 'ring-slate-200']));

        return badge;
    };

    const createDeliveryRow = (delivery) => {
        const row = createDeliveryElement('tr', 'transition hover:bg-slate-50/80');
        const cells = [
            createDeliveryElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-[#0B1930]', delivery.order_reference ?? ''),
            createDeliveryElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm font-medium text-slate-700', delivery.customer ?? ''),
            createDeliveryElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600', delivery.destination ?? ''),
            createDeliveryElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-[#0B1930]', delivery.amount ?? ''),
            createDeliveryElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600', delivery.payment ?? ''),
            createDeliveryElement('td', 'whitespace-nowrap px-5 py-3.5'),
            createDeliveryElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-500', delivery.updated ?? ''),
            createDeliveryElement('td', 'whitespace-nowrap px-5 py-3.5'),
        ];
        const actionButton = createDeliveryElement('button', 'inline-flex min-h-8 cursor-pointer items-center justify-center rounded-lg border border-orange-400 px-3 text-xs font-semibold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500', delivery.action ?? 'View Delivery');

        cells[5].append(createStatusBadge(delivery.delivery_status ?? ''));
        actionButton.type = 'button';
        actionButton.dataset.deliveryId = String(delivery.id ?? '');
        actionButton.setAttribute('aria-label', `${delivery.action ?? 'View Delivery'} ${delivery.order_reference ?? ''}`);
        cells[7].append(actionButton);
        row.append(...cells);

        return row;
    };

    const getFilteredDeliveries = () => {
        const searchValue = searchInput.value.trim().toLowerCase();
        const tabStatuses = deliveryTabStatuses[activeTab] ?? [];

        return deliveries.filter((delivery) => {
            const matchesSearch = !searchValue || String(delivery.order_reference ?? '').toLowerCase().includes(searchValue) || String(delivery.customer ?? '').toLowerCase().includes(searchValue);
            const matchesStatus = statusFilter.value === 'all' || delivery.delivery_status === statusFilter.value;
            const matchesBranch = branchFilter.value === 'all' || delivery.branch === branchFilter.value;
            const matchesDate = dateFilter.value === 'all' || String(delivery.date_value ?? '').startsWith(dateFilter.value);
            const matchesTab = activeTab === 'all' || tabStatuses.includes(delivery.delivery_status);

            return matchesSearch && matchesStatus && matchesBranch && matchesDate && matchesTab;
        }).sort((firstDelivery, secondDelivery) => {
            const firstDate = new Date(firstDelivery.date_value ?? 0).getTime();
            const secondDate = new Date(secondDelivery.date_value ?? 0).getTime();

            return sortSelect.value === 'oldest' ? firstDate - secondDate : secondDate - firstDate;
        });
    };

    const renderDeliveries = () => {
        const filteredDeliveries = getFilteredDeliveries();
        const hasActiveFilters = activeTab !== 'all' || searchInput.value.trim() !== '' || statusFilter.value !== 'all' || branchFilter.value !== 'all' || dateFilter.value !== 'all';

        body.replaceChildren(...filteredDeliveries.map(createDeliveryRow));
        showingLabel.textContent = filteredDeliveries.length > 0 ? `1–${filteredDeliveries.length}` : '0';
        totalLabel.textContent = String(hasActiveFilters ? filteredDeliveries.length : (Number(summary.total) || filteredDeliveries.length));
        setResultsState(filteredDeliveries.length > 0);
    };

    const clearFilters = () => {
        activeTab = 'all';
        searchInput.value = '';
        statusFilter.value = 'all';
        branchFilter.value = 'all';
        dateFilter.value = 'all';
        sortSelect.value = 'newest';
        updateActiveTab();
        renderDeliveries();
    };

    const loadDeliveries = async () => {
        setLoadingState();

        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                credentials: 'same-origin',
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });

            if (!response.ok) {
                throw new Error(`Delivery requests failed with status ${response.status}.`);
            }

            const data = await response.json();

            if (!data || !data.summary || !Array.isArray(data.delivery_requests)) {
                throw new Error('Delivery requests response has an invalid structure.');
            }

            summary = data.summary;
            deliveries = data.delivery_requests;
            updateSummary();
            renderDeliveries();
        } catch (error) {
            console.error('Unable to load Staff Delivery Requests.', error);
            setErrorState();
        }
    };

    tabButtons.forEach((button) => button.addEventListener('click', () => {
        activeTab = button.dataset.deliveriesTab ?? 'all';
        updateActiveTab();
        renderDeliveries();
    }));
    searchInput.addEventListener('input', renderDeliveries);
    statusFilter.addEventListener('change', renderDeliveries);
    branchFilter.addEventListener('change', renderDeliveries);
    dateFilter.addEventListener('change', renderDeliveries);
    sortSelect.addEventListener('change', renderDeliveries);
    clearButton.addEventListener('click', clearFilters);
    retryButton.addEventListener('click', loadDeliveries);

    loadDeliveries();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStaffDeliveries);
} else {
    initializeStaffDeliveries();
}
