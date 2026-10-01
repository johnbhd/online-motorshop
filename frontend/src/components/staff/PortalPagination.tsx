export const STAFF_TABLE_PAGE_SIZE = 8;

type PageItem = number | "start-ellipsis" | "end-ellipsis";

export type PortalPaginationProps = {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
};

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "end-ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "start-ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "start-ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "end-ellipsis",
    totalPages,
  ];
}

export default function PortalPagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = "records",
}: PortalPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(
    Math.max(currentPage, 1),
    totalPages,
  );
  const firstItem = totalItems
    ? (safeCurrentPage - 1) * pageSize + 1
    : 0;
  const lastItem = Math.min(safeCurrentPage * pageSize, totalItems);
  const pageItems = getPageItems(safeCurrentPage, totalPages);

  return (
    <div className="staff-portal-pagination">
      <p className="staff-portal-pagination-summary" aria-live="polite">
        Showing{" "}
        <strong>
          {totalItems ? `${firstItem}–${lastItem}` : "0"}
        </strong>{" "}
        of <strong>{totalItems}</strong> {itemLabel}
      </p>

      {totalPages > 1 ? (
        <nav
          className="staff-portal-pagination-controls"
          aria-label="Table pagination"
        >
          <button
            className="staff-portal-pagination-button staff-portal-pagination-button-nav"
            type="button"
            aria-label="Go to previous page"
            disabled={safeCurrentPage === 1}
            onClick={() => onPageChange(safeCurrentPage - 1)}
          >
            <span aria-hidden="true">‹</span>
            <span className="staff-portal-pagination-button-label">
              Previous
            </span>
          </button>

          {pageItems.map((pageItem) =>
            typeof pageItem === "number" ? (
              <button
                key={pageItem}
                className="staff-portal-pagination-button"
                type="button"
                aria-label={`Go to page ${pageItem}`}
                aria-current={
                  pageItem === safeCurrentPage ? "page" : undefined
                }
                onClick={() => onPageChange(pageItem)}
              >
                {pageItem}
              </button>
            ) : (
              <span
                key={pageItem}
                className="staff-portal-pagination-ellipsis"
                aria-hidden="true"
              >
                …
              </span>
            ),
          )}

          <button
            className="staff-portal-pagination-button staff-portal-pagination-button-nav"
            type="button"
            aria-label="Go to next page"
            disabled={safeCurrentPage === totalPages}
            onClick={() => onPageChange(safeCurrentPage + 1)}
          >
            <span className="staff-portal-pagination-button-label">Next</span>
            <span aria-hidden="true">›</span>
          </button>
        </nav>
      ) : null}
    </div>
  );
}
