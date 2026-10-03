/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faCircleExclamation,
  faMagnifyingGlass,
  faPlus,
  faRefresh,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminProduct,
  getAdminProducts,
  getAdminProductsErrorMessage,
  getValidationErrors,
  updateAdminProduct,
} from "@/lib/adminProductsApi";
import type {
  AdminProduct,
  AdminProductCategoryOption,
  AdminProductPayload,
  AdminProductsResponse,
} from "@/lib/adminProductsTypes";

const PAGE_SIZE = 10;
const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

type ProductFormValues = {
  category_id: string;
  name: string;
  part_number: string;
  brand: string;
  description: string;
  price: string;
  img_url: string;
  availability_status: string;
  status: string;
};

type ProductFormErrors = Record<string, string[]>;

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "Not available";
  }

  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function emptyForm(categories: AdminProductCategoryOption[]): ProductFormValues {
  return {
    category_id: categories[0] ? String(categories[0].id) : "",
    name: "",
    part_number: "",
    brand: "",
    description: "",
    price: "",
    img_url: "",
    availability_status: "active",
    status: "active",
  };
}

function formFromProduct(product: AdminProduct): ProductFormValues {
  return {
    category_id: product.category_id ? String(product.category_id) : "",
    name: product.name,
    part_number: product.part_number,
    brand: product.brand,
    description: product.description ?? "",
    price: String(product.price),
    img_url: product.img_url,
    availability_status: product.availability_status,
    status: product.status,
  };
}

function payloadFromForm(values: ProductFormValues): AdminProductPayload {
  return {
    category_id: Number(values.category_id),
    name: values.name.trim(),
    part_number: values.part_number.trim(),
    brand: values.brand.trim(),
    description: values.description.trim() || null,
    price: Number(values.price),
    img_url: values.img_url.trim(),
    availability_status: values.availability_status,
    status: values.status,
  };
}

function clientFormErrors(values: ProductFormValues): ProductFormErrors {
  const errors: ProductFormErrors = {};
  const required: Array<[keyof ProductFormValues, string]> = [
    ["category_id", "Choose a category."],
    ["name", "Enter a product name."],
    ["part_number", "Enter a part number."],
    ["brand", "Enter a brand."],
    ["img_url", "Enter an image URL or existing image path."],
    ["availability_status", "Choose an availability status."],
    ["status", "Choose a catalog status."],
  ];

  for (const [field, message] of required) {
    if (!values[field].trim()) {
      errors[field] = [message];
    }
  }

  const price = Number(values.price);

  if (!values.price.trim() || !Number.isFinite(price) || price < 0) {
    errors.price = ["Enter a valid non-negative price."];
  }

  return errors;
}

export default function RealAdminProductsPage() {
  const { isLoading: isAuthLoading, user } = useAuth();
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("");
  const [sort, setSort] = useState("updated_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [response, setResponse] = useState<AdminProductsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPartNumber, setEditingPartNumber] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [formSession, setFormSession] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});
  const [deleteProduct, setDeleteProduct] = useState<AdminProduct | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const detailController = useRef<AbortController | null>(null);

  const loadProducts = useCallback(async (signal?: AbortSignal) => {
    const token = getAuthToken();

    if (!token) {
      setResponse(null);
      setError("Your Admin session has expired. Please sign in again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextResponse = await getAdminProducts(token, {
        search,
        brand,
        category,
        status,
        availabilityStatus,
        sort,
        page: currentPage,
        perPage: PAGE_SIZE,
        signal,
      });

      setResponse(nextResponse);

      if (currentPage > nextResponse.meta.last_page && nextResponse.meta.last_page > 0) {
        setCurrentPage(nextResponse.meta.last_page);
      }
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") {
        return;
      }

      setError(getAdminProductsErrorMessage(requestError));
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [availabilityStatus, brand, category, currentPage, search, sort, status]);

  useEffect(() => {
    if (isAuthLoading || user?.role !== "admin") {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => void loadProducts(controller.signal), 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [isAuthLoading, loadProducts, reloadNonce, user?.role]);

  useEffect(() => {
    return () => detailController.current?.abort();
  }, []);

  const filterOptions = response?.filters;
  const categories = filterOptions?.categories ?? [];
  const statuses = filterOptions?.statuses.length ? filterOptions.statuses : ["active", "inactive"];
  const availabilityOptions = filterOptions?.availability_statuses.length
    ? filterOptions.availability_statuses
    : ["active", "inactive"];

  const resetFilters = () => {
    setSearch("");
    setBrand("");
    setCategory("");
    setStatus("");
    setAvailabilityStatus("");
    setSort("updated_desc");
    setCurrentPage(1);
  };

  const openCreate = () => {
    setFormSession((session) => session + 1);
    setEditingPartNumber(null);
    setEditingProduct(null);
    setFormErrors({});
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = async (product: AdminProduct) => {
    const token = getAuthToken();

    if (!token) {
      setFormError("Your Admin session has expired. Please sign in again.");
      return;
    }

    detailController.current?.abort();
    const controller = new AbortController();
    detailController.current = controller;
    setFormSession((session) => session + 1);
    setEditingPartNumber(product.part_number);
    setEditingProduct(product);
    setFormErrors({});
    setFormError(null);
    setFormOpen(true);
    setDetailLoading(true);

    try {
      setEditingProduct(await getAdminProduct(token, product.part_number, { signal: controller.signal }));
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") {
        return;
      }

      setFormError(getAdminProductsErrorMessage(requestError));
    } finally {
      if (!controller.signal.aborted) {
        setDetailLoading(false);
      }
    }
  };

  const closeForm = () => {
    detailController.current?.abort();
    setFormOpen(false);
    setEditingPartNumber(null);
    setEditingProduct(null);
    setDetailLoading(false);
    setMutationLoading(false);
    setFormError(null);
    setFormErrors({});
  };

  const saveProduct = async (values: ProductFormValues) => {
    const token = getAuthToken();

    if (!token) {
      setFormError("Your Admin session has expired. Please sign in again.");
      return;
    }

    const localErrors = clientFormErrors(values);

    if (Object.keys(localErrors).length) {
      setFormErrors(localErrors);
      return;
    }

    setMutationLoading(true);
    setFormError(null);
    setFormErrors({});

    try {
      if (editingPartNumber) {
        await updateAdminProduct(token, editingPartNumber, payloadFromForm(values));
        setNotice("Product updated successfully.");
      } else {
        await createAdminProduct(token, payloadFromForm(values));
        setNotice("Product created successfully.");
        setCurrentPage(1);
      }

      closeForm();
      setReloadNonce((nonce) => nonce + 1);
    } catch (requestError) {
      setFormError(getAdminProductsErrorMessage(requestError));
      setFormErrors(getValidationErrors(requestError));
    } finally {
      setMutationLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteProduct) {
      return;
    }

    const token = getAuthToken();

    if (!token) {
      setDeleteError("Your Admin session has expired. Please sign in again.");
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await deleteAdminProduct(token, deleteProduct.part_number);
      setNotice("Product deleted successfully.");
      setDeleteProduct(null);
      setReloadNonce((nonce) => nonce + 1);
    } catch (requestError) {
      setDeleteError(getAdminProductsErrorMessage(requestError));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">Catalog</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl">Products</h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Manage the persisted ALD catalog used by the public storefront.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
          Add Product
        </button>
      </section>

      {notice ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss success message">
            <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard value={response ? String(response.summary.total) : "—"} label="Total Products" detail="Persisted catalog records" />
        <MetricCard value={response ? String(response.summary.active) : "—"} label="Active Products" detail="Visible in the public catalog" />
        <MetricCard value={response ? String(response.summary.inactive) : "—"} label="Inactive Products" detail="Hidden from the public catalog" />
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#0B1930]">Product List</h2>
              <p className="mt-1 text-sm text-slate-500">
                {response ? `${response.meta.total} product${response.meta.total === 1 ? "" : "s"} match the current filters.` : "Live product data from Laravel."}
              </p>
            </div>
            <label className="relative block w-full xl:w-80">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="h-3.5 w-3.5" />
              </span>
              <span className="sr-only">Search products</span>
              <input
                value={search}
                onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }}
                placeholder="Search name, code, brand"
                className="h-10 w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </label>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <FilterSelect label="Brand" value={brand} options={filterOptions?.brands ?? []} onChange={(value) => { setBrand(value); setCurrentPage(1); }} />
            <FilterSelect label="Category" value={category} options={(filterOptions?.categories ?? []).map((option) => option.name)} onChange={(value) => { setCategory(value); setCurrentPage(1); }} />
            <FilterSelect label="Catalog status" value={status} options={filterOptions?.statuses ?? []} onChange={(value) => { setStatus(value); setCurrentPage(1); }} />
            <FilterSelect label="Availability" value={availabilityStatus} options={filterOptions?.availability_statuses ?? []} onChange={(value) => { setAvailabilityStatus(value); setCurrentPage(1); }} />
            <label className="block text-sm font-medium text-slate-600">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Sort</span>
              <select value={sort} onChange={(event) => { setSort(event.target.value); setCurrentPage(1); }} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
                <option value="updated_desc">Recently updated</option>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
                <option value="price_asc">Price low-high</option>
                <option value="price_desc">Price high-low</option>
              </select>
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={resetFilters} className="text-sm font-semibold text-orange-600 hover:text-orange-700 hover:underline">Clear filters</button>
            <button type="button" onClick={() => setReloadNonce((nonce) => nonce + 1)} disabled={isLoading} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#0B1930] disabled:opacity-50">
              <FontAwesomeIcon icon={faRefresh} aria-hidden="true" /> Refresh
            </button>
          </div>
        </div>

        {error ? <ErrorState message={error} onRetry={() => setReloadNonce((nonce) => nonce + 1)} /> : null}
        {!error && isLoading ? <LoadingState /> : null}
        {!error && !isLoading && response?.products.length ? (
          <ProductResults products={response.products} onEdit={(product) => void openEdit(product)} />
        ) : null}
        {!error && !isLoading && response && !response.products.length ? <EmptyState /> : null}

        {response && !error ? (
          <Pagination meta={response.meta} onPageChange={setCurrentPage} />
        ) : null}
      </section>

      <AdminProductFormModal
        key={formSession}
        isOpen={formOpen}
        isEditing={Boolean(editingPartNumber)}
        product={editingProduct}
        categories={categories}
        statusOptions={statuses}
        availabilityOptions={availabilityOptions}
        detailLoading={detailLoading}
        submitLoading={mutationLoading}
        error={formError}
        fieldErrors={formErrors}
        onClose={closeForm}
        onSubmit={saveProduct}
        onDelete={(product) => {
          closeForm();
          setDeleteError(null);
          setDeleteProduct(product);
        }}
      />

      <DeleteProductDialog
        product={deleteProduct}
        loading={deleteLoading}
        error={deleteError}
        onCancel={() => { setDeleteProduct(null); setDeleteError(null); }}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}

function MetricCard({ value, label, detail }: { value: string; label: string; detail: string }) {
  return <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-3xl font-bold tracking-tight text-[#0B1930]">{value}</p><h2 className="mt-1 font-semibold text-[#0B1930]">{label}</h2><p className="mt-1 text-sm text-slate-500">{detail}</p></article>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="block text-sm font-medium text-slate-600"><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"><option value="">All</option>{options.map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}</select></label>;
}

function ProductResults({ products, onEdit }: { products: AdminProduct[]; onEdit: (product: AdminProduct) => void }) {
  return <>
    <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[1160px] table-fixed border-collapse text-left"><colgroup><col className="w-[78px]" /><col className="w-[220px]" /><col className="w-[145px]" /><col className="w-[130px]" /><col className="w-[160px]" /><col className="w-[120px]" /><col className="w-[145px]" /><col className="w-[145px]" /><col className="w-[150px]" /></colgroup><thead className="bg-slate-50"><tr>{["Image", "Product", "Part Number", "Brand", "Category", "Price", "Availability", "Status", "Actions"].map((column) => <th key={column} scope="col" className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{column}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{products.map((product) => <ProductRow key={product.part_number} product={product} onEdit={onEdit} />)}</tbody></table></div>
    <div className="grid gap-3 p-4 md:hidden">{products.map((product) => <ProductCard key={product.part_number} product={product} onEdit={onEdit} />)}</div>
  </>;
}

function ProductRow({ product, onEdit }: { product: AdminProduct; onEdit: (product: AdminProduct) => void }) {
  return <tr className="align-middle transition hover:bg-slate-50/80"><td className="px-4 py-3"><ProductImage product={product} size="small" /></td><td className="px-4 py-3"><p className="font-semibold text-[#0B1930]">{product.name}</p><p className="mt-1 max-w-[190px] truncate text-xs text-slate-500">{product.description || "No description"}</p></td><td className="px-4 py-3 font-mono text-xs text-slate-600">{product.part_number}</td><td className="px-4 py-3 text-sm text-slate-600">{product.brand}</td><td className="px-4 py-3 text-sm text-slate-600">{product.category || "Uncategorized"}</td><td className="px-4 py-3 text-sm font-semibold text-[#0B1930]">{formatCurrency(product.price)}</td><td className="px-4 py-3"><AdminBadge>{formatLabel(product.availability_status)}</AdminBadge></td><td className="px-4 py-3"><AdminBadge>{formatLabel(product.status)}</AdminBadge></td><td className="px-4 py-3"><button type="button" onClick={() => onEdit(product)} className="rounded-lg border border-orange-300 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-50">Manage</button></td></tr>;
}

function ProductCard({ product, onEdit }: { product: AdminProduct; onEdit: (product: AdminProduct) => void }) {
  return <article className="rounded-lg border border-slate-200 p-4"><div className="flex items-start gap-3"><ProductImage product={product} size="small" /><div className="min-w-0 flex-1"><h3 className="font-semibold text-[#0B1930]">{product.name}</h3><p className="mt-1 font-mono text-xs text-slate-500">{product.part_number}</p><p className="mt-2 text-sm font-semibold text-[#0B1930]">{formatCurrency(product.price)}</p></div></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs uppercase tracking-wide text-slate-400">Brand</dt><dd className="mt-1 text-slate-700">{product.brand}</dd></div><div><dt className="text-xs uppercase tracking-wide text-slate-400">Category</dt><dd className="mt-1 text-slate-700">{product.category || "Uncategorized"}</dd></div></dl><div className="mt-4 flex items-center justify-between"><div className="flex gap-2"><AdminBadge>{formatLabel(product.status)}</AdminBadge><AdminBadge>{formatLabel(product.availability_status)}</AdminBadge></div><button type="button" onClick={() => onEdit(product)} className="rounded-lg border border-orange-300 px-3 py-1.5 text-xs font-semibold text-orange-700">Manage</button></div></article>;
}

function ProductImage({ product, size }: { product: AdminProduct; size: "small" }) {
  const [failed, setFailed] = useState(false);
  return failed ? <span className="grid size-12 place-items-center rounded-lg bg-slate-100 text-slate-400"><FontAwesomeIcon icon={faBoxOpen} aria-hidden="true" /></span> : <img src={product.img_url} alt="" width={48} height={48} className={`rounded-lg border border-slate-200 bg-slate-50 object-cover ${size === "small" ? "size-12" : "size-16"}`} onError={() => setFailed(true)} />;
}

function LoadingState() {
  return <div className="space-y-3 px-6 py-8" aria-live="polite" aria-busy="true">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}<span className="sr-only">Loading admin products</span></div>;
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="px-6 py-14 text-center" role="alert"><FontAwesomeIcon icon={faCircleExclamation} className="text-2xl text-red-500" aria-hidden="true" /><p className="mt-3 font-semibold text-[#0B1930]">Unable to load products</p><p className="mt-2 text-sm text-slate-500">{message}</p><button type="button" onClick={onRetry} className="mt-5 rounded-lg bg-[#0B1930] px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Retry</button></div>;
}

function EmptyState() {
  return <div className="px-6 py-16 text-center"><FontAwesomeIcon icon={faBoxOpen} className="text-3xl text-slate-300" aria-hidden="true" /><p className="mt-3 font-semibold text-[#0B1930]">No products found</p><p className="mt-1 text-sm text-slate-500">Try changing your search or filters.</p></div>;
}

function Pagination({ meta, onPageChange }: { meta: AdminProductsResponse["meta"]; onPageChange: (page: number) => void }) {
  if (meta.total === 0) return null;
  return <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>Showing <strong>{(meta.current_page - 1) * meta.per_page + 1}–{Math.min(meta.current_page * meta.per_page, meta.total)}</strong> of <strong>{meta.total}</strong> products</p><div className="flex items-center gap-2"><button type="button" disabled={meta.current_page <= 1} onClick={() => onPageChange(meta.current_page - 1)} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"><FontAwesomeIcon icon={faChevronLeft} aria-hidden="true" /> Previous</button><span className="px-2 font-semibold text-[#0B1930]">Page {meta.current_page} of {meta.last_page}</span><button type="button" disabled={meta.current_page >= meta.last_page} onClick={() => onPageChange(meta.current_page + 1)} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Next <FontAwesomeIcon icon={faChevronRight} aria-hidden="true" /></button></div></div>;
}

function AdminProductFormModal({ isOpen, isEditing, product, categories, statusOptions, availabilityOptions, detailLoading, submitLoading, error, fieldErrors, onClose, onSubmit, onDelete }: { isOpen: boolean; isEditing: boolean; product: AdminProduct | null; categories: AdminProductCategoryOption[]; statusOptions: string[]; availabilityOptions: string[]; detailLoading: boolean; submitLoading: boolean; error: string | null; fieldErrors: ProductFormErrors; onClose: () => void; onSubmit: (values: ProductFormValues) => void; onDelete: (product: AdminProduct) => void }) {
  const [values, setValues] = useState<ProductFormValues>(() => product ? formFromProduct(product) : emptyForm(categories));

  if (!isOpen) return null;

  const update = (field: keyof ProductFormValues, value: string) => setValues((current) => ({ ...current, [field]: value }));
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSubmit(values); };
  const allErrors = fieldErrors;
  const fieldError = (field: keyof ProductFormValues) => allErrors[field]?.[0];

  return <ModalShell title={isEditing ? "Manage Product" : "Add Product"} description="Persisted catalog fields used by the public product catalog." onClose={onClose} footer={<div className="flex w-full items-center justify-between gap-3"><div>{isEditing && product ? <button type="button" onClick={() => onDelete(product)} disabled={submitLoading || detailLoading} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"><FontAwesomeIcon icon={faTrash} aria-hidden="true" /> Delete product</button> : null}</div><div className="flex items-center gap-3"><button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" form="admin-product-form" disabled={submitLoading || detailLoading} className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"><FontAwesomeIcon icon={faCheck} aria-hidden="true" />{submitLoading ? "Saving..." : isEditing ? "Save Changes" : "Create Product"}</button></div></div>}>
    {detailLoading ? <div className="rounded-lg bg-slate-50 px-4 py-5 text-sm text-slate-600" aria-live="polite">Loading the latest product details...</div> : null}
    {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div> : null}
    <form id="admin-product-form" onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Product name" value={values.name} error={fieldError("name")} onChange={(value) => update("name", value)} required />
        <TextField label="Part number" value={values.part_number} error={fieldError("part_number")} onChange={(value) => update("part_number", value)} required />
        <TextField label="Brand" value={values.brand} error={fieldError("brand")} onChange={(value) => update("brand", value)} required />
        <SelectField label="Category" value={values.category_id} error={fieldError("category_id")} options={categories.map((category) => ({ value: String(category.id), label: category.name }))} placeholder="Select a category" onChange={(value) => update("category_id", value)} required />
        <TextField label="Price" type="number" min="0" step="0.01" value={values.price} error={fieldError("price")} onChange={(value) => update("price", value)} required />
        <SelectField label="Availability" value={values.availability_status} error={fieldError("availability_status")} options={availabilityOptions.map((option) => ({ value: option, label: formatLabel(option) }))} onChange={(value) => update("availability_status", value)} required />
        <SelectField label="Catalog status" value={values.status} error={fieldError("status")} options={statusOptions.map((option) => ({ value: option, label: formatLabel(option) }))} onChange={(value) => update("status", value)} required />
        <TextField label="Image URL" value={values.img_url} error={fieldError("img_url")} onChange={(value) => update("img_url", value)} required />
      </div>
      <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Description</span><textarea value={values.description} onChange={(event) => update("description", event.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Image preview</p><div className="mt-3 flex items-center gap-3">{values.img_url ? <img src={values.img_url} alt="Product preview" width={72} height={72} className="size-[72px] rounded-lg border border-slate-200 bg-white object-cover" /> : <span className="grid size-[72px] place-items-center rounded-lg border border-dashed border-slate-300 text-slate-400"><FontAwesomeIcon icon={faBoxOpen} aria-hidden="true" /></span>}<p className="text-xs leading-5 text-slate-500">The current product image is stored as a URL/path. This field is ready for a future Cloudinary upload without uploading files today.</p></div></div>
    </form>
  </ModalShell>;
}

function TextField({ label, value, error, onChange, type = "text", min, step, required = false }: { label: string; value: string; error?: string; onChange: (value: string) => void; type?: string; min?: string; step?: string; required?: boolean }) {
  return <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">{label}{required ? <span aria-hidden="true"> *</span> : null}</span><input type={type} min={min} step={step} value={value} required={required} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />{error ? <span className="mt-1 block text-xs font-medium text-red-600" role="alert">{error}</span> : null}</label>;
}

function SelectField({ label, value, options, placeholder, error, onChange, required = false }: { label: string; value: string; options: Array<{ value: string; label: string }>; placeholder?: string; error?: string; onChange: (value: string) => void; required?: boolean }) {
  return <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">{label}{required ? <span aria-hidden="true"> *</span> : null}</span><select value={value} required={required} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">{placeholder ? <option value="">{placeholder}</option> : null}{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{error ? <span className="mt-1 block text-xs font-medium text-red-600" role="alert">{error}</span> : null}</label>;
}

function ModalShell({ title, description, onClose, children, footer }: { title: string; description: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; const frame = window.requestAnimationFrame(() => closeButtonRef.current?.focus()); const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; document.body.style.overflow = "hidden"; document.addEventListener("keydown", close); return () => { window.cancelAnimationFrame(frame); document.body.style.overflow = ""; document.removeEventListener("keydown", close); previous?.focus(); }; }, [onClose]);
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"><button type="button" aria-label={`Close ${title}`} onClick={onClose} className="fixed inset-0 bg-slate-950/45" /><section role="dialog" aria-modal="true" aria-labelledby="admin-product-modal-title" aria-describedby="admin-product-modal-description" className="relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl"><header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">Product Catalog</p><h2 id="admin-product-modal-title" className="mt-1 text-xl font-bold text-[#0B1930]">{title}</h2><p id="admin-product-modal-description" className="mt-1 text-sm text-slate-500">{description}</p></div><button ref={closeButtonRef} type="button" onClick={onClose} aria-label={`Close ${title}`} className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#0B1930]"><FontAwesomeIcon icon={faXmark} aria-hidden="true" /></button></header><div className="px-5 py-5 sm:px-6">{children}</div><footer className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">{footer}</footer></section></div>;
}

function DeleteProductDialog({ product, loading, error, onCancel, onConfirm }: { product: AdminProduct | null; loading: boolean; error: string | null; onCancel: () => void; onConfirm: () => void }) {
  if (!product) return null;
  return <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"><button type="button" aria-label="Close delete confirmation" onClick={onCancel} className="fixed inset-0 bg-slate-950/45" /><section role="dialog" aria-modal="true" aria-labelledby="delete-product-title" className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"><div className="grid size-11 place-items-center rounded-full bg-red-50 text-red-600"><FontAwesomeIcon icon={faTrash} aria-hidden="true" /></div><h2 id="delete-product-title" className="mt-4 text-xl font-bold text-[#0B1930]">Delete product?</h2><p className="mt-2 text-sm leading-6 text-slate-600">This permanently removes <strong>{product.name}</strong> if no existing order references it. Historical order snapshots are protected.</p>{error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button><button type="button" onClick={onConfirm} disabled={loading} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Deleting..." : "Delete product"}</button></div></section></div>;
}
