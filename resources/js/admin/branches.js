const branchStatusClasses = {
    Active: ['bg-emerald-50', 'text-emerald-700'],
    Inactive: ['bg-slate-100', 'text-slate-600'],
};

const createBranchElement = (tagName, className = '', text = null) => {
    const element = document.createElement(tagName);
    element.className = className;

    if (text !== null) {
        element.textContent = String(text);
    }

    return element;
};

const initializeAdminBranches = () => {
    const page = document.querySelector('[data-admin-branches]');

    if (!page) {
        return;
    }

    const find = (key) => page.querySelector(`[data-branch-${key}]`);
    const endpoint = page.dataset.adminBranchesEndpoint;
    const search = find('search');
    const status = find('status');
    const pickup = find('pickup');
    const clear = find('clear');
    const retry = find('retry');
    const error = find('error');
    const loading = find('loading');
    const list = find('list');
    const empty = find('empty');
    const summaryLoading = find('summary-loading');
    const summaryContent = find('summary-content');

    if (!endpoint || !search || !status || !pickup || !clear || !retry || !error || !loading || !list || !empty || !summaryLoading || !summaryContent) {
        return;
    }

    let branches = [];

    const setListState = (state) => {
        const isLoading = state === 'loading';

        page.setAttribute('aria-busy', String(isLoading));
        loading.classList.toggle('hidden', !isLoading);
        list.classList.toggle('hidden', state !== 'content');
        empty.classList.toggle('hidden', state !== 'empty');
        error.classList.toggle('hidden', state !== 'error');
    };

    const createInformationItem = (iconClass, label, value, valueClass = 'text-slate-600') => {
        const item = createBranchElement('div', 'flex min-w-0 gap-3');
        const icon = createBranchElement(
            'span',
            'inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500',
        );
        const iconGraphic = createBranchElement('i', `${iconClass} text-sm`);
        const details = createBranchElement('div', 'min-w-0');
        const heading = createBranchElement(
            'p',
            'text-xs font-semibold uppercase tracking-wide text-slate-400',
            label,
        );
        const content = createBranchElement(
            'p',
            `mt-1 break-words text-sm font-medium ${valueClass}`,
            value,
        );

        iconGraphic.setAttribute('aria-hidden', 'true');
        icon.append(iconGraphic);
        details.append(heading, content);
        item.append(icon, details);

        return item;
    };

    const createBranchCard = (branch) => {
        const card = createBranchElement(
            'article',
            'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm',
        );
        const header = createBranchElement(
            'div',
            'flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6',
        );
        const title = createBranchElement('h2', 'text-lg font-semibold text-[#0B1930]', branch.name);
        const statusBadge = createBranchElement(
            'span',
            'inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold',
            branch.status,
        );
        const content = createBranchElement('div', 'p-5 sm:p-6');
        const information = createBranchElement(
            'div',
            'grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 xl:grid-cols-3',
        );
        const footer = createBranchElement(
            'div',
            'mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between',
        );
        const pickupItem = createInformationItem(
            'fa-solid fa-store',
            'Pickup',
            branch.pickup_available ? 'Store Pickup Available' : 'Store Pickup Unavailable',
            branch.pickup_available ? 'text-emerald-700' : 'text-slate-500',
        );
        const actions = createBranchElement('div', 'flex items-center gap-4');
        const edit = createBranchElement(
            'button',
            'inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
            'Edit Branch',
        );
        const viewStaff = createBranchElement(
            'button',
            'min-h-10 cursor-pointer text-sm font-semibold text-orange-600 transition hover:text-orange-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
            'View Staff',
        );

        statusBadge.classList.add(...(
            branchStatusClasses[branch.status] ?? branchStatusClasses.Inactive
        ));
        header.append(title, statusBadge);
        information.append(
            createInformationItem('fa-solid fa-location-dot', 'Address', branch.address),
            createInformationItem('fa-solid fa-phone', 'Contact', branch.contact),
            createInformationItem('fa-solid fa-users', 'Assigned Staff', `${branch.assigned_staff} Staff`, 'text-[#0B1930]'),
            createInformationItem(
                'fa-regular fa-clock',
                'Operating Hours',
                branch.operating_hours_configured ? 'Configured' : 'Not configured',
                branch.operating_hours_configured ? 'text-emerald-700' : 'text-slate-500',
            ),
        );
        edit.type = 'button';
        edit.dataset.branchId = String(branch.id);
        viewStaff.type = 'button';
        viewStaff.dataset.branchId = String(branch.id);
        actions.append(edit, viewStaff);
        footer.append(pickupItem, actions);
        content.append(information, footer);
        card.append(header, content);

        return card;
    };

    const renderBranches = () => {
        const searchTerm = search.value.trim().toLowerCase();
        const visibleBranches = branches.filter((branch) => {
            const matchesSearch = !searchTerm
                || branch.name.toLowerCase().includes(searchTerm)
                || branch.address.toLowerCase().includes(searchTerm);
            const matchesStatus = status.value === 'all' || branch.status === status.value;
            const matchesPickup = pickup.value === 'all'
                || (pickup.value === 'available' && branch.pickup_available)
                || (pickup.value === 'unavailable' && !branch.pickup_available);

            return matchesSearch && matchesStatus && matchesPickup;
        });

        list.replaceChildren(...visibleBranches.map(createBranchCard));
        setListState(visibleBranches.length > 0 ? 'content' : 'empty');
    };

    const updateSummary = (summary) => {
        page.querySelectorAll('[data-branch-summary]').forEach((element) => {
            element.textContent = summary[element.dataset.branchSummary] ?? 0;
        });
    };

    const loadBranches = async () => {
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
                throw new Error('Branch request failed.');
            }

            const payload = await response.json();

            if (!payload?.summary || !Array.isArray(payload.branches)) {
                throw new Error('Invalid branch data.');
            }

            branches = payload.branches;
            updateSummary(payload.summary);
            summaryLoading.classList.add('hidden');
            summaryContent.classList.remove('hidden');
            renderBranches();
        } catch (loadError) {
            summaryLoading.classList.add('hidden');
            setListState('error');
        }
    };

    search.addEventListener('input', renderBranches);
    status.addEventListener('change', renderBranches);
    pickup.addEventListener('change', renderBranches);
    clear.addEventListener('click', () => {
        search.value = '';
        status.value = 'all';
        pickup.value = 'all';
        renderBranches();
    });
    retry.addEventListener('click', loadBranches);

    loadBranches();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminBranches);
} else {
    initializeAdminBranches();
}
