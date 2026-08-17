<tr class="border-b border-slate-200">
    @foreach ([
        'Order',
        'Customer',
        'Date',
        'Amount',
        'Fulfillment',
        'Payment',
        'Status',
        'Action',
    ] as $column)
        <th
            scope="col"
            class="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
            {{ $column }}
        </th>
    @endforeach

    <th
        scope="col"
        class="w-14 px-5 py-3"
    >
        <span class="sr-only">More actions</span>
    </th>
</tr>
