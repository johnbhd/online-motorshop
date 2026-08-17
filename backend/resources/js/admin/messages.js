const adminMessageStatusClasses = {
    New: ['bg-orange-50', 'text-orange-700', 'ring-orange-200'],
    Open: ['bg-blue-50', 'text-blue-700', 'ring-blue-200'],
    Waiting: ['bg-amber-50', 'text-amber-700', 'ring-amber-200'],
    Resolved: ['bg-emerald-50', 'text-emerald-700', 'ring-emerald-200'],
};

const createAdminMessageElement = (tagName, className, text) => {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (text !== undefined && text !== null) {
        element.textContent = String(text);
    }

    return element;
};

const initializeAdminMessages = () => {
    const page = document.querySelector('[data-admin-messages]');

    if (!page) {
        return;
    }

    const endpoint = page.dataset.messagesEndpoint;
    const panel = page.querySelector('[data-messages-panel]');
    const loading = page.querySelector('[data-messages-loading]');
    const conversationsTarget = page.querySelector('[data-conversations]');
    const noConversations = page.querySelector('[data-messages-no-conversations]');
    const messagePanel = page.querySelector('[data-message-panel]');
    const error = page.querySelector('[data-messages-error]');
    const retry = page.querySelector('[data-messages-retry]');
    const search = page.querySelector('[data-messages-search]');
    const filter = page.querySelector('[data-messages-filter]');
    const total = page.querySelector('[data-messages-total]');
    const unread = page.querySelector('[data-messages-unread-count]');
    const selectedInitials = page.querySelector('[data-selected-initials]');
    const selectedName = page.querySelector('[data-selected-name]');
    const selectedContext = page.querySelector('[data-selected-context]');
    const selectedStatus = page.querySelector('[data-selected-status]');
    const history = page.querySelector('[data-message-history]');
    const form = page.querySelector('[data-reply-form]');
    const input = page.querySelector('[data-reply-input]');
    const back = page.querySelector('[data-messages-back]');

    if (!endpoint || !panel || !loading || !conversationsTarget || !noConversations || !messagePanel || !error || !retry || !search || !filter || !total || !unread || !selectedInitials || !selectedName || !selectedContext || !selectedStatus || !history || !form || !input || !back) {
        return;
    }

    let conversations = [];
    let summary = {};
    let selectedId = null;

    const setError = () => {
        panel.setAttribute('aria-busy', 'false');
        panel.querySelector(':scope > div')?.classList.add('hidden');
        error.classList.remove('hidden');
        retry.disabled = false;
    };

    const getFilteredConversations = () => {
        const searchValue = search.value.trim().toLowerCase();

        return conversations.filter((conversation) => {
            const name = String(conversation.customer?.name ?? '').toLowerCase();
            const preview = String(conversation.last_message ?? '').toLowerCase();
            const matchesSearch = !searchValue || name.includes(searchValue) || preview.includes(searchValue);
            const matchesStatus = filter.value === 'all'
                || (filter.value === 'unread' && conversation.unread)
                || conversation.status === filter.value;

            return matchesSearch && matchesStatus;
        });
    };

    const createStatusBadge = (status) => {
        const badge = createAdminMessageElement(
            'span',
            'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
            status,
        );

        badge.classList.add(...(
            adminMessageStatusClasses[status]
            ?? ['bg-slate-100', 'text-slate-600', 'ring-slate-200']
        ));

        return badge;
    };

    const renderMessages = (conversation) => {
        const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
        const nodes = messages.map((message) => {
            const isAdmin = message.sender === 'admin';
            const row = createAdminMessageElement(
                'div',
                `flex ${isAdmin ? 'justify-end' : 'justify-start'}`,
            );
            const bubble = createAdminMessageElement(
                'div',
                isAdmin
                    ? 'max-w-[82%] rounded-2xl rounded-br-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-slate-800 sm:max-w-[70%]'
                    : 'max-w-[82%] rounded-2xl rounded-bl-md bg-slate-200/80 px-4 py-3 text-sm text-slate-800 sm:max-w-[70%]',
            );
            const body = createAdminMessageElement('p', 'leading-5', message.message ?? '');
            const time = createAdminMessageElement(
                'p',
                'mt-1.5 text-right text-[11px] text-slate-500',
                message.time ?? '',
            );

            bubble.append(body, time);
            row.append(bubble);

            return row;
        });

        history.replaceChildren(...nodes);
        history.scrollTop = history.scrollHeight;
    };

    const updateUnread = () => {
        const unreadCount = conversations.filter((conversation) => conversation.unread).length;

        unread.textContent = String(unreadCount || Number(summary.unread) || 0);
    };

    const renderConversations = () => {
        const filteredConversations = getFilteredConversations();

        conversationsTarget.replaceChildren(...filteredConversations.map((conversation) => {
            const isActive = conversation.id === selectedId;
            const button = createAdminMessageElement(
                'button',
                isActive
                    ? 'flex w-full cursor-pointer gap-3 border-l-4 border-orange-500 bg-orange-50 px-4 py-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500'
                    : 'flex w-full cursor-pointer gap-3 border-l-4 border-transparent px-4 py-4 text-left transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500',
            );
            const avatar = createAdminMessageElement(
                'span',
                isActive
                    ? 'inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0B1930] text-xs font-bold text-white'
                    : 'inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600',
                conversation.customer?.initials ?? '',
            );
            const details = createAdminMessageElement('span', 'min-w-0 flex-1');
            const heading = createAdminMessageElement('span', 'flex items-center gap-2');
            const name = createAdminMessageElement(
                'span',
                'min-w-0 flex-1 truncate text-sm font-semibold text-[#0B1930]',
                conversation.customer?.name ?? '',
            );
            const preview = createAdminMessageElement(
                'span',
                'mt-1 block truncate text-sm text-slate-500',
                conversation.last_message ?? '',
            );
            const footer = createAdminMessageElement(
                'span',
                'mt-2 flex items-center justify-between gap-2',
            );
            const updated = createAdminMessageElement(
                'span',
                'text-xs text-slate-400',
                conversation.updated_at ?? '',
            );

            heading.append(name);

            if (conversation.unread) {
                heading.append(createAdminMessageElement(
                    'span',
                    'inline-flex size-2 shrink-0 rounded-full bg-orange-500',
                ));
            }

            footer.append(updated, createStatusBadge(conversation.status ?? ''));
            details.append(heading, preview, footer);
            button.append(avatar, details);
            button.type = 'button';
            button.dataset.conversationId = String(conversation.id);
            button.addEventListener('click', () => selectConversation(conversation.id));

            return button;
        }));

        conversationsTarget.classList.toggle('hidden', filteredConversations.length === 0);
        noConversations.classList.toggle('hidden', filteredConversations.length !== 0);
    };

    const selectConversation = (conversationId) => {
        selectedId = conversationId;
        const conversation = conversations.find(({ id }) => id === conversationId);

        if (!conversation) {
            return;
        }

        conversation.unread = false;
        selectedInitials.textContent = conversation.customer?.initials ?? '';
        selectedName.textContent = conversation.customer?.name ?? '';
        selectedContext.textContent = conversation.branch
            ? `Customer Inquiry · ${conversation.branch}`
            : 'Customer Inquiry';
        selectedStatus.textContent = conversation.status ?? '';
        selectedStatus.className = 'hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex';
        selectedStatus.classList.add(...(
            adminMessageStatusClasses[conversation.status]
            ?? ['bg-slate-100', 'text-slate-600']
        ));
        renderMessages(conversation);
        renderConversations();
        updateUnread();

        messagePanel.classList.remove('hidden');
        messagePanel.classList.add('flex');
        page.dataset.mobileView = 'conversation';
        page.querySelector('[data-conversation-list-panel]')?.classList.add('hidden', 'lg:flex');
    };

    const loadMessages = async () => {
        panel.setAttribute('aria-busy', 'true');
        panel.querySelector(':scope > div')?.classList.remove('hidden');
        error.classList.add('hidden');
        loading.classList.remove('hidden');
        conversationsTarget.classList.add('hidden');
        noConversations.classList.add('hidden');
        messagePanel.classList.add('hidden');
        page.querySelector('[data-conversation-list-panel]')?.classList.remove('hidden');
        retry.disabled = true;

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
                throw new Error(`Messages request failed with status ${response.status}.`);
            }

            const payload = await response.json();

            if (!payload || !payload.summary || !Array.isArray(payload.conversations)) {
                throw new Error('Messages response has an invalid structure.');
            }

            summary = payload.summary;
            conversations = payload.conversations;
            total.textContent = String(Number(summary.total) || conversations.length);
            updateUnread();
            loading.classList.add('hidden');
            panel.setAttribute('aria-busy', 'false');
            renderConversations();

            if (conversations[0]) {
                selectConversation(conversations[0].id);
            }
        } catch (loadError) {
            console.error('Unable to load Admin Messages.', loadError);
            setError();
        }
    };

    search.addEventListener('input', renderConversations);
    filter.addEventListener('change', renderConversations);
    back.addEventListener('click', () => {
        page.dataset.mobileView = 'list';
        messagePanel.classList.add('hidden');
        messagePanel.classList.remove('flex');
        page.querySelector('[data-conversation-list-panel]')?.classList.remove('hidden');
    });
    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const message = input.value.trim();
        const conversation = conversations.find(({ id }) => id === selectedId);

        if (!message || !conversation) {
            return;
        }

        conversation.messages.push({
            sender: 'admin',
            message,
            time: 'Just now',
        });
        conversation.last_message = message;
        conversation.updated_at = 'Just now';
        input.value = '';
        renderMessages(conversation);
        renderConversations();
    });
    retry.addEventListener('click', loadMessages);

    loadMessages();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminMessages);
} else {
    initializeAdminMessages();
}
