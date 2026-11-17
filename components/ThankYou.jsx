"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { waLink } from "../lib/content.js";

const CALENDLY_URL = "https://calendly.com/learn-senyaralearning/30min";

const NEXT = [
  { n: "1", t: "We read what you shared", d: "Your Learning Specialist looks at your answers before the call, so the time is spent on your child." },
  { n: "2", t: "We confirm on WhatsApp", d: "You’ll get a message on the number you gave us, with the time and how to join." },
  { n: "3", t: "You join online", d: "A quiet spot, and a phone, tablet, or laptop, is all you need. The session is 30 minutes." },
];

function cachedLead(id) {
  if (!id) return null;
  try {
    const saved = JSON.parse(sessionStorage.getItem(`senyara-lead:${id}`) || "null");
    return saved?.id === id ? saved : null;
  } catch {
    return null;
  }
}

export function ThankYou() {
  const params = useParams();
  const id = params.id;
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [savingTime, setSavingTime] = useState(false);
  const [loading, setLoading] = useState(true);
  const savingRef = useRef(false);
  const bookingRef = useRef(null);
  bookingRef.current = booking;

  useEffect(() => {
    const previous = document.title;
    document.title = "Thank you | Senyara Learning";
    return () => {
      document.title = previous;
    };
  }, []);

  useEffect(() => {
    let cancel = false;
    const saved = cachedLead(id);
    if (saved) {
      setBooking(saved);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError("");
    fetch(`/api/bookings/${encodeURIComponent(id || "")}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "We couldn’t find that booking.");
        if (!cancel) {
          setBooking((current) => {
            if (current?.id === data.booking?.id && current.slotLabel === data.booking.slotLabel) return current;
            return data.booking;
          });
        }
      })
      .catch((err) => {
        if (!cancel && !saved) setError(err.message);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [id]);

  const scheduled = Boolean(booking?.slotLabel && booking.slotLabel !== "Not booked yet");

  useEffect(() => {
    if (!booking || scheduled) return undefined;
    const parent = document.getElementById("calendly-embed");
    if (!parent) return undefined;

    function mount() {
      if (!window.Calendly || !parent.isConnected) return;
      const current = bookingRef.current;
      if (!current) return;
      parent.innerHTML = "";
      window.Calendly.initInlineWidget({
        url: CALENDLY_URL,
        parentElement: parent,
        prefill: {
          name: current.name,
          customAnswers: {
            a1: current.phone,
            a2: `Child ${current.age}, ${current.area}. Start: ${current.start}`,
          },
        },
      });
    }

    const existing = document.querySelector("script[data-calendly]");
    if (window.Calendly) mount();
    else if (!existing) {
      const script = document.createElement("script");
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      script.dataset.calendly = "true";
      script.onload = mount;
      document.body.appendChild(script);
    } else {
      existing.addEventListener("load", mount);
    }

    async function onScheduled(event) {
      if (event.origin !== "https://calendly.com") return;
      if (event.data?.event !== "calendly.event_scheduled") return;
      if (savingRef.current) return;
      const current = bookingRef.current;
      if (!current) return;
      savingRef.current = true;
      setSavingTime(true);
      setScheduleError("");
      const payload = event.data?.payload || {};
      const scheduledEvent = payload.event;
      const calendlyEvent = typeof scheduledEvent === "string" ? scheduledEvent : scheduledEvent?.uri || "";
      const calendlyStart =
        (scheduledEvent && typeof scheduledEvent === "object" && (scheduledEvent.start_time || scheduledEvent.startTime)) ||
        payload.start_time ||
        "";
      try {
        const response = await fetch(`/api/bookings/${encodeURIComponent(current.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduleOnly: true,
            slotId: "calendly",
            calendlyEvent,
            calendlyStart,
            name: current.name,
            phone: current.phone,
            age: current.age,
            area: current.area,
            start: current.start,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "We couldn’t save that time.");
        setBooking(data.booking);
      } catch (err) {
        savingRef.current = false;
        setScheduleError(err.message);
      } finally {
        setSavingTime(false);
      }
    }

    window.addEventListener("message", onScheduled);
    return () => {
      window.removeEventListener("message", onScheduled);
      if (existing) existing.removeEventListener("load", mount);
    };
  }, [booking, scheduled]);

  const priority = booking?.start === "As soon as possible" || booking?.start === "Within the next month";
  const confirmHref = booking
    ? waLink(
        `Hi Senyara, I am ${booking.name} from ${booking.area}. My child is ${booking.age}. I booked a Free Online Clarity Session for ${booking.slotLabel}. Reference ${booking.id}.`
      )
    : "";

  return (
    <div className="page">
      <div className="topbar">
        <strong>Free Online Clarity Session</strong> · {scheduled ? "Your time is saved" : "Your details are saved"}
      </div>
      <header className="site-header">
        <div className="wrap header-row">
          <Link href="/" className="brand-lockup">
            <img src="/logo-stack.jpg" alt="" />
            <span>Senyara<br />Learning</span>
          </Link>
          <Link className="btn btn-green" href="/">
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
              <p className="eyebrow">Thank you</p>
              <h1>
                Thank you, {booking.name}.
                <span>{scheduled ? "Your call is on the calendar." : "Now is the time to schedule a call."}</span>
              </h1>
              <p className="hero-copy">
                {scheduled
                  ? "A Senyara Learning Specialist will meet you online. Everything from the session is free, and yours to keep."
                  : "Your details are saved. Choose a 30-minute time below, and your Learning Specialist will meet you online."}
              </p>
              {scheduled ? (
                <div className="summary-dark thanks-slot">
                  {booking.slotLabel}
                  <span>
                    Reference {booking.id} · {booking.durationMinutes || 30} minutes · online
                  </span>
                </div>
              ) : (
                <div className="calendly-embed" id="calendly-embed" />
              )}
              {savingTime && <p className="quiet">Saving your time…</p>}
              {scheduleError && (
                <p className="form-error" role="alert">
                  {scheduleError}
                </p>
              )}
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
                {scheduled && (
                  <a className="btn btn-green btn-cta" href={confirmHref} target="_blank" rel="noreferrer">
                    Send a WhatsApp confirmation
                  </a>
                )}
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
