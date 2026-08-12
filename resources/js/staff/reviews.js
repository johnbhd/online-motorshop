const reviewStatusStyles = {
    Published: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    'Pending Review': 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200',
    Flagged: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
    Hidden: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
};

const statusByTab = {
    all: null,
    published: 'Published',
    pending_review: 'Pending Review',
    flagged: 'Flagged',
    hidden: 'Hidden',
};

const setText = (element, value) => {
    if (element) {
        element.textContent = value;
    }
};

const createElement = (tagName, className = '') => {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    return element;
};

const createCell = (className = '') => createElement('td', `px-5 py-4 align-middle ${className}`);

const createRating = (rating) => {
    const wrapper = createElement('div', 'flex items-center gap-0.5 text-sm');
    wrapper.setAttribute('aria-label', `${rating} out of 5 stars`);

    for (let star = 1; star <= 5; star += 1) {
        const icon = createElement(
            'i',
            star <= rating ? 'fa-solid fa-star text-orange-400' : 'fa-regular fa-star text-slate-300',
        );
        icon.setAttribute('aria-hidden', 'true');
        wrapper.append(icon);
    }

    const value = createElement('span', 'ml-1.5 font-semibold text-slate-700');
    value.textContent = `${rating}.0`;
    wrapper.append(value);

    return wrapper;
};

const createReviewRow = (review) => {
    const row = document.createElement('tr');
    row.className = 'transition hover:bg-slate-50/80';

    const customerCell = createCell();
    const customer = createElement('div', 'flex min-w-36 items-center gap-3');
    const avatar = createElement(
        'span',
        'inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#0B1930] text-xs font-bold text-white',
    );
    avatar.textContent = review.initials;
    const customerName = createElement('p', 'whitespace-nowrap font-semibold text-[#0B1930]');
    customerName.textContent = review.customer;
    customer.append(avatar, customerName);
    customerCell.append(customer);

    const productCell = createCell('min-w-52');
    const product = createElement('p', 'max-w-56 text-sm font-medium leading-5 text-slate-700');
    product.title = review.product;
    product.textContent = review.product;
    productCell.append(product);

    const ratingCell = createCell('whitespace-nowrap');
    ratingCell.append(createRating(Number(review.rating)));

    const reviewCell = createCell('min-w-64');
    const preview = createElement('p', 'max-w-72 truncate text-sm leading-5 text-slate-600');
    preview.title = review.review;
    preview.textContent = review.review;
    reviewCell.append(preview);

    const branchCell = createCell('whitespace-nowrap text-sm font-medium text-slate-600');
    branchCell.textContent = `${review.branch} Branch`;

    const statusCell = createCell('whitespace-nowrap');
    const status = createElement(
        'span',
        `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${reviewStatusStyles[review.status] ?? reviewStatusStyles.Hidden}`,
    );
    status.textContent = review.status;
    statusCell.append(status);

    const dateCell = createCell('whitespace-nowrap text-sm font-medium text-slate-600');
    dateCell.textContent = review.date;

    const actionCell = createCell('whitespace-nowrap');
    const action = createElement(
        'button',
        'inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-orange-300 px-3 text-xs font-bold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
    );
    action.type = 'button';
    action.dataset.reviewId = review.id;
    action.textContent = review.action;
    actionCell.append(action);

    row.append(
        customerCell,
        productCell,
        ratingCell,
        reviewCell,
        branchCell,
        statusCell,
        dateCell,
        actionCell,
    );

    return row;
};

document.querySelectorAll('[data-staff-reviews]').forEach((container) => {
    const endpoint = container.dataset.reviewsEndpoint;
    const summaryLoading = container.querySelector('[data-reviews-summary-loading]');
    const summaryContent = container.querySelector('[data-reviews-summary-content]');
    const panel = container.querySelector('[data-reviews-panel]');
    const loading = container.querySelector('[data-reviews-loading]');
    const content = container.querySelector('[data-reviews-content]');
    const empty = container.querySelector('[data-reviews-empty]');
    const error = container.querySelector('[data-reviews-error]');
    const body = container.querySelector('[data-reviews-body]');
    const search = container.querySelector('[data-reviews-search]');
    const rating = container.querySelector('[data-reviews-rating]');
    const product = container.querySelector('[data-reviews-product]');
    const branch = container.querySelector('[data-reviews-branch]');
    const date = container.querySelector('[data-reviews-date]');
    const sort = container.querySelector('[data-reviews-sort]');
    const clear = container.querySelector('[data-reviews-clear]');
    const retry = container.querySelector('[data-reviews-retry]');
    const tabs = [...container.querySelectorAll('[data-reviews-tab]')];
    let reviews = [];
    let reviewSummary = null;
    let activeTab = 'all';

    const showState = (state) => {
        const isLoading = state === 'loading';
        loading.classList.toggle('hidden', !isLoading);
        content.classList.toggle('hidden', state !== 'content');
        empty.classList.toggle('hidden', state !== 'empty');
        error.classList.toggle('hidden', state !== 'error');
        panel.setAttribute('aria-busy', String(isLoading));
    };

    const updateTabs = () => {
        tabs.forEach((tab) => {
            const isActive = tab.dataset.reviewsTab === activeTab;
            tab.setAttribute('aria-selected', String(isActive));
            tab.classList.toggle('border-orange-500', isActive);
            tab.classList.toggle('text-[#0B1930]', isActive);
            tab.classList.toggle('border-transparent', !isActive);
            tab.classList.toggle('text-slate-500', !isActive);
        });
    };

    const filteredReviews = () => {
        const searchTerm = search.value.trim().toLowerCase();
        const requiredStatus = statusByTab[activeTab];

        return reviews
            .filter((review) => {
                const matchesSearch = !searchTerm || [
                    review.customer,
                    review.product,
                    review.review,
                    review.order_reference ?? '',
                ].some((value) => value.toLowerCase().includes(searchTerm));

                return matchesSearch
                    && (rating.value === 'all' || Number(rating.value) === Number(review.rating))
                    && (product.value === 'all' || product.value === review.product)
                    && (branch.value === 'all' || branch.value === review.branch)
                    && (date.value === 'all' || date.value === review.date_value)
                    && (!requiredStatus || review.status === requiredStatus);
            })
            .sort((first, second) => {
                const comparison = second.date_value.localeCompare(first.date_value);

                return sort.value === 'oldest' ? comparison * -1 : comparison;
            });
    };

    const renderReviews = () => {
        const matchingReviews = filteredReviews();
        body.replaceChildren(...matchingReviews.map(createReviewRow));
        setText(container.querySelector('[data-reviews-showing]'), matchingReviews.length ? `1–${matchingReviews.length}` : '0');
        setText(container.querySelector('[data-reviews-total]'), reviewSummary?.total ?? reviews.length);
        showState(matchingReviews.length ? 'content' : 'empty');
    };

    const updateSummary = (summary) => {
        Object.entries(summary).forEach(([key, value]) => {
            container.querySelectorAll(`[data-reviews-summary="${key}"], [data-reviews-tab-count="${key}"]`).forEach((element) => {
                element.textContent = value;
            });
        });

        setText(container.querySelector('[data-reviews-panel-total]'), summary.total);
        setText(container.querySelector('[data-reviews-attention-count]'), summary.needs_admin_review);
    };

    const loadReviews = async () => {
        summaryLoading.classList.remove('hidden');
        summaryContent.classList.add('hidden');
        showState('loading');

        try {
            const response = await fetch(endpoint, {
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Unable to load reviews.');
            }

            const payload = await response.json();

            if (!payload.summary || !Array.isArray(payload.reviews)) {
                throw new Error('Invalid review data.');
            }

            reviews = payload.reviews;
            reviewSummary = payload.summary;
            updateSummary(payload.summary);
            summaryLoading.classList.add('hidden');
            summaryContent.classList.remove('hidden');
            renderReviews();
        } catch (loadError) {
            summaryLoading.classList.add('hidden');
            summaryContent.classList.add('hidden');
            showState('error');
        }
    };

    [search, rating, product, branch, date, sort].forEach((control) => {
        control.addEventListener(control === search ? 'input' : 'change', renderReviews);
    });

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            activeTab = tab.dataset.reviewsTab;
            updateTabs();
            renderReviews();
        });
    });

    clear.addEventListener('click', () => {
        search.value = '';
        rating.value = 'all';
        product.value = 'all';
        branch.value = 'all';
        date.value = 'all';
        sort.value = 'newest';
        activeTab = 'all';
        updateTabs();
        renderReviews();
    });

    retry.addEventListener('click', loadReviews);
    loadReviews();
});
