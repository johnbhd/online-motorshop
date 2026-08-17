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

const overviewToneClasses = {
    orange: ['bg-orange-50', 'text-orange-700', 'ring-orange-200'],
    navy: ['bg-slate-100', 'text-[#0B1930]', 'ring-slate-200'],
    blue: ['bg-blue-50', 'text-blue-700', 'ring-blue-200'],
    green: ['bg-emerald-50', 'text-emerald-700', 'ring-emerald-200'],
    emerald: ['bg-green-50', 'text-green-700', 'ring-green-200'],
    violet: ['bg-violet-50', 'text-violet-700', 'ring-violet-200'],
    red: ['bg-red-50', 'text-red-700', 'ring-red-200'],
    slate: ['bg-slate-100', 'text-slate-600', 'ring-slate-200'],
};

const overviewBarClasses = {
    orange: 'bg-orange-500',
    navy: 'bg-[#0B1930]',
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    emerald: 'bg-green-600',
    violet: 'bg-violet-500',
    red: 'bg-red-500',
    slate: 'bg-slate-500',
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
    const overviewLoading = dashboard.querySelector(
        '[data-dashboard-overview-loading]',
    );
    const overviewContent = dashboard.querySelector(
        '[data-dashboard-overview-content]',
    );

    if (
        !endpoint
        || !summaryLoading
        || !summaryContent
        || !ordersLoading
        || !ordersContent
        || !ordersBody
        || !errorState
        || !retryButton
        || !overviewLoading
        || !overviewContent
    ) {
        return;
    }

    const setLoadingState = () => {
        dashboard.setAttribute('aria-busy', 'true');
        summaryLoading.classList.remove('hidden');
        ordersLoading.classList.remove('hidden');
        summaryContent.classList.add('hidden');
        ordersContent.classList.add('hidden');
        overviewLoading.classList.remove('hidden');
        overviewContent.classList.add('hidden');
        errorState.classList.add('hidden');
        retryButton.disabled = true;
    };

    const setSuccessState = () => {
        dashboard.setAttribute('aria-busy', 'false');
        summaryLoading.classList.add('hidden');
        ordersLoading.classList.add('hidden');
        summaryContent.classList.remove('hidden');
        ordersContent.classList.remove('hidden');
        overviewLoading.classList.add('hidden');
        overviewContent.classList.remove('hidden');
        errorState.classList.add('hidden');
        retryButton.disabled = false;
    };

    const setErrorState = () => {
        dashboard.setAttribute('aria-busy', 'false');
        summaryLoading.classList.add('hidden');
        ordersLoading.classList.add('hidden');
        summaryContent.classList.add('hidden');
        ordersContent.classList.add('hidden');
        overviewLoading.classList.add('hidden');
        overviewContent.classList.add('hidden');
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

    const createOverviewCard = (title) => {
        const card = createDashboardElement(
            'article',
            'h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6',
        );
        const heading = createDashboardElement(
            'h2',
            'text-base font-semibold text-[#0B1930]',
            title,
        );

        card.append(heading);

        return card;
    };

    const createOverviewLink = (label, url) => {
        const link = createDashboardElement(
            'a',
            'mt-auto inline-flex items-center justify-end gap-2 pt-5 text-sm font-semibold text-orange-600 transition hover:text-orange-700 focus:outline-none focus-visible:underline',
            label,
        );
        link.href = safeSameOriginUrl(url);

        return link;
    };

    const createBadge = (label, tone) => {
        const badge = createDashboardElement(
            'span',
            'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
            label,
        );
        badge.classList.add(
            ...(overviewToneClasses[tone] ?? overviewToneClasses.slate),
        );

        return badge;
    };

    const renderOperationalOverview = (overview) => {
        const statuses = Array.isArray(overview.today_order_statuses)
            ? overview.today_order_statuses
            : [];
        const payments = Array.isArray(overview.payment_overview)
            ? overview.payment_overview
            : [];
        const products = Array.isArray(overview.product_alerts)
            ? overview.product_alerts
            : [];
        const inquiries = Array.isArray(overview.recent_inquiries)
            ? overview.recent_inquiries
            : [];
        const activities = Array.isArray(overview.recent_activities)
            ? overview.recent_activities
            : [];
        const pickup = overview.fulfillment?.pickup ?? {};
        const delivery = overview.fulfillment?.delivery ?? {};
        const maximumStatusCount = Math.max(
            1,
            ...statuses.map((status) => Number(status.count) || 0),
        );

        const statusCard = createOverviewCard("Today's Order Status");
        const statusList = createDashboardElement('div', 'mt-5 space-y-4');
        statuses.forEach((status) => {
            const item = createDashboardElement(
                'div',
                'grid grid-cols-[7.25rem_minmax(0,1fr)_1.5rem] items-center gap-3',
            );
            const label = createDashboardElement(
                'span',
                'text-xs font-medium text-slate-600',
                status.label ?? '',
            );
            const track = createDashboardElement(
                'div',
                'h-2 overflow-hidden rounded-full bg-slate-100',
            );
            const bar = createDashboardElement(
                'div',
                `h-full rounded-full ${overviewBarClasses[status.tone] ?? overviewBarClasses.slate}`,
            );
            const count = createDashboardElement(
                'span',
                'text-right text-sm font-bold text-[#0B1930]',
                Number(status.count) || 0,
            );

            bar.style.width = `${((Number(status.count) || 0) / maximumStatusCount) * 100}%`;
            track.append(bar);
            item.append(label, track, count);
            statusList.append(item);
        });
        if (statuses.length === 0) {
            statusList.append(createDashboardElement('p', 'text-sm text-slate-500', 'No orders recorded today.'));
        }
        statusCard.append(statusList);

        const fulfillmentCard = createOverviewCard('Fulfillment Overview');
        const fulfillmentGrid = createDashboardElement('div', 'mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2');
        [
            { label: 'Store Pickup', icon: 'fa-solid fa-store', tone: 'orange', data: pickup, first: 'Preparing', firstKey: 'preparing', second: 'Ready for Pickup', secondKey: 'ready', url: overviewContent.dataset.pickupRequestsUrl, action: 'Manage Pickup Requests' },
            { label: 'Lalamove Delivery', icon: 'fa-solid fa-motorcycle', tone: 'blue', data: delivery, first: 'Waiting for Booking', firstKey: 'waiting', second: 'In Transit', secondKey: 'in_transit', url: overviewContent.dataset.deliveryRequestsUrl, action: 'Manage Delivery Requests' },
        ].forEach((fulfillment) => {
            const panel = createDashboardElement('section', 'flex flex-col rounded-lg border border-slate-200 bg-slate-50/60 p-4');
            const heading = createDashboardElement('div', 'flex items-center gap-2');
            const iconWrap = createDashboardElement('span', `inline-flex size-8 items-center justify-center rounded-lg ${fulfillment.tone === 'blue' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-600'}`);
            const icon = createDashboardElement('i', `${fulfillment.icon} text-sm`);
            const title = createDashboardElement('h3', 'text-sm font-semibold text-[#0B1930]', fulfillment.label);
            const active = createDashboardElement('p', 'mt-4 text-lg font-bold text-[#0B1930]', `${Number(fulfillment.data.active) || 0} Active Requests`);
            const list = createDashboardElement('ul', 'mt-3 space-y-1.5 text-xs text-slate-600');
            icon.setAttribute('aria-hidden', 'true');
            iconWrap.append(icon);
            heading.append(iconWrap, title);
            [[fulfillment.first, fulfillment.firstKey], [fulfillment.second, fulfillment.secondKey]].forEach(([label, key]) => {
                const row = createDashboardElement('li', 'flex items-center justify-between gap-2');
                row.append(createDashboardElement('span', null, label), createDashboardElement('strong', 'text-[#0B1930]', Number(fulfillment.data[key]) || 0));
                list.append(row);
            });
            const action = createDashboardElement('a', 'mt-4 inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-xs font-semibold text-[#0B1930] transition hover:border-orange-300 hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500', fulfillment.action);
            action.href = safeSameOriginUrl(fulfillment.url);
            panel.append(heading, active, list, action);
            fulfillmentGrid.append(panel);
        });
        fulfillmentCard.append(fulfillmentGrid);

        const paymentCard = createOverviewCard('Payment Overview');
        paymentCard.classList.add('flex', 'flex-col');
        const paymentList = createDashboardElement('div', 'mt-5 divide-y divide-slate-100');
        payments.forEach((payment) => {
            const row = createDashboardElement('div', 'flex items-center gap-3 py-3 first:pt-0');
            const iconWrap = createDashboardElement('span', 'inline-flex size-8 shrink-0 items-center justify-center rounded-full');
            const icon = createDashboardElement('i', `${payment.icon ?? 'fa-solid fa-circle'} text-xs`);
            iconWrap.classList.add(...(overviewToneClasses[payment.tone] ?? overviewToneClasses.slate));
            iconWrap.append(icon);
            row.append(iconWrap, createDashboardElement('span', 'min-w-0 flex-1 text-sm text-slate-600', payment.label ?? ''), createDashboardElement('strong', 'text-xl text-[#0B1930]', Number(payment.count) || 0));
            paymentList.append(row);
        });
        paymentCard.append(paymentList, createOverviewLink('View Payments', overviewContent.dataset.paymentsUrl));

        const productsCard = createOverviewCard('Product Availability Alerts');
        const productList = createDashboardElement('div', 'mt-4 divide-y divide-slate-100');
        products.forEach((product) => {
            const row = createDashboardElement('div', 'flex items-start gap-3 py-3 first:pt-0 last:pb-0');
            const details = createDashboardElement('div', 'min-w-0 flex-1');
            details.append(createDashboardElement('p', 'text-sm font-medium text-[#0B1930]', product.name ?? ''), createBadge(product.availability ?? '', product.tone));
            const action = createDashboardElement('a', 'shrink-0 text-xs font-semibold text-blue-700 transition hover:text-blue-900 focus:outline-none focus-visible:underline', product.action ?? 'Review');
            action.href = safeSameOriginUrl(overviewContent.dataset.productsUrl);
            row.append(details, action);
            productList.append(row);
        });
        if (products.length === 0) productList.append(createDashboardElement('p', 'py-3 text-sm text-slate-500', 'No product availability alerts.'));
        productsCard.append(productList);

        const inquiriesCard = createOverviewCard('Recent Customer Inquiries');
        const inquiryList = createDashboardElement('div', 'mt-4 divide-y divide-slate-100');
        inquiries.forEach((inquiry) => {
            const row = createDashboardElement('div', 'flex gap-3 py-3 first:pt-0 last:pb-0');
            const avatar = createDashboardElement('span', 'inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200');
            const icon = createDashboardElement('i', 'fa-regular fa-user text-sm');
            const details = createDashboardElement('div', 'min-w-0 flex-1');
            const header = createDashboardElement('div', 'flex flex-wrap items-center gap-x-2 gap-y-1');
            const meta = createDashboardElement('div', 'mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500');
            icon.setAttribute('aria-hidden', 'true'); avatar.append(icon);
            header.append(createDashboardElement('h3', 'text-sm font-semibold text-[#0B1930]', inquiry.customer ?? ''), createBadge(inquiry.status ?? '', inquiry.tone));
            meta.append(createDashboardElement('span', null, inquiry.category ?? ''), createDashboardElement('span', 'size-1 rounded-full bg-slate-300'), createDashboardElement('span', null, inquiry.time ?? ''));
            details.append(header, createDashboardElement('p', 'mt-1 truncate text-sm text-slate-600', inquiry.message ?? ''), meta);
            row.append(avatar, details); inquiryList.append(row);
        });
        if (inquiries.length === 0) inquiryList.append(createDashboardElement('p', 'py-3 text-sm text-slate-500', 'No recent customer inquiries.'));
        const messagesLink = createDashboardElement('a', 'mt-4 inline-flex text-xs font-semibold text-orange-600 transition hover:text-orange-700 focus:outline-none focus-visible:underline', 'View All Messages');
        messagesLink.href = safeSameOriginUrl(overviewContent.dataset.messagesUrl);
        inquiriesCard.append(inquiryList, messagesLink);

        const activitiesCard = createOverviewCard('Recent Activity');
        const activityList = createDashboardElement('div', 'mt-4 divide-y divide-slate-100');
        activities.forEach((activity) => {
            const row = createDashboardElement('div', 'flex items-start gap-3 py-3 first:pt-0 last:pb-0');
            const iconWrap = createDashboardElement('span', 'inline-flex size-8 shrink-0 items-center justify-center rounded-full');
            const icon = createDashboardElement('i', `${activity.icon ?? 'fa-solid fa-circle'} text-xs`);
            iconWrap.classList.add(...(overviewToneClasses[activity.tone] ?? overviewToneClasses.slate));
            iconWrap.append(icon);
            row.append(iconWrap, createDashboardElement('p', 'min-w-0 flex-1 text-xs leading-5 text-slate-600', activity.description ?? ''), createDashboardElement('time', 'shrink-0 whitespace-nowrap text-[11px] text-slate-400', activity.time ?? ''));
            activityList.append(row);
        });
        if (activities.length === 0) activityList.append(createDashboardElement('p', 'py-3 text-sm text-slate-500', 'No recent activity.'));
        activitiesCard.append(activityList);

        overviewContent.replaceChildren(statusCard, fulfillmentCard, paymentCard, productsCard, inquiriesCard, activitiesCard);
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
                || typeof data.operational_overview !== 'object'
            ) {
                throw new Error('Dashboard response has an invalid structure.');
            }

            renderSummary(data.summary);
            renderRecentOrders(data.recent_orders);
            renderOperationalOverview(data.operational_overview);
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
