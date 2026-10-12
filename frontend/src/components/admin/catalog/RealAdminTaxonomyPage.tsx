/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faBoxOpen, faCircleExclamation, faPlus, faRefresh, faTags, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import ArchiveRecordButton from "@/components/admin/archive/ArchiveRecordButton";
import { AdminProductFormModal } from "@/components/admin/products/RealAdminProductsPage";
import { createAdminBrand, createAdminCategory, deleteAdminBrand, deleteAdminCategory, getAdminBrandProducts, getAdminBrands, getAdminCategories, getAdminCategoryProducts, getAdminTaxonomyErrorMessage, getTaxonomyValidationErrors, updateAdminBrand, updateAdminCategory } from "@/lib/adminTaxonomyApi";
import { createAdminProduct, deleteAdminProduct, getValidationErrors, updateAdminProduct } from "@/lib/adminProductsApi";
import type { AdminProduct, AdminProductBrandOption, AdminProductCategoryOption } from "@/lib/adminProductsTypes";
import type { AdminTaxonomyPayload, AdminTaxonomyRecord } from "@/lib/adminTaxonomyTypes";
import { getAuthToken } from "@/lib/auth/authStorage";

type Tab = "categories" | "brands";
type ProductFormValues = { category_id: string; brand_id: string; name: string; part_number: string; description: string; price: string; img_url: string; availability_status: string; status: string };
const EMPTY_TAXONOMY: AdminTaxonomyPayload = { name: "", description: null, status: "active" };

export default function RealAdminTaxonomyPage() {
  const [tab, setTab] = useState<Tab>("categories");
  const [items, setItems] = useState<AdminTaxonomyRecord[]>([]);
  const [selected, setSelected] = useState<AdminTaxonomyRecord | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productMeta, setProductMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [productFilters, setProductFilters] = useState({ categories: [] as AdminProductCategoryOption[], brands: [] as AdminProductBrandOption[] });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [listLastPage, setListLastPage] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [editor, setEditor] = useState<AdminTaxonomyRecord | null | false>(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminTaxonomyRecord | null>(null);
  const [editorValues, setEditorValues] = useState<AdminTaxonomyPayload>(EMPTY_TAXONOMY);
  const [editorErrors, setEditorErrors] = useState<Record<string, string[]>>({});
  const [editorError, setEditorError] = useState<string | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [productModal, setProductModal] = useState<AdminProduct | null | false>(false);
  const [productModalKey, setProductModalKey] = useState(0);
  const [productSaving, setProductSaving] = useState(false);
  const [productFormError, setProductFormError] = useState<string | null>(null);
  const [productFieldErrors, setProductFieldErrors] = useState<Record<string, string[]>>({});

  const token = getAuthToken();
  const singular = tab === "categories" ? "Category" : "Brand";

  const loadList = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try {
      const response = tab === "categories"
        ? await getAdminCategories(token, { search, page, perPage: 10 })
        : await getAdminBrands(token, { search, page, perPage: 10 });
      const nextItems = "categories" in response ? response.categories : response.brands;
      setListLastPage(response.meta.last_page);
      setItems(nextItems);
      setSelected((current) => current && nextItems.some((item) => item.id === current.id) ? nextItems.find((item) => item.id === current.id) ?? null : null);
    } catch (requestError) { setError(getAdminTaxonomyErrorMessage(requestError)); } finally { setLoading(false); }
  }, [page, search, tab, token]);

  const loadProducts = useCallback(async () => {
    if (!token || !selected) { setProducts([]); return; }
    setProductsLoading(true); setProductError(null);
    try {
      const response = tab === "categories" ? await getAdminCategoryProducts(token, selected.id, { page: productPage, perPage: 6 }) : await getAdminBrandProducts(token, selected.id, { page: productPage, perPage: 6 });
      setProducts(response.products);
      setProductMeta({ current_page: response.meta.current_page, last_page: response.meta.last_page, total: response.meta.total });
      setProductFilters({ categories: response.filters.categories, brands: response.filters.brand_options });
    } catch (requestError) { setProductError(getAdminTaxonomyErrorMessage(requestError)); } finally { setProductsLoading(false); }
  }, [productPage, selected, tab, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadList(), 0);
    return () => window.clearTimeout(timer);
  }, [loadList]);
  useEffect(() => {
    const timer = window.setTimeout(() => void loadProducts(), 0);
    return () => window.clearTimeout(timer);
  }, [loadProducts]);

  const openCreate = () => { setEditor(null); setEditorValues(EMPTY_TAXONOMY); setEditorErrors({}); setEditorError(null); };
  const openEdit = (item: AdminTaxonomyRecord) => { setEditor(item); setEditorValues({ name: item.name, description: item.description, status: item.status }); setEditorErrors({}); setEditorError(null); };

  const submitEditor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!token) return;
    setEditorLoading(true); setEditorError(null); setEditorErrors({});
    try {
      if (tab === "categories") { if (editor) await updateAdminCategory(token, editor.id, editorValues); else await createAdminCategory(token, editorValues); }
      else if (editor) await updateAdminBrand(token, editor.id, editorValues);
      else await createAdminBrand(token, editorValues);
      setEditor(false); await loadList();
    } catch (requestError) { setEditorError(getAdminTaxonomyErrorMessage(requestError)); setEditorErrors(getTaxonomyValidationErrors(requestError)); } finally { setEditorLoading(false); }
  };

  const confirmDelete = async () => {
    if (!token || !deleteTarget) return;
    setDeleteLoading(true);
    try {
      if (tab === "categories") await deleteAdminCategory(token, deleteTarget.id); else await deleteAdminBrand(token, deleteTarget.id);
      setDeleteTarget(null); if (selected?.id === deleteTarget.id) setSelected(null); await loadList();
    } catch (requestError) { setError(getAdminTaxonomyErrorMessage(requestError)); setDeleteTarget(null); } finally { setDeleteLoading(false); }
  };

  const openProductCreate = () => { setProductFormError(null); setProductFieldErrors({}); setProductModalKey((value) => value + 1); setProductModal(null); };
  const openProductEdit = (product: AdminProduct) => { setProductFormError(null); setProductFieldErrors({}); setProductModalKey((value) => value + 1); setProductModal(product); };
  const saveProduct = async (values: ProductFormValues) => {
    if (!token) return;
    setProductSaving(true); setProductFormError(null); setProductFieldErrors({});
    const payload = { category_id: Number(values.category_id), brand_id: Number(values.brand_id), name: values.name.trim(), part_number: values.part_number.trim(), description: values.description.trim() || null, price: Number(values.price), img_url: values.img_url.trim(), availability_status: values.availability_status, status: values.status };
    try { if (productModal) await updateAdminProduct(token, productModal.part_number, payload); else await createAdminProduct(token, payload); setProductModal(false); await Promise.all([loadProducts(), loadList()]); } catch (requestError) { setProductFormError(requestError instanceof Error ? requestError.message : "Unable to save the product."); setProductFieldErrors(getValidationErrors(requestError)); } finally { setProductSaving(false); }
  };
  const removeProduct = async (product: AdminProduct) => {
    if (!token) return;
    setProductSaving(true);
    try { await deleteAdminProduct(token, product.part_number); setProductModal(false); await Promise.all([loadProducts(), loadList()]); } catch (requestError) { setProductFormError(requestError instanceof Error ? requestError.message : "Unable to delete the product."); } finally { setProductSaving(false); }
  };
  const resetTab = (nextTab: Tab) => { setTab(nextTab); setPage(1); setProductPage(1); setSelected(null); setError(null); };

  useEffect(() => {
    const tableBody = document.querySelector("table tbody");

    if (!tableBody) {
      return;
    }

    const handleRowClick = (event: Event) => {
      const target = event.target as HTMLElement;

      if (target.closest("button")) {
        return;
      }

      const row = target.closest("tr");
      const rowIndex = row ? Array.from(tableBody.children).indexOf(row) : -1;
      const item = rowIndex >= 0 ? items[rowIndex] : undefined;

      if (item) {
        setSelected(item);
        setProductPage(1);
      }
    };

    const rows = Array.from(tableBody.children);
    rows.forEach((row) => row.classList.add("cursor-pointer"));
    tableBody.addEventListener("click", handleRowClick);

    return () => {
      tableBody.removeEventListener("click", handleRowClick);
      rows.forEach((row) => row.classList.remove("cursor-pointer"));
    };
  }, [items]);

  return <main className="space-y-6 p-4 sm:p-6 lg:p-8">
    <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">Catalog structure</p><h1 className="mt-1 text-2xl font-bold text-[#0B1930]">Categories &amp; Brands</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">Manage taxonomy, see assigned products, and keep the public catalog organized.</p></div><button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"><FontAwesomeIcon icon={faPlus} /> Add {singular}</button></header>
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Taxonomy type">{(["categories", "brands"] as Tab[]).map((value) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => resetTab(value)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === value ? "bg-[#0B1930] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{value === "categories" ? "Categories" : "Brands"}</button>)}</div>
    {error && <InlineError message={error} onRetry={() => void loadList()} />}
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0 flex-1"><label htmlFor="taxonomy-search" className="sr-only">Search {tab}</label><input id="taxonomy-search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={`Search ${tab}...`} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-orange-200 focus:ring-2" /></div><button type="button" onClick={() => void loadList()} aria-label="Refresh taxonomy" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50"><FontAwesomeIcon icon={faRefresh} /></button></div>{loading ? <LoadingRows /> : items.length === 0 ? <EmptyState label={tab} onAdd={openCreate} /> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Products</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item.id} className={`hover:bg-orange-50/40 ${selected?.id === item.id ? "bg-orange-50/60" : ""}`}><td className="px-4 py-3"><button type="button" onClick={() => { setSelected(item); setProductPage(1); }} className="text-left font-semibold text-[#0B1930] hover:text-orange-700">{item.name}</button>{item.description && <p className="mt-1 max-w-xs truncate text-xs text-slate-500">{item.description}</p>}</td><td className="px-4 py-3"><AdminBadge>{item.status}</AdminBadge></td><td className="px-4 py-3 font-semibold text-[#0B1930]">{item.product_count}</td><td className="px-4 py-3"><div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => openEdit(item)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Manage</button><ArchiveRecordButton type={tab === "categories" ? "category" : "brand"} id={item.id} label={item.name} onArchived={loadList} /><button type="button" onClick={() => setDeleteTarget(item)} aria-label={`Delete ${item.name}`} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-red-600 hover:bg-red-50"><FontAwesomeIcon icon={faTrash} /></button></div></td></tr>)}</tbody></table></div>}{!loading && items.length > 0 && <Pagination current={page} last={listLastPage} total={items.length} onChange={setPage} />}</div>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">{!selected ? <div className="grid min-h-64 place-items-center text-center text-slate-500"><div><FontAwesomeIcon icon={faTags} className="text-3xl text-slate-300" /><p className="mt-3 text-sm">Select a {singular.toLowerCase()} to view its products.</p></div></div> : <><div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4"><div><p className="text-xs font-bold uppercase tracking-wide text-orange-600">Assigned products</p><h2 className="mt-1 text-xl font-bold text-[#0B1930]">{selected.name}</h2><p className="mt-1 text-sm text-slate-500">{productMeta.total} product{productMeta.total === 1 ? "" : "s"}</p></div><button type="button" onClick={openProductCreate} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700"><FontAwesomeIcon icon={faPlus} /> Add product</button></div>{productError && <div className="mt-4"><InlineError message={productError} onRetry={() => void loadProducts()} /></div>}{productsLoading ? <LoadingRows /> : products.length === 0 ? <div className="py-12 text-center text-sm text-slate-500">No products are assigned to this {singular.toLowerCase()}.</div> : <div className="mt-4 space-y-3">{products.map((product) => <button type="button" key={product.id} onClick={() => openProductEdit(product)} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-orange-300 hover:bg-orange-50/40"><img src={product.img_url} alt="" className="size-12 rounded-lg bg-slate-100 object-cover" /><span className="min-w-0 flex-1"><span className="block truncate font-semibold text-[#0B1930]">{product.name}</span><span className="mt-1 block font-mono text-xs text-slate-500">{product.part_number}</span></span><span className="text-sm font-semibold text-[#0B1930]">₱{Number(product.price).toLocaleString("en-PH")}</span></button>)}</div>}<Pagination current={productPage} last={productMeta.last_page} total={productMeta.total} onChange={setProductPage} /></>}</section>
    </section>
    {editor !== false && <TaxonomyEditor title={`${editor ? "Edit" : "Add"} ${singular}`} values={editorValues} errors={editorErrors} error={editorError} loading={editorLoading} onChange={setEditorValues} onClose={() => setEditor(false)} onSubmit={submitEditor} />}
    {deleteTarget && <ConfirmDelete item={deleteTarget} loading={deleteLoading} onClose={() => setDeleteTarget(null)} onConfirm={() => void confirmDelete()} />}
    {productModal !== false && <AdminProductFormModal key={productModalKey} isOpen isEditing={Boolean(productModal)} product={productModal} categories={productFilters.categories} brands={productFilters.brands} initialCategoryId={tab === "categories" ? selected?.id : undefined} initialBrandId={tab === "brands" ? selected?.id : undefined} statusOptions={["active", "inactive"]} availabilityOptions={["active", "out_of_stock", "discontinued"]} detailLoading={false} submitLoading={productSaving} error={productFormError} fieldErrors={productFieldErrors} onClose={() => setProductModal(false)} onSubmit={(values) => void saveProduct(values)} onDelete={(product) => void removeProduct(product)} />}
  </main>;
}

function TaxonomyEditor({ title, values, errors, error, loading, onChange, onClose, onSubmit }: { title: string; values: AdminTaxonomyPayload; errors: Record<string, string[]>; error: string | null; loading: boolean; onChange: (values: AdminTaxonomyPayload) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 p-4"><form onSubmit={onSubmit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-bold text-[#0B1930]">{title}</h2><button type="button" onClick={onClose} aria-label="Close dialog" className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><FontAwesomeIcon icon={faXmark} /></button></div>{error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<label className="mt-5 block text-sm font-semibold text-slate-700">Name<input required value={values.name} onChange={(event) => onChange({ ...values, name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-orange-200 focus:ring-2" />{errors.name?.map((message) => <span key={message} className="mt-1 block text-xs text-red-600">{message}</span>)}</label><label className="mt-4 block text-sm font-semibold text-slate-700">Description<textarea value={values.description ?? ""} onChange={(event) => onChange({ ...values, description: event.target.value || null })} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-orange-200 focus:ring-2" /></label><label className="mt-4 block text-sm font-semibold text-slate-700">Status<select value={values.status} onChange={(event) => onChange({ ...values, status: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"><option value="active">Active</option><option value="inactive">Inactive</option></select></label><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button><button type="submit" disabled={loading} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Saving..." : "Save"}</button></div></form></div>;
}

function ConfirmDelete({ item, loading, onClose, onConfirm }: { item: AdminTaxonomyRecord; loading: boolean; onClose: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 p-4"><div role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="grid size-12 place-items-center rounded-full bg-red-50 text-red-600"><FontAwesomeIcon icon={faTrash} /></div><h2 className="mt-4 text-xl font-bold text-[#0B1930]">Delete {item.name}?</h2><p className="mt-2 text-sm leading-6 text-slate-600">This is only allowed when no products are assigned. The server will protect populated records.</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button><button type="button" onClick={onConfirm} disabled={loading} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Deleting..." : "Delete"}</button></div></div></div>;
}

function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><FontAwesomeIcon icon={faCircleExclamation} /><span className="min-w-0 flex-1">{message}</span><button type="button" onClick={onRetry} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold hover:bg-white">Retry</button></div>;
}

function LoadingRows() {
  return <div className="space-y-3 p-4" aria-label="Loading"><div className="h-12 animate-pulse rounded-lg bg-slate-100" /><div className="h-12 animate-pulse rounded-lg bg-slate-100" /><div className="h-12 animate-pulse rounded-lg bg-slate-100" /></div>;
}

function EmptyState({ label, onAdd }: { label: string; onAdd: () => void }) {
  return <div className="grid min-h-64 place-items-center p-6 text-center"><div><FontAwesomeIcon icon={faBoxOpen} className="text-3xl text-slate-300" /><p className="mt-3 text-sm text-slate-500">No {label} found.</p><button type="button" onClick={onAdd} className="mt-4 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white">Add {label === "categories" ? "Category" : "Brand"}</button></div></div>;
}

function Pagination({ current, last, total, onChange }: { current: number; last: number; total: number; onChange: (page: number) => void }) {
  if (total === 0 || last <= 1) return null;
  return <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500"><span>Page {current} of {last}</span><div className="flex gap-2"><button type="button" disabled={current <= 1} onClick={() => onChange(current - 1)} className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40"><FontAwesomeIcon icon={faArrowLeft} /></button><button type="button" disabled={current >= last} onClick={() => onChange(current + 1)} className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40"><FontAwesomeIcon icon={faArrowLeft} className="rotate-180" /></button></div></div>;
}
