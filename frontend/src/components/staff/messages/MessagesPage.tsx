"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import PortalPagination from "@/components/staff/PortalPagination";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getStaffConversation,
  getStaffConversations,
  sendStaffConversationMessage,
} from "@/lib/messages/conversationApi";
import type {
  Conversation,
  StaffConversationSummary,
} from "@/lib/messages/conversationTypes";
import {
  formatConversationTime,
  getConversationInitials,
  getLastConversationMessage,
} from "@/lib/messages/conversationUtils";

type ConversationFilter = "all" | "open";
const PAGE_SIZE = 20;

export default function MessagesPage() {
  const [items, setItems] = useState<StaffConversationSummary[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [summary, setSummary] = useState({
    total: 0,
    open: 0,
    needs_reply: 0,
  });
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: PAGE_SIZE,
    total: 0,
  });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState("");
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    const token = getAuthToken();

    if (!token) {
      setError("Your staff session has expired. Please sign in again.");
      setLoading(false);
      return;
    }

    try {
      const response = await getStaffConversations(token, {
        search: query,
        status: filter,
        page,
        perPage: PAGE_SIZE,
      });
      setItems(response.conversations);
      setSummary(response.summary);
      setMeta(response.meta);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load conversations.",
      );
    } finally {
      setLoading(false);
    }
  }, [filter, page, query]);

  useEffect(() => {
    const loadTimeout = window.setTimeout(() => void loadList(), 0);
    const interval = window.setInterval(() => void loadList(), 10000);
    const refresh = () => void loadList();
    window.addEventListener("focus", refresh);
    window.addEventListener("staff-data-updated", refresh);

    return () => {
      window.clearTimeout(loadTimeout);
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("staff-data-updated", refresh);
    };
  }, [loadList]);

  const loadSelected = useCallback(async () => {
    if (selectedId === null) return;
    const token = getAuthToken();
    if (!token) return;

    setDetailLoading(true);
    try {
      setSelected(await getStaffConversation(token, selectedId));
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load this conversation.",
      );
    } finally {
      setDetailLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    const loadTimeout = window.setTimeout(() => void loadSelected(), 0);
    if (selectedId === null) return;
    const interval = window.setInterval(() => void loadSelected(), 10000);
    return () => {
      window.clearTimeout(loadTimeout);
      window.clearInterval(interval);
    };
  }, [loadSelected, selectedId]);

  useEffect(() => {
    if (selectedId === null && items[0]) {
      const selectTimeout = window.setTimeout(() => {
        setSelectedId(items[0].id);
        setMobileThreadOpen(true);
      }, 0);

      return () => window.clearTimeout(selectTimeout);
    }

    return undefined;
  }, [items, selectedId]);

  const conversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((conversation) => {
      const lastMessage = getLastConversationMessage(conversation);
      const searchableText = [
        conversation.participant.name,
        conversation.participant.email ?? "",
        lastMessage?.body ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        !normalizedQuery || searchableText.includes(normalizedQuery);
      const matchesFilter =
        filter === "all" || conversation.status === filter;

      return matchesQuery && matchesFilter;
    });
  }, [filter, items, query]);

  const activeConversation = selected;

  useEffect(() => {
    if (!activeConversation || !threadRef.current) {
      return;
    }

    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [activeConversation]);

  const chooseConversation = (conversationId: number) => {
    setSelectedId(conversationId);
    setMobileThreadOpen(true);
  };

  const handleBackToConversations = () => {
    setMobileThreadOpen(false);
  };

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedDraft = draft.trim();
    const token = getAuthToken();

    if (!activeConversation || !normalizedDraft || !token) {
      return;
    }

    setReplying(true);
    try {
      setSelected(
        await sendStaffConversationMessage(
          token,
          activeConversation.id,
          normalizedDraft,
        ),
      );
      await loadList();
      setDraft("");
      setError(null);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to send the reply.",
      );
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="space-y-5">
      <StaffPageHeader
        eyebrow="Customer Support"
        title="Messages"
        description="Respond to customer conversations started through Talk to ALD Staff."
      />
      {error && (
        <div
          className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          <span>{error}</span>
          <button type="button" className="font-semibold underline" onClick={() => void loadList()}>
            Retry
          </button>
        </div>
      )}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid min-h-[620px] lg:grid-cols-[22rem_minmax(0,1fr)]">
          <aside
            className={
              mobileThreadOpen
                ? "hidden border-r border-slate-200 lg:block"
                : "block border-r border-slate-200"
            }
          >
            <div className="border-b border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-[#0B1930]">Conversations</h2>
                <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-bold text-orange-700">
                  {summary.total} total
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {summary.needs_reply} awaiting staff reply
              </p>
              <label className="sr-only" htmlFor="staff-message-search">
                Search conversations
              </label>
              <input
                id="staff-message-search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                className="mt-4 min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-orange-400"
                placeholder="Search conversations"
              />
              <label className="sr-only" htmlFor="staff-message-filter">
                Filter conversations
              </label>
              <select
                id="staff-message-filter"
                value={filter}
                onChange={(event) => {
                  setFilter(event.target.value as ConversationFilter);
                  setPage(1);
                }}
                className="mt-3 min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              >
                <option value="all">All conversations</option>
                <option value="open">Open</option>
              </select>
            </div>
            <div className="max-h-[530px] overflow-y-auto">
              {loading && (
                <p className="p-6 text-center text-sm text-slate-500">
                  Loading conversations...
                </p>
              )}
              {!loading &&
                conversations.map((conversation) => {
                  const lastMessage = getLastConversationMessage(conversation);
                  const isSelected =
                    activeConversation?.id === conversation.id;

                  return (
                  <button
                    onClick={() => chooseConversation(conversation.id)}
                    type="button"
                    key={conversation.id}
                    aria-pressed={isSelected}
                    className={
                      isSelected
                        ? "flex w-full gap-3 border-l-4 border-orange-500 bg-orange-50 px-4 py-4 text-left"
                        : "flex w-full gap-3 border-l-4 border-transparent px-4 py-4 text-left hover:bg-slate-50"
                    }
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      {getConversationInitials(conversation.participant.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <b className="min-w-0 flex-1 truncate text-sm text-[#0B1930]">
                          {conversation.participant.name}
                        </b>
                      </span>
                      <span className="mt-1 block truncate text-sm text-slate-500">
                        {lastMessage?.body ?? "No messages yet"}
                      </span>
                      <span className="mt-2 flex items-center justify-between gap-2">
                        <small className="text-slate-400">
                          {formatConversationTime(
                            conversation.last_message_at ?? conversation.updated_at,
                          )}
                        </small>
                        <i className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold not-italic text-blue-700">
                          Open
                        </i>
                      </span>
                    </span>
                  </button>
                  );
                })}
              {!loading && !conversations.length && (
                <p className="p-6 text-center text-sm text-slate-500">
                  {items.length
                    ? "No conversations found."
                    : "No conversations yet. Customer conversations will appear here when someone requests staff assistance."}
                </p>
              )}
            </div>
            <div className="border-t border-slate-200 px-4 py-3">
              <PortalPagination
                currentPage={meta.current_page}
                totalItems={meta.total}
                pageSize={meta.per_page}
                onPageChange={setPage}
                itemLabel="conversations"
              />
            </div>
          </aside>

          <section
            className={
              mobileThreadOpen
                ? "flex min-h-[620px] flex-col"
                : "hidden min-h-[620px] flex-col lg:flex"
            }
          >
            {activeConversation ? (
              <>
                <header className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
                  <button
                    className="grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
                    type="button"
                    aria-label="Back to conversations"
                    onClick={handleBackToConversations}
                  >
                    <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
                  </button>
                  <span className="grid size-10 place-items-center rounded-full bg-[#0B1930] text-xs font-bold text-white">
                    {getConversationInitials(
                      activeConversation.participant.name,
                    )}
                  </span>
                  <div>
                    <h2 className="font-semibold text-[#0B1930]">
                      {activeConversation.participant.name}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {activeConversation.participant_type === "customer"
                        ? "Registered Customer"
                        : "Guest"}{" "}
                      · Open
                    </p>
                  </div>
                </header>
                <div
                  ref={threadRef}
                  className="flex-1 space-y-4 overflow-y-auto bg-slate-50/50 p-5"
                  role="log"
                  aria-live="polite"
                  aria-label={
                    "Conversation with " + activeConversation.participant.name
                  }
                >
                  {detailLoading && (
                    <p className="text-center text-xs text-slate-500" role="status">
                      Refreshing conversation...
                    </p>
                  )}
                  {activeConversation.messages.length ? (
                    activeConversation.messages.map((message) => {
                      const isStaffMessage = message.sender === "staff";

                      return (
                        <div
                          key={message.id}
                          className={
                            isStaffMessage
                              ? "flex justify-end"
                              : "flex justify-start"
                          }
                        >
                          <div
                            className={
                              isStaffMessage
                                ? "max-w-[82%] rounded-2xl rounded-br-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-slate-800 sm:max-w-[70%]"
                                : "max-w-[82%] rounded-2xl rounded-bl-md bg-slate-200/80 px-4 py-3 text-sm text-slate-800 sm:max-w-[70%]"
                            }
                          >
                            <p className="mb-1 text-[11px] font-semibold text-slate-500">
                              {isStaffMessage
                                ? "ALD Staff"
                                : activeConversation.participant.name}
                            </p>
                            <p>{message.body}</p>
                            <p className="mt-1.5 text-right text-[11px] text-slate-500">
                              {formatConversationTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex h-full items-center justify-center text-center">
                      <p className="max-w-sm text-sm text-slate-500">
                        No messages yet. The customer can send a message from
                        the ALD Assistant.
                      </p>
                    </div>
                  )}
                </div>
                <form
                  onSubmit={handleSend}
                  className="flex gap-3 border-t border-slate-200 p-4"
                >
                  <label className="sr-only" htmlFor="staff-message-reply">
                    Reply to {activeConversation.participant.name}
                  </label>
                  <input
                    id="staff-message-reply"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    className="min-h-11 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-orange-400"
                    placeholder="Write a reply..."
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className="min-h-11 rounded-lg bg-orange-500 px-5 text-sm font-semibold text-white hover:bg-orange-600"
                  >
                    {replying ? "Sending..." : "Send"}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <h2 className="text-lg font-semibold text-[#0B1930]">
                  Select a conversation
                </h2>
                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  Choose a customer conversation from the list to view and
                  reply.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
