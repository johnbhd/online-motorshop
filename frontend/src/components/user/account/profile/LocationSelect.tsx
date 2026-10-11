"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faLocationDot } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type LocationOption = {
  value: string;
  label: string;
  code?: string;
};

type LocationSelectProps = {
  id: string;
  label: string;
  icon?: IconDefinition;
  value: string;
  options: readonly LocationOption[];
  placeholder: string;
  emptyMessage: string;
  isLoading?: boolean;
  disabled?: boolean;
  error?: string;
  onRetry?: () => void;
  helpText?: string;
  onChange: (value: string) => void;
};

export default function LocationSelect({
  id,
  label,
  icon = faLocationDot,
  value,
  options,
  placeholder,
  emptyMessage,
  isLoading = false,
  disabled = false,
  error,
  onRetry,
  helpText,
  onChange,
}: LocationSelectProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = `${id}-options`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery(value);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, value]);

  const savedOption: LocationOption | null = value && !options.some((option) => option.value === value)
    ? { value, label: value }
    : null;
  const availableOptions = savedOption ? [savedOption, ...options] : options;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = availableOptions.filter((option) => {
    if (!normalizedQuery || option.value === value) return true;

    return option.label.toLowerCase().includes(normalizedQuery) || option.value.toLowerCase().includes(normalizedQuery);
  });
  const activeOption = activeIndex >= 0 ? filteredOptions[activeIndex] : undefined;
  const optionId = (option: LocationOption) => `${listboxId}-${(option.code ?? option.value).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const describedBy = [helpText ? descriptionId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;
  const isDisabled = disabled || isLoading;

  const selectOption = (option: LocationOption) => {
    onChange(option.value);
    setQuery(option.label);
    setActiveIndex(-1);
    setIsOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (isDisabled) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => Math.min(current + 1, filteredOptions.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" && isOpen && activeOption) {
      event.preventDefault();
      selectOption(activeOption);
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setQuery(value);
    }
  };

  return (
    <div ref={rootRef} className="customer-location-select">
      <label htmlFor={id}>
        <FontAwesomeIcon icon={icon} aria-hidden="true" />
        {label}
      </label>
      <div className="customer-location-control">
        <input
          ref={inputRef}
          id={id}
          className="customer-location-input"
          value={query}
          placeholder={isLoading ? `Loading ${label.toLowerCase()}...` : placeholder}
          disabled={isDisabled}
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-activedescendant={activeOption ? optionId(activeOption) : undefined}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          onFocus={() => {
            if (!isDisabled) setIsOpen(true);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="customer-location-toggle"
          aria-label={`${isOpen ? "Close" : "Open"} ${label.toLowerCase()} options`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          disabled={isDisabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setIsOpen((current) => !current);
            inputRef.current?.focus();
          }}
        >
          <FontAwesomeIcon icon={faChevronDown} aria-hidden="true" />
        </button>
      </div>

      {isOpen ? (
        <div id={listboxId} className="customer-location-menu" role="listbox" aria-label={`${label} options`}>
          {isLoading ? (
            <p className="customer-location-menu-status" role="status">Loading {label.toLowerCase()}...</p>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <button
                key={option.code ?? option.value}
                id={optionId(option)}
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={`customer-location-option${index === activeIndex ? " is-active" : ""}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectOption(option)}
              >
                {option.label}
              </button>
            ))
          ) : (
            <p className="customer-location-menu-status">{emptyMessage}</p>
          )}
        </div>
      ) : null}

      {helpText ? <p id={descriptionId} className="customer-location-help">{helpText}</p> : null}
      {error ? (
        <div className="customer-location-error">
          <p id={errorId} className="customer-profile-field-error" role="alert">{error}</p>
          {onRetry ? <button type="button" className="customer-location-retry" onClick={onRetry}>Try again</button> : null}
        </div>
      ) : null}
    </div>
  );
}
