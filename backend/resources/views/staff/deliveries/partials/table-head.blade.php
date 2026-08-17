<tr class="border-b border-slate-200">
    @foreach ([
        'Order', 'Customer', 'Destination', 'Amount', 'Payment', 'Delivery Status', 'Updated', 'Action',
    ] as $column)
        <th scope="col" class="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {{ $column }}
        </th>
    @endforeach
</tr>
