import Chart from 'chart.js/auto';

const chartRegistry = {};
const pesoFormatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
});

const createReportChart = (canvas, configuration) => {
    const chartKey = canvas.dataset.reportChart ?? canvas.dataset.reportSparkline;

    chartRegistry[chartKey]?.destroy();
    chartRegistry[chartKey] = new Chart(canvas, configuration);
};

const destroyCharts = () => {
    Object.values(chartRegistry).forEach((chart) => chart.destroy());
    Object.keys(chartRegistry).forEach((key) => delete chartRegistry[key]);
};

const chartOptions = ({ currency = false, legend = false } = {}) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: legend,
            position: 'right',
            labels: { boxWidth: 10, font: { size: 11 } },
        },
        tooltip: {
            callbacks: currency
                ? { label: (context) => `${context.dataset.label ?? ''}: ${pesoFormatter.format(context.raw)}` }
                : {},
        },
    },
    scales: {
        x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
        y: {
            beginAtZero: true,
            grid: { color: '#e2e8f0' },
            ticks: {
                color: '#64748b',
                font: { size: 10 },
                callback: currency ? (value) => pesoFormatter.format(value) : undefined,
            },
        },
    },
});

const initializeStaffReports = () => {
    const page = document.querySelector('[data-staff-reports]');

    if (!page) {
        return;
    }

    const endpoint = page.dataset.reportsEndpoint;
    const periodSelect = page.querySelector('[data-reports-period]');
    const summaryLoading = page.querySelector('[data-reports-summary-loading]');
    const summaryContent = page.querySelector('[data-reports-summary-content]');
    const chartCards = [...page.querySelectorAll('[data-report-chart-card]')];
    const error = page.querySelector('[data-reports-error]');
    const retry = page.querySelector('[data-reports-retry]');
    const insightCards = [...page.querySelectorAll('[data-report-insight]')];

    if (!endpoint || !periodSelect || !summaryLoading || !summaryContent || !error || !retry) {
        return;
    }

    const setLoading = () => {
        summaryLoading.classList.remove('hidden');
        summaryContent.classList.add('hidden');
        error.classList.add('hidden');
        chartCards.forEach((card) => {
            card.querySelector('[data-report-chart-loading]')?.classList.remove('hidden');
            card.querySelector('[data-report-chart-content]')?.classList.add('hidden');
            card.querySelector('[data-report-chart-empty]')?.classList.add('hidden');
        });
        insightCards.forEach((card) => card.classList.add('hidden'));
        retry.disabled = true;
    };

    const setSuccess = () => {
        summaryLoading.classList.add('hidden');
        summaryContent.classList.remove('hidden');
        error.classList.add('hidden');
        retry.disabled = false;
    };

    const setError = () => {
        summaryLoading.classList.add('hidden');
        summaryContent.classList.add('hidden');
        chartCards.forEach((card) => card.querySelector('[data-report-chart-loading]')?.classList.add('hidden'));
        error.classList.remove('hidden');
        retry.disabled = false;
    };

    const updateSummary = (summary) => {
        const currencyKeys = new Set(['total_sales', 'average_order_value']);

        page.querySelectorAll('[data-report-summary]').forEach((target) => {
            const key = target.dataset.reportSummary;
            const value = Number(summary[key] ?? 0);

            target.textContent = currencyKeys.has(key)
                ? pesoFormatter.format(value)
                : String(value);
        });

        page.querySelectorAll('[data-report-support]').forEach((target) => {
            const key = target.dataset.reportSupport;
            const value = Number(summary[key] ?? 0);
            const isCompletionRate = key === 'completion_rate';

            target.textContent = isCompletionRate ? `${value}%` : `↑ ${value}%`;
            const label = page.querySelector(`[data-report-support-label="${key}"]`);

            if (label) {
                label.textContent = isCompletionRate ? 'completion rate' : 'vs previous period';
            }
        });
    };

    const renderSparklines = (summary) => {
        const series = {
            sales: [18, 22, 20, 27, 24, 31, 29],
            orders: [8, 12, 10, 16, 14, 19, 18],
            customers: [5, 8, 7, 11, 10, 14, 13],
            average: [12, 15, 14, 17, 16, 19, 18],
            completed: [9, 11, 12, 14, 13, 17, 16],
        };
        const colors = {
            sales: '#0B1930', orders: '#f97316', customers: '#16a34a', average: '#2563eb', completed: '#16a34a',
        };

        page.querySelectorAll('[data-report-sparkline]').forEach((canvas) => {
            const key = canvas.dataset.reportSparkline;
            const values = series[key] ?? [];

            createReportChart(canvas, {
                type: 'line',
                data: {
                    labels: values.map((_, index) => index + 1),
                    datasets: [{ data: values, borderColor: colors[key], borderWidth: 2, pointRadius: 0, tension: 0.35 }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                    scales: { x: { display: false }, y: { display: false } },
                },
            });
        });
    };

    const displayChart = (key, hasData = true) => {
        const card = page.querySelector(`[data-report-chart-card="${key}"]`);

        card?.querySelector(`[data-report-chart-loading="${key}"]`)?.classList.add('hidden');
        card?.querySelector(`[data-report-chart-content="${key}"]`)?.classList.toggle('hidden', !hasData);
        card?.querySelector(`[data-report-chart-empty="${key}"]`)?.classList.toggle('hidden', hasData);
    };

    const renderCharts = (data) => {
        const sales = data.sales_over_time ?? [];
        const statuses = data.orders_by_status ?? [];
        const branches = data.sales_by_branch ?? [];
        const products = data.top_products ?? [];
        const customers = data.customer_breakdown ?? [];
        const comparison = data.sales_vs_orders ?? [];

        if (sales.length) {
            createReportChart(page.querySelector('[data-report-chart="sales-over-time"]'), {
                type: 'line',
                data: { labels: sales.map((item) => item.label), datasets: [{ label: 'Sales', data: sales.map((item) => item.sales), borderColor: '#0B1930', backgroundColor: '#0B1930', borderWidth: 2.5, pointBackgroundColor: '#f97316', pointRadius: 3, tension: 0.35 }] },
                options: chartOptions({ currency: true }),
            });
        }
        displayChart('sales-over-time', sales.length > 0);

        if (statuses.length) {
            createReportChart(page.querySelector('[data-report-chart="orders-by-status"]'), {
                type: 'doughnut',
                data: { labels: statuses.map((item) => item.label), datasets: [{ data: statuses.map((item) => item.value), backgroundColor: statuses.map((item) => item.color), borderWidth: 2, borderColor: '#fff' }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } }, cutout: '62%' },
            });
        }
        displayChart('orders-by-status', statuses.length > 0);

        if (branches.length) {
            createReportChart(page.querySelector('[data-report-chart="sales-by-branch"]'), {
                type: 'bar',
                data: { labels: branches.map((item) => item.branch), datasets: [{ label: 'Sales', data: branches.map((item) => item.sales), backgroundColor: ['#0B1930', '#2563eb', '#60a5fa'], borderRadius: 5 }] },
                options: { ...chartOptions({ currency: true }), indexAxis: 'y' },
            });
        }
        displayChart('sales-by-branch', branches.length > 0);

        if (products.length) {
            createReportChart(page.querySelector('[data-report-chart="top-products"]'), {
                type: 'bar',
                data: { labels: products.map((item) => item.label), datasets: [{ label: 'Sales', data: products.map((item) => item.sales), backgroundColor: '#0B1930', borderRadius: 5 }] },
                options: chartOptions({ currency: true }),
            });
        }
        displayChart('top-products', products.length > 0);

        if (customers.length) {
            createReportChart(page.querySelector('[data-report-chart="customer-breakdown"]'), {
                type: 'doughnut',
                data: { labels: customers.map((item) => item.label), datasets: [{ data: customers.map((item) => item.value), backgroundColor: customers.map((item) => item.color), borderWidth: 2, borderColor: '#fff' }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } }, cutout: '62%' },
            });
        }
        displayChart('customer-breakdown', customers.length > 0);

        if (comparison.length) {
            createReportChart(page.querySelector('[data-report-chart="sales-vs-orders"]'), {
                data: { labels: comparison.map((item) => item.label), datasets: [{ type: 'bar', label: 'Sales', data: comparison.map((item) => item.sales), backgroundColor: '#0B1930', borderRadius: 4, yAxisID: 'sales' }, { type: 'line', label: 'Orders', data: comparison.map((item) => item.orders), borderColor: '#f97316', backgroundColor: '#f97316', tension: 0.35, pointRadius: 3, yAxisID: 'orders' }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 10, font: { size: 11 } } }, tooltip: { callbacks: { label: (context) => context.dataset.yAxisID === 'sales' ? `Sales: ${pesoFormatter.format(context.raw)}` : `Orders: ${context.raw}` } } }, scales: { x: { grid: { display: false } }, sales: { position: 'left', beginAtZero: true, ticks: { callback: (value) => pesoFormatter.format(value) }, grid: { color: '#e2e8f0' } }, orders: { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false } } } },
            });
        }
        displayChart('sales-vs-orders', comparison.length > 0);
    };

    const renderInsights = (insights) => {
        insightCards.forEach((card) => {
            const key = card.dataset.reportInsight;
            const insight = insights[key];

            if (!insight) return;

            card.querySelector(`[data-report-insight-value="${key}"]`).textContent = insight.value ?? '';
            card.querySelector(`[data-report-insight-support="${key}"]`).textContent = insight.supporting ?? '';
            card.classList.remove('hidden');
        });
    };

    const loadReports = async () => {
        setLoading();
        destroyCharts();

        try {
            const url = new URL(endpoint, window.location.origin);
            url.searchParams.set('period', periodSelect.value);
            const response = await fetch(url, { method: 'GET', credentials: 'same-origin', headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });

            if (!response.ok) throw new Error(`Reports request failed with status ${response.status}.`);

            const data = await response.json();

            if (!data || !data.summary || !Array.isArray(data.sales_over_time) || !data.insights) throw new Error('Reports response has an invalid structure.');

            updateSummary(data.summary);
            renderSparklines(data.summary);
            renderCharts(data);
            renderInsights(data.insights);
            setSuccess();
        } catch (loadError) {
            console.error('Unable to load Staff Reports.', loadError);
            setError();
        }
    };

    periodSelect.addEventListener('change', loadReports);
    retry.addEventListener('click', loadReports);
    window.addEventListener('beforeunload', destroyCharts, { once: true });

    loadReports();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStaffReports);
} else {
    initializeStaffReports();
}
