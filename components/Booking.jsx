"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AGES, AREAS, PATHS, QUESTIONS, STARTS, buildInsight } from "../lib/content.js";

const CALENDLY_URL = "https://calendly.com/learn-senyaralearning/30min";

const emptyForm = {
  name: "",
  phone: "",
  age: AGES[0],
  area: AREAS[0],
  start: STARTS[0],
  consent: false,
};

export function Booking() {
  const [stage, setStage] = useState("quiz");
  const [path, setPath] = useState(null);
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState([]);
  const [skipped, setSkipped] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const detailsRef = useRef(form);
  const savingRef = useRef(false);
  const router = useRouter();
  detailsRef.current = { form, path, skipped, picks };

  const insight = buildInsight(picks);
  const question = QUESTIONS[step];
  const priority = form.start === "As soon as possible" || form.start === "Within the next month";
  const progress = Math.round((step / QUESTIONS.length) * 100);

  const live =
    stage === "time"
      ? "Pick a time for your session."
      : stage === "details"
        ? "Add your details so your specialist can prepare."
        : path
          ? `Question ${step + 1} of ${QUESTIONS.length}. ${question?.text || ""}`
          : "Choose which sounds more like your child.";

  useEffect(() => {
    if (stage !== "time") return undefined;
    const parent = document.getElementById("calendly-embed");
    if (!parent) return undefined;

    function mount() {
      if (!window.Calendly || !parent.isConnected) return;
      parent.innerHTML = "";
      const current = detailsRef.current.form;
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
      savingRef.current = true;
      setSubmitting(true);
      setFormError("");
      const current = detailsRef.current;
      const answers = buildInsight(current.picks);
      const payload = event.data?.payload || {};
      const scheduled = payload.event;
      const calendlyEvent = typeof scheduled === "string" ? scheduled : scheduled?.uri || "";
      const calendlyStart =
        (scheduled && typeof scheduled === "object" && (scheduled.start_time || scheduled.startTime)) ||
        payload.start_time ||
        "";
      try {
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: current.form.name,
            phone: current.form.phone,
            age: current.form.age,
            area: current.form.area,
            start: current.form.start,
            consent: current.form.consent,
            path: current.path,
            skipped: current.skipped,
            picks: current.picks.map((pick) => ({ question: pick.question, answer: pick.label })),
            summary: answers.summaryLine,
            mirror: answers.mirror,
            resultKey: answers.result.key,
            slotId: "calendly",
            calendlyEvent,
            calendlyStart,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "We couldn’t save that booking.");
        router.push(`/thank-you/${data.booking.id}`);
      } catch (error) {
        savingRef.current = false;
        setSubmitting(false);
        setFormError(error.message);
      }
    }

    window.addEventListener("message", onScheduled);
    return () => {
      window.removeEventListener("message", onScheduled);
      if (existing) existing.removeEventListener("load", mount);
    };
  }, [stage, router]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function choosePath(id) {
    setPath(id);
    setStep(0);
    setPicks([]);
    setSkipped(false);
    setFormError("");
  }

  function chooseOption(option) {
    const nextPicks = picks.slice(0, step).concat({
      ...option,
      question: question.text,
    });
    const nextStep = step + 1;
    setPicks(nextPicks);
    setFormError("");
    if (nextStep >= QUESTIONS.length) {
      setStage("details");
      return;
    }
    setStep(nextStep);
  }

  function backQuestion() {
    if (step === 0) {
      setPath(null);
      setPicks([]);
      return;
    }
    setStep(step - 1);
    setPicks(picks.slice(0, -1));
  }

  function skip() {
    setSkipped(true);
    setFormError("");
    setStage("details");
  }

  function changeAnswers() {
    setSkipped(false);
    setFormError("");
    if (picks.length === 0) {
      setPath(null);
      setStep(0);
      setStage("quiz");
      return;
    }
    setPicks(picks.slice(0, -1));
    setStep(Math.max(0, picks.length - 1));
    setStage("quiz");
  }

  function onDetails(event) {
    event.preventDefault();
    const digits = form.phone.replace(/\D/g, "");
    if (form.name.trim().length < 2 || digits.length < 7) {
      setFormError("Please add your name and a valid WhatsApp number.");
      return;
    }
    if (!form.consent) {
      setFormError("Please agree to be contacted about your free session.");
      return;
    }
    setFormError("");
    setStage("time");
  }

  return (
    <section id="book" className="band band-mint">
      <div className="wrap book">
        <div className="center stack-tight">
          <p className="eyebrow">Book your free online clarity session</p>
          <h2 className="display">
            Take the first step towards <em>understanding your child’s learning</em>
          </h2>
          <p className="lede-sm">
            Answer 5 short questions about your child, so your Learning Specialist can prepare. Then pick a time that suits you.
          </p>
        </div>

        <div className="stepper" aria-label="Booking steps">
          {[
            ["1", "About your child", stage === "quiz"],
            ["2", "Your details", stage === "details"],
            ["3", "Pick a time", stage === "time"],
          ].map(([n, label, on]) => (
            <span key={n} className={on ? "stepper-item is-on" : "stepper-item"}>
              {n} · {label}
            </span>
          ))}
        </div>

        <div className="book-card">
          <p className="sr-only" aria-live="polite">
            {live}
          </p>

          {stage === "quiz" && !path && (
            <div className="stack">
              <h3>First, which sounds more like your child?</h3>
              <div className="choice-grid one">
                {PATHS.map((item) => (
                  <button key={item.id} type="button" className="choice" onClick={() => choosePath(item.id)}>
                    <strong>{item.title}</strong>
                    <span>{item.sub}</span>
                  </button>
                ))}
              </div>
              <button type="button" className="text-btn" onClick={skip}>
                Prefer to skip the questions? Pick a time now
              </button>
            </div>
          )}

          {stage === "quiz" && path && question && (
            <div className="stack">
              <div className="quiz-meta">
                <span>About your child</span>
                <span>
                  Question {step + 1} of {QUESTIONS.length}
                </span>
              </div>
              <div
                className="bar"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-label="Quiz progress"
              >
                <div className="bar-fill" style={{ width: `${progress}%` }} />
              </div>
              <h3>{question.text}</h3>
              <div className="choice-grid">
                {question.options.map((option) => (
                  <button key={option.label} type="button" className="choice flat" onClick={() => chooseOption(option)}>
                    {option.label}
                  </button>
                ))}
              </div>
              <button type="button" className="text-btn back" onClick={backQuestion}>
                ← Back
              </button>
              <button type="button" className="text-btn" onClick={skip}>
                Prefer to skip the questions? Pick a time now
              </button>
            </div>
          )}

          {stage === "details" && (
            <form className="stack" onSubmit={onDetails} noValidate>
              <h3 className="serif">Thank you. Here’s what you shared:</h3>
              {!skipped && picks.length > 0 && (
                <>
                  <div className="summary-dark">
                    <strong>A starting picture, not a label.</strong> {insight.result.name}. {insight.summaryLine}
                  </div>
                  <div className="mirror">
                    {insight.mirror.map((line) => (
                      <span key={line}>• {line}</span>
                    ))}
                  </div>
                  <p className="quiet">{insight.result.text}</p>
                </>
              )}
              {(skipped || picks.length === 0) && (
                <div className="summary-dark">You can share more about your child during the session.</div>
              )}
              <p className="quiet">Your Learning Specialist will read this before your session, so the time is spent on your child.</p>

              <label className="field" htmlFor="g-name">
                Your name
                <input
                  id="g-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                />
              </label>
              <label className="field" htmlFor="g-wa">
                WhatsApp number
                <input
                  id="g-wa"
                  name="tel"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+971"
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                />
              </label>
              <div className="split">
                <label className="field" htmlFor="g-age">
                  Child’s age
                  <select id="g-age" value={form.age} onChange={(event) => update("age", event.target.value)}>
                    {AGES.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="field" htmlFor="g-area">
                  Where do you live?
                  <select id="g-area" value={form.area} onChange={(event) => update("area", event.target.value)}>
                    {AREAS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="field" htmlFor="g-start">
                When would you like support to start?
                <select id="g-start" value={form.start} onChange={(event) => update("start", event.target.value)}>
                  {STARTS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="check-row" htmlFor="g-consent">
                <input
                  id="g-consent"
                  type="checkbox"
                  checked={form.consent}
                  onChange={(event) => update("consent", event.target.checked)}
                />
                <span>I agree to be contacted about my free session. My answers are only used to prepare it.</span>
              </label>
              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}
              <button type="submit" className="btn btn-green btn-cta">
                Continue to pick a time →
              </button>
              <button type="button" className="text-btn back" onClick={changeAnswers}>
                ← Change my answers
              </button>
            </form>
          )}

          {stage === "time" && (
            <div className="stack">
              {priority && (
                <div className="priority">
                  <strong>Priority family:</strong> you’d like to start soon, so we’ll keep an eye on your booking and reach out today.
                </div>
              )}
              <h3 className="serif">Pick a time for your Free Online Clarity Session</h3>
              <p className="quiet">
                {skipped
                  ? "You can share more about your child during the session."
                  : "Your answers are attached, so your specialist will be ready."}{" "}
                Choose a 30-minute time below.
              </p>
              <div id="calendly-embed" className="calendly-embed" />
              {submitting && <p className="quiet">Saving your booking…</p>}
              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}
              <button type="button" className="text-btn back" onClick={() => setStage("details")}>
                ← Edit my details
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
