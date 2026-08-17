const customerTypeClasses = {
    Registered: ['bg-blue-50', 'text-blue-700'],
    Guest: ['bg-slate-100', 'text-slate-600'],
};

const customerStatusClasses = {
    Returning: ['bg-emerald-50', 'text-emerald-700'],
    New: ['bg-blue-50', 'text-blue-700'],
};

const createCustomerElement = (tagName, className = '', text = null) => {
    const element = document.createElement(tagName);
    element.className = className;

    if (text !== null) {
        element.textContent = String(text);
    }

    return element;
};

const initializeAdminCustomers = () => {
    const page = document.querySelector('[data-admin-customers]');

    if (!page) {
        return;
    }

    const find = (key) => page.querySelector(`[data-customer-${key}]`);
    const endpoint = page.dataset.adminCustomersEndpoint;
    const body = find('body');
    const search = find('search');
    const branch = find('branch');
    const type = find('type');
    const activity = find('activity');
    const sort = find('sort');
    const clear = find('clear');
    const retry = find('retry');
    const error = find('error');
    const loading = find('loading');
    const content = find('content');
    const empty = find('empty');
    const summaryLoading = find('summary-loading');
    const summaryContent = find('summary-content');
    const tabs = [...page.querySelectorAll('[data-customer-tab]')];
    let customers = [];
    let summary = {};
    let activeTab = 'all';

    if (!endpoint || !body || !search || !branch || !type || !activity || !sort || !clear || !retry || !error || !loading || !content || !empty || !summaryLoading || !summaryContent) {
        return;
    }

    const setListState = (state) => {
        const isLoading = state === 'loading';

        page.setAttribute('aria-busy', String(isLoading));
        loading.classList.toggle('hidden', !isLoading);
        content.classList.toggle('hidden', state !== 'content');
        empty.classList.toggle('hidden', state !== 'empty');
        error.classList.toggle('hidden', state !== 'error');
    };

    const updateTabs = () => {
        tabs.forEach((tab) => {
            const isActive = tab.dataset.customerTab === activeTab;

            tab.classList.toggle('border-orange-500', isActive);
            tab.classList.toggle('text-[#0B1930]', isActive);
            tab.classList.toggle('border-transparent', !isActive);
            tab.classList.toggle('text-slate-500', !isActive);
            tab.setAttribute('aria-selected', String(isActive));
        });
    };

    const createBadge = (label, classMap) => {
        const badge = createCustomerElement(
            'span',
            'inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold',
            label,
        );

        badge.classList.add(...(classMap[label] ?? ['bg-slate-100', 'text-slate-600']));

        return badge;
    };

    const createCustomerRow = (customer) => {
        const row = createCustomerElement('tr', 'transition hover:bg-slate-50/80');
        const customerCell = createCustomerElement('td', 'whitespace-nowrap px-5 py-3.5');
        const customerIdentity = createCustomerElement('div', 'flex items-center gap-3');
        const avatar = createCustomerElement(
            'span',
            'inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-200',
            customer.initials,
        );
        const name = createCustomerElement(
            'span',
            'font-semibold text-[#0B1930]',
            customer.name,
        );

        customerIdentity.append(avatar, name);
        customerCell.append(customerIdentity);

        const typeCell = createCustomerElement('td', 'whitespace-nowrap px-5 py-3.5');
        typeCell.append(createBadge(customer.type, customerTypeClasses));

        const contactCell = createCustomerElement(
            'td',
            'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600',
            customer.contact,
        );
        const locationCell = createCustomerElement(
            'td',
            'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600',
            customer.location,
        );
        const ordersCell = createCustomerElement(
            'td',
            'whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-[#0B1930]',
            customer.orders,
        );
        const totalCell = createCustomerElement(
            'td',
            'whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-[#0B1930]',
            customer.total_ordered,
        );
        const lastOrderCell = createCustomerElement(
            'td',
            'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600',
            customer.last_order,
        );
        const statusCell = createCustomerElement('td', 'whitespace-nowrap px-5 py-3.5');
        const actionCell = createCustomerElement('td', 'whitespace-nowrap px-5 py-3.5');
        const action = createCustomerElement(
            'button',
            'inline-flex min-h-8 cursor-pointer items-center justify-center rounded-lg border border-orange-400 px-3 text-xs font-semibold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
            'View',
        );

        action.type = 'button';
        action.dataset.customerId = String(customer.id);
        action.setAttribute('aria-label', `View ${customer.name}`);
        statusCell.append(createBadge(customer.status, customerStatusClasses));
        actionCell.append(action);
        row.append(
            customerCell,
            typeCell,
            contactCell,
            locationCell,
            ordersCell,
            totalCell,
            lastOrderCell,
            statusCell,
            actionCell,
        );

        return row;
    };

    const filterCustomers = () => {
        const term = search.value.trim().toLowerCase();

        return customers
            .filter((customer) => (
                (activeTab === 'all'
                    || customer.type === activeTab
                    || customer.status === activeTab)
                && (!term
                    || customer.name.toLowerCase().includes(term)
                    || customer.contact.toLowerCase().includes(term)
                    || customer.email.toLowerCase().includes(term))
                && (branch.value === 'all' || customer.branch === branch.value)
                && (type.value === 'all' || customer.type === type.value)
                && (activity.value === 'all'
                    || customer.status === activity.value
                    || (activity.value === 'active-orders' && customer.active_orders > 0)
                    || (activity.value === 'no-recent-orders' && customer.last_order_date < '2026-08-06'))
            ))
            .sort((firstCustomer, secondCustomer) => {
                if (sort.value === 'oldest') {
                    return firstCustomer.last_order_date.localeCompare(secondCustomer.last_order_date);
                }

                if (sort.value === 'name') {
                    return firstCustomer.name.localeCompare(secondCustomer.name);
                }

                if (sort.value === 'orders') {
                    return secondCustomer.orders - firstCustomer.orders;
                }

                return secondCustomer.last_order_date.localeCompare(firstCustomer.last_order_date);
            });
    };

    const renderCustomers = () => {
        const visibleCustomers = filterCustomers();
        const filtersAreActive = activeTab !== 'all'
            || search.value.trim() !== ''
            || branch.value !== 'all'
            || type.value !== 'all'
            || activity.value !== 'all';
        const total = filtersAreActive ? visibleCustomers.length : (summary.total ?? customers.length);

        body.replaceChildren(...visibleCustomers.map(createCustomerRow));
        find('showing').textContent = visibleCustomers.length
            ? `1–${visibleCustomers.length}`
            : '0';
        find('total').textContent = String(total);
        find('total-label').textContent = String(total);
        setListState(visibleCustomers.length > 0 ? 'content' : 'empty');
    };

    const updateSummary = () => {
        page.querySelectorAll('[data-customer-summary]').forEach((element) => {
            element.textContent = summary[element.dataset.customerSummary] ?? 0;
        });

        page.querySelectorAll('[data-customer-tab-count]').forEach((element) => {
            element.textContent = summary[element.dataset.customerTabCount] ?? 0;
        });

        find('header-total').textContent = summary.total ?? customers.length;
        find('total-label').textContent = summary.total ?? customers.length;
    };

    const loadCustomers = async () => {
        setListState('loading');
        summaryLoading.classList.remove('hidden');
        summaryContent.classList.add('hidden');

        try {
            const response = await fetch(endpoint, {
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Customer request failed.');
            }

            const payload = await response.json();

            if (!payload?.summary || !Array.isArray(payload.customers)) {
                throw new Error('Invalid customer data.');
            }

            summary = payload.summary;
            customers = payload.customers;
            updateSummary();
            summaryLoading.classList.add('hidden');
            summaryContent.classList.remove('hidden');
            renderCustomers();
        } catch (loadError) {
            summaryLoading.classList.add('hidden');
            setListState('error');
        }
    };

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            activeTab = tab.dataset.customerTab;
            updateTabs();
            renderCustomers();
        });
    });

    [branch, type, activity, sort].forEach((control) => {
        control.addEventListener('change', renderCustomers);
    });

    search.addEventListener('input', renderCustomers);

    clear.addEventListener('click', () => {
        activeTab = 'all';
        search.value = '';
        branch.value = 'all';
        type.value = 'all';
        activity.value = 'all';
        sort.value = 'newest';
        updateTabs();
        renderCustomers();
    });

    retry.addEventListener('click', loadCustomers);
    loadCustomers();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminCustomers);
} else {
    initializeAdminCustomers();
}
