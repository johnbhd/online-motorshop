"use client";

import { useEffect, useMemo, useState } from "react";
import type { DemoOrder } from "@/lib/orders/orderTypes";
import { useDemoAuth } from "@/components/auth/DemoAuthProvider";
import {
  getDemoOrdersForCustomer,
  ORDERS_STORAGE_KEY,
} from "@/lib/orders/orderStorage";
import OrdersEmptyState from "./OrdersEmptyState";
import OrdersMobileList from "./OrdersMobileList";
import OrdersPagination from "./OrdersPagination";
import OrdersTable from "./OrdersTable";
import OrdersTabs from "./OrdersTabs";
import {
  isActiveOrder,
  ORDERS_PER_PAGE,
  sortOrdersNewestFirst,
  type CustomerOrderTab,
} from "./customerOrderUtils";

export default function MyOrdersPage() {
  const { isReady: isAuthReady, session } = useDemoAuth();
  const customerAccountId =
    session?.role === "customer" ? session.id : null;
  const [ownedOrders, setOwnedOrders] = useState<DemoOrder[]>([]);
  const [activeTab, setActiveTab] = useState<CustomerOrderTab>("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [isOrdersReady, setIsOrdersReady] = useState(false);
  const [loadedCustomerAccountId, setLoadedCustomerAccountId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthReady || !customerAccountId) {
      return;
    }

    const syncOrders = () => {
      const nextOrders = getDemoOrdersForCustomer(customerAccountId);

      // Browser storage is read after auth hydration; no network loading is simulated.
      setOwnedOrders(nextOrders);
      setIsOrdersReady(true);
      setCurrentPage(1);
      setLoadedCustomerAccountId(customerAccountId);
    };

    syncOrders();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === ORDERS_STORAGE_KEY || event.key === null) {
        syncOrders();
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [customerAccountId, isAuthReady]);

  const sortedOwnedOrders = useMemo(() => {
    return sortOrdersNewestFirst(ownedOrders);
  }, [ownedOrders]);

  const activeOrders = useMemo(() => {
    return sortedOwnedOrders.filter((order) => isActiveOrder(order));
  }, [sortedOwnedOrders]);

  const historyOrders = useMemo(() => {
    return sortedOwnedOrders;
  }, [sortedOwnedOrders]);

  const selectedOrders = activeTab === "active" ? activeOrders : historyOrders;
  const totalPages = Math.max(
    1,
    Math.ceil(selectedOrders.length / ORDERS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ORDERS_PER_PAGE;
  const endIndex = startIndex + ORDERS_PER_PAGE;
  const paginatedOrders = selectedOrders.slice(startIndex, endIndex);

  const handleTabChange = (tab: CustomerOrderTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(nextPage);
  };

  if (
    !isOrdersReady ||
    !customerAccountId ||
    loadedCustomerAccountId !== customerAccountId
  ) {
    return (
      <div className="customer-orders-page">
        <section className="customer-orders-loading" aria-live="polite">
          Loading your orders…
        </section>
      </div>
    );
  }

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
          activeCount={activeOrders.length}
          historyCount={historyOrders.length}
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
              {selectedOrders.length}{" "}
              {selectedOrders.length === 1 ? "order" : "orders"}
            </span>
          </div>

          {selectedOrders.length === 0 ? (
            <OrdersEmptyState tab={activeTab} />
          ) : (
            <>
              <OrdersTable orders={paginatedOrders} />
              <OrdersMobileList orders={paginatedOrders} />
              <OrdersPagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                totalItems={selectedOrders.length}
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
