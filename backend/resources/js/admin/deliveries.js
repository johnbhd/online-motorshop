const deliveryStatusClasses = {
    'Waiting for Booking': ['bg-orange-50', 'text-orange-700'],
    Booked: ['bg-blue-50', 'text-blue-700'],
    'Picked Up': ['bg-blue-50', 'text-blue-700'],
    'In Transit': ['bg-blue-50', 'text-blue-700'],
    Delivered: ['bg-emerald-50', 'text-emerald-700'],
    Failed: ['bg-red-50', 'text-red-700'],
    Cancelled: ['bg-slate-100', 'text-slate-600'],
};

const createDeliveryElement = (tagName, className = '', text = null) => {
    const element = document.createElement(tagName);
    element.className = className;

    if (text !== null) {
        element.textContent = String(text);
    }

    return element;
};

const initializeAdminDeliveries = () => {
    const page = document.querySelector('[data-admin-deliveries]');

    if (!page) {
        return;
    }

    const find = (key) => page.querySelector(`[data-delivery-${key}]`);
    const endpoint = page.dataset.adminDeliveriesEndpoint;
    const body = find('body');
    const search = find('search');
    const branch = find('branch');
    const status = find('status');
    const staff = find('staff');
    const clear = find('clear');
    const retry = find('retry');
    const error = find('error');
    const loading = find('loading');
    const content = find('content');
    const empty = find('empty');
    const summaryLoading = find('summary-loading');
    const summaryContent = find('summary');
    const branchLoading = find('branches-loading');
    const branchContent = find('branches-content');
    const branchBody = find('branches');
    const tabs = [...page.querySelectorAll('[data-delivery-tab]')];
    let deliveries = [];
    let summary = {};
    let activeTab = 'all';

    const updateTabs = () => {
        tabs.forEach((tab) => {
            const isActive = tab.dataset.deliveryTab === activeTab;

            tab.classList.toggle('border-orange-500', isActive);
            tab.classList.toggle('text-[#0B1930]', isActive);
            tab.classList.toggle('border-transparent', !isActive);
            tab.classList.toggle('text-slate-500', !isActive);
        });
    };

    const createRow = (delivery) => {
        const row = createDeliveryElement('tr', 'transition hover:bg-slate-50/80');
        const values = [
            delivery.order,
            delivery.customer,
            delivery.destination,
            `${delivery.branch} Branch`,
            delivery.amount,
        ];

        values.forEach((value, index) => {
            row.append(createDeliveryElement(
                'td',
                index === 0
                    ? 'whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-[#0B1930]'
                    : 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600',
                value,
            ));
        });

        const feeCell = createDeliveryElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm font-medium');
        feeCell.classList.add(delivery.fee === 'To be confirmed' ? 'text-orange-600' : 'text-slate-700');
        feeCell.textContent = delivery.fee;

        const staffCell = createDeliveryElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm');
        if (delivery.staff === '—') {
            staffCell.classList.add('text-slate-400');
            staffCell.textContent = delivery.staff;
        } else {
            const icon = createDeliveryElement('i', 'fa-regular fa-user text-xs text-slate-400');
            icon.setAttribute('aria-hidden', 'true');
            staffCell.classList.add('font-medium', 'text-slate-700');
            staffCell.append(icon, document.createTextNode(` ${delivery.staff}`));
        }

        const statusCell = createDeliveryElement('td', 'whitespace-nowrap px-5 py-3.5');
        const badge = createDeliveryElement('span', 'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', delivery.status);
        badge.classList.add(...(deliveryStatusClasses[delivery.status] ?? deliveryStatusClasses.Cancelled));
        statusCell.append(badge);

        const actionCell = createDeliveryElement('td', 'whitespace-nowrap px-5 py-3.5');
        const action = createDeliveryElement('button', 'inline-flex min-h-8 cursor-pointer items-center justify-center rounded-lg border border-orange-400 px-3 text-xs font-semibold text-orange-600 transition hover:bg-orange-50', delivery.action);
        action.type = 'button';
        action.dataset.deliveryId = String(delivery.id);
        actionCell.append(action);

        row.append(feeCell, staffCell, statusCell, actionCell);
        return row;
    };

    const renderDeliveries = () => {
        const term = search.value.trim().toLowerCase();
        const rows = deliveries.filter((delivery) => (
            (activeTab === 'all' || delivery.status === activeTab)
            && (!term || delivery.order.toLowerCase().includes(term) || delivery.customer.toLowerCase().includes(term))
            && (branch.value === 'all' || delivery.branch === branch.value)
            && (status.value === 'all' || delivery.status === status.value)
            && (staff.value === 'all' || delivery.staff === staff.value)
        ));

        body.replaceChildren(...rows.map(createRow));
        find('showing').textContent = rows.length ? `1–${rows.length}` : '0';
        find('total').textContent = activeTab === 'all' ? summary.total : rows.length;
        content.classList.toggle('hidden', rows.length === 0);
        empty.classList.toggle('hidden', rows.length > 0);
    };

    const renderBranches = (branches) => {
        branchBody.replaceChildren(...branches.map((branchItem) => {
            const row = createDeliveryElement('tr', 'border-t border-slate-100');
            [
                branchItem.branch,
                `${branchItem.requests} Delivery Requests`,
                `${branchItem.active} Active`,
                `${branchItem.delivered} Delivered`,
            ].forEach((value, index) => row.append(createDeliveryElement('td', index === 0 ? 'px-5 py-4 font-semibold text-[#0B1930]' : 'px-5 py-4 text-sm text-slate-600', value)));
            return row;
        }));
        branchLoading.classList.add('hidden');
        branchContent.classList.remove('hidden');
    };

    const load = async () => {
        error.classList.add('hidden');
        loading.classList.remove('hidden');

        try {
            const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
            if (!response.ok) throw new Error('Delivery request failed.');
            const data = await response.json();
            if (!data?.summary || !Array.isArray(data.delivery_requests) || !Array.isArray(data.branches)) throw new Error('Invalid delivery data.');

            deliveries = data.delivery_requests;
            summary = data.summary;
            ['active_deliveries', 'waiting_for_booking', 'delivered_today'].forEach((key) => {
                page.querySelector(`[data-delivery-summary-value="${key}"]`).textContent = summary[key] ?? 0;
            });
            find('active').textContent = summary.active_deliveries ?? 0;
            find('total-label').textContent = summary.total ?? deliveries.length;
            summaryLoading.classList.add('hidden');
            summaryContent.classList.remove('hidden');
            loading.classList.add('hidden');
            renderDeliveries();
            renderBranches(data.branches);
        } catch (loadError) {
            loading.classList.add('hidden');
            summaryLoading.classList.add('hidden');
            error.classList.remove('hidden');
        }
    };

    tabs.forEach((tab) => tab.addEventListener('click', () => {
        activeTab = tab.dataset.deliveryTab;
        updateTabs();
        renderDeliveries();
    }));
    [branch, status, staff].forEach((control) => control.addEventListener('change', renderDeliveries));
    search.addEventListener('input', renderDeliveries);
    clear.addEventListener('click', () => {
        activeTab = 'all'; search.value = ''; branch.value = 'all'; status.value = 'all'; staff.value = 'all'; updateTabs(); renderDeliveries();
    });
    retry.addEventListener('click', load);
    load();
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeAdminDeliveries);
else initializeAdminDeliveries();
