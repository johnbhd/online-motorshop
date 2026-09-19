type CustomerOrderBadgeProps = {
  value: string;
  kind: "status" | "payment";
};

function getBadgeTone(value: string): string {
  if (/completed|paid/i.test(value)) {
    return "customer-order-badge--success";
  }

  if (/cancelled|rejected/i.test(value)) {
    return "customer-order-badge--danger";
  }

  if (/pending|waiting|verification|preparing|ready|booked|picked|review|confirmed|unpaid/i.test(value)) {
    return "customer-order-badge--warning";
  }

  return "customer-order-badge--neutral";
}

export default function OrderStatusBadge({
  value,
  kind,
}: CustomerOrderBadgeProps) {
  return (
    <span
      className={`customer-order-badge customer-order-badge--${kind} ${getBadgeTone(value)}`}
    >
      {value}
    </span>
  );
}
