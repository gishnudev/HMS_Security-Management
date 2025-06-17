// src/pages/VerifyReferral.jsx

import { useEffect, useState } from "react";
import { Card, CardContent } from "../components/card";
import { Button } from "../components/Button";

export default function VerifyReferral() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch referrals assigned to the patient from smart contract
    async function fetchReferrals() {
      setLoading(true);

      // MOCK data example (replace with blockchain fetch)
      const mockReferrals = [
        {
          id: 201,
          referredBy: "0xDoctor123",
          reason: "Needs specialist consultation",
          status: "Pending",
        },
        {
          id: 202,
          referredBy: "0xDoctor456",
          reason: "Further testing required",
          status: "Pending",
        },
      ];

      setReferrals(mockReferrals);
      setLoading(false);
    }

    fetchReferrals();
  }, []);

  const handleAccept = (id) => {
    // TODO: Smart contract call to accept referral
    alert(`Referral ${id} accepted by patient`);
    setReferrals((prev) =>
      prev.map((ref) =>
        ref.id === id ? { ...ref, status: "Accepted" } : ref
      )
    );
  };

  const handleReject = (id) => {
    // TODO: Smart contract call to reject referral
    alert(`Referral ${id} rejected by patient`);
    setReferrals((prev) =>
      prev.map((ref) =>
        ref.id === id ? { ...ref, status: "Rejected" } : ref
      )
    );
  };

  if (loading) return <p className="p-6">Loading your referrals...</p>;

  if (referrals.length === 0)
    return <p className="p-6">No referrals to verify.</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Verify Your Referrals</h1>
      <div className="space-y-4">
        {referrals.map((ref) => (
          <Card key={ref.id} className="shadow-md">
            <CardContent className="p-4">
              <p><strong>Referral ID:</strong> {ref.id}</p>
              <p><strong>Referred By:</strong> {ref.referredBy}</p>
              <p><strong>Reason:</strong> {ref.reason}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={
                    ref.status === "Pending"
                      ? "text-yellow-600"
                      : ref.status === "Accepted"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {ref.status}
                </span>
              </p>

              {ref.status === "Pending" && (
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => handleAccept(ref.id)}>Accept</Button>
                  <Button variant="outline" onClick={() => handleReject(ref.id)}>Reject</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
