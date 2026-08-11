const paymentStatusClasses = {
    Unpaid: [
        'bg-slate-100',
        'text-slate-700',
        'ring-slate-200',
    ],
    'Waiting for Payment': [
        'bg-orange-50',
        'text-orange-700',
        'ring-orange-200',
    ],
    'Waiting for Verification': [
        'bg-orange-50',
        'text-orange-700',
        'ring-orange-200',
    ],
    Paid: [
        'bg-emerald-50',
        'text-emerald-700',
        'ring-emerald-200',
    ],
    Failed: [
        'bg-red-50',
        'text-red-700',
        'ring-red-200',
    ],
    Refunded: [
        'bg-blue-50',
        'text-blue-700',
        'ring-blue-200',
    ],
    Cancelled: [
        'bg-slate-100',
        'text-slate-600',
        'ring-slate-200',
    ],
};

const defaultPaymentStatusClasses = [
    'bg-slate-100',
    'text-slate-700',
    'ring-slate-200',
];

const paymentTabStatuses = {
    unpaid: ['Unpaid'],
    waiting_for_payment: ['Waiting for Payment'],
    waiting_for_verification: ['Waiting for Verification'],
    paid: ['Paid'],
    failed: ['Failed'],
    refunded: ['Refunded'],
    cancelled: ['Cancelled'],
};

const createPaymentsElement = (tagName, className, text) => {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (text !== undefined && text !== null) {
        element.textContent = String(text);
    }

    return element;
};

const createPaymentStatusBadge = (status) => {
    const badge = createPaymentsElement(
        'span',
        'inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        status,
    );
    const badgeClasses = paymentStatusClasses[status]
        ?? defaultPaymentStatusClasses;

    badge.classList.add(...badgeClasses);

    return badge;
};

const initializeStaffPayments = () => {
    const page = document.querySelector('[data-staff-payments]');

    if (!page) {
        return;
    }

    const endpoint = page.dataset.paymentsEndpoint;
    const paymentsPanel = page.querySelector('[data-payments-panel]');
    const loadingState = page.querySelector('[data-payments-loading]');
    const contentState = page.querySelector('[data-payments-content]');
    const emptyState = page.querySelector('[data-payments-empty]');
    const errorState = page.querySelector('[data-payments-error]');
    const retryButton = page.querySelector('[data-payments-retry]');
    const paymentsBody = page.querySelector('[data-payments-body]');
    const searchInput = page.querySelector('[data-payments-search]');
    const methodFilter = page.querySelector('[data-payments-method]');
    const statusFilter = page.querySelector('[data-payments-status]');
    const dateFilter = page.querySelector('[data-payments-date]');
    const sortSelect = page.querySelector('[data-payments-sort]');
    const clearButton = page.querySelector('[data-payments-clear]');
    const showingLabel = page.querySelector('[data-payments-showing]');
    const totalLabel = page.querySelector('[data-payments-total]');
    const panelTotalLabel = page.querySelector('[data-payments-total-label]');
    const attentionCount = page.querySelector('[data-payments-attention-count]');
    const tabButtons = [...page.querySelectorAll('[data-payments-tab]')];

    if (
        !endpoint
        || !paymentsPanel
        || !loadingState
        || !contentState
        || !emptyState
        || !errorState
        || !retryButton
        || !paymentsBody
        || !searchInput
        || !methodFilter
        || !statusFilter
        || !dateFilter
        || !sortSelect
        || !clearButton
        || !showingLabel
        || !totalLabel
        || !panelTotalLabel
        || !attentionCount
    ) {
        return;
    }

    let payments = [];
    let summary = {};
    let activeTab = 'all';

    const setLoadingState = () => {
        paymentsPanel.setAttribute('aria-busy', 'true');
        loadingState.classList.remove('hidden');
        contentState.classList.add('hidden');
        emptyState.classList.add('hidden');
        errorState.classList.add('hidden');
        retryButton.disabled = true;
    };

    const setResultsState = (hasResults) => {
        paymentsPanel.setAttribute('aria-busy', 'false');
        loadingState.classList.add('hidden');
        errorState.classList.add('hidden');
        contentState.classList.toggle('hidden', !hasResults);
        emptyState.classList.toggle('hidden', hasResults);
        retryButton.disabled = false;
    };

    const setErrorState = () => {
        paymentsPanel.setAttribute('aria-busy', 'false');
        loadingState.classList.add('hidden');
        contentState.classList.add('hidden');
        emptyState.classList.add('hidden');
        errorState.classList.remove('hidden');
        retryButton.disabled = false;
    };

    const updateSummary = () => {
        page.querySelectorAll('[data-payments-summary]').forEach((target) => {
            const key = target.dataset.paymentsSummary;

            if (Number.isFinite(Number(summary[key]))) {
                target.textContent = String(Number(summary[key]));
            }
        });

        const total = Number(summary.total) || payments.length;
        const waiting = Number(summary.waiting_for_verification) || 0;

        panelTotalLabel.textContent = String(total);
        attentionCount.textContent = String(waiting);
    };

    const updateActiveTab = () => {
        tabButtons.forEach((button) => {
            const isActive = button.dataset.paymentsTab === activeTab;

            button.classList.toggle('border-orange-500', isActive);
            button.classList.toggle('text-[#0B1930]', isActive);
            button.classList.toggle('border-transparent', !isActive);
            button.classList.toggle('text-slate-500', !isActive);
            button.setAttribute('aria-selected', String(isActive));
        });
    };

    const createPaymentRow = (payment) => {
        const row = createPaymentsElement(
            'tr',
            'transition hover:bg-slate-50/80',
        );
        const orderCell = createPaymentsElement(
            'td',
            'whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-[#0B1930]',
            payment.order_reference ?? '',
        );
        const customerCell = createPaymentsElement(
            'td',
            'whitespace-nowrap px-5 py-3.5 text-sm font-medium text-slate-700',
            payment.customer ?? '',
        );
        const totalCell = createPaymentsElement(
            'td',
            'whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-[#0B1930]',
            payment.table_total ?? payment.total ?? '',
        );
        const methodCell = createPaymentsElement(
            'td',
            'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600',
            payment.method ?? '',
        );
        const amountCell = createPaymentsElement(
            'td',
            'whitespace-nowrap px-5 py-3.5 text-sm font-medium text-slate-700',
            payment.table_amount_paid ?? payment.amount_paid ?? '',
        );
        const statusCell = createPaymentsElement(
            'td',
            'whitespace-nowrap px-5 py-3.5',
        );
        const dateCell = createPaymentsElement(
            'td',
            'whitespace-nowrap px-5 py-3.5 text-sm text-slate-500',
            payment.payment_date ?? '',
        );
        const actionCell = createPaymentsElement(
            'td',
            'whitespace-nowrap px-5 py-3.5',
        );
        const menuCell = createPaymentsElement(
            'td',
            'whitespace-nowrap px-5 py-3.5 text-right',
        );

        statusCell.append(
            createPaymentStatusBadge(payment.status ?? ''),
        );

        const actionButton = createPaymentsElement(
            'button',
            'inline-flex min-h-8 cursor-pointer items-center justify-center rounded-lg border border-orange-400 px-3 text-xs font-semibold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
            payment.action ?? 'View Payment',
        );
        actionButton.type = 'button';
        actionCell.append(actionButton);

        const menuButton = createPaymentsElement(
            'button',
            'inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[#0B1930] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
        );
        const menuIcon = createPaymentsElement(
            'i',
            'fa-solid fa-ellipsis-vertical',
        );

        menuButton.type = 'button';
        menuButton.setAttribute(
            'aria-label',
            `More actions for ${payment.order_reference ?? 'payment'}`,
        );
        menuIcon.setAttribute('aria-hidden', 'true');
        menuButton.append(menuIcon);
        menuCell.append(menuButton);

        row.append(
            orderCell,
            customerCell,
            totalCell,
            methodCell,
            amountCell,
            statusCell,
            dateCell,
            actionCell,
            menuCell,
        );

        return row;
    };

    const getFilteredPayments = () => {
        const searchValue = searchInput.value.trim().toLowerCase();
        const methodValue = methodFilter.value;
        const statusValue = statusFilter.value;
        const dateValue = dateFilter.value;
        const activeStatuses = paymentTabStatuses[activeTab] ?? [];

        const filteredPayments = payments.filter((payment) => {
            const matchesSearch = !searchValue
                || String(payment.order_reference).toLowerCase().includes(searchValue)
                || String(payment.customer).toLowerCase().includes(searchValue)
                || String(payment.payment_reference).toLowerCase().includes(searchValue);
            const matchesMethod = methodValue === 'all'
                || payment.method === methodValue;
            const matchesStatus = statusValue === 'all'
                || payment.status === statusValue;
            const matchesDate = dateValue === 'all'
                || payment.date_value === dateValue;
            const matchesTab = activeTab === 'all'
                || activeStatuses.includes(payment.status);

            return matchesSearch
                && matchesMethod
                && matchesStatus
                && matchesDate
                && matchesTab;
        });

        return filteredPayments.sort((firstPayment, secondPayment) => {
            const firstDate = new Date(firstPayment.date_value || 0).getTime();
            const secondDate = new Date(secondPayment.date_value || 0).getTime();

            return sortSelect.value === 'oldest'
                ? firstDate - secondDate
                : secondDate - firstDate;
        });
    };

    const renderPayments = () => {
        const filteredPayments = getFilteredPayments();
        const hasActiveFilters = activeTab !== 'all'
            || searchInput.value.trim() !== ''
            || methodFilter.value !== 'all'
            || statusFilter.value !== 'all'
            || dateFilter.value !== 'all';
        const displayedTotal = hasActiveFilters
            ? filteredPayments.length
            : Number(summary.total) || filteredPayments.length;

        paymentsBody.replaceChildren(
            ...filteredPayments.map(createPaymentRow),
        );
        showingLabel.textContent = filteredPayments.length > 0
            ? `1–${filteredPayments.length}`
            : '0';
        totalLabel.textContent = String(displayedTotal);
        setResultsState(filteredPayments.length > 0);
    };

    const clearFilters = () => {
        activeTab = 'all';
        searchInput.value = '';
        methodFilter.value = 'all';
        statusFilter.value = 'all';
        dateFilter.value = 'all';
        sortSelect.value = 'newest';
        updateActiveTab();
        renderPayments();
    };

    const loadPayments = async () => {
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
                    `Payments request failed with status ${response.status}.`,
                );
            }

            const data = await response.json();

            if (
                !data
                || !data.summary
                || !Array.isArray(data.payments)
            ) {
                throw new Error('Payments response has an invalid structure.');
            }

            summary = data.summary;
            payments = data.payments;
            updateSummary();
            renderPayments();
        } catch (error) {
            console.error('Unable to load Staff Payments.', error);
            setErrorState();
        }
    };

    tabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            activeTab = button.dataset.paymentsTab ?? 'all';
            updateActiveTab();
            renderPayments();
        });
    });

    searchInput.addEventListener('input', renderPayments);
    methodFilter.addEventListener('change', renderPayments);
    statusFilter.addEventListener('change', renderPayments);
    dateFilter.addEventListener('change', renderPayments);
    sortSelect.addEventListener('change', renderPayments);
    clearButton.addEventListener('click', clearFilters);
    retryButton.addEventListener('click', loadPayments);

    loadPayments();
};

if (document.readyState === 'loading') {
    document.addEventListener(
        'DOMContentLoaded',
        initializeStaffPayments,
    );
} else {
    initializeStaffPayments();
}
