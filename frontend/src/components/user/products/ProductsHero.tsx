import Image from "next/image";
import Link from "next/link";

export default function ProductsHero() {
  return (
    <section className="products-hero pt-13" aria-labelledby="products-page-title">
      <div className="products-hero-image" aria-hidden="true">
        <Image
          src="/branches/manila.png"
          alt=""
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className="products-hero-overlay" aria-hidden="true" />
      <div className="products-shell products-hero-content ">
        <p className="products-breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span>Products</span>
        </p>
        <h1 id="products-page-title">Motorcycle Parts Catalog</h1>
        <p className="products-hero-description">
          Browse genuine and compatible motorcycle parts for Honda, Yamaha, and
          Suzuki motorcycles.
        </p>
      </div>
    </section>
  );
}
