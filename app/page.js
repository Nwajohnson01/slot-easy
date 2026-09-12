"use client";

import { useEffect, useMemo, useState } from "react";

function nextBusinessDaysClient(count) {
  const days = [];
  let d = new Date();
  while (days.length < count) {
    d = new Date(d.getTime() + 24 * 60 * 60 * 1000);
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      days.push(new Date(d));
    }
  }
  return days;
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function fmtDayLabel(d) {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function fmtTime(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export default function BookingPage() {
  const days = useMemo(() => nextBusinessDaysClient(6), []);
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { ok: bool, message }

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        setServices(data.services);
        setServiceId(data.services[0]?.id ?? null);
      });
  }, []);

  useEffect(() => {
    if (!serviceId) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    const date = fmtDate(days[dayIndex]);
    fetch(`/api/slots?date=${date}&service_id=${serviceId}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots || []))
      .finally(() => setLoadingSlots(false));
  }, [serviceId, dayIndex, days]);

  async function handleConfirm() {
    if (!selectedSlot || !name || !email) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: serviceId,
          customer_name: name,
          customer_email: email,
          booking_date: fmtDate(days[dayIndex]),
          booking_time: selectedSlot,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: data.error || "Something went wrong." });
      } else {
        setResult({ ok: true, message: "Booked." });
        setSlots((prev) => prev.filter((s) => s !== selectedSlot));
        setSelectedSlot(null);
        setName("");
        setEmail("");
      }
    } catch (e) {
      setResult({ ok: false, message: "Network error — please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const selectedService = services.find((s) => s.id === serviceId);

  return (
    <div className="page">
      <div className="book">
        <div className="book-header">
          <div className="eyebrow">SlotEasy</div>
          <h1>Reserve a time.</h1>
        </div>

        <div className="leaf">
          <div className="section-title">Choose what you need</div>
          {services.map((s) => (
            <div
              key={s.id}
              className={`service-row ${s.id === serviceId ? "selected" : ""}`}
              onClick={() => setServiceId(s.id)}
            >
              <div>
                <div className="name">{s.name}</div>
                <div className="meta">{s.description}</div>
              </div>
              <div className="meta">{s.duration_minutes} min</div>
            </div>
          ))}
        </div>

        <div className="leaf">
          <div className="section-title">Pick a day and time</div>
          <div className="day-tabs">
            {days.map((d, i) => (
              <button
                key={i}
                className={`day-tab ${i === dayIndex ? "active" : ""}`}
                onClick={() => setDayIndex(i)}
              >
                {fmtDayLabel(d)}
              </button>
            ))}
          </div>

          {loadingSlots && <div className="empty-note">Checking the book…</div>}

          {!loadingSlots && slots.length === 0 && (
            <div className="empty-note">Nothing open this day for {selectedService?.name?.toLowerCase()}. Try another day.</div>
          )}

          {!loadingSlots &&
            slots.map((s) => (
              <div className="slot-row" key={s}>
                <div className="slot-time">{fmtTime(s)}</div>
                <button
                  className={`reserve-btn ${selectedSlot === s ? "active" : ""}`}
                  onClick={() => setSelectedSlot(s)}
                >
                  {selectedSlot === s ? "Selected" : "Select"}
                </button>
              </div>
            ))}
        </div>

        {selectedSlot && (
          <div className="leaf">
            <div className="section-title">Your details</div>
            <div className="field">
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <button
              className="confirm-btn"
              disabled={!name || !email || submitting}
              onClick={handleConfirm}
            >
              {submitting ? "Booking…" : `Confirm ${fmtTime(selectedSlot)} on ${fmtDayLabel(days[dayIndex])}`}
            </button>

            {result && (
              <div className={`status-line ${result.ok ? "ok" : "err"}`}>
                {result.ok ? (
                  <span className="stamp">Confirmed</span>
                ) : (
                  result.message
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 28, textAlign: "center" }}>
          <a className="top-link" href="/admin">
            Admin view
          </a>
        </div>
      </div>
    </div>
  );
}
