"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  ConversationApiError,
  getAdminConversation,
  getAdminConversations,
  sendAdminConversationMessage,
  type AdminConversationsResponse,
} from "@/lib/messages/conversationApi";
import type {
  AdminConversationSummary,
  Conversation,
  ConversationMessage,
} from "@/lib/messages/conversationTypes";

const PAGE_SIZE = 20;

function errorMessage(error: unknown): string {
  if (error instanceof ConversationApiError) {
    return error.message;
  }

  return "The conversations could not be loaded. Please try again.";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatTime(value: string | null): string {
  if (!value) {
    return "No messages yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function senderLabel(
  message: ConversationMessage,
  conversation: Conversation,
): string {
  if (message.sender === "admin") {
    return "ALD Administrator";
  }

  if (message.sender === "staff") {
    return message.sender_name
      ? `ALD Staff · ${message.sender_name}`
      : "ALD Staff";
  }

  return conversation.participant.name;
}

export default function AdminMessages() {
  const token = getAuthToken() ?? "";
  const [conversations, setConversations] = useState<AdminConversationSummary[]>([]);
  const [summary, setSummary] = useState<AdminConversationsResponse["summary"]>({
    total: 0,
    open: 0,
    needs_reply: 0,
  });
  const [meta, setMeta] = useState<AdminConversationsResponse["meta"]>({
    current_page: 1,
    last_page: 1,
    per_page: PAGE_SIZE,
    total: 0,
  });
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [needsReplyOnly, setNeedsReplyOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);
  const initialSelectionHandled = useRef(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(query.trim()), 250);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const loadConversations = useCallback(
    async (signal: AbortSignal) => {
      try {
        const result = await getAdminConversations(token, {
          search,
          needsReply: needsReplyOnly,
          page,
          perPage: PAGE_SIZE,
          signal,
        });

        if (signal.aborted) {
          return;
        }

        setConversations(result.conversations);
        setSummary(result.summary);
        setMeta(result.meta);

        if (!initialSelectionHandled.current) {
          initialSelectionHandled.current = true;
          setSelectedId(result.conversations[0]?.id ?? null);
        }
      } catch (error) {
        if (!signal.aborted) {
          setListError(errorMessage(error));
        }
      } finally {
        if (!signal.aborted) {
          setListLoading(false);
        }
      }
    },
    [needsReplyOnly, page, search, token],
  );

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadConversations(controller.signal));

    return () => controller.abort();
  }, [loadConversations, refreshKey]);

  useEffect(() => {
    if (selectedId === null) {
      return;
    }

    const controller = new AbortController();

    void getAdminConversation(token, selectedId, controller.signal)
      .then((conversation) => setActiveConversation(conversation))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setDetailError(errorMessage(error));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setDetailLoading(false);
        }
      });

    return () => controller.abort();
  }, [detailRefreshKey, selectedId, token]);

  function handleSearchChange(value: string) {
    const resetsPage = page !== 1;
    setQuery(value);
    setPage(1);

    if (search !== value.trim() || resetsPage) {
      setSelectedId(null);
      setActiveConversation(null);
      setDetailLoading(false);
      setDetailError(null);
      setListLoading(true);
      setListError(null);
    } else {
      setListLoading(false);
      setListError(null);
    }
  }

  function handleNeedsReplyChange(value: boolean) {
    setNeedsReplyOnly(value);
    setPage(1);
    setSelectedId(null);
    setActiveConversation(null);
    setDetailLoading(false);
    setDetailError(null);
    setListLoading(true);
    setListError(null);
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage);
    setSelectedId(null);
    setActiveConversation(null);
    setDetailLoading(false);
    setDetailError(null);
    setListLoading(true);
    setListError(null);
  }

  function selectConversation(conversationId: number) {
    if (sending) {
      return;
    }

    setSelectedId(conversationId);
    setActiveConversation(null);
    setDetailLoading(true);
    setDetailError(null);
    setSendError(null);
    setDraft("");
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();

    if (!token || selectedId === null || !body || sending) {
      return;
    }

    setSending(true);
    setSendError(null);

    try {
      const updatedConversation = await sendAdminConversationMessage(
        token,
        selectedId,
        body,
      );

      setActiveConversation(updatedConversation);
      setDraft("");
      setListLoading(true);
      setListError(null);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setSendError(errorMessage(error));
    } finally {
      setSending(false);
    }
  }

  const selectedSummary = conversations.find((item) => item.id === selectedId);
  const listVisibleOnMobile = selectedId === null;
  const threadVisibleOnMobile = selectedId !== null;

  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">
          Customer Support
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl">
          Messages
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Review and reply to the shared customer conversations.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Conversations are not assigned to branches or Staff in the current system.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Conversation summary">
        <SummaryCard label="All conversations" value={summary.total} />
        <SummaryCard label="Open" value={summary.open} />
        <SummaryCard label="Needs reply" value={summary.needs_reply} />
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid min-h-[620px] lg:grid-cols-[22rem_minmax(0,1fr)]">
          <aside
            className={`border-r border-slate-200 ${listVisibleOnMobile ? "block" : "hidden lg:block"}`}
            aria-label="Conversation list"
          >
            <div className="space-y-4 border-b border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-[#0B1930]">Conversations</h2>
                <span className="text-xs text-slate-500">
                  {meta.total} total
                </span>
              </div>
              <label className="sr-only" htmlFor="admin-message-search">
                Search conversations
              </label>
              <input
                id="admin-message-search"
                value={query}
                onChange={(event) => handleSearchChange(event.target.value)}
                disabled={sending}
                className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                placeholder="Search name, contact, ID, or message"
                type="search"
              />
              <div className="flex gap-2" aria-label="Conversation filters">
                <FilterButton
                  active={!needsReplyOnly}
                  disabled={sending}
                  onClick={() => handleNeedsReplyChange(false)}
                >
                  All
                </FilterButton>
                <FilterButton
                  active={needsReplyOnly}
                  disabled={sending}
                  onClick={() => handleNeedsReplyChange(true)}
                >
                  Needs reply
                </FilterButton>
              </div>
            </div>

            {listError && (
              <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
                <p>{listError}</p>
                {token && (
                  <button
                    className="mt-2 font-semibold underline underline-offset-2"
                    onClick={() => {
                      setListLoading(true);
                      setListError(null);
                      setRefreshKey((current) => current + 1);
                    }}
                    type="button"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            {listLoading && conversations.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-500" role="status">
                Loading conversations…
              </p>
            ) : !listError && conversations.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-500">
                {needsReplyOnly || search
                  ? "No conversations match these filters."
                  : "No customer conversations yet."}
              </p>
            ) : (
              <div className="max-h-[530px] overflow-y-auto" aria-busy={listLoading}>
                {conversations.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    selected={conversation.id === selectedId}
                    disabled={sending}
                    onSelect={() => selectConversation(conversation.id)}
                  />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
              <button
                className="min-h-10 rounded-md px-3 font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={page <= 1 || listLoading || sending}
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                type="button"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <button
                className="min-h-10 rounded-md px-3 font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={page >= meta.last_page || listLoading || sending}
                onClick={() => handlePageChange(page + 1)}
                type="button"
              >
                Next
              </button>
            </div>
          </aside>

          <section
            className={`min-h-[620px] flex-col ${threadVisibleOnMobile ? "flex" : "hidden lg:flex"}`}
            aria-label="Conversation thread"
          >
            {activeConversation ? (
              <>
                <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
                  <button
                    className="min-h-10 rounded-md px-2 text-sm font-semibold text-[#0B1930] hover:bg-slate-100 lg:hidden"
                    disabled={sending}
                    onClick={() => {
                      setSelectedId(null);
                      setDetailLoading(false);
                    }}
                    type="button"
                  >
                    Back
                  </button>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#0B1930] text-xs font-bold text-white" aria-hidden="true">
                    {initials(activeConversation.participant.name) || "G"}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-[#0B1930]">
                      {activeConversation.participant.name}
                    </h2>
                    <p className="truncate text-xs text-slate-500">
                      {activeConversation.participant.email ??
                        `${activeConversation.participant_type === "guest" ? "Guest" : "Registered"} customer`}
                      {` · Conversation #${activeConversation.id}`}
                    </p>
                  </div>
                  <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                    Open
                  </span>
                </header>

                {detailError && (
                  <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
                    <p>{detailError}</p>
                    <button
                      className="mt-2 font-semibold underline underline-offset-2"
                      onClick={() => {
                        setDetailLoading(true);
                        setDetailError(null);
                        setDetailRefreshKey((current) => current + 1);
                      }}
                      type="button"
                    >
                      Retry
                    </button>
                  </div>
                )}

                <div
                  className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-4 sm:p-5"
                  role="log"
                  aria-live="polite"
                  aria-label={`Messages with ${activeConversation.participant.name}`}
                  aria-busy={detailLoading}
                >
                  {detailLoading && (
                    <p className="text-center text-xs text-slate-500" role="status">
                      Refreshing conversation…
                    </p>
                  )}
                  {activeConversation.messages.length > 0 ? (
                    activeConversation.messages.map((message) => {
                      const isAdminMessage = message.sender === "admin";

                      return (
                        <div
                          className={`flex ${isAdminMessage ? "justify-end" : "justify-start"}`}
                          key={message.id}
                        >
                          <div
                            className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm text-slate-800 sm:max-w-[72%] ${isAdminMessage ? "rounded-br-md border border-orange-200 bg-orange-50" : "rounded-bl-md bg-white shadow-sm ring-1 ring-slate-200"}`}
                          >
                            <p className="mb-1 text-[11px] font-semibold text-slate-500">
                              {senderLabel(message, activeConversation)}
                            </p>
                            <p className="whitespace-pre-wrap break-words">{message.body}</p>
                            <p className="mt-1.5 text-right text-[11px] text-slate-500">
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex h-full items-center justify-center text-center">
                      <p className="max-w-sm text-sm text-slate-500">
                        This conversation has no messages yet.
                      </p>
                    </div>
                  )}
                </div>

                {sendError && (
                  <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-800" role="alert">
                    {sendError}
                  </p>
                )}
                <form onSubmit={handleSend} className="border-t border-slate-200 p-4">
                  <label className="sr-only" htmlFor="admin-message-reply">
                    Write a reply as Admin
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <textarea
                      id="admin-message-reply"
                      className="min-h-11 min-w-0 flex-1 resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      maxLength={2000}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Write a reply as Admin…"
                      rows={2}
                      value={draft}
                    />
                    <button
                      className="min-h-11 rounded-lg bg-[#0B1930] px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!draft.trim() || sending || activeConversation.status !== "open"}
                      type="submit"
                    >
                      {sending ? "Sending…" : "Send reply"}
                    </button>
                  </div>
                  <p className="mt-2 text-right text-xs text-slate-500">
                    {draft.length}/2000 · Sent as Admin
                  </p>
                </form>
              </>
            ) : detailLoading ? (
              <p className="m-auto p-6 text-sm text-slate-500" role="status">
                Loading conversation…
              </p>
            ) : detailError ? (
              <div className="m-auto p-6 text-center text-sm text-slate-600">
                <p>{detailError}</p>
                <button
                  className="mt-3 font-semibold text-[#0B1930] underline underline-offset-2"
                  onClick={() => {
                    setDetailLoading(true);
                    setDetailError(null);
                    setDetailRefreshKey((current) => current + 1);
                  }}
                  type="button"
                >
                  Retry
                </button>
              </div>
            ) : selectedSummary ? (
              <p className="m-auto p-6 text-sm text-slate-500" role="status">
                Loading conversation details…
              </p>
            ) : (
              <p className="m-auto p-6 text-center text-sm text-slate-500">
                Select a conversation to read the shared thread.
              </p>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#0B1930]">{value}</p>
    </div>
  );
}

function FilterButton({
  active,
  children,
  disabled = false,
  onClick,
}: {
  active: boolean;
  children: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`min-h-10 rounded-full border px-3 text-sm font-semibold ${active ? "border-orange-200 bg-orange-50 text-orange-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function ConversationRow({
  conversation,
  selected,
  disabled,
  onSelect,
}: {
  conversation: AdminConversationSummary;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const lastMessage = conversation.last_message;
  const needsReply = lastMessage?.sender === "customer";

  return (
    <button
      aria-current={selected ? "true" : undefined}
      className={`flex min-h-[88px] w-full gap-3 border-l-4 px-4 py-4 text-left transition-colors ${selected ? "border-orange-500 bg-orange-50" : "border-transparent hover:bg-slate-50"}`}
      disabled={disabled}
      onClick={onSelect}
      type="button"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600" aria-hidden="true">
        {initials(conversation.participant.name) || "G"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#0B1930]">
            {conversation.participant.name}
          </span>
          {needsReply && (
            <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-800">
              Needs reply
            </span>
          )}
        </span>
        <span className="mt-1 block truncate text-sm text-slate-500">
          {lastMessage?.body ?? "No messages yet"}
        </span>
        <span className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-400">
          <span>#{conversation.id} · {conversation.message_count} messages</span>
          <span className="shrink-0">{formatTime(conversation.last_message_at)}</span>
        </span>
      </span>
    </button>
  );
}
