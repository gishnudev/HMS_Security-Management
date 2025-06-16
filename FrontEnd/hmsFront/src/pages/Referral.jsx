// src/pages/Referral.jsx

import { useEffect, useState } from "react";
import { Card, CardContent } from "../components/card";
import { Button } from "../components/button";

export default function Referral() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with smart contract call to fetch referrals assigned to the doctor/nurse
    async function fetchReferrals() {
      setLoading(true);

      // Mock data for demo:
      const mockReferrals = [
        {
          id: 101,
          patientName: "Alice Johnson",
          fromDoctor: "0xDocA",
          reason: "Specialist consultation required",
          status: "Pending",
        },
        {
          id: 102,
          patientName: "Bob Smith",
          fromDoctor: "0xDocB",
          reason: "Further diagnostics needed",
          status: "Pending",
        },
      ];

      setReferrals(mockReferrals);
      setLoading(false);
    }

    fetchReferrals();
  }, []);

  const handleAccept = (id) => {
    // TODO: Call smart contract to accept referral
    alert(`Referral ${id} accepted`);
    setReferrals((prev) =>
      prev.map((ref) =>
        ref.id === id ? { ...ref, status: "Accepted" } : ref
      )
    );
  };

  const handleReject = (id) => {
    // TODO: Call smart contract to reject referral
    alert(`Referral ${id} rejected`);
    setReferrals((prev) =>
      prev.map((ref) =>
        ref.id === id ? { ...ref, status: "Rejected" } : ref
      )
    );
  };

  if (loading) return <p className="p-6">Loading referrals...</p>;

  if (referrals.length === 0)
    return <p className="p-6">No referrals pending at the moment.</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Referral Management</h1>
      <div className="space-y-4">
        {referrals.map((referral) => (
          <Card key={referral.id} className="shadow-md">
            <CardContent className="p-4">
              <p><strong>Referral ID:</strong> {referral.id}</p>
              <p><strong>Patient Name:</strong> {referral.patientName}</p>
              <p><strong>From Doctor:</strong> {referral.fromDoctor}</p>
              <p><strong>Reason:</strong> {referral.reason}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={
                    referral.status === "Pending"
                      ? "text-yellow-600"
                      : referral.status === "Accepted"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {referral.status}
                </span>
              </p>
              {referral.status === "Pending" && (
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => handleAccept(referral.id)}>
                    Accept
                  </Button>
                  <Button variant="outline" onClick={() => handleReject(referral.id)}>
                    Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
