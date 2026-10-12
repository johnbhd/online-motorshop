"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxOpen, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { formatCartCurrency } from "../cart/cartData";
import type { AssistantProductCard as AssistantProductCardData } from "@/lib/assistant/assistantTypes";

type AssistantProductCardProps = {
  product: AssistantProductCardData;
};

export default function AssistantProductCard({
  product,
}: AssistantProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showPrice = product.price !== null && product.price > 0;

  return (
    <Link
      className="ald-chatbot__assistant-product-card"
      href={product.href}
      aria-label={`View ${product.name}`}
    >
      <span className="ald-chatbot__assistant-product-image-wrap">
        {product.imageUrl && !imageFailed ? (
          <Image
            className="ald-chatbot__assistant-product-image"
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 480px) 30vw, 112px"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="ald-chatbot__assistant-product-image-fallback">
            <FontAwesomeIcon icon={faBoxOpen} aria-hidden="true" />
            <span>No image</span>
          </span>
        )}
      </span>
      <span className="ald-chatbot__assistant-product-details">
        <span className="ald-chatbot__assistant-product-name">{product.name}</span>
        {(product.brand || product.category) && (
          <span className="ald-chatbot__assistant-product-meta">
            {[product.brand, product.category].filter(Boolean).join(" · ")}
          </span>
        )}
        {showPrice && (
          <span className="ald-chatbot__assistant-product-price">
            {formatCartCurrency(product.price!)}
          </span>
        )}
        <span className="ald-chatbot__assistant-product-link">
          View Product
          <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}
