"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import {
  appendConversationMessage,
  CONVERSATIONS_STORAGE_KEY,
  CONVERSATIONS_UPDATED_EVENT,
  getConversations,
} from "@/lib/messages/conversationStorage";
import type { DemoConversation } from "@/lib/messages/conversationTypes";
import {
  formatConversationTime,
  getConversationInitials,
  getLastConversationMessage,
  sortConversationsByRecent,
} from "@/lib/messages/conversationUtils";

type ConversationFilter = "all" | "open";

export default function MessagesPage() {
  const [items, setItems] = useState<DemoConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const [draft, setDraft] = useState("");
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refreshConversations = () => {
      setItems(sortConversationsByRecent(getConversations()));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === CONVERSATIONS_STORAGE_KEY) {
        refreshConversations();
      }
    };

    refreshConversations();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(
      CONVERSATIONS_UPDATED_EVENT,
      refreshConversations,
    );

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        CONVERSATIONS_UPDATED_EVENT,
        refreshConversations,
      );
    };
  }, []);

  const conversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((conversation) => {
      const lastMessage = getLastConversationMessage(conversation);
      const searchableText = [
        conversation.participantName,
        conversation.participantEmail ?? "",
        lastMessage?.text ?? "",
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

  const activeConversation =
    conversations.find((conversation) => {
      return conversation.id === selectedId;
    }) ??
    conversations[0] ??
    null;

  useEffect(() => {
    if (!activeConversation || !threadRef.current) {
      return;
    }

    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [activeConversation]);

  const chooseConversation = (conversationId: string) => {
    setSelectedId(conversationId);
    setMobileThreadOpen(true);
  };

  const handleBackToConversations = () => {
    setMobileThreadOpen(false);
  };

  const handleSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeConversation) {
      return;
    }

    const normalizedDraft = draft.trim();

    if (!normalizedDraft) {
      return;
    }

    const updatedConversation = appendConversationMessage(
      activeConversation.id,
      "staff",
      normalizedDraft,
    );

    if (updatedConversation) {
      setItems(sortConversationsByRecent(getConversations()));
    }

    setDraft("");
  };

  return (
    <div className="space-y-5">
      <StaffPageHeader
        eyebrow="Customer Support"
        title="Messages"
        description="Respond to customer conversations started through Talk to ALD Staff."
      />
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
                  {items.length} total
                </span>
              </div>
              <label className="sr-only" htmlFor="staff-message-search">
                Search conversations
              </label>
              <input
                id="staff-message-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
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
                }}
                className="mt-3 min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              >
                <option value="all">All conversations</option>
                <option value="open">Open</option>
              </select>
            </div>
            <div className="max-h-[530px] overflow-y-auto">
              {conversations.map((conversation) => {
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
                      {getConversationInitials(conversation.participantName)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <b className="min-w-0 flex-1 truncate text-sm text-[#0B1930]">
                          {conversation.participantName}
                        </b>
                      </span>
                      <span className="mt-1 block truncate text-sm text-slate-500">
                        {lastMessage?.text ?? "No messages yet"}
                      </span>
                      <span className="mt-2 flex items-center justify-between gap-2">
                        <small className="text-slate-400">
                          {formatConversationTime(conversation.updatedAt)}
                        </small>
                        <i className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold not-italic text-blue-700">
                          Open
                        </i>
                      </span>
                    </span>
                  </button>
                );
              })}
              {!conversations.length && (
                <p className="p-6 text-center text-sm text-slate-500">
                  {items.length
                    ? "No conversations found."
                    : "No conversations yet. Customer conversations will appear here when someone requests staff assistance."}
                </p>
              )}
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
                      activeConversation.participantName,
                    )}
                  </span>
                  <div>
                    <h2 className="font-semibold text-[#0B1930]">
                      {activeConversation.participantName}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {activeConversation.participantType === "customer"
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
                    "Conversation with " + activeConversation.participantName
                  }
                >
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
                                : activeConversation.participantName}
                            </p>
                            <p>{message.text}</p>
                            <p className="mt-1.5 text-right text-[11px] text-slate-500">
                              {formatConversationTime(message.createdAt)}
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
                    Reply to {activeConversation.participantName}
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
                    Send
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
