import { useState } from "react";
import { API_BASE } from "../utils/api";
import { getToken } from "../utils/auth";

export default function BidForm({ rfqId, refresh }) {
    const [form, setForm] = useState({
        freight: "",
        origin: "",
        destination: ""
    });

    const submitBid = async () => {
        const token = localStorage.getItem("token");

        if (form.freight < 0) {
            alert("Freight cannot be negative");
            return;
        }
        if (form.origin < 0) {
            alert("Origin cannot be negative");
            return;
        }
        if (form.destination < 0) {
            alert("Destination cannot be negative");
            return;
        }

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

        if(!res.ok) {
            const data = await res.json();
            alert(data.message || "Failed to submit bid");
            return;
        }

        if (res.ok) {
            refresh();
        }
    };

    return (
        <div>
            <div className="title">Place Bid</div>

            <label>Freight Charges</label>
            <input onChange={e => setForm({ ...form, freight: e.target.value })} />

            <label>Origin Charges</label>
            <input onChange={e => setForm({ ...form, origin: e.target.value })} />

            <label>Destination Charges</label>
            <input onChange={e => setForm({ ...form, destination: e.target.value })} />

            <button onClick={submitBid}>Submit Bid</button>
        </div>
    );
}