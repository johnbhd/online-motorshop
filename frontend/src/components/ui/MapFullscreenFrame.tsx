"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExpand, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type MapFullscreenFrameProps = {
  title: string;
  mapLabel?: string;
  children: ReactNode;
  onFullscreenChange?: (isFullscreen: boolean) => void;
};

export default function MapFullscreenFrame({
  title,
  mapLabel = "map",
  children,
  onFullscreenChange,
}: MapFullscreenFrameProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onFullscreenChangeRef = useRef(onFullscreenChange);
  const titleId = `ald-map-fullscreen-title-${useId()}`;

  useEffect(() => {
    onFullscreenChangeRef.current = onFullscreenChange;
  }, [onFullscreenChange]);

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }

    const previousActiveElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
        onFullscreenChangeRef.current?.(false);
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      previousActiveElement?.focus();
    };
  }, [isFullscreen]);

  const openFullscreen = () => {
    setIsFullscreen(true);
    onFullscreenChangeRef.current?.(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    onFullscreenChangeRef.current?.(false);
  };

  return (
    <div
      className={`ald-map-fullscreen-frame${isFullscreen ? " ald-map-fullscreen-frame--open" : ""}`}
    >
      <button
        className="ald-map-fullscreen-backdrop"
        type="button"
        aria-label={`Close full ${mapLabel} view`}
        hidden={!isFullscreen}
        tabIndex={isFullscreen ? 0 : -1}
        onClick={closeFullscreen}
      />

      <div
        className="ald-map-fullscreen-surface"
        role={isFullscreen ? "dialog" : undefined}
        aria-modal={isFullscreen ? "true" : undefined}
        aria-labelledby={isFullscreen ? titleId : undefined}
      >
        <header className="ald-map-fullscreen-header" hidden={!isFullscreen}>
          <div>
            <p>FULL MAP VIEW</p>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            className="ald-map-fullscreen-close"
            type="button"
            aria-label={`Close full ${mapLabel} view`}
            tabIndex={isFullscreen ? 0 : -1}
            onClick={closeFullscreen}
          >
            <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
          </button>
        </header>

        <button
          className="ald-map-fullscreen-open"
          type="button"
          aria-label={`View ${mapLabel} in full view`}
          hidden={isFullscreen}
          onClick={openFullscreen}
        >
          <FontAwesomeIcon icon={faExpand} aria-hidden="true" />
          <span>View full map</span>
        </button>

        {children}
      </div>
    </div>
  );
}
