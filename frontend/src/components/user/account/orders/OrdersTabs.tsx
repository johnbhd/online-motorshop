import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faClockRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import type { CustomerOrderTab } from "./customerOrderUtils";

type OrdersTabsProps = {
  activeTab: CustomerOrderTab;
  activeCount: number;
  historyCount: number;
  onTabChange: (tab: CustomerOrderTab) => void;
};

export default function OrdersTabs({
  activeTab,
  activeCount,
  historyCount,
  onTabChange,
}: OrdersTabsProps) {
  const tabs = [
    {
      id: "active" as const,
      label: "Active Orders",
      count: activeCount,
      icon: faBoxOpen,
    },
    {
      id: "history" as const,
      label: "Order History",
      count: historyCount,
      icon: faClockRotateLeft,
    },
  ];

  return (
    <div className="customer-orders-tabs" role="tablist" aria-label="My orders views">
      {tabs.map((tab) => (
        <button
          className={`customer-orders-tab${activeTab === tab.id ? " is-active" : ""}`}
          type="button"
          role="tab"
          key={tab.id}
          id={`customer-orders-tab-${tab.id}`}
          aria-selected={activeTab === tab.id}
          aria-controls={`customer-orders-panel-${tab.id}`}
          onClick={() => onTabChange(tab.id)}
        >
          <FontAwesomeIcon icon={tab.icon} aria-hidden="true" />
          <span>{tab.label}</span>
          <strong>{tab.count}</strong>
        </button>
      ))}
    </div>
  );
}
