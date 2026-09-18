import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

type PageToken = number | "ellipsis";

type OrdersPaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
};

function getPageTokens(currentPage: number, totalPages: number): PageToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
}

export default function OrdersPagination({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
}: OrdersPaginationProps) {
  const firstItem = totalItems === 0 ? 0 : startIndex + 1;
  const lastItem = Math.min(endIndex, totalItems);
  const pageTokens = getPageTokens(currentPage, totalPages);

  return (
    <div className="customer-orders-pagination-row">
      <p className="customer-orders-pagination-summary" aria-live="polite">
        Showing {firstItem}–{lastItem} of {totalItems} orders
      </p>
      {totalPages > 1 ? (
        <nav
          className="customer-orders-pagination"
          aria-label="My orders pagination"
        >
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <FontAwesomeIcon icon={faChevronLeft} aria-hidden="true" />
            <span>Previous</span>
          </button>
          <div className="customer-orders-pagination-pages">
            {pageTokens.map((token, index) => {
              if (token === "ellipsis") {
                return (
                  <span
                    className="customer-orders-pagination-ellipsis"
                    key={`ellipsis-${index}`}
                    aria-hidden="true"
                  >
                    …
                  </span>
                );
              }

              return (
                <button
                  className={token === currentPage ? "is-active" : ""}
                  type="button"
                  key={token}
                  aria-current={token === currentPage ? "page" : undefined}
                  aria-label={`Go to page ${token}`}
                  onClick={() => onPageChange(token)}
                >
                  {token}
                </button>
              );
            })}
          </div>
          <span className="customer-orders-pagination-mobile">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <span>Next</span>
            <FontAwesomeIcon icon={faChevronRight} aria-hidden="true" />
          </button>
        </nav>
      ) : null}
    </div>
  );
}
