import { forwardRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments } from "@fortawesome/free-solid-svg-icons";

export type AssistantLauncherProps = {
  isOpen: boolean;
  onClick: () => void;
};

const AssistantLauncher = forwardRef<HTMLButtonElement, AssistantLauncherProps>(
  function AssistantLauncher({ isOpen, onClick }, ref) {
    return (
      <button
        ref={ref}
        className="ald-assistant__launcher"
        type="button"
        aria-label={isOpen ? "Close ALD Assistant" : "Open ALD Assistant"}
        aria-expanded={isOpen}
        aria-controls="ald-assistant-panel"
        hidden={isOpen}
        onClick={onClick}
      >
        <FontAwesomeIcon icon={faComments} aria-hidden="true" />
      </button>
    );
  },
);

export default AssistantLauncher;
