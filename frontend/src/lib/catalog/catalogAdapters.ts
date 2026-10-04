import type { AboutBranch } from "@/components/user/about/aboutData";
import type {
  CatalogApiProduct,
  CatalogBranch,
  CatalogProduct,
} from "./catalogTypes";

const branchPresentation: Record<
  string,
  { image: string; tags: string[] }
> = {
  manila: {
    image: "/branches/manila.png",
    tags: ["Motorcycle Parts", "Maintenance and Repair", "Store Pickup"],
  },
  makati: {
    image: "/branches/makati.png",
    tags: ["Motorcycle Parts", "Maintenance and Repair", "Store Pickup"],
  },
  imus: {
    image: "/branches/imus.png",
    tags: ["Motorcycle Parts", "Maintenance and Repair", "Store Pickup"],
  },
};

function toNumber(value: number | string | null | undefined) {
  const numberValue = typeof value === "number" ? value : Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function toCatalogProduct(product: CatalogApiProduct): CatalogProduct {
  const category = product.category ?? "Uncategorized";

  return {
    id: product.part_number,
    databaseId: product.id,
    partNumber: product.part_number,
    name: product.name,
    description:
      product.description ?? "Product details are available from ALD staff.",
    brand: product.brand,
    categoryId: product.category_id,
    category,
    price: toNumber(product.price),
    image: product.img_url ?? "/images/hero-section.jpg",
    alt: `${product.brand} ${product.name}`,
    availabilityStatus: product.availability_status,
    status: product.status,
  };
}

export function toCatalogProducts(products: CatalogApiProduct[]) {
  return products.map(toCatalogProduct);
}

export function toAboutBranch(branch: CatalogBranch): AboutBranch {
  const nameKey = branch.name
    .replace(/\s+Branch$/i, "")
    .trim()
    .toLowerCase();
  const presentation = branchPresentation[nameKey] ?? {
    image: "/branches/manila.png",
    tags: ["Motorcycle Parts"],
  };

  return {
    id: branch.id,
    name: branch.name,
    image: presentation.image,
    address: branch.address,
    tags: branch.pickup_available
      ? presentation.tags
      : presentation.tags.filter((tag) => tag !== "Store Pickup"),
    contactNumber: branch.contact_number,
    pickupAvailable: branch.pickup_available,
  };
}
