"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faCreditCard,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";
import CustomerInformation from "./CustomerInformation";
import CheckoutNextSteps from "./CheckoutNextSteps";
import CheckoutOrderSummary from "./CheckoutOrderSummary";
import DeliveryFields from "./DeliveryFields";
import FulfillmentMethod from "./FulfillmentMethod";
import StorePickupFields from "./StorePickupFields";
import { useDemoAuth } from "@/components/auth/DemoAuthProvider";
import { getCustomerPhoneForSession } from "@/lib/auth/demoAuthStorage";
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
  DemoOrder,
  DemoOrderItem,
  DemoOrderFulfillment,
} from "./checkoutTypes";
import {
  createOrderReference,
  getBranchById,
  getCartSubtotal,
  hasDisplayablePrices,
  readDemoOrders,
  readSelectedBranchId,
  saveDemoCustomer,
  saveDemoOrder,
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
  const { session, isReady: isAuthReady } = useDemoAuth();
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [formData, setFormData] = useState<CheckoutFormData>(initialFormData);
  const [errors, setErrors] = useState<CheckoutFieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    const storedCartItems = readStoredCartItems();
    const loggedInCustomer =
      session?.role === "customer"
        ? {
            fullName: session.name,
            email: session.email,
            contactNumber: getCustomerPhoneForSession(session),
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
  }, [isAuthReady, session]);

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitLockRef.current || isSubmitting) {
      return;
    }

    if (cartItems.length === 0) {
      setSubmitError("Your cart is empty. Add a product before submitting a request.");
      return;
    }

    const validationErrors = validateCheckoutForm(formData);
    const selectedBranch =
      formData.fulfillmentMethod === "pickup"
        ? getBranchById(formData.branchId)
        : undefined;

    if (formData.fulfillmentMethod === "pickup" && !selectedBranch) {
      validationErrors.branchId = "Choose an ALD branch for pickup.";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitError("Review the highlighted details before submitting your request.");
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);
    setSubmitError("");

    const customer: CheckoutCustomerData = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      contactNumber: formData.contactNumber.trim(),
    };
    const fulfillment: DemoOrderFulfillment = selectedBranch
      ? {
          method: "pickup",
          branch: {
            id: formData.branchId,
            name: selectedBranch.name,
            address: selectedBranch.address,
          },
        }
      : {
          method: "delivery",
          delivery: {
            address: formData.delivery.address.trim(),
            barangay: formData.delivery.barangay.trim(),
            city: formData.delivery.city.trim(),
            contactPerson: formData.delivery.contactPerson.trim(),
            notes: formData.delivery.notes.trim(),
          },
        };
    const orderItems: DemoOrderItem[] = cartItems.map((item) => ({
      product: {
        ...item.product,
      },
      compatibility: item.compatibility,
      price: item.price,
      quantity: item.quantity,
    }));
    const reference = createOrderReference(readDemoOrders());
    const timestamp = new Date().toISOString();
    const order: DemoOrder = {
      reference,
      customer,
      items: orderItems,
      fulfillment,
      orderNotes: formData.orderNotes.trim(),
      estimatedSubtotal: hasDisplayablePrices(cartItems)
        ? getCartSubtotal(cartItems)
        : null,
      totalQuantity: cartItems.reduce(
        (total, item) => total + item.quantity,
        0,
      ),
      status: "Pending",
      paymentStatus: "Unpaid",
      createdAt: timestamp,
      updatedAt: timestamp,
      activities: [
        {
          id: `${reference}-submitted`,
          status: "Pending",
          title: "Order Request Submitted",
          message: "Your order request has been received.",
          createdAt: timestamp,
        },
      ],
    };

    if (!saveDemoOrder(order)) {
      setIsSubmitting(false);
      submitLockRef.current = false;
      setSubmitError(
        "This request could not be saved in this browser. Please try again or contact ALD Motorshop.",
      );
      return;
    }

    saveDemoCustomer(customer);
    clearStoredCart();
    router.push(
      `/order-confirmation/${encodeURIComponent(order.reference)}`,
    );
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

            {formData.fulfillmentMethod === "pickup" ? (
              <StorePickupFields
                selectedBranchId={formData.branchId}
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
            ) : (
              <DeliveryFields
                values={formData.delivery}
                errors={errors}
                onChange={updateDelivery}
              />
            )}

            <section className="checkout-section checkout-section--payment" aria-labelledby="checkout-payment-title">
              <div className="checkout-section-heading">
                <div className="checkout-section-icon" aria-hidden="true">
                  <FontAwesomeIcon icon={faCreditCard} />
                </div>
                <div>
                  <h2 id="checkout-payment-title">Payment and Final Amount</h2>
                  <p>No payment is collected during this demo order request.</p>
                </div>
              </div>
              <div className="checkout-neutral-notice" role="note">
                <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
                <p>
                  ALD staff will confirm product availability, compatibility, the final
                  amount, payment instructions, and preparation details before any
                  payment is made.
                </p>
              </div>
            </section>

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

        <CheckoutNextSteps />
      </div>
    </div>
  );
}
