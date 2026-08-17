const availabilityClasses = {
    Available: ['bg-emerald-50', 'text-emerald-700', 'ring-emerald-200'],
    'Low Stock': ['bg-orange-50', 'text-orange-700', 'ring-orange-200'],
    'Subject to Confirmation': ['bg-blue-50', 'text-blue-700', 'ring-blue-200'],
    'Out of Stock': ['bg-red-50', 'text-red-700', 'ring-red-200'],
    Unavailable: ['bg-slate-100', 'text-slate-600', 'ring-slate-200'],
    Archived: ['bg-slate-100', 'text-slate-600', 'ring-slate-200'],
};

const tabAvailability = {
    available: ['Available'],
    low_stock: ['Low Stock'],
    subject_to_confirmation: ['Subject to Confirmation'],
    out_of_stock: ['Out of Stock'],
    unavailable: ['Unavailable'],
    archived: ['Archived'],
};

const makeElement = (tagName, className, text) => {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (text !== undefined && text !== null) {
        element.textContent = String(text);
    }

    return element;
};

const initializeStaffProducts = () => {
    const page = document.querySelector('[data-staff-products]');

    if (!page) {
        return;
    }

    const endpoint = page.dataset.productsEndpoint;
    const panel = page.querySelector('[data-products-panel]');
    const loading = page.querySelector('[data-products-loading]');
    const content = page.querySelector('[data-products-content]');
    const empty = page.querySelector('[data-products-empty]');
    const error = page.querySelector('[data-products-error]');
    const retry = page.querySelector('[data-products-retry]');
    const body = page.querySelector('[data-products-body]');
    const search = page.querySelector('[data-products-search]');
    const brand = page.querySelector('[data-products-brand]');
    const category = page.querySelector('[data-products-category]');
    const availability = page.querySelector('[data-products-availability]');
    const sort = page.querySelector('[data-products-sort]');
    const clear = page.querySelector('[data-products-clear]');
    const showing = page.querySelector('[data-products-showing]');
    const total = page.querySelector('[data-products-total]');
    const panelTotal = page.querySelector('[data-products-total-label]');
    const attention = page.querySelector('[data-products-attention-count]');
    const tabs = [...page.querySelectorAll('[data-products-tab]')];

    if (!endpoint || !panel || !loading || !content || !empty || !error || !retry || !body || !search || !brand || !category || !availability || !sort || !clear || !showing || !total || !panelTotal || !attention) {
        return;
    }

    let products = [];
    let summary = {};
    let activeTab = 'all';

    const setLoading = () => {
        panel.setAttribute('aria-busy', 'true');
        loading.classList.remove('hidden');
        content.classList.add('hidden');
        empty.classList.add('hidden');
        error.classList.add('hidden');
        retry.disabled = true;
    };

    const setResults = (hasResults) => {
        panel.setAttribute('aria-busy', 'false');
        loading.classList.add('hidden');
        content.classList.toggle('hidden', !hasResults);
        empty.classList.toggle('hidden', hasResults);
        error.classList.add('hidden');
        retry.disabled = false;
    };

    const setError = () => {
        panel.setAttribute('aria-busy', 'false');
        loading.classList.add('hidden');
        content.classList.add('hidden');
        empty.classList.add('hidden');
        error.classList.remove('hidden');
        retry.disabled = false;
    };

    const updateSummary = () => {
        page.querySelectorAll('[data-products-summary]').forEach((target) => {
            const value = Number(summary[target.dataset.productsSummary]);

            if (Number.isFinite(value)) {
                target.textContent = String(value);
            }
        });

        panelTotal.textContent = String(Number(summary.total) || products.length);
        attention.textContent = String(Number(summary.needs_attention) || 0);
    };

    const updateActiveTab = () => {
        tabs.forEach((tab) => {
            const isActive = tab.dataset.productsTab === activeTab;

            tab.classList.toggle('border-orange-500', isActive);
            tab.classList.toggle('text-[#0B1930]', isActive);
            tab.classList.toggle('border-transparent', !isActive);
            tab.classList.toggle('text-slate-500', !isActive);
            tab.setAttribute('aria-selected', String(isActive));
        });
    };

    const createAvailabilityBadge = (status) => {
        const badge = makeElement('span', 'inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', status);
        badge.classList.add(...(availabilityClasses[status] ?? ['bg-slate-100', 'text-slate-700', 'ring-slate-200']));

        return badge;
    };

    const createProductRow = (product) => {
        const row = makeElement('tr', 'transition hover:bg-slate-50/80');
        const productCell = makeElement('td', 'min-w-64 px-5 py-3.5');
        const productWrap = makeElement('div', 'flex items-center gap-3');
        const placeholder = makeElement('span', 'inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 ring-1 ring-inset ring-slate-200');
        const icon = makeElement('i', 'fa-solid fa-box');
        const productName = makeElement('span', 'font-semibold text-[#0B1930]', product.name ?? '');
        const cells = [
            productCell,
            makeElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm font-medium text-slate-700', product.part_number ?? ''),
            makeElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600', product.brand ?? ''),
            makeElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600', product.category ?? ''),
            makeElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-[#0B1930]', product.price ?? ''),
            makeElement('td', 'whitespace-nowrap px-5 py-3.5'),
            makeElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-500', product.updated ?? ''),
            makeElement('td', 'whitespace-nowrap px-5 py-3.5'),
        ];
        const action = makeElement('button', 'inline-flex min-h-8 cursor-pointer items-center justify-center rounded-lg border border-orange-400 px-3 text-xs font-semibold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500', product.action ?? 'View Product');

        icon.setAttribute('aria-hidden', 'true');
        placeholder.append(icon);
        productWrap.append(placeholder, productName);
        productCell.append(productWrap);
        cells[5].append(createAvailabilityBadge(product.availability ?? ''));
        action.type = 'button';
        action.dataset.productId = String(product.id ?? '');
        action.setAttribute('aria-label', `${product.action ?? 'View Product'} ${product.name ?? ''}`);
        cells[7].append(action);
        row.append(...cells);

        return row;
    };

    const getFilteredProducts = () => {
        const searchValue = search.value.trim().toLowerCase();
        const activeAvailability = tabAvailability[activeTab] ?? [];

        return products.filter((product) => {
            const matchesSearch = !searchValue || String(product.name ?? '').toLowerCase().includes(searchValue) || String(product.part_number ?? '').toLowerCase().includes(searchValue);
            const matchesBrand = brand.value === 'all' || product.brand === brand.value;
            const matchesCategory = category.value === 'all' || product.category === category.value;
            const matchesAvailability = availability.value === 'all' || product.availability === availability.value;
            const matchesTab = activeTab === 'all' || activeAvailability.includes(product.availability);

            return matchesSearch && matchesBrand && matchesCategory && matchesAvailability && matchesTab;
        }).sort((firstProduct, secondProduct) => {
            if (sort.value === 'updated') {
                return new Date(secondProduct.date_value ?? 0).getTime() - new Date(firstProduct.date_value ?? 0).getTime();
            }

            return String(firstProduct.name ?? '').localeCompare(String(secondProduct.name ?? ''));
        });
    };

    const renderProducts = () => {
        const filteredProducts = getFilteredProducts();
        const hasFilters = activeTab !== 'all' || search.value.trim() !== '' || brand.value !== 'all' || category.value !== 'all' || availability.value !== 'all';

        body.replaceChildren(...filteredProducts.map(createProductRow));
        showing.textContent = filteredProducts.length > 0 ? `1–${filteredProducts.length}` : '0';
        total.textContent = String(hasFilters ? filteredProducts.length : (Number(summary.total) || filteredProducts.length));
        setResults(filteredProducts.length > 0);
    };

    const clearFilters = () => {
        activeTab = 'all';
        search.value = '';
        brand.value = 'all';
        category.value = 'all';
        availability.value = 'all';
        sort.value = 'name';
        updateActiveTab();
        renderProducts();
    };

    const loadProducts = async () => {
        setLoading();

        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                credentials: 'same-origin',
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });

            if (!response.ok) {
                throw new Error(`Products request failed with status ${response.status}.`);
            }

            const data = await response.json();

            if (!data || !data.summary || !Array.isArray(data.products)) {
                throw new Error('Products response has an invalid structure.');
            }

            summary = data.summary;
            products = data.products;
            updateSummary();
            renderProducts();
        } catch (loadError) {
            console.error('Unable to load Staff Products.', loadError);
            setError();
        }
    };

    tabs.forEach((tab) => tab.addEventListener('click', () => {
        activeTab = tab.dataset.productsTab ?? 'all';
        updateActiveTab();
        renderProducts();
    }));
    search.addEventListener('input', renderProducts);
    brand.addEventListener('change', renderProducts);
    category.addEventListener('change', renderProducts);
    availability.addEventListener('change', renderProducts);
    sort.addEventListener('change', renderProducts);
    clear.addEventListener('click', clearFilters);
    retry.addEventListener('click', loadProducts);

    loadProducts();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStaffProducts);
} else {
    initializeStaffProducts();
}
