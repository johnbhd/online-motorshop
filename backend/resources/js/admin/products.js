const adminAvailabilityClasses = {
    Available: ['bg-emerald-50', 'text-emerald-700', 'ring-emerald-200'],
    'Low Stock': ['bg-orange-50', 'text-orange-700', 'ring-orange-200'],
    'Subject to Confirmation': ['bg-blue-50', 'text-blue-700', 'ring-blue-200'],
    'Out of Stock': ['bg-red-50', 'text-red-700', 'ring-red-200'],
    Unavailable: ['bg-slate-100', 'text-slate-600', 'ring-slate-200'],
};

const adminRecordStatusClasses = {
    Active: ['bg-emerald-50', 'text-emerald-700', 'ring-emerald-200'],
    Inactive: ['bg-slate-100', 'text-slate-600', 'ring-slate-200'],
    Archived: ['bg-slate-100', 'text-slate-600', 'ring-slate-200'],
};

const availabilityByTab = {
    all: null,
    available: 'Available',
    low_stock: 'Low Stock',
    subject_to_confirmation: 'Subject to Confirmation',
    out_of_stock: 'Out of Stock',
    unavailable: 'Unavailable',
    archived: 'Archived',
};

const createAdminProductElement = (tagName, className = '', text = null) => {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (text !== null) {
        element.textContent = String(text);
    }

    return element;
};

const createAdminProductBadge = (label, classes) => {
    const badge = createAdminProductElement(
        'span',
        'inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        label,
    );

    badge.classList.add(...classes);

    return badge;
};

const initializeAdminProducts = () => {
    const page = document.querySelector('[data-admin-products]');

    if (!page) {
        return;
    }

    const endpoint = page.dataset.adminProductsEndpoint;
    const error = page.querySelector('[data-admin-products-error]');
    const retry = page.querySelector('[data-admin-products-retry]');
    const summaryLoading = page.querySelector('[data-admin-products-summary-loading]');
    const summaryContent = page.querySelector('[data-admin-products-summary-content]');
    const panel = page.querySelector('[data-admin-products-panel]');
    const loading = page.querySelector('[data-admin-products-loading]');
    const content = page.querySelector('[data-admin-products-content]');
    const empty = page.querySelector('[data-admin-products-empty]');
    const body = page.querySelector('[data-admin-products-body]');
    const search = page.querySelector('[data-admin-products-search]');
    const brand = page.querySelector('[data-admin-products-brand]');
    const category = page.querySelector('[data-admin-products-category]');
    const availability = page.querySelector('[data-admin-products-availability]');
    const status = page.querySelector('[data-admin-products-status]');
    const sort = page.querySelector('[data-admin-products-sort]');
    const clear = page.querySelector('[data-admin-products-clear]');
    const attention = page.querySelector('[data-admin-products-attention]');
    const totalLabel = page.querySelector('[data-admin-products-total-label]');
    const showing = page.querySelector('[data-admin-products-showing]');
    const total = page.querySelector('[data-admin-products-total]');
    const categoriesBody = page.querySelector('[data-admin-products-categories]');
    const brandsBody = page.querySelector('[data-admin-products-brands]');
    const modelsBody = page.querySelector('[data-admin-products-models]');
    const modelSearch = page.querySelector('[data-admin-products-model-search]');
    const modelBrand = page.querySelector('[data-admin-products-model-brand]');
    const mainTabs = [...page.querySelectorAll('[data-admin-products-main-tab]')];
    const mainPanels = [...page.querySelectorAll('[data-admin-products-main-panel]')];
    const statusTabs = [...page.querySelectorAll('[data-admin-products-status-tab]')];

    if (!endpoint || !error || !retry || !summaryLoading || !summaryContent || !panel || !loading || !content || !empty || !body || !search || !brand || !category || !availability || !status || !sort || !clear || !attention || !totalLabel || !showing || !total || !categoriesBody || !brandsBody || !modelsBody || !modelSearch || !modelBrand) {
        return;
    }

    let products = [];
    let categories = [];
    let brands = [];
    let motorcycleModels = [];
    let summary = {};
    let activeMainTab = 'products';
    let activeStatusTab = 'all';

    const setLoading = () => {
        page.setAttribute('aria-busy', 'true');
        summaryLoading.classList.remove('hidden');
        summaryContent.classList.add('hidden');
        loading.classList.remove('hidden');
        content.classList.add('hidden');
        empty.classList.add('hidden');
        error.classList.add('hidden');
        retry.disabled = true;
    };

    const setProductResults = (hasResults) => {
        panel.setAttribute('aria-busy', 'false');
        loading.classList.add('hidden');
        content.classList.toggle('hidden', !hasResults);
        empty.classList.toggle('hidden', hasResults);
    };

    const setError = () => {
        page.setAttribute('aria-busy', 'false');
        summaryLoading.classList.add('hidden');
        summaryContent.classList.add('hidden');
        loading.classList.add('hidden');
        content.classList.add('hidden');
        empty.classList.add('hidden');
        error.classList.remove('hidden');
        retry.disabled = false;
    };

    const updateSummary = () => {
        page.querySelectorAll('[data-admin-products-summary]').forEach((target) => {
            const value = Number(summary[target.dataset.adminProductsSummary]);

            target.textContent = Number.isFinite(value) ? String(value) : '0';
        });

        page.querySelectorAll('[data-admin-products-status-count]').forEach((target) => {
            const value = Number(summary[target.dataset.adminProductsStatusCount]);

            target.textContent = Number.isFinite(value) ? String(value) : '0';
        });

        attention.textContent = String(Number(summary.low_stock) || 0);
        totalLabel.textContent = String(Number(summary.total) || products.length);
    };

    const updateMainTabs = () => {
        mainTabs.forEach((tab) => {
            const isActive = tab.dataset.adminProductsMainTab === activeMainTab;

            tab.classList.toggle('border-orange-500', isActive);
            tab.classList.toggle('text-[#0B1930]', isActive);
            tab.classList.toggle('border-transparent', !isActive);
            tab.classList.toggle('text-slate-500', !isActive);
            tab.setAttribute('aria-selected', String(isActive));
        });

        mainPanels.forEach((mainPanel) => {
            mainPanel.classList.toggle(
                'hidden',
                mainPanel.dataset.adminProductsMainPanel !== activeMainTab,
            );
        });
    };

    const updateStatusTabs = () => {
        statusTabs.forEach((tab) => {
            const isActive = tab.dataset.adminProductsStatusTab === activeStatusTab;

            tab.classList.toggle('border-orange-500', isActive);
            tab.classList.toggle('text-[#0B1930]', isActive);
            tab.classList.toggle('border-transparent', !isActive);
            tab.classList.toggle('text-slate-500', !isActive);
            tab.setAttribute('aria-selected', String(isActive));
        });
    };

    const createProductRow = (product) => {
        const row = createAdminProductElement('tr', 'transition hover:bg-slate-50/80');
        const productCell = createAdminProductElement('td', 'min-w-64 px-5 py-3.5');
        const productWrap = createAdminProductElement('div', 'flex items-center gap-3');
        const placeholder = createAdminProductElement('span', 'inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 ring-1 ring-inset ring-slate-200');
        const icon = createAdminProductElement('i', 'fa-solid fa-box text-sm');
        const productName = createAdminProductElement('span', 'font-semibold text-[#0B1930]', product.name);
        const cells = [
            productCell,
            createAdminProductElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm font-medium text-slate-700', product.part_number),
            createAdminProductElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600', product.brand),
            createAdminProductElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600', product.category),
            createAdminProductElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-[#0B1930]', product.price),
            createAdminProductElement('td', 'whitespace-nowrap px-5 py-3.5'),
            createAdminProductElement('td', 'whitespace-nowrap px-5 py-3.5'),
            createAdminProductElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-500', product.updated),
            createAdminProductElement('td', 'whitespace-nowrap px-5 py-3.5'),
        ];
        const manage = createAdminProductElement('button', 'inline-flex min-h-8 cursor-pointer items-center justify-center rounded-lg border border-orange-400 px-3 text-xs font-semibold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500', 'Manage');

        icon.setAttribute('aria-hidden', 'true');
        placeholder.append(icon);
        productWrap.append(placeholder, productName);
        productCell.append(productWrap);
        cells[5].append(createAdminProductBadge(
            product.availability,
            adminAvailabilityClasses[product.availability] ?? adminAvailabilityClasses.Unavailable,
        ));
        cells[6].append(createAdminProductBadge(
            product.status,
            adminRecordStatusClasses[product.status] ?? adminRecordStatusClasses.Inactive,
        ));
        manage.type = 'button';
        manage.dataset.adminProductId = String(product.id);
        manage.setAttribute('aria-label', `Manage ${product.name}`);
        cells[8].append(manage);
        row.append(...cells);

        return row;
    };

    const getFilteredProducts = () => {
        const searchValue = search.value.trim().toLowerCase();
        const tabAvailability = availabilityByTab[activeStatusTab];

        return products.filter((product) => {
            const matchesSearch = !searchValue
                || product.name.toLowerCase().includes(searchValue)
                || product.part_number.toLowerCase().includes(searchValue);
            const matchesBrand = brand.value === 'all' || product.brand === brand.value;
            const matchesCategory = category.value === 'all' || product.category === category.value;
            const matchesAvailability = availability.value === 'all' || product.availability === availability.value;
            const matchesStatus = status.value === 'all' || product.status === status.value;
            const matchesTab = activeStatusTab === 'archived'
                ? product.status === 'Archived'
                : (!tabAvailability || product.availability === tabAvailability);

            return matchesSearch && matchesBrand && matchesCategory && matchesAvailability && matchesStatus && matchesTab;
        }).sort((firstProduct, secondProduct) => {
            if (sort.value === 'updated') {
                return new Date(secondProduct.date_value).getTime() - new Date(firstProduct.date_value).getTime();
            }

            return firstProduct.name.localeCompare(secondProduct.name);
        });
    };

    const renderProducts = () => {
        const filteredProducts = getFilteredProducts();
        const hasFilters = activeStatusTab !== 'all'
            || search.value.trim() !== ''
            || brand.value !== 'all'
            || category.value !== 'all'
            || availability.value !== 'all'
            || status.value !== 'all';

        body.replaceChildren(...filteredProducts.map(createProductRow));
        showing.textContent = filteredProducts.length > 0 ? `1–${filteredProducts.length}` : '0';
        total.textContent = String(hasFilters
            ? filteredProducts.length
            : (Number(summary.total) || filteredProducts.length));
        setProductResults(filteredProducts.length > 0);
    };

    const createManagementRow = (record, label) => {
        const row = createAdminProductElement('tr', 'transition hover:bg-slate-50/80');
        const manage = createAdminProductElement('button', 'inline-flex min-h-8 cursor-pointer items-center justify-center rounded-lg border border-orange-400 px-3 text-xs font-semibold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500', 'Manage');
        const statusBadge = createAdminProductBadge(
            record.status,
            adminRecordStatusClasses[record.status] ?? adminRecordStatusClasses.Inactive,
        );

        manage.type = 'button';
        manage.dataset.adminProductManagement = `${label}-${record.id}`;
        row.append(
            createAdminProductElement('td', 'px-5 py-3.5 text-sm font-semibold text-[#0B1930]', record.name),
            createAdminProductElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm font-medium text-slate-600', record.products),
            createAdminProductElement('td', 'whitespace-nowrap px-5 py-3.5'),
            createAdminProductElement('td', 'whitespace-nowrap px-5 py-3.5'),
        );
        row.children[2].append(statusBadge);
        row.children[3].append(manage);

        return row;
    };

    const renderManagementRecords = () => {
        categoriesBody.replaceChildren(...categories.map((item) => createManagementRow(item, 'category')));
        brandsBody.replaceChildren(...brands.map((item) => createManagementRow(item, 'brand')));
    };

    const renderMotorcycleModels = () => {
        const searchValue = modelSearch.value.trim().toLowerCase();
        const models = motorcycleModels.filter((model) => {
            const matchesSearch = !searchValue || model.model.toLowerCase().includes(searchValue);
            const matchesBrand = modelBrand.value === 'all' || model.brand === modelBrand.value;

            return matchesSearch && matchesBrand;
        });

        if (models.length === 0) {
            const row = document.createElement('tr');
            const cell = createAdminProductElement('td', 'px-5 py-10 text-center text-sm text-slate-500', 'No motorcycle models found.');

            cell.colSpan = 6;
            row.append(cell);
            modelsBody.replaceChildren(row);
            return;
        }

        modelsBody.replaceChildren(...models.map((model) => {
            const row = createAdminProductElement('tr', 'transition hover:bg-slate-50/80');
            const manage = createAdminProductElement('button', 'inline-flex min-h-8 cursor-pointer items-center justify-center rounded-lg border border-orange-400 px-3 text-xs font-semibold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500', 'Manage');
            const statusBadge = createAdminProductBadge(
                model.status,
                adminRecordStatusClasses[model.status] ?? adminRecordStatusClasses.Inactive,
            );

            manage.type = 'button';
            manage.dataset.adminMotorcycleModelId = String(model.id);
            row.append(
                createAdminProductElement('td', 'px-5 py-3.5 text-sm font-semibold text-[#0B1930]', model.model),
                createAdminProductElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600', model.brand),
                createAdminProductElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm text-slate-600', model.series),
                createAdminProductElement('td', 'whitespace-nowrap px-5 py-3.5 text-sm font-medium text-slate-700', `${model.compatible_products} compatible products`),
                createAdminProductElement('td', 'whitespace-nowrap px-5 py-3.5'),
                createAdminProductElement('td', 'whitespace-nowrap px-5 py-3.5'),
            );
            row.children[4].append(statusBadge);
            row.children[5].append(manage);

            return row;
        }));
    };

    const clearFilters = () => {
        activeStatusTab = 'all';
        search.value = '';
        brand.value = 'all';
        category.value = 'all';
        availability.value = 'all';
        status.value = 'all';
        sort.value = 'name';
        updateStatusTabs();
        renderProducts();
    };

    const loadProducts = async () => {
        setLoading();

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
                throw new Error(`Admin products request failed with status ${response.status}.`);
            }

            const data = await response.json();

            if (!data?.summary || !Array.isArray(data.products) || !Array.isArray(data.categories) || !Array.isArray(data.brands) || !Array.isArray(data.motorcycle_models)) {
                throw new Error('Admin products response has an invalid structure.');
            }

            summary = data.summary;
            products = data.products;
            categories = data.categories;
            brands = data.brands;
            motorcycleModels = data.motorcycle_models;
            updateSummary();
            renderProducts();
            renderManagementRecords();
            renderMotorcycleModels();
            page.setAttribute('aria-busy', 'false');
            summaryLoading.classList.add('hidden');
            summaryContent.classList.remove('hidden');
            error.classList.add('hidden');
            retry.disabled = false;
        } catch (loadError) {
            console.error('Unable to load Admin Products.', loadError);
            setError();
        }
    };

    mainTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            activeMainTab = tab.dataset.adminProductsMainTab ?? 'products';
            updateMainTabs();
        });
    });

    statusTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            activeStatusTab = tab.dataset.adminProductsStatusTab ?? 'all';
            updateStatusTabs();
            renderProducts();
        });
    });

    search.addEventListener('input', renderProducts);
    brand.addEventListener('change', renderProducts);
    category.addEventListener('change', renderProducts);
    availability.addEventListener('change', renderProducts);
    status.addEventListener('change', renderProducts);
    sort.addEventListener('change', renderProducts);
    clear.addEventListener('click', clearFilters);
    modelSearch.addEventListener('input', renderMotorcycleModels);
    modelBrand.addEventListener('change', renderMotorcycleModels);
    retry.addEventListener('click', loadProducts);

    loadProducts();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminProducts);
} else {
    initializeAdminProducts();
}
