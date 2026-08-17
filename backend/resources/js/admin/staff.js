const staffStatusClasses = {
    Active: ['bg-emerald-50', 'text-emerald-700'],
    Inactive: ['bg-red-50', 'text-red-600'],
};

const createStaffElement = (tagName, className = '', text = null) => {
    const element = document.createElement(tagName);
    element.className = className;

    if (text !== null) {
        element.textContent = String(text);
    }

    return element;
};

const initializeAdminStaff = () => {
    const page = document.querySelector('[data-admin-staff]');

    if (!page) {
        return;
    }

    const find = (key) => page.querySelector(`[data-staff-${key}]`);
    const endpoint = page.dataset.adminStaffEndpoint;
    const body = find('body');
    const search = find('search');
    const branch = find('branch');
    const role = find('role');
    const status = find('status');
    const sort = find('sort');
    const clear = find('clear');
    const retry = find('retry');
    const error = find('error');
    const loading = find('loading');
    const content = find('content');
    const empty = find('empty');
    const summaryLoading = find('summary-loading');
    const summaryContent = find('summary-content');
    const tabs = [...page.querySelectorAll('[data-staff-tab]')];

    if (!endpoint || !body || !search || !branch || !role || !status || !sort || !clear || !retry || !error || !loading || !content || !empty || !summaryLoading || !summaryContent) {
        return;
    }

    let staffAccounts = [];
    let summary = {};
    let activeTab = 'all';

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
            const isActive = tab.dataset.staffTab === activeTab;

            tab.classList.toggle('border-orange-500', isActive);
            tab.classList.toggle('text-[#0B1930]', isActive);
            tab.classList.toggle('border-transparent', !isActive);
            tab.classList.toggle('text-slate-500', !isActive);
            tab.setAttribute('aria-selected', String(isActive));
        });
    };

    const createStaffRow = (staff) => {
        const row = createStaffElement('tr', 'transition hover:bg-slate-50/80');
        const staffCell = createStaffElement('td', 'whitespace-nowrap px-5 py-3.5');
        const identity = createStaffElement('div', 'flex items-center gap-3');
        const avatar = createStaffElement(
            'span',
            'inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200',
        );
        const avatarIcon = createStaffElement('i', 'fa-regular fa-user text-sm');
        const name = createStaffElement('span', 'text-sm font-semibold text-[#0B1930]', staff.name);
        const emailCell = createStaffElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600', staff.email);
        const roleCell = createStaffElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600', staff.role);
        const branchCell = createStaffElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600', staff.branch);
        const statusCell = createStaffElement('td', 'whitespace-nowrap px-5 py-3.5');
        const statusBadge = createStaffElement(
            'span',
            'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
            staff.status,
        );
        const lastActiveCell = createStaffElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600', staff.last_active);
        const actionCell = createStaffElement('td', 'whitespace-nowrap px-5 py-3.5');
        const manage = createStaffElement(
            'button',
            'inline-flex min-h-8 cursor-pointer items-center justify-center rounded-lg border border-orange-400 px-3 text-xs font-semibold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
            'Manage',
        );

        avatarIcon.setAttribute('aria-hidden', 'true');
        avatar.append(avatarIcon);
        identity.append(avatar, name);
        staffCell.append(identity);
        statusBadge.classList.add(...(
            staffStatusClasses[staff.status] ?? staffStatusClasses.Inactive
        ));
        statusCell.append(statusBadge);
        manage.type = 'button';
        manage.dataset.staffId = String(staff.id);
        manage.setAttribute('aria-label', `Manage ${staff.name}`);
        actionCell.append(manage);
        row.append(
            staffCell,
            emailCell,
            roleCell,
            branchCell,
            statusCell,
            lastActiveCell,
            actionCell,
        );

        return row;
    };

    const getVisibleStaff = () => {
        const searchTerm = search.value.trim().toLowerCase();

        return staffAccounts
            .filter((staff) => (
                (activeTab === 'all' || staff.status === activeTab)
                && (!searchTerm
                    || staff.name.toLowerCase().includes(searchTerm)
                    || staff.email.toLowerCase().includes(searchTerm))
                && (branch.value === 'all' || staff.branch === branch.value)
                && (role.value === 'all' || staff.role === role.value)
                && (status.value === 'all' || staff.status === status.value)
            ))
            .sort((firstStaff, secondStaff) => (
                sort.value === 'name-desc'
                    ? secondStaff.name.localeCompare(firstStaff.name)
                    : firstStaff.name.localeCompare(secondStaff.name)
            ));
    };

    const renderStaff = () => {
        const visibleStaff = getVisibleStaff();
        const filtersAreActive = activeTab !== 'all'
            || search.value.trim() !== ''
            || branch.value !== 'all'
            || role.value !== 'all'
            || status.value !== 'all';
        const total = filtersAreActive ? visibleStaff.length : (summary.total ?? staffAccounts.length);

        body.replaceChildren(...visibleStaff.map(createStaffRow));
        find('showing').textContent = visibleStaff.length ? `1–${visibleStaff.length}` : '0';
        find('total').textContent = String(total);
        find('total-label').textContent = String(total);
        setListState(visibleStaff.length > 0 ? 'content' : 'empty');
    };

    const updateSummary = () => {
        page.querySelectorAll('[data-staff-summary]').forEach((element) => {
            element.textContent = summary[element.dataset.staffSummary] ?? 0;
        });

        page.querySelectorAll('[data-staff-tab-count]').forEach((element) => {
            element.textContent = summary[element.dataset.staffTabCount] ?? 0;
        });

        find('total-label').textContent = summary.total ?? staffAccounts.length;
    };

    const loadStaff = async () => {
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
                throw new Error('Staff request failed.');
            }

            const payload = await response.json();

            if (!payload?.summary || !Array.isArray(payload.staff)) {
                throw new Error('Invalid staff data.');
            }

            summary = payload.summary;
            staffAccounts = payload.staff;
            updateSummary();
            summaryLoading.classList.add('hidden');
            summaryContent.classList.remove('hidden');
            renderStaff();
        } catch (loadError) {
            summaryLoading.classList.add('hidden');
            setListState('error');
        }
    };

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            activeTab = tab.dataset.staffTab;
            updateTabs();
            renderStaff();
        });
    });

    [branch, role, status, sort].forEach((control) => {
        control.addEventListener('change', renderStaff);
    });

    search.addEventListener('input', renderStaff);
    clear.addEventListener('click', () => {
        activeTab = 'all';
        search.value = '';
        branch.value = 'all';
        role.value = 'all';
        status.value = 'all';
        sort.value = 'name-asc';
        updateTabs();
        renderStaff();
    });
    retry.addEventListener('click', loadStaff);

    loadStaff();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminStaff);
} else {
    initializeAdminStaff();
}
