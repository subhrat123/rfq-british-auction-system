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

  return (
    <div className="container">
      <h2>RFQs</h2>
      {error ? <div style={{ color: "red" }}>{error}</div> : null}
      {user?.role === "buyer" ? (
        <div style={{ marginBottom: "16px" }}>
          <Link to="/create-rfq">
            <button>Create new RFQ</button>
          </Link>
        </div>
      ) : null}

      {rfqs.length === 0 ? (
        <div>No RFQs available yet.</div>
      ) : (
        rfqs.map((r) => (
          <div className="card" key={r._id}>
            <div className="title">{r.name}</div>
            <div>Reference: {r.referenceId}</div>
            <div className="row">
              <span>Status: {r.status}</span>
              <span>Lowest: ₹{r.currentLowestBid || "N/A"}</span>
            </div>
            <div className="row" style={{ marginTop: "8px" }}>
              <span>Pickup: {new Date(r.pickupDate).toLocaleDateString()}</span>
              <span>Close: {new Date(r.bidCloseTime).toLocaleString()}</span>
            </div>
            <br />
            <Link to={`/rfq/${r._id}`}>
              <button>View Details</button>
            </Link>
          </div>
        ))
      )}
    </div>
  );
}