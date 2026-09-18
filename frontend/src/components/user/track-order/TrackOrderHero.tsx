import Image from "next/image";
import Link from "next/link";

export default function TrackOrderHero() {
  return (
    <section
      className="track-order-hero pt-13"
      aria-labelledby="track-order-page-title"
    >
      <div className="track-order-hero-image" aria-hidden="true">
        <Image
          src="/branches/manila.png"
          alt=""
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className="track-order-hero-overlay" aria-hidden="true" />
      <div className="track-order-shell track-order-hero-content">
        <p className="track-order-breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span>Track Order</span>
        </p>
        <p className="track-order-eyebrow">ORDER TRACKING</p>
        <h1 id="track-order-page-title">Track Your Order Request</h1>
        <p className="track-order-hero-description">
          Enter your ALD order reference and contact number to check the latest
          status of your order request.
        </p>
      </div>
    </section>
  );
}
