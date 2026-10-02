"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getCustomerOrders,
  getOrderApiErrorMessage,
} from "@/lib/orders/orderApi";
import { toCustomerOrderSummary } from "@/lib/orders/orderAdapter";
import type { CustomerOrderSummary } from "@/lib/orders/orderTypes";
import OrdersEmptyState from "./OrdersEmptyState";
import OrdersMobileList from "./OrdersMobileList";
import OrdersPagination from "./OrdersPagination";
import OrdersTable from "./OrdersTable";
import OrdersTabs from "./OrdersTabs";
import { ORDERS_PER_PAGE, type CustomerOrderTab } from "./customerOrderUtils";

type OrderListMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type TabCounts = Record<CustomerOrderTab, number | null>;

const initialTabCounts: TabCounts = {
  active: null,
  history: null,
};

export default function MyOrdersPage() {
  const { isLoading: isAuthLoading, user } = useAuth();
  const isCustomer = user?.role === "customer";
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [activeTab, setActiveTab] = useState<CustomerOrderTab>("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<OrderListMeta | null>(null);
  const [tabCounts, setTabCounts] = useState<TabCounts>(initialTabCounts);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (isAuthLoading || !isCustomer) {
      return;
    }

    const token = getAuthToken();

    if (!token) {
      // The auth token is external browser state; reflect its absence before starting the request.
      /* eslint-disable react-hooks/set-state-in-effect */
      setError("Your session has expired. Please sign in again.");
      setIsLoading(false);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }

    const controller = new AbortController();

    setIsLoading(true);
    setError("");
    setOrders([]);
    setMeta(null);

    getCustomerOrders(token, {
      scope: activeTab,
      page: currentPage,
      perPage: ORDERS_PER_PAGE,
      signal: controller.signal,
    })
      .then((response) => {
        if (controller.signal.aborted) {
          return;
        }

        setOrders(response.orders.map(toCustomerOrderSummary));
        setMeta(response.meta);
        setTabCounts((currentCounts) => ({
          ...currentCounts,
          [activeTab]: response.meta.total,
        }));
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setOrders([]);
        setMeta(null);
        setError(
          getOrderApiErrorMessage(
            requestError,
            "We could not load your orders. Please try again.",
          ),
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [activeTab, currentPage, isAuthLoading, isCustomer, retryKey]);

  const handleTabChange = (tab: CustomerOrderTab) => {
    if (tab === activeTab) {
      return;
    }

    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    const lastPage = meta?.last_page ?? 1;
    const nextPage = Math.min(Math.max(page, 1), lastPage);

    if (nextPage !== currentPage) {
      setCurrentPage(nextPage);
    }
  };

  if (isAuthLoading || !isCustomer || isLoading) {
    return (
      <div className="customer-orders-page">
        <section className="customer-orders-loading" aria-live="polite">
          Loading your orders…
        </section>
      </div>
    );
  }

  const totalItems = meta?.total ?? 0;
  const totalPages = meta?.last_page ?? 1;
  const startIndex = meta ? (meta.current_page - 1) * meta.per_page : 0;
  const endIndex = startIndex + orders.length;

  return (
    <div className="customer-orders-page">
      <section
        className="customer-orders-hero"
        aria-labelledby="customer-orders-page-title"
      >
        <div className="customer-orders-shell">
          <p className="customer-orders-eyebrow">Customer Account</p>
          <h1 id="customer-orders-page-title">My Orders</h1>
          <p>
            View and manage your current and previous ALD Motorshop order requests.
          </p>
        </div>
      </section>

      <div className="customer-orders-shell customer-orders-content">
        <OrdersTabs
          activeTab={activeTab}
          activeCount={tabCounts.active}
          historyCount={tabCounts.history}
          onTabChange={handleTabChange}
        />

        <section
          className="customer-orders-panel"
          id={`customer-orders-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`customer-orders-tab-${activeTab}`}
          tabIndex={0}
        >
          <div className="customer-orders-panel-header">
            <div>
              <p className="customer-orders-eyebrow">
                {activeTab === "active" ? "In Progress" : "Completed Requests"}
              </p>
              <h2>
                {activeTab === "active" ? "Active Orders" : "Order History"}
              </h2>
            </div>
            <span className="customer-orders-count">
              {totalItems} {totalItems === 1 ? "order" : "orders"}
            </span>
          </div>

          {error ? (
            <section className="customer-orders-error" role="alert">
              <h2>Orders unavailable</h2>
              <p>{error}</p>
              <button
                className="customer-orders-primary-link"
                type="button"
                onClick={() => setRetryKey((currentKey) => currentKey + 1)}
              >
                Try again
              </button>
            </section>
          ) : orders.length === 0 ? (
            <OrdersEmptyState tab={activeTab} />
          ) : (
            <>
              <OrdersTable orders={orders} />
              <OrdersMobileList orders={orders} />
              <OrdersPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
