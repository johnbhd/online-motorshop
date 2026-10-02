"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import ActionButton from "@/components/staff/ActionButton";
import PortalPagination from "@/components/staff/PortalPagination";
import { Badge } from "@/components/staff/PortalTable";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import Summary from "@/components/staff/Summary";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getStaffCustomers,
  getStaffCustomersErrorMessage,
} from "./staffCustomersApi";
import type { StaffCustomerSummary } from "./staffCustomersTypes";
import RealStaffCustomerDetailsModal from "./RealStaffCustomerDetailsModal";

const PAGE_SIZE = 10;

const customerTypeTabs = [
  { label: "All", value: "" },
  { label: "Registered", value: "registered" },
  { label: "Guest", value: "guest" },
];

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
});

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : dateFormatter.format(date);
}

function formatType(value: StaffCustomerSummary["type"]) {
  return value === "registered" ? "Registered" : "Guest";
}

function displayValue(value: string | null | undefined) {
  return value?.trim() || "Not provided";
}

export default function CustomersPage() {
  const { isLoading: isAuthLoading, user } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [type, setType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [response, setResponse] = useState<Awaited<ReturnType<typeof getStaffCustomers>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (isAuthLoading || user?.role !== "staff") {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      const token = getAuthToken();

      if (!token) {
        setResponse(null);
        setIsLoading(false);
        setError("Your Staff session has expired. Please sign in again.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const nextResponse = await getStaffCustomers(token, {
          search: searchInput,
          type,
          page: currentPage,
          perPage: PAGE_SIZE,
          signal: controller.signal,
        });

        setResponse(nextResponse);

        if (
          nextResponse.meta.last_page > 0 &&
          currentPage > nextResponse.meta.last_page
        ) {
          setCurrentPage(nextResponse.meta.last_page);
        }
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        setResponse(null);
        setError(
          getStaffCustomersErrorMessage(
            requestError,
            "Staff customers could not be loaded. Please try again.",
          ),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [currentPage, isAuthLoading, reloadNonce, searchInput, type, user?.role]);

  const openCustomerDetails = useCallback((customer: StaffCustomerSummary) => {
    setSelectedCustomerId(customer.id);
  }, []);

  const closeCustomerDetails = useCallback(() => {
    setSelectedCustomerId(null);
  }, []);

  const summaryItems = useMemo(() => {
    const summary = response?.summary;

    return [
      [String(summary?.total ?? "—"), "Total Customers", "Branch-visible records"],
      [String(summary?.registered ?? "—"), "Registered", "Linked customer accounts"],
      [String(summary?.guest ?? "—"), "Guest", "Guest checkout records"],
      [String(summary?.active_orders ?? "—"), "Active Orders", "Orders still in workflow"],
    ] as [string, string, string][];
  }, [response?.summary]);

  const customers = response?.customers ?? [];
  const description = response
    ? `${response.meta.total} customer record${response.meta.total === 1 ? "" : "s"} with activity in your branch`
    : "Real customer records with activity in your branch";

  return (
    <div className="space-y-5">
      <StaffPageHeader
        eyebrow="Customer Directory"
        title="Customers"
        description="Review real customer records and branch-relevant ordering activity."
      />

      <Summary items={summaryItems} />

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5">
          <div className="flex min-w-max gap-6 overflow-x-auto">
            {customerTypeTabs.map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => {
                  setType(tab.value);
                  setCurrentPage(1);
                }}
                className={`min-h-14 border-b-2 text-sm font-semibold ${type === tab.value ? "border-orange-500 text-[#0B1930]" : "border-transparent text-slate-500 hover:text-[#0B1930]"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#0B1930]">
              Customer List
            </h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>

          <label className="relative block w-full sm:w-80">
            <span
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400"
              aria-hidden="true"
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} className="h-3.5 w-3.5" />
            </span>
            <span className="sr-only">Search Staff customers</span>
            <input
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search name, contact, or email"
              className="h-10 w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </label>
        </div>

        {error ? (
          <div className="px-6 py-14 text-center" role="alert">
            <p className="font-semibold text-[#0B1930]">Unable to load customers</p>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => setReloadNonce((nonce) => nonce + 1)}
              className="mt-5 rounded-lg bg-[#0B1930] px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <CustomerListLoadingState />
        ) : customers.length ? (
          <CustomerList
            customers={customers}
            onViewCustomer={openCustomerDetails}
          />
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="font-semibold text-[#0B1930]">
              {searchInput || type
                ? "No customers match your search."
                : "No customers found."}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Customers appear here after they have an order in your branch.
            </p>
          </div>
        )}

        {!error && response ? (
          <PortalPagination
            currentPage={response.meta.current_page}
            totalItems={response.meta.total}
            pageSize={response.meta.per_page}
            itemLabel="customers"
            onPageChange={setCurrentPage}
          />
        ) : null}
      </section>

      {selectedCustomerId !== null ? (
        <RealStaffCustomerDetailsModal
          key={selectedCustomerId}
          customerId={selectedCustomerId}
          onClose={closeCustomerDetails}
        />
      ) : null}
    </div>
  );
}

function CustomerList({
  customers,
  onViewCustomer,
}: {
  customers: StaffCustomerSummary[];
  onViewCustomer: (customer: StaffCustomerSummary) => void;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1120px] border-collapse text-left">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Customer",
                "Type",
                "Contact",
                "Branch",
                "Orders",
                "Active Orders",
                "Last Order",
                "Action",
              ].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((customer) => (
              <tr key={customer.id} className="transition hover:bg-slate-50/80">
                <td className="px-5 py-3.5 align-middle">
                  <CustomerIdentity customer={customer} />
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 align-middle">
                  <Badge>{formatType(customer.type)}</Badge>
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 align-middle text-sm text-slate-600">
                  {displayValue(customer.contact)}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 align-middle text-sm text-slate-600">
                  {customer.branch.name}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 align-middle text-sm text-slate-700">
                  {customer.orders}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 align-middle text-sm text-slate-700">
                  {customer.active_orders}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 align-middle text-sm text-slate-600">
                  {customer.last_order
                    ? formatDate(customer.last_order.created_at)
                    : "Not available"}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 align-middle">
                  <ActionButton
                    label="View Customer"
                    onClick={() => onViewCustomer(customer)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-200 md:hidden">
        {customers.map((customer) => (
          <article key={customer.id} className="space-y-4 px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <CustomerIdentity customer={customer} />
              <Badge>{formatType(customer.type)}</Badge>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  Contact
                </dt>
                <dd className="mt-1 text-slate-700">{displayValue(customer.contact)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  Branch
                </dt>
                <dd className="mt-1 text-slate-700">{customer.branch.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  Orders
                </dt>
                <dd className="mt-1 font-semibold text-[#0B1930]">{customer.orders}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  Active
                </dt>
                <dd className="mt-1 font-semibold text-[#0B1930]">{customer.active_orders}</dd>
              </div>
            </dl>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                Last order: {customer.last_order ? formatDate(customer.last_order.created_at) : "Not available"}
              </p>
              <ActionButton
                label="View"
                onClick={() => onViewCustomer(customer)}
              />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function CustomerIdentity({ customer }: { customer: StaffCustomerSummary }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <i className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold not-italic text-[#0B1930]">
        {customer.initials}
      </i>
      <span className="min-w-0">
        <b className="block truncate text-[#0B1930]">{customer.name}</b>
        <small className="block max-w-56 truncate text-slate-500">
          {displayValue(customer.email)}
        </small>
      </span>
    </span>
  );
}

function CustomerListLoadingState() {
  return (
    <div className="space-y-3 px-6 py-8" aria-live="polite" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="motion-safe:animate-pulse h-14 rounded-lg bg-slate-100"
        />
      ))}
      <span className="sr-only">Loading Staff customers</span>
    </div>
  );
}
