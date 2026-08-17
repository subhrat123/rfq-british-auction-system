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
  const [refreshToken, setRefreshToken] = useState(0);
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

  useEffect(() => {
    fetchRfq();
    fetchDetails();
    fetchActivity();
  }, [id, refreshToken]);

  useEffect(() => {
    socket.emit("join_auction", id);

    return () => {
      socket.emit("leave_auction", id);
    };
  }, [id]);

  useEffect(() => {
    const handleBidAccepted = (data) => {
      console.log("BID_ACCEPTED:", data);

      setRfq((prev) => ({
        ...prev,
        currentLowestBidAmount: data.auctionState.currentLowestBidAmount,
        currentLowestBidId: data.auctionState.currentLowestBidId,
        currentLowestBidSupplierId: data.bid.supplierId._id,
        currentBidCloseTime: data.auctionState.currentBidCloseTime,
      }));

      setDetails((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          rfq: {
            ...prev.rfq,
            currentLowestBidAmount: data.auctionState.currentLowestBidAmount,
            currentLowestBidId: data.auctionState.currentLowestBidId,
            currentLowestBidSupplierId: data.bid.supplierId._id,
            currentBidCloseTime: data.auctionState.currentBidCloseTime,
          },
          bids: [data.bid, ...prev.bids],
        };
      });

      setActivity((prev) => [
        ...data.activities,
        ...prev,
      ]);

      console.log("details after update:", details);
    };

    socket.on("BID_ACCEPTED", handleBidAccepted);

    return () => {
      socket.off("BID_ACCEPTED", handleBidAccepted);
    };
  }, []);

  useEffect(() => {
    if (!rfq?.currentBidCloseTime) return;

    const updateTimer = () => {
      const remaining =
        new Date(rfq.currentBidCloseTime).getTime() - Date.now();

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

  if (error) {
    return (
      <div className="container">
        <div className="card" style={{ color: "red" }}>{error}</div>
      </div>
    );
  }

  if (!rfq || !details) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <div  className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="title">{rfq.name}</div>
          <div>Reference: {rfq.referenceId}</div>
        </div>
        
        <div>
          <div>Pickup Date: {new Date(rfq.pickupDate).toLocaleDateString()}</div>
          <div>Bid Close: {new Date(rfq.currentBidCloseTime).toLocaleString()}</div>
          <div>Forced Close: {new Date(rfq.forcedBidCloseTime).toLocaleString()}</div>
        </div>
      </div>

      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="title">Auction Config</div>
        <div>
          Time Remaining:
          {" "}
          <strong>{formatTimeLeft(timeLeft)}</strong>
        </div>
        <AuctionConfigForm
          rfqId={id}
          existingConfig={details.config}
        />
      </div>

      <div className="card">
        <div className="title">Bids</div>

        <table width="100%">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Supplier</th>
              <th>Carrier</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            {details.bids.length === 0 ? (
              <tr>
                <td colSpan={4}>No bids yet.</td>
              </tr>
            ) : (
              details.bids.map((b, idx) => (
                <tr key={b._id}>
                  <td>{idx + 1}</td>
                  <td>{b.supplierId?.name}</td>
                  <td>{b.carrierName}</td>
                  <td>₹{b.totalBidAmount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="title">Activity Logs</div>
        {activity.length === 0 ? (
          <div>No activity logs yet.</div>
        ) : (
          activity.map((log) => (
            <div key={log._id}>
              <strong>{log.eventType}</strong> {log.reason ? `(${log.reason})` : ""} - {log.message}
            </div>
          ))
        )}
      </div>

      <div className="card">
        <div className="title">Place a bid</div>
        {user?.role === "supplier" ? (
          <BidForm rfqId={id} />
        ) : (
          <div>Login as a supplier to place bids.</div>
        )}
      </div>
    </div>
  );
}