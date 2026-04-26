import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/api";
import { authHeaders, getUser } from "../utils/auth";

export default function CreateRFQ() {
  const user = getUser();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [bidStartTime, setBidStartTime] = useState("");
  const [bidCloseTime, setBidCloseTime] = useState("");
  const [forcedBidCloseTime, setForcedBidCloseTime] = useState("");
  const [error, setError] = useState("");

  const createRFQ = async () => {
    setError("");

    if (!user || user.role !== "buyer") {
      setError("Only buyers can create RFQs.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/rfqs`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name,
          referenceId,
          pickupDate,
          bidStartTime,
          bidCloseTime,
          forcedBidCloseTime,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Unable to create RFQ");
      }

      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user) {
    return (
      <div className="container">
        <div className="card">
          <p>Please login as a buyer to create an RFQ.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h2>Create RFQ</h2>

        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />

        <label>Reference ID</label>
        <input value={referenceId} onChange={(e) => setReferenceId(e.target.value)} />

        <label>Pickup Date</label>
        <input
          type="date"
          value={pickupDate}
          onChange={(e) => setPickupDate(e.target.value)}
        />

        <label>Bid Start Time</label>
        <input
          type="datetime-local"
          value={bidStartTime}
          onChange={(e) => setBidStartTime(e.target.value)}
        />

        <label>Bid Close Time</label>
        <input
          type="datetime-local"
          value={bidCloseTime}
          onChange={(e) => setBidCloseTime(e.target.value)}
        />

        <label>Forced Bid Close Time</label>
        <input
          type="datetime-local"
          value={forcedBidCloseTime}
          onChange={(e) => setForcedBidCloseTime(e.target.value)}
        />

        {error ? <div style={{ color: "red" }}>{error}</div> : null}

        <button onClick={createRFQ}>Create RFQ</button>
      </div>
    </div>
  );
}
