@extends('layouts.admin')

@section('title', 'Admin Messages | ALD Motorshop')

@section('content')
    <div
        class="space-y-5"
        data-admin-messages
        data-messages-endpoint="{{ route('admin.messages.data') }}"
    >
        <section
            class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
            aria-labelledby="messages-page-heading"
        >
            <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
                    Customer Communication
                </p>

                <h2
                    id="messages-page-heading"
                    class="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl"
                >
                    Website Messages
                </h2>

                <p class="mt-2 text-sm text-slate-600 sm:text-base">
                    View and respond to customer conversations across ALD Motorshop.
                </p>
            </div>

            <div
                class="inline-flex min-h-11 w-fit items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-800"
            >
                <span
                    class="inline-flex size-8 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm"
                    aria-hidden="true"
                >
                    <i class="fa-regular fa-envelope"></i>
                </span>

                <span>
                    <strong data-messages-unread-count>5</strong>
                    unread conversations
                </span>
            </div>
        </section>

        <section
            class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            aria-label="Message filters"
        >
            <div class="flex gap-3">
                <label class="relative block min-w-0 basis-0 flex-1">
                    <span class="sr-only">Search conversations</span>

                    <i
                        class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                        aria-hidden="true"
                    ></i>

                    <input
                        type="search"
                        class="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-[#0B1930] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        placeholder="Search conversations"
                        data-messages-search
                    >
                </label>

                <label class="relative block min-w-0 basis-0">
                    <span class="sr-only">Filter by message status</span>

                    <select
                        class="min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        data-messages-filter
                    >
                        <option value="all">All Messages</option>
                        <option value="unread">Unread</option>
                        <option value="Open">Open</option>
                        <option value="Resolved">Resolved</option>
                    </select>

                    <i
                        class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                        aria-hidden="true"
                    ></i>
                </label>
            </div>
        </section>

        <section
            class="min-h-[38rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            aria-busy="true"
            data-messages-panel
        >
            <div class="flex h-[calc(100vh-17rem)] min-h-[38rem] flex-col gap-3 p-3 lg:flex-row">
                <aside
                    class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 lg:w-[35%] lg:shrink-0"
                    data-conversation-list-panel
                >
                    <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                        <div>
                            <h2 class="text-lg font-semibold text-[#0B1930]">
                                Conversations
                            </h2>

                            <p class="mt-0.5 text-sm text-slate-500">
                                <span data-messages-total>24</span>
                                conversations
                            </p>
                        </div>

                        <span class="text-xs font-semibold text-slate-500">
                            Newest
                        </span>
                    </div>

                    <div
                        class="flex-1 overflow-y-auto"
                        role="status"
                        aria-live="polite"
                        data-messages-loading
                    >
                        <span class="sr-only">Loading conversations.</span>

                        <div class="space-y-3 p-4">
                            <x-skeleton
                                type="list"
                                :rows="4"
                            />
                            <x-skeleton
                                type="list"
                                :rows="3"
                            />
                        </div>
                    </div>

                    <div
                        class="hidden flex-1 overflow-y-auto"
                        data-conversations
                    ></div>

                    <div
                        class="hidden flex-1 px-6 py-16 text-center"
                        data-messages-no-conversations
                    >
                        <span
                            class="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"
                            aria-hidden="true"
                        >
                            <i class="fa-regular fa-message text-xl"></i>
                        </span>

                        <h3 class="mt-4 font-semibold text-[#0B1930]">
                            No messages yet
                        </h3>

                        <p class="mt-1 text-sm text-slate-500">
                            Customer conversations will appear here.
                        </p>
                    </div>
                </aside>

                <div
                    class="hidden min-h-0 flex-1 lg:flex"
                    data-message-panel
                >
                    <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200">
                        <div class="flex items-center gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
                            <button
                                type="button"
                                class="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 lg:hidden"
                                aria-label="Back to conversations"
                                data-messages-back
                            >
                                <i
                                    class="fa-solid fa-arrow-left"
                                    aria-hidden="true"
                                ></i>
                            </button>

                            <span
                                class="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0B1930] text-sm font-bold text-white"
                                data-selected-initials
                            >
                                MR
                            </span>

                            <div class="min-w-0 flex-1">
                                <h2
                                    class="truncate text-lg font-semibold text-[#0B1930]"
                                    data-selected-name
                                >
                                    Mark Reyes
                                </h2>

                                <p
                                    class="truncate text-sm text-slate-500"
                                    data-selected-context
                                >
                                    Customer Inquiry
                                </p>
                            </div>

                            <span
                                class="hidden rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 sm:inline-flex"
                                data-selected-status
                            >
                                Open
                            </span>

                            <button
                                type="button"
                                class="inline-flex size-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[#0B1930] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                                aria-label="Conversation options"
                            >
                                <i
                                    class="fa-solid fa-ellipsis-vertical"
                                    aria-hidden="true"
                                ></i>
                            </button>
                        </div>

                        <div
                            class="flex-1 space-y-4 overflow-y-auto bg-slate-50/60 p-5 sm:p-6"
                            data-message-history
                        ></div>

                        <form
                            class="border-t border-slate-200 bg-white p-4 sm:p-5"
                            data-reply-form
                        >
                            <label
                                class="sr-only"
                                for="admin-reply"
                            >
                                Type your reply
                            </label>

                            <div class="flex flex-col gap-3 sm:flex-row">
                                <textarea
                                    id="admin-reply"
                                    rows="2"
                                    class="min-h-11 flex-1 resize-none rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#0B1930] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                    placeholder="Type your reply..."
                                    data-reply-input
                                ></textarea>

                                <button
                                    type="submit"
                                    class="inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                                >
                                    <i
                                        class="fa-solid fa-paper-plane"
                                        aria-hidden="true"
                                    ></i>

                                    <span>Send Reply</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div
                class="hidden px-6 py-20 text-center"
                role="alert"
                data-messages-error
            >
                <span
                    class="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-red-50 text-red-500"
                    aria-hidden="true"
                >
                    <i class="fa-solid fa-triangle-exclamation text-xl"></i>
                </span>

                <h2 class="mt-4 font-semibold text-[#0B1930]">
                    Unable to load messages
                </h2>

                <p class="mt-1 text-sm text-slate-500">
                    Please try again.
                </p>

                <button
                    type="button"
                    class="mt-5 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-orange-500 px-4 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    data-messages-retry
                >
                    Retry
                </button>
            </div>
        </section>
    </div>
@endsection
