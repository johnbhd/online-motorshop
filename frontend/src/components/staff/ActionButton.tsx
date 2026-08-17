type ActionButtonProps = {
  label: string;
  onClick?: () => void;
};

export default function ActionButton({ label, onClick }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-orange-400 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50"
    >
      <span className="inline-flex items-center gap-2">
        <FontAwesomeIcon icon={faEye} aria-hidden="true" />
        {label}
      </span>
    </button>
  );
}
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
