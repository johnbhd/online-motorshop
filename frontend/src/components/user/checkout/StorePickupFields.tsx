import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import type { CheckoutBranch } from "@/lib/branches/branchApi";
import type { FulfillmentMethod } from "../cart/cartTypes";

type StorePickupFieldsProps = {
  branches: CheckoutBranch[];
  fulfillmentMethod: FulfillmentMethod;
  selectedBranchId: string;
  isLoading: boolean;
  error?: string;
  notesError?: string;
  pickupNotes: string;
  onChange: (branchId: string) => void;
  onNotesChange: (value: string) => void;
};

export default function StorePickupFields({
  branches,
  fulfillmentMethod,
  selectedBranchId,
  isLoading,
  error,
  notesError,
  pickupNotes,
  onChange,
  onNotesChange,
}: StorePickupFieldsProps) {
  const selectableBranches =
    fulfillmentMethod === "pickup"
      ? branches.filter((branch) => branch.pickupAvailable)
      : branches;
  const selectedBranch = selectableBranches.find(
    (branch) => String(branch.id) === selectedBranchId,
  );
  const isDelivery = fulfillmentMethod === "delivery";

  return (
    <section className="checkout-sub-panel checkout-sub-panel--pickup">
      <div className="checkout-sub-panel-heading">
        <h3>{isDelivery ? "Fulfillment Branch" : "Pickup Branch"}</h3>
        <p>
          {isDelivery
            ? "Choose the ALD branch that will handle this delivery request."
            : "Choose a branch for your request. Availability is confirmed by ALD staff."}
        </p>
      </div>

      <div className="checkout-field">
        <label htmlFor="checkout-branch">
          {isDelivery ? "ALD Branch" : "Preferred Branch"}
        </label>
        <select
          id="checkout-branch"
          name="branchId"
          value={selectedBranchId}
          disabled={isLoading || selectableBranches.length === 0}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "checkout-branch-error" : undefined}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        >
          <option value="">
            {isLoading
              ? "Loading ALD branches..."
              : selectableBranches.length > 0
                ? "Select an ALD branch"
                : "Branches unavailable"}
          </option>
          {selectableBranches.map((branch) => (
            <option key={branch.id} value={String(branch.id)}>
              {branch.name}
            </option>
          ))}
        </select>
        {error ? (
          <p className="checkout-field-error" id="checkout-branch-error">
            {error}
          </p>
        ) : null}
      </div>

      {selectedBranch ? (
        <address className="checkout-branch-address">
          <FontAwesomeIcon icon={faLocationDot} aria-hidden="true" />
          <span>{selectedBranch.address}</span>
        </address>
      ) : null}

      {!isDelivery ? (
        <div className="checkout-field">
          <label htmlFor="checkout-pickup-notes">Pickup Notes — Optional</label>
          <textarea
            id="checkout-pickup-notes"
            name="pickupNotes"
            rows={4}
            maxLength={200}
            value={pickupNotes}
            aria-invalid={Boolean(notesError)}
            aria-describedby={notesError ? "checkout-pickup-notes-error" : undefined}
            placeholder="Tell ALD staff anything they should know about your store pickup."
            onChange={(event) => onNotesChange(event.target.value)}
          />
          {notesError ? (
            <p className="checkout-field-error" id="checkout-pickup-notes-error">{notesError}</p>
          ) : (
            <p className="mt-2 text-xs text-slate-500">These notes are saved only with this Store Pickup request.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
