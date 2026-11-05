"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { waLink } from "../lib/content.js";

const NEXT = [
  { n: "1", t: "We read what you shared", d: "Your Learning Specialist looks at your answers before the call, so the time is spent on your child." },
  { n: "2", t: "We confirm on WhatsApp", d: "You’ll get a message on the number you gave us, with the time and how to join." },
  { n: "3", t: "You join online", d: "A quiet spot, and a phone, tablet, or laptop, is all you need. The session is 45 minutes." },
];

export function ThankYou() {
  const params = useParams();
  const id = params.id;
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const previous = document.title;
    document.title = "Thank you | Senyara Learning";
    return () => {
      document.title = previous;
    };
  }, []);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setError("");
    fetch(`/api/bookings/${encodeURIComponent(id || "")}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "We couldn’t find that booking.");
        if (!cancel) setBooking(data.booking);
      })
      .catch((err) => {
        if (!cancel) setError(err.message);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [id]);

  const priority = booking?.start === "As soon as possible" || booking?.start === "Within the next month";
  const confirmHref = booking
    ? waLink(
        `Hi Senyara, I am ${booking.name} from ${booking.area}. My child is ${booking.age}. I booked a Free Online Clarity Session for ${booking.slotLabel}. Reference ${booking.id}.`
      )
    : "";

  return (
    <div className="page">
      <div className="topbar">
        <strong>Free Online Clarity Session</strong> · Your time is saved
      </div>
      <header className="site-header">
        <div className="wrap header-row">
          <Link href="/" className="logo-link">
            <img src="/logo.png" alt="Senyara Learning, where every child is seen" />
          </Link>
          <Link className="btn btn-gold" href="/">
            Back to Senyara
          </Link>
        </div>
      </header>
      <main className="band band-mint">
        <div className="thanks">
          {loading && <p className="quiet">Loading your booking…</p>}
          {error && (
            <div className="stack">
              <p className="eyebrow">Thank you</p>
              <h1>We couldn’t open that booking.</h1>
              <p className="form-error" role="alert">
                {error}
              </p>
              <Link className="btn btn-green btn-cta" href="/#book">
                Book a session
              </Link>
            </div>
          )}
          {booking && (
            <div className="stack">
              <p className="eyebrow">You’re booked</p>
              <h1>
                Thank you, {booking.name}.
                <span>Your session is held.</span>
              </h1>
              <p className="hero-copy">
                A Senyara Learning Specialist will meet you online. Everything from the session is free, and yours to keep.
              </p>
              <div className="summary-dark thanks-slot">
                {booking.slotLabel}
                <span>
                  Reference {booking.id} · {booking.durationMinutes || 45} minutes · online
                </span>
              </div>
              {priority && (
                <div className="priority">
                  <strong>Priority family:</strong> you’d like to start soon, so we’ll keep an eye on your booking and reach out today.
                </div>
              )}
              <p className="quiet">
                We’ll reach you on WhatsApp at {booking.phone}
                {priority ? " today." : "."} Bring a quiet spot and a phone, tablet, or laptop.
              </p>
              <div className="cards three thanks-steps">
                {NEXT.map((item) => (
                  <article key={item.n} className="card offer">
                    <span className="num">{item.n}</span>
                    <h2>{item.t}</h2>
                    <p>{item.d}</p>
                  </article>
                ))}
              </div>
              <div className="cta-block">
                <a className="btn btn-green btn-cta" href={confirmHref} target="_blank" rel="noreferrer">
                  Send a WhatsApp confirmation
                </a>
                <Link className="text-btn" href="/#book">
                  Book for another child
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <footer className="site-footer">
        <div className="wrap thanks-foot">
          <p className="brand">Senyara Learning</p>
          <p className="tag">Where every child is seen.</p>
          <p>
            <a href="tel:+97143764924">+971 4 376 4924</a>
            <a href="https://wa.me/971565480898" target="_blank" rel="noreferrer">WhatsApp +971 56 548 0898</a>
            <a href="mailto:learn@senyaralearning.com">learn@senyaralearning.com</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
