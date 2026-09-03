import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronUp } from "@fortawesome/free-solid-svg-icons";
import {
  productAvailability,
  productBrands,
  productCatalog,
  productCategories,
  productMaxPrice,
  type ProductAvailability,
  type ProductBrand,
  type ProductCategory,
  type ProductDisplayItem,
  type ProductFilterState,
} from "./productsData";

type ProductFiltersProps = {
  filters: ProductFilterState;
  onToggleBrand: (brand: ProductBrand) => void;
  onToggleCategory: (category: ProductCategory) => void;
  onToggleAvailability: (availability: ProductAvailability) => void;
  onMinPriceChange: (price: number) => void;
  onMaxPriceChange: (price: number) => void;
  onApply: () => void;
  onClear: () => void;
};

function countProducts(matcher: (product: ProductDisplayItem) => boolean) {
  return productCatalog.filter(matcher).length;
}

export default function ProductFilters({
  filters,
  onToggleBrand,
  onToggleCategory,
  onToggleAvailability,
  onMinPriceChange,
  onMaxPriceChange,
  onApply,
  onClear,
}: ProductFiltersProps) {
  return (
    <aside className="products-filters" aria-labelledby="products-filters-title">
      <div className="products-filters-header">
        <h2 id="products-filters-title">Filter Products</h2>
        <button className="products-clear-all" type="button" onClick={onClear}>
          Clear All
        </button>
      </div>

      <fieldset className="products-filter-group">
        <legend>
          Motorcycle Brand
          <FontAwesomeIcon icon={faChevronUp} aria-hidden="true" />
        </legend>
        {productBrands.map((brand) => (
          <label className="products-check-option" key={brand}>
            <input
              type="checkbox"
              checked={filters.brands.includes(brand)}
              onChange={() => onToggleBrand(brand)}
            />
            <span>{brand}</span>
            <small>{countProducts((product) => product.brand === brand)}</small>
          </label>
        ))}
      </fieldset>

      <fieldset className="products-filter-group">
        <legend>
          Category
          <FontAwesomeIcon icon={faChevronUp} aria-hidden="true" />
        </legend>
        {productCategories.map((category) => (
          <label className="products-check-option" key={category}>
            <input
              type="checkbox"
              checked={filters.categories.includes(category)}
              onChange={() => onToggleCategory(category)}
            />
            <span>{category}</span>
            <small>
              {countProducts((product) => product.category === category)}
            </small>
          </label>
        ))}
      </fieldset>

      <fieldset className="products-filter-group">
        <legend>
          Price Range
          <FontAwesomeIcon icon={faChevronUp} aria-hidden="true" />
        </legend>
        <div className="products-price-inputs">
          <label>
            <span className="products-sr-only">Minimum price</span>
            <input
              type="number"
              min={0}
              max={productMaxPrice}
              value={filters.minPrice}
              onChange={(event) => onMinPriceChange(Number(event.target.value))}
              aria-label="Minimum price"
            />
          </label>
          <span aria-hidden="true">-</span>
          <label>
            <span className="products-sr-only">Maximum price</span>
            <input
              type="number"
              min={0}
              max={productMaxPrice}
              value={filters.maxPrice}
              onChange={(event) => onMaxPriceChange(Number(event.target.value))}
              aria-label="Maximum price"
            />
          </label>
        </div>
        <label className="products-sr-only" htmlFor="products-price-slider">
          Maximum price
        </label>
        <input
          id="products-price-slider"
          className="products-price-slider"
          type="range"
          min={0}
          max={productMaxPrice}
          step={50}
          value={filters.maxPrice}
          onChange={(event) => onMaxPriceChange(Number(event.target.value))}
        />
      </fieldset>

      <fieldset className="products-filter-group">
        <legend>
          Availability
          <FontAwesomeIcon icon={faChevronUp} aria-hidden="true" />
        </legend>
        {productAvailability.map((availability) => (
          <label className="products-check-option" key={availability}>
            <input
              type="checkbox"
              checked={filters.availability.includes(availability)}
              onChange={() => onToggleAvailability(availability)}
            />
            <span>{availability}</span>
            <small>{countProducts((product) => product.status === "active")}</small>
          </label>
        ))}
      </fieldset>

      <button className="products-apply-button" type="button" onClick={onApply}>
        Apply Filters
      </button>
    </aside>
  );
}
