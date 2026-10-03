"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import ActionButton from "@/components/staff/ActionButton";
import PortalPagination from "@/components/staff/PortalPagination";
import { Badge } from "@/components/staff/PortalTable";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import Summary from "@/components/staff/Summary";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getStaffProducts,
  getStaffProductsErrorMessage,
} from "./staffProductsApi";
import type {
  StaffProduct,
  StaffProductsResponse,
} from "./staffProductsTypes";
import RealStaffProductDetailsModal from "./RealStaffProductDetailsModal";

const PAGE_SIZE = 10;

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "Not available";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function inventoryLabel(product: StaffProduct) {
  return product.inventory === null ? "Not tracked" : "Tracked";
}

export default function RealProductsPage() {
  const { isLoading: isAuthLoading, user } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("");
  const [sort, setSort] = useState("updated_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [response, setResponse] = useState<StaffProductsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [selectedPartNumber, setSelectedPartNumber] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (isAuthLoading || user?.role !== "staff") {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      const token = getAuthToken();

      if (!token) {
        setResponse(null);
        setIsLoading(false);
        setError("Your Staff session has expired. Please sign in again.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const nextResponse = await getStaffProducts(token, {
          search: searchInput,
          brand,
          category,
          status,
          availabilityStatus,
          sort,
          page: currentPage,
          perPage: PAGE_SIZE,
          signal: controller.signal,
        });

        setResponse(nextResponse);

        if (
          nextResponse.meta.last_page > 0 &&
          currentPage > nextResponse.meta.last_page
        ) {
          setCurrentPage(nextResponse.meta.last_page);
        }
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        setError(
          getStaffProductsErrorMessage(
            requestError,
            "Staff products could not be loaded. Please try again.",
          ),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [
    availabilityStatus,
    brand,
    category,
    currentPage,
    isAuthLoading,
    reloadNonce,
    searchInput,
    sort,
    status,
    user?.role,
  ]);

  const summary = response?.summary;
  const filterOptions = response?.filters;

  const resetFilters = () => {
    setSearchInput("");
    setBrand("");
    setCategory("");
    setStatus("");
    setAvailabilityStatus("");
    setSort("updated_desc");
    setCurrentPage(1);
  };

  const handleFilterChange = (setter: (value: string) => void) =>
    (value: string) => {
      setter(value);
      setCurrentPage(1);
    };

  return (
    <div className="space-y-5">
      <StaffPageHeader
        eyebrow="Catalog"
        title="Products"
        description="Review the real ALD catalog. Inventory quantities are not persisted in the current system."
      />

      <Summary
        items={[
          [String(summary?.total ?? "—"), "Total Products", "Global catalog records"],
          [String(summary?.active ?? "—"), "Active Products", "Published catalog records"],
          [String(summary?.inactive ?? "—"), "Inactive Products", "Hidden catalog records"],
          ["Not tracked", "Inventory", "No persisted stock quantities"],
        ]}
      />

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#0B1930]">
                Product List
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {response
                  ? `${response.meta.total} catalog product${response.meta.total === 1 ? "" : "s"} match the current filters.`
                  : "Real catalog products from Laravel."}
              </p>
            </div>

            <label className="relative block w-full xl:w-80">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="h-3.5 w-3.5" />
              </span>
              <span className="sr-only">Search Staff products</span>
              <input
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search name, code, brand"
                className="h-10 w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </label>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <FilterSelect
              label="Brand"
              value={brand}
              onChange={handleFilterChange(setBrand)}
              options={filterOptions?.brands ?? []}
            />
            <FilterSelect
              label="Category"
              value={category}
              onChange={handleFilterChange(setCategory)}
              options={(filterOptions?.categories ?? []).map(
                (option) => option.name,
              )}
            />
            <FilterSelect
              label="Catalog status"
              value={status}
              onChange={handleFilterChange(setStatus)}
              options={filterOptions?.statuses ?? []}
            />
            <FilterSelect
              label="Availability field"
              value={availabilityStatus}
              onChange={handleFilterChange(setAvailabilityStatus)}
              options={filterOptions?.availability_statuses ?? []}
            />
            <label className="block text-sm font-medium text-slate-600">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
                Sort
              </span>
              <select
                value={sort}
                onChange={(event) => handleFilterChange(setSort)(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="updated_desc">Recently updated</option>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
                <option value="price_asc">Price low-high</option>
                <option value="price_desc">Price high-low</option>
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="mt-3 text-sm font-semibold text-orange-600 hover:text-orange-700 hover:underline"
          >
            Clear filters
          </button>
        </div>

        {error ? (
          <div className="px-6 py-14 text-center" role="alert">
            <p className="font-semibold text-[#0B1930]">Unable to load products</p>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => setReloadNonce((nonce) => nonce + 1)}
              className="mt-5 rounded-lg bg-[#0B1930] px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="space-y-3 px-6 py-8" aria-live="polite" aria-busy="true">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-100" />
            ))}
            <span className="sr-only">Loading Staff products</span>
          </div>
        ) : response?.products.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1180px] table-fixed border-collapse text-left">
                <colgroup>
                  <col className="w-[260px]" />
                  <col className="w-[130px]" />
                  <col className="w-[180px]" />
                  <col className="w-[130px]" />
                  <col className="w-[145px]" />
                  <col className="w-[150px]" />
                  <col className="w-[130px]" />
                  <col className="w-[140px]" />
                </colgroup>
                <thead className="bg-slate-50">
                  <tr>
                    {["Product", "Brand", "Category", "Price", "Catalog Status", "Availability", "Inventory", "Action"].map(
                      (column) => (
                        <th
                          key={column}
                          scope="col"
                          className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                          {column}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {response.products.map((product) => (
                    <ProductRow
                      key={product.part_number}
                      product={product}
                      onView={() => setSelectedPartNumber(product.part_number)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-200 md:hidden">
              {response.products.map((product) => (
                <article key={product.part_number} className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[#0B1930]">{product.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{product.part_number}</p>
                    </div>
                    <Badge>{formatLabel(product.status)}</Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <ProductFact label="Brand" value={product.brand} />
                    <ProductFact label="Category" value={product.category ?? "Not available"} />
                    <ProductFact label="Price" value={formatCurrency(product.price)} />
                    <ProductFact label="Inventory" value={inventoryLabel(product)} />
                  </dl>
                  <ActionButton
                    label="View Product"
                    onClick={() => setSelectedPartNumber(product.part_number)}
                  />
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="font-semibold text-[#0B1930]">No products found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or selected filters.
            </p>
          </div>
        )}

        {response && !error ? (
          <PortalPagination
            currentPage={response.meta.current_page}
            totalItems={response.meta.total}
            pageSize={response.meta.per_page}
            itemLabel="products"
            onPageChange={setCurrentPage}
          />
        ) : null}
      </section>

      {selectedPartNumber ? (
        <RealStaffProductDetailsModal
          key={selectedPartNumber}
          isOpen
          partNumber={selectedPartNumber}
          onClose={() => setSelectedPartNumber(null)}
        />
      ) : null}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-slate-600">
      <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {formatLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProductRow({
  product,
  onView,
}: {
  product: StaffProduct;
  onView: () => void;
}) {
  return (
    <tr className="transition hover:bg-slate-50/80">
      <td className="px-5 py-3.5 align-middle text-sm">
        <span className="block truncate font-bold text-[#0B1930]">{product.name}</span>
        <span className="block text-xs text-slate-400">{product.part_number}</span>
      </td>
      <td className="px-5 py-3.5 align-middle text-sm text-slate-600">{product.brand}</td>
      <td className="px-5 py-3.5 align-middle text-sm text-slate-600">{product.category ?? "Not available"}</td>
      <td className="whitespace-nowrap px-5 py-3.5 align-middle text-sm font-semibold text-slate-700">
        {formatCurrency(product.price)}
      </td>
      <td className="px-5 py-3.5 align-middle">
        <Badge>{formatLabel(product.status)}</Badge>
      </td>
      <td className="px-5 py-3.5 align-middle">
        <Badge>{formatLabel(product.availability_status)}</Badge>
      </td>
      <td className="px-5 py-3.5 align-middle text-sm text-slate-500">
        {inventoryLabel(product)}
      </td>
      <td className="px-5 py-3.5 align-middle">
        <ActionButton label="View Product" onClick={onView} />
      </td>
    </tr>
  );
}

function ProductFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 truncate font-medium text-slate-700">{value}</dd>
    </div>
  );
}
