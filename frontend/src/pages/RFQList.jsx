import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../utils/api";
import { getUser } from "../utils/auth";

export default function RFQList() {
  const [rfqs, setRfqs] = useState([]);
  const [error, setError] = useState("");
  const user = getUser();

  useEffect(() => {
    const fetchRfqs = async () => {
      try {
        const res = await fetch(`${API_BASE}/rfqs`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Unable to load RFQs");
        }

        setRfqs(data.data || []);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchRfqs();
  }, []);

  const getAuctionState = (rfq) => {
    const now = new Date();
    const start = new Date(rfq.bidStartTime);
    const close = new Date(rfq.currentBidCloseTime);

    if (now < start) {
      return {
        label: "UPCOMING",
        className: "status-upcoming",
      };
    }

    if (now < close) {
      return {
        label: "LIVE",
        className: "status-live",
      };
    }

    return {
      label: "CLOSED",
      className: "status-closed",
    };
  };

  return (
    <div className="rfq-page">

      <div className="rfq-header">
        <div>
          <h1>RFQ Auctions</h1>
          <p>Browse and participate in quotation auctions.</p>
        </div>

        {user?.role === "buyer" && (
          <Link to="/create-rfq" className="primary-button">
            + Create RFQ
          </Link>
        )}
      </div>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {rfqs.length === 0 ? (
        <div className="empty-state">
          <h3>No RFQs available</h3>
          <p>There are currently no auctions to display.</p>
        </div>
      ) : (
        <div className="rfq-grid">
          {rfqs.map((rfq) => {
            const state = getAuctionState(rfq);

            return (
              <div className="rfq-card" key={rfq._id}>

                {/* Card Header */}
                <div className="rfq-card-header">
                  <div>
                    <h2>{rfq.name}</h2>
                    <p className="reference">
                      Reference: {rfq.referenceId}
                    </p>
                  </div>

                  <span className={`auction-status ${state.className}`}>
                    {state.label}
                  </span>
                </div>

                {/* Auction Information */}
                <div className="rfq-info-grid">

                  <div className="info-item">
                    <span className="info-label">
                      Current Lowest
                    </span>

                    <span className="lowest-price">
                      {rfq.currentLowestBidAmount != null
                        ? `₹${rfq.currentLowestBidAmount}`
                        : "No bids yet"}
                    </span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">
                      Auction Closes
                    </span>

                    <span className="info-value">
                      {new Date(
                        rfq.currentBidCloseTime
                      ).toLocaleString()}
                    </span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">
                      Pickup Date
                    </span>

                    <span className="info-value">
                      {new Date(
                        rfq.pickupDate
                      ).toLocaleDateString()}
                    </span>
                  </div>

                </div>

                {/* Footer */}
                <div className="rfq-card-footer">
                  <Link
                    to={`/rfq/${rfq._id}`}
                    className="view-auction-button"
                  >
                    View Auction →
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}