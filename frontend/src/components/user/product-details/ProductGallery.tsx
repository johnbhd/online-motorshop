import Image from "next/image";
import type { ProductDisplayItem } from "../products/productsData";

type ProductGalleryProps = {
  product: ProductDisplayItem;
};

export default function ProductGallery({ product }: ProductGalleryProps) {
  return (
    <section
      className="product-details-gallery"
      aria-label={`${product.name} image`}
    >
      <div className="product-details-image-frame">
        <Image
          src={product.image}
          alt={product.alt}
          fill
          priority
          sizes="(max-width: 760px) 100vw, (max-width: 1180px) 50vw, 42vw"
        />
      </div>
      <p className="product-details-image-note">
        Product image shown for identification.
      </p>
    </section>
  );
}
