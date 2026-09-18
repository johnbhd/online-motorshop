import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import ProductFulfillmentInfo from "./ProductFulfillmentInfo";
import ProductGallery from "./ProductGallery";
import ProductInformation from "./ProductInformation";
import ProductOverview from "./ProductOverview";
import ProductPurchasePanel from "./ProductPurchasePanel";
import type { ProductDisplayItem } from "../products/productsData";

type ProductDetailsPageProps = {
  product: ProductDisplayItem;
};

export default function ProductDetailsPage({
  product,
}: ProductDetailsPageProps) {
  return (
    <div className="product-details-page">
      <div className="product-details-shell">
        <header className="product-details-header">
          <nav className="product-details-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/products">Products</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{product.name}</span>
          </nav>
        </header>

        <div className="product-details-layout">
          <ProductGallery product={product} />

          <section
            className="product-details-main-card"
            aria-label="Product purchase information"
          >
            <ProductOverview product={product} />
            <ProductPurchasePanel product={product} />
          </section>

          <ProductFulfillmentInfo />
        </div>

        <ProductInformation product={product} />

        <div className="product-details-back-link-wrap">
          <Link className="product-details-back-link" href="/products">
            <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
            Back to Products
          </Link>
        </div>
      </div>
    </div>
  );
}
