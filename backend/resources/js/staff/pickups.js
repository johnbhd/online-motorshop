const pickupStatusClasses = {
    Preparing: ['bg-blue-50', 'text-blue-700', 'ring-blue-200'],
    'Ready for Pickup': ['bg-emerald-50', 'text-emerald-700', 'ring-emerald-200'],
    Completed: ['bg-green-50', 'text-green-700', 'ring-green-200'],
    Cancelled: ['bg-red-50', 'text-red-700', 'ring-red-200'],
};

const pickupTabStatuses = {
    preparing: ['Preparing'],
    ready_for_pickup: ['Ready for Pickup'],
    completed: ['Completed'],
    cancelled: ['Cancelled'],
};

const createElement = (tagName, className, text) => {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (text !== undefined && text !== null) {
        element.textContent = String(text);
    }

    return element;
};

const createPickupStatusBadge = (status) => {
    const badge = createElement(
        'span',
        'inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        status,
    );

    badge.classList.add(
        ...(pickupStatusClasses[status] ?? ['bg-slate-100', 'text-slate-700', 'ring-slate-200']),
    );

    return badge;
};

const initializeStaffPickups = () => {
    const page = document.querySelector('[data-staff-pickups]');

    if (!page) {
        return;
    }

    const endpoint = page.dataset.pickupsEndpoint;
    const pickupsPanel = page.querySelector('[data-pickups-panel]');
    const loadingState = page.querySelector('[data-pickups-loading]');
    const contentState = page.querySelector('[data-pickups-content]');
    const emptyState = page.querySelector('[data-pickups-empty]');
    const errorState = page.querySelector('[data-pickups-error]');
    const retryButton = page.querySelector('[data-pickups-retry]');
    const pickupsBody = page.querySelector('[data-pickups-body]');
    const searchInput = page.querySelector('[data-pickups-search]');
    const branchFilter = page.querySelector('[data-pickups-branch]');
    const statusFilter = page.querySelector('[data-pickups-status]');
    const dateFilter = page.querySelector('[data-pickups-date]');
    const sortSelect = page.querySelector('[data-pickups-sort]');
    const clearButton = page.querySelector('[data-pickups-clear]');
    const showingLabel = page.querySelector('[data-pickups-showing]');
    const totalLabel = page.querySelector('[data-pickups-total]');
    const panelTotalLabel = page.querySelector('[data-pickups-total-label]');
    const activeCount = page.querySelector('[data-pickups-active-count]');
    const tabButtons = [...page.querySelectorAll('[data-pickups-tab]')];

    if (
        !endpoint
        || !pickupsPanel
        || !loadingState
        || !contentState
        || !emptyState
        || !errorState
        || !retryButton
        || !pickupsBody
        || !searchInput
        || !branchFilter
        || !statusFilter
        || !dateFilter
        || !sortSelect
        || !clearButton
        || !showingLabel
        || !totalLabel
        || !panelTotalLabel
        || !activeCount
    ) {
        return;
    }

    let pickupRequests = [];
    let summary = {};
    let activeTab = 'all';

    const setLoadingState = () => {
        pickupsPanel.setAttribute('aria-busy', 'true');
        loadingState.classList.remove('hidden');
        contentState.classList.add('hidden');
        emptyState.classList.add('hidden');
        errorState.classList.add('hidden');
        retryButton.disabled = true;
    };

    const setResultsState = (hasResults) => {
        pickupsPanel.setAttribute('aria-busy', 'false');
        loadingState.classList.add('hidden');
        errorState.classList.add('hidden');
        contentState.classList.toggle('hidden', !hasResults);
        emptyState.classList.toggle('hidden', hasResults);
        retryButton.disabled = false;
    };

    const setErrorState = () => {
        pickupsPanel.setAttribute('aria-busy', 'false');
        loadingState.classList.add('hidden');
        contentState.classList.add('hidden');
        emptyState.classList.add('hidden');
        errorState.classList.remove('hidden');
        retryButton.disabled = false;
    };

    const updateSummary = () => {
        page.querySelectorAll('[data-pickups-summary]').forEach((target) => {
            const value = Number(summary[target.dataset.pickupsSummary]);

            if (Number.isFinite(value)) {
                target.textContent = String(value);
            }
        });

        const total = Number(summary.total) || pickupRequests.length;

        panelTotalLabel.textContent = String(total);
        activeCount.textContent = String(Number(summary.active) || 0);
    };

    const updateActiveTab = () => {
        tabButtons.forEach((button) => {
            const isActive = button.dataset.pickupsTab === activeTab;

            button.classList.toggle('border-orange-500', isActive);
            button.classList.toggle('text-[#0B1930]', isActive);
            button.classList.toggle('border-transparent', !isActive);
            button.classList.toggle('text-slate-500', !isActive);
            button.setAttribute('aria-selected', String(isActive));
        });
    };

    const createPickupRow = (pickup) => {
        const row = createElement('tr', 'transition hover:bg-slate-50/80');
        const cells = [
            createElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-[#0B1930]', pickup.order_reference ?? ''),
            createElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm font-medium text-slate-700', pickup.customer ?? ''),
            createElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600', pickup.branch ?? ''),
            createElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-[#0B1930]', pickup.amount ?? ''),
            createElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600', pickup.payment ?? ''),
            createElement('td', 'whitespace-nowrap px-5 py-3.5'),
            createElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-500', pickup.updated ?? ''),
            createElement('td', 'whitespace-nowrap px-5 py-3.5'),
        ];

        cells[5].append(createPickupStatusBadge(pickup.pickup_status ?? ''));

        const actionButton = createElement(
            'button',
            'inline-flex min-h-8 cursor-pointer items-center justify-center rounded-lg border border-orange-400 px-3 text-xs font-semibold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
            'View Pickup',
        );
        actionButton.type = 'button';
        actionButton.dataset.pickupId = String(pickup.id ?? '');
        actionButton.setAttribute(
            'aria-label',
            `View pickup ${pickup.order_reference ?? ''}`,
        );
        cells[7].append(actionButton);

        row.append(...cells);

        return row;
    };

    const getFilteredPickups = () => {
        const searchValue = searchInput.value.trim().toLowerCase();
        const activeStatuses = pickupTabStatuses[activeTab] ?? [];

        return pickupRequests.filter((pickup) => {
            const matchesSearch = !searchValue
                || String(pickup.order_reference ?? '').toLowerCase().includes(searchValue)
                || String(pickup.customer ?? '').toLowerCase().includes(searchValue);
            const matchesBranch = branchFilter.value === 'all'
                || pickup.branch === branchFilter.value;
            const matchesStatus = statusFilter.value === 'all'
                || pickup.pickup_status === statusFilter.value;
            const matchesDate = dateFilter.value === 'all'
                || String(pickup.date_value ?? '').startsWith(dateFilter.value);
            const matchesTab = activeTab === 'all'
                || activeStatuses.includes(pickup.pickup_status);

            return matchesSearch
                && matchesBranch
                && matchesStatus
                && matchesDate
                && matchesTab;
        }).sort((firstPickup, secondPickup) => {
            const firstDate = new Date(firstPickup.date_value ?? 0).getTime();
            const secondDate = new Date(secondPickup.date_value ?? 0).getTime();

            return sortSelect.value === 'oldest'
                ? firstDate - secondDate
                : secondDate - firstDate;
        });
    };

    const renderPickups = () => {
        const filteredPickups = getFilteredPickups();
        const hasActiveFilters = activeTab !== 'all'
            || searchInput.value.trim() !== ''
            || branchFilter.value !== 'all'
            || statusFilter.value !== 'all'
            || dateFilter.value !== 'all';
        const displayedTotal = hasActiveFilters
            ? filteredPickups.length
            : Number(summary.total) || filteredPickups.length;

        pickupsBody.replaceChildren(...filteredPickups.map(createPickupRow));
        showingLabel.textContent = filteredPickups.length > 0
            ? `1–${filteredPickups.length}`
            : '0';
        totalLabel.textContent = String(displayedTotal);
        setResultsState(filteredPickups.length > 0);
    };

    const clearFilters = () => {
        activeTab = 'all';
        searchInput.value = '';
        branchFilter.value = 'all';
        statusFilter.value = 'all';
        dateFilter.value = 'all';
        sortSelect.value = 'newest';
        updateActiveTab();
        renderPickups();
    };

    const loadPickups = async () => {
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
                throw new Error(`Pickup requests failed with status ${response.status}.`);
            }

            const data = await response.json();

            if (!data || !data.summary || !Array.isArray(data.pickup_requests)) {
                throw new Error('Pickup requests response has an invalid structure.');
            }

            summary = data.summary;
            pickupRequests = data.pickup_requests;
            updateSummary();
            renderPickups();
        } catch (error) {
            console.error('Unable to load Staff Pickup Requests.', error);
            setErrorState();
        }
    };

    tabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            activeTab = button.dataset.pickupsTab ?? 'all';
            updateActiveTab();
            renderPickups();
        });
    });

    searchInput.addEventListener('input', renderPickups);
    branchFilter.addEventListener('change', renderPickups);
    statusFilter.addEventListener('change', renderPickups);
    dateFilter.addEventListener('change', renderPickups);
    sortSelect.addEventListener('change', renderPickups);
    clearButton.addEventListener('click', clearFilters);
    retryButton.addEventListener('click', loadPickups);

    loadPickups();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStaffPickups);
} else {
    initializeStaffPickups();
}
