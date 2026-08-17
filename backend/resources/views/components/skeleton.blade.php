@props([
    'type' => 'text',
    'rows' => 3,
    'lines' => 2,
    'columns' => 6,
])

@php
    $supportedTypes = ['stat', 'list', 'table-row', 'text', 'circle'];
    $type = in_array($type, $supportedTypes, true) ? $type : 'text';
    $rows = max(1, min((int) $rows, 10));
    $lines = max(1, min((int) $lines, 6));
    $columns = max(1, min((int) $columns, 12));
@endphp

@switch($type)
    @case('stat')
        <div
            {{ $attributes->class('rounded-xl border border-slate-200 bg-white p-5 shadow-sm') }}
            aria-hidden="true"
        >
            <div class="motion-safe:animate-pulse">
                <div class="flex items-start justify-between gap-4">
                    <span class="size-11 shrink-0 rounded-full bg-slate-200"></span>
                    <span class="h-9 w-12 rounded-md bg-slate-200"></span>
                </div>

                <div class="mt-5 h-4 w-36 max-w-full rounded bg-slate-200"></div>
                <div class="mt-2 h-3 w-48 max-w-[85%] rounded bg-slate-200"></div>
            </div>
        </div>
        @break

    @case('list')
        <div
            {{ $attributes->class('rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6') }}
            aria-hidden="true"
        >
            <div class="motion-safe:animate-pulse">
                <div class="h-4 w-40 max-w-[70%] rounded bg-slate-200"></div>

                <div class="mt-4 divide-y divide-slate-100">
                    @for ($rowIndex = 0; $rowIndex < $rows; $rowIndex++)
                        <div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                            <span class="size-9 shrink-0 rounded-full bg-slate-200"></span>

                            <div class="min-w-0 flex-1 space-y-2">
                                <div
                                    @class([
                                        'h-3 rounded bg-slate-200',
                                        'w-4/5' => $rowIndex % 3 === 0,
                                        'w-3/4' => $rowIndex % 3 === 1,
                                        'w-2/3' => $rowIndex % 3 === 2,
                                    ])
                                ></div>

                                <div
                                    @class([
                                        'h-2.5 rounded bg-slate-200',
                                        'w-1/2' => $rowIndex % 2 === 0,
                                        'w-2/5' => $rowIndex % 2 === 1,
                                    ])
                                ></div>
                            </div>

                            <span class="h-5 w-10 shrink-0 rounded-full bg-slate-200"></span>
                        </div>
                    @endfor
                </div>
            </div>
        </div>
        @break

    @case('table-row')
        <tr
            {{ $attributes->class('border-b border-slate-100 last:border-b-0') }}
            aria-hidden="true"
        >
            @if ($columns === 6)
                <td class="px-6 py-4">
                    <div class="h-3 w-32 rounded bg-slate-200 motion-safe:animate-pulse"></div>
                </td>
                <td class="px-6 py-4">
                    <div class="h-3 w-24 rounded bg-slate-200 motion-safe:animate-pulse"></div>
                </td>
                <td class="px-6 py-4">
                    <div class="space-y-2 motion-safe:animate-pulse">
                        <div class="h-3 w-44 rounded bg-slate-200"></div>
                        <div class="h-2.5 w-28 rounded bg-slate-200"></div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="h-6 w-28 rounded-full bg-slate-200 motion-safe:animate-pulse"></div>
                </td>
                <td class="px-6 py-4">
                    <div class="h-3 w-16 rounded bg-slate-200 motion-safe:animate-pulse"></div>
                </td>
                <td class="px-6 py-4">
                    <div class="h-3 w-20 rounded bg-slate-200 motion-safe:animate-pulse"></div>
                </td>
            @else
                @for ($columnIndex = 0; $columnIndex < $columns; $columnIndex++)
                    <td class="px-5 py-4">
                        <div
                            @class([
                                'rounded bg-slate-200 motion-safe:animate-pulse',
                                'h-3 w-32' => $columnIndex === 0,
                                'h-3 w-24' => $columnIndex === 1,
                                'h-3 w-20' => $columnIndex === 2,
                                'h-3 w-16' => $columnIndex === 3,
                                'h-3 w-28' => $columnIndex === 4,
                                'h-6 w-24 rounded-full' => in_array($columnIndex, [5, 6], true),
                                'h-8 w-24 rounded-lg' => $columnIndex === 7,
                                'size-8 rounded-lg' => $columnIndex >= 8,
                            ])
                        ></div>
                    </td>
                @endfor
            @endif
        </tr>
        @break

    @case('circle')
        <span
            {{ $attributes->class('inline-block size-10 shrink-0 rounded-full bg-slate-200 motion-safe:animate-pulse') }}
            aria-hidden="true"
        ></span>
        @break

    @default
        <div
            {{ $attributes->class('space-y-2 motion-safe:animate-pulse') }}
            aria-hidden="true"
        >
            @for ($lineIndex = 0; $lineIndex < $lines; $lineIndex++)
                <div
                    @class([
                        'h-3 rounded bg-slate-200',
                        'w-full' => $lineIndex % 3 === 0,
                        'w-4/5' => $lineIndex % 3 === 1,
                        'w-2/3' => $lineIndex % 3 === 2,
                    ])
                ></div>
            @endfor
        </div>
@endswitch
