import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE } from "../utils/api";
import BidForm from "../components/BidForm";
import AuctionConfigForm from "../components/AuctionConfigForm";
import { getUser } from "../utils/auth";

export default function RFQDetails() {
  const { id } = useParams();
  const [rfq, setRfq] = useState(null);
  const [details, setDetails] = useState(null);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
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
      <div className="card">
        <div className="title">{rfq.name}</div>
        <div>Reference: {rfq.referenceId}</div>
        <div>Status: {rfq.status}</div>
        <div>Pickup Date: {new Date(rfq.pickupDate).toLocaleDateString()}</div>
        <div>Bid Close: {new Date(rfq.bidCloseTime).toLocaleString()}</div>
        <div>Forced Close: {new Date(rfq.forcedBidCloseTime).toLocaleString()}</div>
      </div>

      <div className="card">
        <div className="title">Auction Config</div>
        <AuctionConfigForm
          rfqId={id}
          existingConfig={details.config}
          onConfigSaved={() => setRefreshToken((prev) => prev + 1)}
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
              details.bids.map((b) => (
                <tr key={b._id}>
                  <td>{b.rank}</td>
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
          <BidForm rfqId={id} refresh={() => setRefreshToken((prev) => prev + 1)} />
        ) : (
          <div>Login as a supplier to place bids.</div>
        )}
      </div>
    </div>
  );
}