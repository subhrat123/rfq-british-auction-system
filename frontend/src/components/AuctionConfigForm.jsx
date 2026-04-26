import { useState } from "react";
import { API_BASE } from "../utils/api";
import { authHeaders, getUser } from "../utils/auth";

export default function AuctionConfigForm({ rfqId, existingConfig, onConfigSaved }) {
  const user = getUser();
  const [triggerType, setTriggerType] = useState("bid_received");
  const [triggerWindowMinutes, setTriggerWindowMinutes] = useState(5);
  const [extensionDurationMinutes, setExtensionDurationMinutes] = useState(10);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const saveConfig = async () => {
    setError("");
    setSuccess("");

    if (!user || user.role !== "buyer") {
      setError("Only buyers can configure the auction.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auction-config`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          rfqId,
          triggerType,
          triggerWindowMinutes: Number(triggerWindowMinutes),
          extensionDurationMinutes: Number(extensionDurationMinutes),
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Unable to create auction config");
      }

      setSuccess("Auction config saved.");
      onConfigSaved?.();
    } catch (err) {
      setError(err.message);
    }
  };

  if (existingConfig) {
    return (
      <div>
        <div>Configured trigger: {existingConfig.triggerType}</div>
        <div>Trigger window: {existingConfig.triggerWindowMinutes} min</div>
        <div>Extension length: {existingConfig.extensionDurationMinutes} min</div>
      </div>
    );
  }

  return (
    <div>
      <h3>Auction Config</h3>
      <label>Trigger type</label>
      <select value={triggerType} onChange={(e) => setTriggerType(e.target.value)}>
        <option value="bid_received">Bid received</option>
        <option value="any_rank_change">Any rank change</option>
        <option value="l1_rank_change">L1 rank change</option>
      </select>

      <label>Trigger window (minutes)</label>
      <input
        type="number"
        value={triggerWindowMinutes}
        onChange={(e) => setTriggerWindowMinutes(e.target.value)}
      />

      <label>Extension duration (minutes)</label>
      <input
        type="number"
        value={extensionDurationMinutes}
        onChange={(e) => setExtensionDurationMinutes(e.target.value)}
      />

      {error ? <div style={{ color: "red" }}>{error}</div> : null}
      {success ? <div style={{ color: "green" }}>{success}</div> : null}

      <button onClick={saveConfig}>Save Auction Config</button>
    </div>
  );
}
