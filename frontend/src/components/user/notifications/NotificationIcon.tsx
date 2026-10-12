import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faCircleUser, faClipboardCheck, faCreditCard, faHeadset } from "@fortawesome/free-solid-svg-icons";

export default function NotificationIcon({ category }: { category: string }) {
  const icon =
    category === "payments"
      ? faCreditCard
      : category === "account"
        ? faCircleUser
        : category === "support"
          ? faHeadset
          : category === "orders"
            ? faClipboardCheck
            : faBell;
  return <FontAwesomeIcon icon={icon} aria-hidden="true" />;
}
