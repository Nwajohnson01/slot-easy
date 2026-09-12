"use client";

import { useEffect, useState } from "react";

const SERVICE_NAMES = {
  1: "Initial Consultation",
  2: "Working Session",
  3: "Follow-up Check-in",
};

export default function AdminPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/bookings");
    const data = await res.json();
    setBookings(data.bookings || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id, status) {
    await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  return (
    <div className="page">
      <div className="book" style={{ maxWidth: 780 }}>
        <div className="book-header">
          <div className="eyebrow">SlotEasy</div>
          <h1>The day book.</h1>
        </div>

        <div className="leaf">
          <div className="section-title">All appointments</div>
          {loading && <div className="empty-note">Reading the book…</div>}
          {!loading && bookings.length === 0 && <div className="empty-note">No appointments yet.</div>}
          {!loading && bookings.length > 0 && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Service</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.booking_date instanceof Date ? b.booking_date.toISOString().slice(0, 10) : String(b.booking_date).slice(0, 10)}</td>
                    <td>{b.booking_time}</td>
                    <td>{SERVICE_NAMES[b.service_id] || b.service_id}</td>
                    <td>
                      {b.customer_name}
                      <div style={{ color: "var(--ink-soft)", fontSize: "0.8rem" }}>{b.customer_email}</div>
                    </td>
                    <td>
                      <span className={`pill ${b.status}`}>{b.status.replace("_", " ")}</span>
                    </td>
                    <td>
                      {b.status === "confirmed" && (
                        <>
                          <button className="admin-action" onClick={() => setStatus(b.id, "completed")}>
                            Mark done
                          </button>
                          <button className="admin-action" onClick={() => setStatus(b.id, "no_show")}>
                            No-show
                          </button>
                          <button className="admin-action" onClick={() => setStatus(b.id, "cancelled")}>
                            Cancel
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop: 28, textAlign: "center" }}>
          <a className="top-link" href="/">
            Back to booking page
          </a>
        </div>
      </div>
    </div>
  );
}
