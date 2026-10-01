import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";

type ActionButtonProps = {
  label: string;
  icon?: IconDefinition;
  onClick?: () => void;
};

export default function ActionButton({
  label,
  icon = faEye,
  onClick,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-orange-400 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50"
    >
      <span className="inline-flex items-center gap-2">
        <FontAwesomeIcon icon={icon} aria-hidden="true" />
        {label}
      </span>
    </button>
  );
}
