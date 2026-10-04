import { formatPeso } from "@/components/user/cart/cartData";
import type { AdminProduct } from "@/lib/mock/admin";

export type ProductFormState = {
  name: string;
  partNumber: string;
  brand: string;
  category: string;
  price: string;
  availability: string;
  status: string;
};

export type ProductFormErrors = Partial<
  Record<keyof ProductFormState, string>
>;

export type ProductFormOptions = {
  brandOptions: string[];
  categoryOptions: string[];
  availabilityOptions: string[];
  statusOptions: string[];
};

export function createEmptyProductForm(
  options: ProductFormOptions,
): ProductFormState {
  return {
    name: "",
    partNumber: "",
    brand: options.brandOptions[0] ?? "",
    category: options.categoryOptions[0] ?? "",
    price: "",
    availability: options.availabilityOptions[0] ?? "",
    status: options.statusOptions[0] ?? "",
  };
}

export function getProductFormState(product: AdminProduct): ProductFormState {
  return {
    name: product.name,
    partNumber: product.partNumber,
    brand: product.brand,
    category: product.category,
    price: product.price.replace(/[^0-9.]/g, ""),
    availability: product.availability,
    status: product.status,
  };
}

export function validateProductForm(
  values: ProductFormState,
  existingProducts: AdminProduct[],
  originalPartNumber?: string,
): ProductFormErrors {
  const errors: ProductFormErrors = {};
  const name = values.name.trim();
  const partNumber = values.partNumber.trim();
  const price = values.price.trim();

  if (!name) {
    errors.name = "Please enter a product name.";
  }

  if (!partNumber) {
    errors.partNumber = "Please enter a product code.";
  } else {
    const normalizedPartNumber = partNumber.toLowerCase();
    const isDuplicate = existingProducts.some((product) => {
      const isCurrentProduct = originalPartNumber
        ? product.partNumber.toLowerCase() === originalPartNumber.toLowerCase()
        : false;

      return (
        !isCurrentProduct &&
        product.partNumber.toLowerCase() === normalizedPartNumber
      );
    });

    if (isDuplicate) {
      errors.partNumber = "A product with this code already exists.";
    }
  }

  if (!values.brand) {
    errors.brand = "Please select a brand.";
  }

  if (!values.category) {
    errors.category = "Please select a category.";
  }

  const numericPrice = Number(price);

  if (!price || !Number.isFinite(numericPrice) || numericPrice < 0) {
    errors.price = "Please enter a valid price.";
  }

  if (!values.availability) {
    errors.availability = "Please select an availability value.";
  }

  if (!values.status) {
    errors.status = "Please select a product status.";
  }

  return errors;
}

export function productFromForm(
  values: ProductFormState,
): AdminProduct {
  return {
    name: values.name.trim(),
    partNumber: values.partNumber.trim(),
    brand: values.brand,
    category: values.category,
    price: formatPeso(Number(values.price)),
    availability: values.availability,
    status: values.status,
    updated: "Just now",
  };
}
