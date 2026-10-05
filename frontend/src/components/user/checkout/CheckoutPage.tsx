"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";
import CustomerInformation from "./CustomerInformation";
import CheckoutOrderSummary from "./CheckoutOrderSummary";
import DeliveryFields from "./DeliveryFields";
import FulfillmentMethod from "./FulfillmentMethod";
import StorePickupFields from "./StorePickupFields";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getCheckoutBranches,
  type CheckoutBranch,
} from "@/lib/branches/branchApi";
import {
  getOrderRequestErrorMessage,
  OrderRequestApiError,
  submitOrderRequest,
} from "@/lib/orders/orderRequestApi";
import { saveOrderConfirmation } from "@/lib/orders/orderConfirmationStorage";
import { buildOrderRequestPayload } from "@/lib/orders/orderRequestMapper";
import type {
  CartItemData,
  FulfillmentMethod as CartFulfillmentMethod,
} from "../cart/cartTypes";
import {
  clearStoredCart,
  readStoredCartItems,
} from "../cart/cartStorage";
import type {
  CheckoutCustomerData,
  CheckoutDeliveryData,
  CheckoutFieldErrors,
  CheckoutFormData,
} from "./checkoutTypes";
import {
  getCheckoutBranchById,
  readSelectedBranchId,
  resolveSelectedBranchId,
  validateCheckoutForm,
} from "./checkoutUtils";

const initialDeliveryData: CheckoutDeliveryData = {
  address: "",
  barangay: "",
  city: "",
  contactPerson: "",
  notes: "",
};

const initialFormData: CheckoutFormData = {
  fullName: "",
  email: "",
  contactNumber: "",
  fulfillmentMethod: "pickup",
  branchId: "",
  delivery: initialDeliveryData,
  orderNotes: "",
  confirmDetails: false,
};

export default function CheckoutPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading, user } = useAuth();
  const { showToast } = useToast();
  const isAuthReady = !isAuthLoading;
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [branches, setBranches] = useState<CheckoutBranch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [branchLoadError, setBranchLoadError] = useState("");
  const [formData, setFormData] = useState<CheckoutFormData>(initialFormData);
  const [errors, setErrors] = useState<CheckoutFieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  const loadBranches = useCallback(async () => {
    setIsLoadingBranches(true);
    setBranchLoadError("");

    try {
      const nextBranches = await getCheckoutBranches();

      setBranches(nextBranches);
      setFormData((currentFormData) => ({
        ...currentFormData,
        branchId: resolveSelectedBranchId(
          nextBranches,
          currentFormData.branchId || readSelectedBranchId(),
        ),
      }));
    } catch {
      setBranches([]);
      setBranchLoadError(
        "ALD branches could not be loaded. Please try again before submitting.",
      );
    } finally {
      setIsLoadingBranches(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    const storedCartItems = readStoredCartItems();
    const loggedInCustomer =
      user?.role === "customer"
        ? {
            fullName: user.name,
            email: user.email,
            contactNumber: user.customer?.contact_number ?? "",
          }
        : null;

    // Browser storage is read after hydration to avoid server/client markup drift.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate shared cart and customer data after the client mounts
    setCartItems(storedCartItems ?? []);
    setFormData((currentFormData) => ({
      ...currentFormData,
      ...(loggedInCustomer ?? {}),
      branchId: readSelectedBranchId(),
    }));
    setIsReady(true);
    void loadBranches();
  }, [isAuthReady, loadBranches, user]);

  const updateCustomer = (
    field: keyof CheckoutCustomerData,
    value: string,
  ) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
    setSubmitError("");
  };

  const updateDelivery = (
    field: keyof CheckoutDeliveryData,
    value: string,
  ) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      delivery: {
        ...currentFormData.delivery,
        [field]: value,
      },
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field === "address" ? "deliveryAddress" : field]: undefined,
    }));
    setSubmitError("");
  };

  const handleFulfillmentChange = (method: CartFulfillmentMethod) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      fulfillmentMethod: method,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      branchId: undefined,
      deliveryAddress: undefined,
      barangay: undefined,
      city: undefined,
      contactPerson: undefined,
    }));
    setSubmitError("");
  };

  const handleOrderNotesChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      orderNotes: event.target.value,
    }));
    setSubmitError("");
  };

  const handleConfirmationChange = (checked: boolean) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      confirmDetails: checked,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      confirmDetails: undefined,
    }));
    setSubmitError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitLockRef.current || isSubmitting) {
      return;
    }

    if (cartItems.length === 0) {
      setSubmitError("Your cart is empty. Add a product before submitting a request.");
      return;
    }

    const validationErrors = validateCheckoutForm(formData);
    const selectedBranch = getCheckoutBranchById(branches, formData.branchId);

    if (!selectedBranch) {
      validationErrors.branchId = "Choose an ALD branch for this request.";
    } else if (
      formData.fulfillmentMethod === "pickup" &&
      !selectedBranch.pickupAvailable
    ) {
      validationErrors.branchId =
        "Choose a branch that currently supports store pickup.";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitError("Review the highlighted details before submitting your request.");
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);

    const payload = buildOrderRequestPayload(formData, cartItems, branches);

    if (!payload) {
      setIsSubmitting(false);
      submitLockRef.current = false;
      setSubmitError(
        "This request contains an invalid branch or cart item. Review your details and try again.",
      );
      return;
    }

    try {
      const response = await submitOrderRequest(payload, getAuthToken());

      if (!saveOrderConfirmation(response.order)) {
        throw new OrderRequestApiError(
          0,
          "The order was saved, but the confirmation could not be stored in this browser.",
        );
      }

      clearStoredCart();
      showToast({
        title: "Checkout successful",
        message: `Order request ${response.order.reference} was submitted successfully.`,
      });
      router.push(
        `/order-confirmation/${encodeURIComponent(response.order.reference)}`,
      );
    } catch (error) {
      if (error instanceof OrderRequestApiError && error.status === 0) {
        setSubmitError(error.message);
      } else {
        setSubmitError(
          getOrderRequestErrorMessage(
            error,
            "This request could not be submitted. Your cart is still saved. Please try again.",
          ),
        );
      }

      if (error instanceof OrderRequestApiError) {
        const firstValidationError = Object.entries(error.errors)[0];

        if (firstValidationError) {
          const [field, messages] = firstValidationError;
          const message = messages[0];
          const fieldMap: Record<string, keyof CheckoutFieldErrors> = {
            "customer.name": "fullName",
            "customer.email": "email",
            "customer.contact_number": "contactNumber",
            "fulfillment.branch_id": "branchId",
            "fulfillment.delivery.address": "deliveryAddress",
            "fulfillment.delivery.barangay": "barangay",
            "fulfillment.delivery.city": "city",
            "fulfillment.delivery.contact_person": "contactPerson",
          };

          if (message && fieldMap[field]) {
            setErrors((currentErrors) => ({
              ...currentErrors,
              [fieldMap[field]]: message,
            }));
          }
        }
      }
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  if (!isReady) {
    return (
      <div className="checkout-page">
        <section className="checkout-loading checkout-shell" aria-live="polite">
          Loading checkout details…
        </section>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <section className="checkout-header" aria-labelledby="checkout-page-title">
          <div className="checkout-shell">
            <nav className="checkout-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span aria-hidden="true">/</span>
              <Link href="/cart">Shopping Cart</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Checkout</span>
            </nav>
            <p className="checkout-eyebrow">Order Request</p>
            <h1 id="checkout-page-title">Checkout</h1>
          </div>
        </section>
        <section className="checkout-empty checkout-shell" aria-labelledby="checkout-empty-title">
          <div className="checkout-empty-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faFileLines} />
          </div>
          <h2 id="checkout-empty-title">Your cart is empty</h2>
          <p>Add a motorcycle part before starting an order request.</p>
          <Link className="checkout-primary-link" href="/products">
            Browse Products
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <section className="checkout-header" aria-labelledby="checkout-page-title">
        <div className="checkout-shell">
          <nav className="checkout-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/cart">Shopping Cart</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Checkout</span>
          </nav>
          <p className="checkout-eyebrow">Order Request</p>
          <h1 id="checkout-page-title">Checkout</h1>
          <p className="checkout-subtitle">
            Complete your details and submit your order request for ALD staff review.
          </p>
        </div>
      </section>

      <div className="checkout-shell checkout-content">
        <div className="checkout-info-banner" role="note">
          <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
          <p>
            Product availability, compatibility, final pricing, payment instructions,
            and delivery details are confirmed by ALD Motorshop staff after you submit
            this request.
          </p>
        </div>

        {submitError ? (
          <p className="checkout-submit-error" role="alert">
            {submitError}
          </p>
        ) : null}

        {branchLoadError ? (
          <p className="checkout-submit-error" role="alert">
            {branchLoadError}{" "}
            <button type="button" onClick={() => void loadBranches()}>
              Try again
            </button>
          </p>
        ) : null}

        <form className="checkout-layout" onSubmit={handleSubmit} noValidate>
          <div className="checkout-form-column">
            <CustomerInformation
              values={formData}
              errors={errors}
              onChange={updateCustomer}
            />

            <FulfillmentMethod
              value={formData.fulfillmentMethod}
              onChange={handleFulfillmentChange}
            />

            <StorePickupFields
              branches={branches}
              fulfillmentMethod={formData.fulfillmentMethod}
              selectedBranchId={formData.branchId}
              isLoading={isLoadingBranches}
              error={errors.branchId}
              onChange={(branchId) => {
                setFormData((currentFormData) => ({
                  ...currentFormData,
                  branchId,
                }));
                setErrors((currentErrors) => ({
                  ...currentErrors,
                  branchId: undefined,
                }));
                setSubmitError("");
              }}
            />

            {formData.fulfillmentMethod === "delivery" ? (
              <DeliveryFields
                values={formData.delivery}
                errors={errors}
                onChange={updateDelivery}
              />
            ) : null}

            <section className="checkout-section checkout-section--notes" aria-labelledby="checkout-notes-title">
              <div className="checkout-section-heading">
                <div className="checkout-section-icon" aria-hidden="true">
                  <FontAwesomeIcon icon={faFileLines} />
                </div>
                <div>
                  <h2 id="checkout-notes-title">Order Notes</h2>
                  <p>Share compatibility questions or preparation notes.</p>
                </div>
              </div>
              <div className="checkout-field">
                <label htmlFor="checkout-order-notes">Order Notes — Optional</label>
                <textarea
                  id="checkout-order-notes"
                  name="orderNotes"
                  rows={5}
                  value={formData.orderNotes}
                  placeholder="Tell ALD staff anything they should review with this request."
                  onChange={handleOrderNotesChange}
                />
              </div>
            </section>
          </div>

          <CheckoutOrderSummary
            items={cartItems}
            confirmDetails={formData.confirmDetails}
            errors={errors}
            isSubmitting={isSubmitting}
            onConfirmChange={handleConfirmationChange}
          />
        </form>

      </div>
    </div>
  );
}
