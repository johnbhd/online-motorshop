"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import ProductFilters from "./ProductFilters";
import ProductGrid from "./ProductGrid";
import ProductsEmptyState from "./ProductsEmptyState";
import ProductsPagination from "./ProductsPagination";
import ProductsSearch from "./ProductsSearch";
import ProductsToolbar, {
  type ProductSortOption,
  type ProductViewMode,
} from "./ProductsToolbar";
import {
  initialProductFilters,
  productCatalog,
  productMaxPrice,
  type ProductAvailability,
  type ProductBrand,
  type ProductCategory,
  type ProductFilterState,
} from "./productsData";

const PRODUCTS_PER_PAGE = 12;

function toggleValue<Value>(values: Value[], value: Value) {
  return values.includes(value)
    ? values.filter((currentValue) => currentValue !== value)
    : [...values, value];
}

function clampPrice(price: number) {
  return Math.min(productMaxPrice, Math.max(0, Number.isFinite(price) ? price : 0));
}

function shuffleProducts(products: typeof productCatalog) {
  const shuffledProducts = [...products];

  for (let index = shuffledProducts.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledProducts[index], shuffledProducts[randomIndex]] = [
      shuffledProducts[randomIndex],
      shuffledProducts[index],
    ];
  }

  return shuffledProducts;
}

function hasSelectedFilters(filters: ProductFilterState) {
  return (
    filters.brands.length > 0 ||
    filters.categories.length > 0 ||
    filters.availability.length > 0 ||
    filters.minPrice !== initialProductFilters.minPrice ||
    filters.maxPrice !== initialProductFilters.maxPrice
  );
}

export default function ProductsCatalog() {
  const [searchValue, setSearchValue] = useState("");
  const [filters, setFilters] = useState<ProductFilterState>(
    initialProductFilters,
  );
  const [sort, setSort] = useState<ProductSortOption>("featured");
  const [viewMode, setViewMode] = useState<ProductViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [productOrder, setProductOrder] = useState(productCatalog);
  const catalogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProductOrder(shuffleProducts(productCatalog));
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    const matchingProducts = productOrder.filter((product) => {
      const searchMatches = normalizedSearch
        ? [
            product.name,
            product.partNumber,
            product.brand,
            product.category,
          ].some((value) => value.toLowerCase().includes(normalizedSearch))
        : true;
      const brandMatches = filters.brands.length
        ? filters.brands.includes(product.brand)
        : true;
      const categoryMatches = filters.categories.length
        ? filters.categories.includes(product.category)
        : true;
      const availabilityMatches = filters.availability.length
        ? filters.availability.includes("Listed") &&
          product.status === "active"
        : true;
      const priceMatches =
        product.price >= filters.minPrice && product.price <= filters.maxPrice;

      return (
        searchMatches &&
        brandMatches &&
        categoryMatches &&
        availabilityMatches &&
        priceMatches
      );
    });

    return matchingProducts.sort((firstProduct, secondProduct) => {
      if (sort === "price-asc") {
        return firstProduct.price - secondProduct.price;
      }

      if (sort === "price-desc") {
        return secondProduct.price - firstProduct.price;
      }

      return 0;
    });
  }, [filters, productOrder, searchValue, sort]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * PRODUCTS_PER_PAGE;
  const pagedProducts = filteredProducts.slice(
    pageStart,
    pageStart + PRODUCTS_PER_PAGE,
  );
  const resultStart = filteredProducts.length ? pageStart + 1 : 0;
  const resultEnd = pageStart + pagedProducts.length;

  const updateFilters = (nextFilters: ProductFilterState) => {
    setFilters(nextFilters);
    setCurrentPage(1);

    if (
      !hasSelectedFilters(nextFilters) &&
      !searchValue.trim() &&
      sort === "featured"
    ) {
      setProductOrder(shuffleProducts(productCatalog));
    }
  };

  const toggleBrand = (brand: ProductBrand) => {
    updateFilters({ ...filters, brands: toggleValue(filters.brands, brand) });
  };

  const toggleCategory = (category: ProductCategory) => {
    updateFilters({
      ...filters,
      categories: toggleValue(filters.categories, category),
    });
  };

  const toggleAvailability = (availability: ProductAvailability) => {
    updateFilters({
      ...filters,
      availability: toggleValue(filters.availability, availability),
    });
  };

  const clearFilters = () => {
    setFilters({ ...initialProductFilters });
    setCurrentPage(1);

    if (!searchValue.trim() && sort === "featured") {
      setProductOrder(shuffleProducts(productCatalog));
    }
  };

  const clearSearch = () => {
    setSearchValue("");
    setCurrentPage(1);

    if (!hasSelectedFilters(filters) && sort === "featured") {
      setProductOrder(shuffleProducts(productCatalog));
    }
  };

  const removeBrand = (brand: ProductBrand) => {
    updateFilters({
      ...filters,
      brands: filters.brands.filter((currentBrand) => currentBrand !== brand),
    });
  };

  const removeCategory = (category: ProductCategory) => {
    updateFilters({
      ...filters,
      categories: filters.categories.filter(
        (currentCategory) => currentCategory !== category,
      ),
    });
  };

  const removeAvailability = (availability: ProductAvailability) => {
    updateFilters({
      ...filters,
      availability: filters.availability.filter(
        (currentAvailability) => currentAvailability !== availability,
      ),
    });
  };

  const resetPrice = () => {
    updateFilters({
      ...filters,
      minPrice: initialProductFilters.minPrice,
      maxPrice: initialProductFilters.maxPrice,
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    if (catalogRef.current) {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      catalogRef.current.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    }
  };

  const handleSortChange = (nextSort: ProductSortOption) => {
    setSort(nextSort);
    setCurrentPage(1);

    if (
      nextSort === "featured" &&
      !searchValue.trim() &&
      !hasSelectedFilters(filters)
    ) {
      setProductOrder(shuffleProducts(productCatalog));
    }
  };

  const hasActiveFilters =
    filters.brands.length > 0 ||
    filters.categories.length > 0 ||
    filters.availability.length > 0 ||
    filters.minPrice !== initialProductFilters.minPrice ||
    filters.maxPrice !== initialProductFilters.maxPrice;

  return (
    <>
      <section className="products-search-section" aria-label="Product search">
        <div className="products-shell">
          <ProductsSearch
            value={searchValue}
            onChange={(value) => {
              setSearchValue(value);
              setCurrentPage(1);
            }}
            onSubmit={() => setCurrentPage(1)}
            onClear={clearSearch}
          />
        </div>
      </section>

      <section className="products-catalog-section" aria-label="Product catalog">
        <div className="products-shell products-catalog-layout">
          <ProductFilters
            filters={filters}
            onToggleBrand={toggleBrand}
            onToggleCategory={toggleCategory}
            onToggleAvailability={toggleAvailability}
            onMinPriceChange={(minPrice) =>
              updateFilters({
                ...filters,
                minPrice: Math.min(clampPrice(minPrice), filters.maxPrice),
              })
            }
            onMaxPriceChange={(maxPrice) =>
              updateFilters({
                ...filters,
                maxPrice: Math.max(clampPrice(maxPrice), filters.minPrice),
              })
            }
            onApply={() => setCurrentPage(1)}
            onClear={clearFilters}
          />

          <div className="products-catalog-main" ref={catalogRef}>
            <ProductsToolbar
              resultStart={resultStart}
              resultEnd={resultEnd}
              totalCount={filteredProducts.length}
              sort={sort}
              onSortChange={handleSortChange}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {hasActiveFilters ? (
              <div className="products-active-filters" aria-label="Active filters">
                {filters.brands.map((brand) => (
                  <button
                    className="products-filter-chip"
                    type="button"
                    key={brand}
                    onClick={() => removeBrand(brand)}
                    aria-label={`Remove ${brand} filter`}
                  >
                    <span>{brand}</span>
                    <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
                  </button>
                ))}
                {filters.categories.map((category) => (
                  <button
                    className="products-filter-chip"
                    type="button"
                    key={category}
                    onClick={() => removeCategory(category)}
                    aria-label={`Remove ${category} filter`}
                  >
                    <span>{category}</span>
                    <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
                  </button>
                ))}
                {filters.availability.map((availability) => (
                  <button
                    className="products-filter-chip"
                    type="button"
                    key={availability}
                    onClick={() => removeAvailability(availability)}
                    aria-label={`Remove ${availability} filter`}
                  >
                    <span>{availability}</span>
                    <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
                  </button>
                ))}
                {filters.minPrice !== initialProductFilters.minPrice ||
                filters.maxPrice !== initialProductFilters.maxPrice ? (
                  <button
                    className="products-filter-chip"
                    type="button"
                    onClick={resetPrice}
                    aria-label="Remove price filter"
                  >
                    <span>
                      Price {filters.minPrice} - {filters.maxPrice}
                    </span>
                    <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
                  </button>
                ) : null}
                <button
                  className="products-clear-filters-link"
                  type="button"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              </div>
            ) : null}

            {pagedProducts.length ? (
              <>
                <ProductGrid products={pagedProducts} viewMode={viewMode} />
                <ProductsPagination
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            ) : (
              <ProductsEmptyState />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
