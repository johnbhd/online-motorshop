const customerTypeClasses = {
    Registered: ['bg-blue-50', 'text-blue-700', 'ring-blue-200'],
    Guest: ['bg-slate-100', 'text-slate-600', 'ring-slate-200'],
};

const createCustomerElement = (tagName, className, text) => {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (text !== undefined && text !== null) {
        element.textContent = String(text);
    }

    return element;
};

const initializeStaffCustomers = () => {
    const page = document.querySelector('[data-staff-customers]');

    if (!page) {
        return;
    }

    const endpoint = page.dataset.customersEndpoint;
    const summaryLoading = page.querySelector('[data-customers-summary-loading]');
    const summaryContent = page.querySelector('[data-customers-summary-content]');
    const panel = page.querySelector('[data-customers-panel]');
    const loading = page.querySelector('[data-customers-loading]');
    const content = page.querySelector('[data-customers-content]');
    const empty = page.querySelector('[data-customers-empty]');
    const error = page.querySelector('[data-customers-error]');
    const retry = page.querySelector('[data-customers-retry]');
    const body = page.querySelector('[data-customers-body]');
    const search = page.querySelector('[data-customers-search]');
    const type = page.querySelector('[data-customers-type]');
    const branch = page.querySelector('[data-customers-branch]');
    const activity = page.querySelector('[data-customers-activity]');
    const sort = page.querySelector('[data-customers-sort]');
    const clear = page.querySelector('[data-customers-clear]');
    const showing = page.querySelector('[data-customers-showing]');
    const total = page.querySelector('[data-customers-total]');
    const panelTotal = page.querySelector('[data-customers-panel-total]');
    const headerTotal = page.querySelector('[data-customers-header-total]');
    const tabs = [...page.querySelectorAll('[data-customers-tab]')];

    if (!endpoint || !summaryLoading || !summaryContent || !panel || !loading || !content || !empty || !error || !retry || !body || !search || !type || !branch || !activity || !sort || !clear || !showing || !total || !panelTotal || !headerTotal) {
        return;
    }

    let customers = [];
    let summary = {};
    let activeTab = 'all';

    const setLoading = () => {
        panel.setAttribute('aria-busy', 'true');
        summaryLoading.classList.remove('hidden');
        summaryContent.classList.add('hidden');
        loading.classList.remove('hidden');
        content.classList.add('hidden');
        empty.classList.add('hidden');
        error.classList.add('hidden');
        retry.disabled = true;
    };

    const setResults = (hasResults) => {
        panel.setAttribute('aria-busy', 'false');
        summaryLoading.classList.add('hidden');
        summaryContent.classList.remove('hidden');
        loading.classList.add('hidden');
        content.classList.toggle('hidden', !hasResults);
        empty.classList.toggle('hidden', hasResults);
        error.classList.add('hidden');
        retry.disabled = false;
    };

    const setError = () => {
        panel.setAttribute('aria-busy', 'false');
        summaryLoading.classList.add('hidden');
        summaryContent.classList.add('hidden');
        loading.classList.add('hidden');
        content.classList.add('hidden');
        empty.classList.add('hidden');
        error.classList.remove('hidden');
        retry.disabled = false;
    };

    const updateSummary = () => {
        page.querySelectorAll('[data-customers-summary]').forEach((target) => {
            const value = Number(summary[target.dataset.customersSummary]);

            target.textContent = Number.isFinite(value) ? String(value) : '0';
        });
        page.querySelectorAll('[data-customers-tab-count]').forEach((target) => {
            const value = Number(summary[target.dataset.customersTabCount]);

            target.textContent = Number.isFinite(value) ? String(value) : '0';
        });

        const customerTotal = Number(summary.total) || customers.length;
        panelTotal.textContent = String(customerTotal);
        headerTotal.textContent = String(customerTotal);
    };

    const updateActiveTab = () => {
        tabs.forEach((tab) => {
            const isActive = tab.dataset.customersTab === activeTab;

            tab.classList.toggle('border-orange-500', isActive);
            tab.classList.toggle('text-[#0B1930]', isActive);
            tab.classList.toggle('border-transparent', !isActive);
            tab.classList.toggle('text-slate-500', !isActive);
            tab.setAttribute('aria-selected', String(isActive));
        });
    };

    const createTypeBadge = (customerType) => {
        const badge = createCustomerElement('span', 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', customerType);
        const icon = createCustomerElement('i', customerType === 'Registered' ? 'fa-solid fa-user-check text-[10px]' : 'fa-regular fa-user text-[10px]');

        icon.setAttribute('aria-hidden', 'true');
        badge.classList.add(...(customerTypeClasses[customerType] ?? customerTypeClasses.Guest));
        badge.prepend(icon);

        return badge;
    };

    const createCustomerRow = (customer) => {
        const row = createCustomerElement('tr', 'transition hover:bg-slate-50/80');
        const customerCell = createCustomerElement('td', 'min-w-52 px-5 py-3.5');
        const customerWrap = createCustomerElement('div', 'flex items-center gap-3');
        const avatar = createCustomerElement('span', 'inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#0B1930] text-xs font-bold text-white', customer.initials ?? '');
        const cells = [
            customerCell,
            createCustomerElement('td', 'whitespace-nowrap px-5 py-3.5'),
            createCustomerElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600', customer.contact ?? ''),
            createCustomerElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600', customer.email ?? ''),
            createCustomerElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600', customer.branch ?? ''),
            createCustomerElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-[#0B1930]', customer.orders ?? 0),
            createCustomerElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm font-semibold', customer.active_orders ?? 0),
            createCustomerElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-500', customer.last_order ?? ''),
            createCustomerElement('td', 'whitespace-nowrap px-5 py-3.5'),
        ];
        const customerName = createCustomerElement('span', 'font-semibold text-[#0B1930]', customer.name ?? '');
        const action = createCustomerElement('button', 'inline-flex min-h-8 cursor-pointer items-center justify-center rounded-lg border border-orange-400 px-3 text-xs font-semibold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500', 'View Customer');

        customerWrap.append(avatar, customerName);
        customerCell.append(customerWrap);
        cells[1].append(createTypeBadge(customer.type ?? 'Guest'));
        cells[6].classList.add(Number(customer.active_orders) > 0 ? 'text-orange-600' : 'text-slate-500');
        action.type = 'button';
        action.dataset.customerId = String(customer.id ?? '');
        action.setAttribute('aria-label', `View customer ${customer.name ?? ''}`);
        cells[8].append(action);
        row.append(...cells);

        return row;
    };

    const getFilteredCustomers = () => {
        const searchValue = search.value.trim().toLowerCase();

        return customers.filter((customer) => {
            const matchesSearch = !searchValue
                || String(customer.name ?? '').toLowerCase().includes(searchValue)
                || String(customer.email ?? '').toLowerCase().includes(searchValue)
                || String(customer.contact ?? '').toLowerCase().includes(searchValue);
            const matchesType = type.value === 'all' || customer.type === type.value;
            const matchesBranch = branch.value === 'all' || customer.branch === branch.value;
            const matchesActivity = activity.value === 'all'
                || (activity.value === 'active' && Number(customer.active_orders) > 0)
                || (activity.value === 'completed' && Number(customer.orders) > 0 && Number(customer.active_orders) === 0)
                || (activity.value === 'cancelled' && false)
                || (activity.value === 'none' && Number(customer.orders) === 0);
            const matchesTab = activeTab === 'all'
                || (activeTab === 'registered' && customer.type === 'Registered')
                || (activeTab === 'guest' && customer.type === 'Guest')
                || (activeTab === 'active' && Number(customer.active_orders) > 0);

            return matchesSearch && matchesType && matchesBranch && matchesActivity && matchesTab;
        }).sort((firstCustomer, secondCustomer) => {
            if (sort.value === 'name') {
                return String(firstCustomer.name ?? '').localeCompare(String(secondCustomer.name ?? ''));
            }

            return new Date(secondCustomer.date_value ?? 0).getTime() - new Date(firstCustomer.date_value ?? 0).getTime();
        });
    };

    const renderCustomers = () => {
        const filteredCustomers = getFilteredCustomers();
        const hasFilters = activeTab !== 'all' || search.value.trim() !== '' || type.value !== 'all' || branch.value !== 'all' || activity.value !== 'all';

        body.replaceChildren(...filteredCustomers.map(createCustomerRow));
        showing.textContent = filteredCustomers.length > 0 ? `1–${filteredCustomers.length}` : '0';
        total.textContent = String(hasFilters ? filteredCustomers.length : (Number(summary.total) || filteredCustomers.length));
        setResults(filteredCustomers.length > 0);
    };

    const clearFilters = () => {
        activeTab = 'all';
        search.value = '';
        type.value = 'all';
        branch.value = 'all';
        activity.value = 'all';
        sort.value = 'newest';
        updateActiveTab();
        renderCustomers();
    };

    const loadCustomers = async () => {
        setLoading();

        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                credentials: 'same-origin',
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });

            if (!response.ok) {
                throw new Error(`Customers request failed with status ${response.status}.`);
            }

            const data = await response.json();

            if (!data || !data.summary || !Array.isArray(data.customers)) {
                throw new Error('Customers response has an invalid structure.');
            }

            summary = data.summary;
            customers = data.customers;
            updateSummary();
            renderCustomers();
        } catch (loadError) {
            console.error('Unable to load Staff Customers.', loadError);
            setError();
        }
    };

    tabs.forEach((tab) => tab.addEventListener('click', () => {
        activeTab = tab.dataset.customersTab ?? 'all';
        updateActiveTab();
        renderCustomers();
    }));
    search.addEventListener('input', renderCustomers);
    type.addEventListener('change', renderCustomers);
    branch.addEventListener('change', renderCustomers);
    activity.addEventListener('change', renderCustomers);
    sort.addEventListener('change', renderCustomers);
    clear.addEventListener('click', clearFilters);
    retry.addEventListener('click', loadCustomers);

    loadCustomers();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStaffCustomers);
} else {
    initializeStaffCustomers();
}
