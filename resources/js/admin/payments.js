const paymentStatusClasses = {
    'Waiting for Verification': ['bg-orange-50', 'text-orange-700', 'ring-orange-200'],
    Paid: ['bg-emerald-50', 'text-emerald-700', 'ring-emerald-200'],
    Unpaid: ['bg-slate-100', 'text-slate-600', 'ring-slate-200'],
    'Waiting for Payment': ['bg-amber-50', 'text-amber-700', 'ring-amber-200'],
    Failed: ['bg-red-50', 'text-red-700', 'ring-red-200'],
    Refunded: ['bg-blue-50', 'text-blue-700', 'ring-blue-200'],
    Cancelled: ['bg-slate-100', 'text-slate-600', 'ring-slate-200'],
};

const statusByTab = {
    all: null,
    unpaid: 'Unpaid',
    waiting_payment: 'Waiting for Payment',
    waiting_verification: 'Waiting for Verification',
    paid: 'Paid',
    failed: 'Failed',
    refunded: 'Refunded',
    cancelled: 'Cancelled',
};

const makePaymentElement = (tag, className = '', text = null) => {
    const element = document.createElement(tag);
    element.className = className;

    if (text !== null) {
        element.textContent = String(text);
    }

    return element;
};

const initializeAdminPayments = () => {
    const page = document.querySelector('[data-admin-payments]');

    if (!page) return;

    const select = (name) => page.querySelector(`[data-admin-payments-${name}]`);
    const endpoint = page.dataset.adminPaymentsEndpoint;
    const panel = select('panel');
    const loading = select('loading');
    const content = select('content');
    const empty = select('empty');
    const error = select('error');
    const retry = select('retry');
    const summaryLoading = select('summary-loading');
    const summaryContent = select('summary-content');
    const body = select('body');
    const search = select('search');
    const branch = select('branch');
    const method = select('method');
    const status = select('status');
    const date = select('date');
    const sort = select('sort');
    const clear = select('clear');
    const attention = select('attention');
    const totalLabel = select('total-label');
    const showing = select('showing');
    const total = select('total');
    const tabs = [...page.querySelectorAll('[data-admin-payments-tab]')];

    if (!endpoint || !panel || !loading || !content || !empty || !error || !retry || !summaryLoading || !summaryContent || !body || !search || !branch || !method || !status || !date || !sort || !clear || !attention || !totalLabel || !showing || !total) return;

    let payments = [];
    let summary = {};
    let activeTab = 'all';

    const setLoading = () => {
        page.setAttribute('aria-busy', 'true');
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
        page.setAttribute('aria-busy', 'false');
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
        page.setAttribute('aria-busy', 'false');
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
        page.querySelectorAll('[data-admin-payments-summary]').forEach((item) => {
            item.textContent = String(Number(summary[item.dataset.adminPaymentsSummary]) || 0);
        });
        attention.textContent = String(Number(summary.waiting_for_verification) || 0);
        totalLabel.textContent = String(Number(summary.total) || payments.length);
    };

    const updateTabs = () => {
        tabs.forEach((tab) => {
            const isActive = tab.dataset.adminPaymentsTab === activeTab;
            tab.classList.toggle('border-orange-500', isActive);
            tab.classList.toggle('text-[#0B1930]', isActive);
            tab.classList.toggle('border-transparent', !isActive);
            tab.classList.toggle('text-slate-500', !isActive);
            tab.setAttribute('aria-selected', String(isActive));
        });
    };

    const createVerifier = (name) => {
        if (name === '—') return makePaymentElement('span', 'text-sm text-slate-400', name);
        const wrapper = makePaymentElement('span', 'inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-slate-700');
        const icon = makePaymentElement('i', 'fa-regular fa-user text-xs text-slate-400');
        icon.setAttribute('aria-hidden', 'true');
        wrapper.append(icon, document.createTextNode(name));
        return wrapper;
    };

    const createRow = (payment) => {
        const row = makePaymentElement('tr', 'transition hover:bg-slate-50/80');
        const cells = [
            makePaymentElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-[#0B1930]', payment.order),
            makePaymentElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm font-medium text-slate-700', payment.customer),
            makePaymentElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-[#0B1930]', payment.order_total),
            makePaymentElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600', payment.method),
            makePaymentElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-slate-700', payment.amount_paid),
            makePaymentElement('td', 'whitespace-nowrap px-5 py-3.5'),
            makePaymentElement('td', 'whitespace-nowrap px-5 py-3.5'),
            makePaymentElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-500', payment.payment_date),
            makePaymentElement('td', 'whitespace-nowrap px-5 py-3.5'),
        ];
        const badge = makePaymentElement('span', 'inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', payment.status);
        const action = makePaymentElement('button', 'inline-flex min-h-8 cursor-pointer items-center justify-center rounded-lg border border-orange-400 px-3 text-xs font-semibold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500', payment.action);
        badge.classList.add(...(paymentStatusClasses[payment.status] ?? paymentStatusClasses.Unpaid));
        action.type = 'button';
        action.dataset.paymentId = String(payment.id);
        action.setAttribute('aria-label', `${payment.action} ${payment.order}`);
        cells[5].append(badge);
        cells[6].append(createVerifier(payment.verified_by));
        cells[8].append(action);
        row.append(...cells);
        return row;
    };

    const filteredPayments = () => {
        const searchValue = search.value.trim().toLowerCase();
        const tabStatus = statusByTab[activeTab];
        return payments.filter((payment) => {
            const matchesSearch = !searchValue || [payment.order, payment.customer, payment.payment_reference ?? ''].some((value) => value.toLowerCase().includes(searchValue));
            return matchesSearch
                && (branch.value === 'all' || payment.branch === branch.value)
                && (method.value === 'all' || payment.method === method.value)
                && (status.value === 'all' || payment.status === status.value)
                && (date.value === 'all' || payment.date_value === date.value)
                && (!tabStatus || payment.status === tabStatus);
        }).sort((first, second) => {
            if (sort.value === 'order') return first.order.localeCompare(second.order);
            const difference = new Date(second.date_value).getTime() - new Date(first.date_value).getTime();
            return sort.value === 'oldest' ? difference * -1 : difference;
        });
    };

    const renderPayments = () => {
        const matches = filteredPayments();
        const hasFilters = activeTab !== 'all' || search.value.trim() || branch.value !== 'all' || method.value !== 'all' || status.value !== 'all' || date.value !== 'all';
        body.replaceChildren(...matches.map(createRow));
        showing.textContent = matches.length ? `1–${matches.length}` : '0';
        total.textContent = String(hasFilters ? matches.length : (Number(summary.total) || matches.length));
        setResults(matches.length > 0);
    };

    const resetFilters = () => {
        activeTab = 'all';
        search.value = '';
        branch.value = 'all';
        method.value = 'all';
        status.value = 'all';
        date.value = 'all';
        sort.value = 'newest';
        updateTabs();
        renderPayments();
    };

    const loadPayments = async () => {
        setLoading();
        try {
            const response = await fetch(endpoint, { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
            if (!response.ok) throw new Error(`Payments request failed with ${response.status}.`);
            const data = await response.json();
            if (!data?.summary || !Array.isArray(data.payments)) throw new Error('Invalid payments response.');
            summary = data.summary;
            payments = data.payments;
            updateSummary();
            renderPayments();
        } catch (loadError) {
            console.error('Unable to load Admin Payments.', loadError);
            setError();
        }
    };

    tabs.forEach((tab) => tab.addEventListener('click', () => {
        activeTab = tab.dataset.adminPaymentsTab ?? 'all';
        updateTabs();
        renderPayments();
    }));
    [branch, method, status, date, sort].forEach((control) => control.addEventListener('change', renderPayments));
    search.addEventListener('input', renderPayments);
    clear.addEventListener('click', resetFilters);
    retry.addEventListener('click', loadPayments);
    loadPayments();
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeAdminPayments);
else initializeAdminPayments();
