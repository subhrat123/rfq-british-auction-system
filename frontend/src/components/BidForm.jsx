import { useState } from "react";
import { API_BASE } from "../utils/api";

export default function BidForm({ rfqId }) {
  const [form, setForm] = useState({
    freight: "",
    origin: "",
    destination: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const total =
    Number(form.freight || 0) +
    Number(form.origin || 0) +
    Number(form.destination || 0);

  const submitBid = async () => {
    if (
      form.freight === "" ||
      form.origin === "" ||
      form.destination === ""
    ) {
      alert("Please enter all charges");
      return;
    }

    if (
      Number(form.freight) < 0 ||
      Number(form.origin) < 0 ||
      Number(form.destination) < 0
    ) {
      alert("Charges cannot be negative");
      return;
    }

    try {
      setSubmitting(true);

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/bids`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rfqId,
          carrierName: "Carrier",
          freightCharges: Number(form.freight),
          originCharges: Number(form.origin),
          destinationCharges: Number(form.destination),
          transitTime: 2,
          validityOfQuote: new Date(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to submit bid");
        return;
      }

      // Clear form after successful submission
      setForm({
        freight: "",
        origin: "",
        destination: "",
      });

      alert("Bid submitted successfully");
    } catch (error) {
      alert("Unable to submit bid");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bid-form">

      <div className="bid-form-header">
        <div>
          <h3>Submit Your Quotation</h3>
          <p>
            Enter your charges to submit a competitive bid.
          </p>
        </div>
      </div>

      <div className="charge-grid">

        <div className="charge-field">
          <label>Freight Charges</label>

          <div className="input-wrapper">
            <span>₹</span>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={form.freight}
              onChange={(e) =>
                updateField("freight", e.target.value)
              }
            />
          </div>
        </div>

        <div className="charge-field">
          <label>Origin Charges</label>

          <div className="input-wrapper">
            <span>₹</span>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={form.origin}
              onChange={(e) =>
                updateField("origin", e.target.value)
              }
            />
          </div>
        </div>

        <div className="charge-field">
          <label>Destination Charges</label>

          <div className="input-wrapper">
            <span>₹</span>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={form.destination}
              onChange={(e) =>
                updateField("destination", e.target.value)
              }
            />
          </div>
        </div>

      </div>

      <div className="bid-total">
        <div>
          <span>Total Bid Amount</span>
          <small>
            Freight + Origin + Destination
          </small>
        </div>

        <strong>₹{total}</strong>
      </div>

      <button
        className="submit-bid-button"
        onClick={submitBid}
        disabled={submitting}
      >
        {submitting ? "Submitting..." : "Submit Bid"}
      </button>

    </div>
  );
}