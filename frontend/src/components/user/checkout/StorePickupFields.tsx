import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { aboutBranches } from "../about/aboutData";
import { getBranchId } from "./checkoutUtils";

type StorePickupFieldsProps = {
  selectedBranchId: string;
  error?: string;
  onChange: (branchId: string) => void;
};

export default function StorePickupFields({
  selectedBranchId,
  error,
  onChange,
}: StorePickupFieldsProps) {
  const selectedBranch = aboutBranches.find(
    (branch) => getBranchId(branch.name) === selectedBranchId,
  );

  return (
    <section className="checkout-sub-panel checkout-sub-panel--pickup">
      <div className="checkout-sub-panel-heading">
        <h3>Pickup Branch</h3>
        <p>Choose a branch for your request. Availability is confirmed by ALD staff.</p>
      </div>

      <div className="checkout-field">
        <label htmlFor="checkout-branch">Preferred Branch</label>
        <select
          id="checkout-branch"
          name="branchId"
          value={selectedBranchId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "checkout-branch-error" : undefined}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        >
          <option value="">Select an ALD branch</option>
          {aboutBranches.map((branch) => (
            <option key={branch.name} value={getBranchId(branch.name)}>
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
    </section>
  );
}
