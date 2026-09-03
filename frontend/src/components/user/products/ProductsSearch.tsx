"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

type ProductsSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
};

export default function ProductsSearch({
  value,
  onChange,
  onSubmit,
  onClear,
}: ProductsSearchProps) {
  return (
    <form
      className="products-search-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="products-search-input-wrap">
        <FontAwesomeIcon
          className="products-search-icon"
          icon={faMagnifyingGlass}
          aria-hidden="true"
        />
        <label className="products-sr-only" htmlFor="products-search">
          Search products
        </label>
        <input
          id="products-search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search by product name, part number, brand, or motorcycle model"
        />
        {value ? (
          <button
            className="products-search-clear"
            type="button"
            onClick={onClear}
            aria-label="Clear product search"
          >
            <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <button className="products-search-button" type="submit">
        <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
        <span>Search Products</span>
      </button>
    </form>
  );
}
