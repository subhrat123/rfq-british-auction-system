import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE } from "../utils/api";
import BidForm from "../components/BidForm";
import AuctionConfigForm from "../components/AuctionConfigForm";
import { getUser } from "../utils/auth";
import { socket } from "../socket/socket";

export default function RFQDetails() {
  const { id } = useParams();

  const [rfq, setRfq] = useState(null);
  const [details, setDetails] = useState(null);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);

  const user = getUser();

  const fetchRfq = async () => {
    try {
      const res = await fetch(`${API_BASE}/rfqs/${id}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Unable to load RFQ");
      }

      setRfq(result.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchDetails = async () => {
    try {
      const res = await fetch(`${API_BASE}/rfqs/${id}/details`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Unable to load RFQ details");
      }

      setDetails(result.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchActivity = async () => {
    try {
      const res = await fetch(`${API_BASE}/activity/${id}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Unable to load activity logs");
      }

      setActivity(result.data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  // Initial state only
  useEffect(() => {
    fetchRfq();
    fetchDetails();
    fetchActivity();
  }, [id]);

  // Join RFQ-specific Socket.IO room
  useEffect(() => {
    socket.emit("join_auction", id);

    return () => {
      socket.emit("leave_auction", id);
    };
  }, [id]);

  // Handle real-time bid updates
  useEffect(() => {
    const handleBidAccepted = (data) => {
      console.log("BID_ACCEPTED:", data);

      const lowestSupplierId =
        data.bid?.supplierId?._id || data.bid?.supplierId;

      setRfq((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          currentLowestBidAmount:
            data.auctionState.currentLowestBidAmount,
          currentLowestBidId:
            data.auctionState.currentLowestBidId,
          currentLowestBidSupplierId:
            lowestSupplierId,
          currentBidCloseTime:
            data.auctionState.currentBidCloseTime,
        };
      });

      setDetails((prev) => {
        if (!prev) return prev;

        return {
          ...prev,

          rfq: {
            ...prev.rfq,
            currentLowestBidAmount:
              data.auctionState.currentLowestBidAmount,
            currentLowestBidId:
              data.auctionState.currentLowestBidId,
            currentLowestBidSupplierId:
              lowestSupplierId,
            currentBidCloseTime:
              data.auctionState.currentBidCloseTime,
          },

          bids: [data.bid, ...prev.bids],
        };
      });

      if (data.activities?.length) {
        setActivity((prev) => [
          ...data.activities,
          ...prev,
        ]);
      }
    };

    socket.on("BID_ACCEPTED", handleBidAccepted);

    return () => {
      socket.off("BID_ACCEPTED", handleBidAccepted);
    };
  }, []);

  // Live countdown
  useEffect(() => {
    if (!rfq?.currentBidCloseTime) return;

    const updateTimer = () => {
      const remaining =
        new Date(rfq.currentBidCloseTime).getTime() -
        Date.now();

      setTimeLeft(Math.max(0, remaining));
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [rfq?.currentBidCloseTime]);

  const formatTimeLeft = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
      hours > 0 ? String(hours).padStart(2, "0") : null,
      String(minutes).padStart(2, "0"),
      String(seconds).padStart(2, "0"),
    ]
      .filter(Boolean)
      .join(":");
  };

  const getAuctionState = () => {
    if (!rfq) return null;

    const now = Date.now();
    const start = new Date(rfq.bidStartTime).getTime();
    const close = new Date(rfq.currentBidCloseTime).getTime();

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

  if (error) {
    return (
      <div className="container">
        <div className="error-box">{error}</div>
      </div>
    );
  }

  if (!rfq || !details) {
    return <div className="container">Loading...</div>;
  }

  const auctionState = getAuctionState();

  return (
    <div className="auction-page">

      {/* Header */}
      <div className="auction-header">
        <div>
          <div className="auction-title-row">
            <h1>{rfq.name}</h1>

            <span
              className={`auction-status ${auctionState.className}`}
            >
              {auctionState.label}
            </span>
            <a href="#bid-form" className="place-bid-top-button">
              Place a Bid ↓
            </a>
          </div>

          <p className="reference">
            Reference: {rfq.referenceId}
          </p>
        </div>
      </div>

      {/* Auction Overview */}
      <div className="auction-overview">

        <div className="lowest-bid-box">
          <span className="overview-label">
            Current Lowest Bid
          </span>

          <span className="lowest-bid">
            {rfq.currentLowestBidAmount != null
              ? `₹${rfq.currentLowestBidAmount}`
              : "No bids yet"}
          </span>
        </div>

        <div className="timer-box">
          <span className="overview-label">
            Time Remaining
          </span>

          <span className="auction-timer">
            {formatTimeLeft(timeLeft)}
          </span>
        </div>

      </div>

      {/* Auction Information */}
      <div className="auction-info card">

        <div>
          <span className="info-label">
            Pickup Date
          </span>

          <strong>
            {new Date(rfq.pickupDate).toLocaleDateString()}
          </strong>
        </div>

        <div>
          <span className="info-label">
            Current Close
          </span>

          <strong>
            {new Date(
              rfq.currentBidCloseTime
            ).toLocaleString()}
          </strong>
        </div>

        <div>
          <span className="info-label">
            Forced Close
          </span>

          <strong>
            {new Date(
              rfq.forcedBidCloseTime
            ).toLocaleString()}
          </strong>
        </div>

      </div>

      {/* Auction Configuration */}
      <div className="card">
        <div className="section-header">
          <h2>Auction Configuration</h2>
        </div>

        <AuctionConfigForm
          rfqId={id}
          existingConfig={details.config}
        />
      </div>

      {/* Bids */}
      <div className="card">
        <div className="section-header">
          <h2>Bid History</h2>

          <span className="bid-count">
            {details.bids.length} bids
          </span>
        </div>

        {details.bids.length === 0 ? (
          <div className="empty-state">
            No bids have been submitted yet.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="auction-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Carrier</th>
                  <th>Total Amount</th>
                  <th>Submitted</th>
                </tr>
              </thead>

              <tbody>
                {details.bids.map((bid) => (
                  <tr key={bid._id}>
                    <td>
                      {bid.supplierId?.name || "Unknown"}
                    </td>

                    <td>
                      {bid.carrierName}
                    </td>

                    <td className="bid-amount">
                      ₹{bid.totalBidAmount}
                    </td>

                    <td>
                      {new Date(
                        bid.createdAt
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Activity */}
      <div className="card">
        <div className="section-header">
          <h2>Live Activity</h2>

          <span className="live-indicator">
            ● LIVE
          </span>
        </div>

        {activity.length === 0 ? (
          <div className="empty-state">
            No activity yet.
          </div>
        ) : (
          <div className="activity-list">
            {activity.map((log) => (
              <div
                className="activity-item"
                key={log._id || `${log.eventType}-${log.createdAt}`}
              >
                <div className="activity-dot" />

                <div>
                  <strong>
                    {log.eventType}
                  </strong>

                  <p>
                    {log.message}
                  </p>

                  {log.reason && (
                    <span className="activity-reason">
                      {log.reason}
                    </span>
                  )}
                </div>

                {log.createdAt && (
                  <span className="activity-time">
                    {new Date(
                      log.createdAt
                    ).toLocaleTimeString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bid Form */}
      <div id="bid-form" className="card bid-form-card">
        <div className="section-header">
          <div>
            <h2>Place a Bid</h2>
            <p>
              Submit a quotation lower than the current
              lowest bid.
            </p>
          </div>
        </div>

        {user?.role === "supplier" ? (
          <BidForm rfqId={id} />
        ) : (
          <div className="supplier-message">
            Login as a supplier to place a bid.
          </div>
        )}
      </div>

    </div>
  );
}