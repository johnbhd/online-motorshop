"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  aboutBranches,
  branchInfoIcons,
  type AboutBranch,
} from "./aboutData";
import BranchMapModal from "./modal/BranchMapModal";

export default function AboutBranchesNext() {
  const [selectedBranch, setSelectedBranch] =
    useState<AboutBranch | null>(null);
  const handleOpenMap = useCallback(
    (branch: AboutBranch) => {
      setSelectedBranch(branch);
    },
    [],
  );
  const handleCloseMap = useCallback(() => {
    setSelectedBranch(null);
  }, []);

  return (
    <section className="branches-section">
      <div className="wrap">
        <div className="branches-head">
          <div className="eyebrow">Visit ALD Motorshop</div>
          <h2 className="section-title">Our Verified Branches</h2>
          <p className="section-sub">
            Visit one of the currently verified ALD Motorshop branches for
            motorcycle parts, service, and order pickup. Branch hours, contact
            details, and service availability should be confirmed directly with
            ALD Motorshop.
          </p>
        </div>
        <div className="branch-grid">
          {aboutBranches.map((branch) => (
            <article className="branch-card" key={branch.name}>
              <div className="branch-photo">
                <Image
                  src={branch.image}
                  alt={`ALD Motorshop ${branch.name}`}
                  fill
                  sizes="(max-width: 900px) 100vw, 33vw"
                />
              </div>
              <div className="branch-body">
                <h4>ALD Motorshop — {branch.name}</h4>
                <div className="b-line">
                  <div className="icon">
                    <FontAwesomeIcon icon={branchInfoIcons.address} />
                  </div>
                  <span>{branch.address}</span>
                </div>
                <div className="b-line">
                  <div className="icon">
                    <FontAwesomeIcon icon={branchInfoIcons.hours} />
                  </div>
                  <span>Contact branch for current hours</span>
                </div>
                <div className="b-line">
                  <div className="icon">
                    <FontAwesomeIcon icon={branchInfoIcons.contact} />
                  </div>
                  <span>Contact ALD Motorshop</span>
                </div>
                <div className="tag-row">
                  {branch.tags.map((tag) => (
                    <span className="tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="branch-actions">
                  <button
                    className="btn"
                    type="button"
                    aria-label={`View map for ${branch.name}`}
                    onClick={() => {
                      handleOpenMap(branch);
                    }}
                  >
                    <FontAwesomeIcon icon={branchInfoIcons.map} />
                    View on Map
                  </button>
                  <a className="btn primary" href="#">
                    <FontAwesomeIcon icon={branchInfoIcons.pickup} />
                    Select as Pickup Branch
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      {selectedBranch && (
        <BranchMapModal
          branch={selectedBranch}
          onClose={handleCloseMap}
        />
      )}
    </section>
  );
}
