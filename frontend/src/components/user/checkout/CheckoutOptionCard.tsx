import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

type CheckoutOptionCardProps = {
  name: string;
  value: string;
  title: string;
  description: string;
  icon: IconDefinition;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  describedBy?: string;
};

export default function CheckoutOptionCard({
  name,
  value,
  title,
  description,
  icon,
  selected,
  onSelect,
  disabled = false,
  describedBy,
}: CheckoutOptionCardProps) {
  return (
    <label
      className={`checkout-option-card${
        selected ? " checkout-option-card--active" : ""
      }${disabled ? " checkout-option-card--disabled" : ""}`}
    >
      <span className="checkout-option-icon" aria-hidden="true">
        <FontAwesomeIcon icon={icon} />
      </span>
      <span className="checkout-option-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        disabled={disabled}
        aria-describedby={describedBy}
        onChange={onSelect}
      />
    </label>
  );
}
