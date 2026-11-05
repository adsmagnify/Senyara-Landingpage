import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AGES, AREAS, PATHS, QUESTIONS, STARTS, buildInsight } from "./content.js";

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
  const [days, setDays] = useState([]);
  const [slotsError, setSlotsError] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [day, setDay] = useState("");
  const [slotId, setSlotId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [slotsNonce, setSlotsNonce] = useState(0);
  const navigate = useNavigate();

  const insight = buildInsight(picks);
  const question = QUESTIONS[step];
  const selectedDay = days.find((item) => item.date === day);
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
    let cancel = false;
    setSlotsLoading(true);
    setSlotsError("");
    fetch("/api/slots")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load times");
        return response.json();
      })
      .then((data) => {
        if (cancel) return;
        const nextDays = data.days || [];
        setDays(nextDays);
        setDay((current) => {
          if (current && nextDays.some((item) => item.date === current)) return current;
          const open = nextDays.find((item) => item.times.some((time) => time.available));
          return (open || nextDays[0])?.date || "";
        });
      })
      .catch(() => {
        if (!cancel) {
          setSlotsError("We couldn’t load times just now. Message us on WhatsApp and we’ll find a time with you.");
        }
      })
      .finally(() => {
        if (!cancel) setSlotsLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [stage, slotsNonce]);

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

  async function confirm(event) {
    event.preventDefault();
    if (!slotId) {
      setFormError("Please pick a time.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          age: form.age,
          area: form.area,
          start: form.start,
          consent: form.consent,
          path,
          skipped,
          picks: picks.map((pick) => ({ question: pick.question, answer: pick.label })),
          summary: insight.summaryLine,
          mirror: insight.mirror,
          resultKey: insight.result.key,
          slotId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          setSlotId("");
          setSlotsNonce((value) => value + 1);
        }
        throw new Error(data.error || "We couldn’t save that booking.");
      }
      navigate(`/thank-you/${data.booking.id}`, { state: { booking: data.booking } });
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
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
            <form className="stack" onSubmit={confirm}>
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
                Each session is 45 minutes, Gulf Standard Time.
              </p>

              {slotsLoading && <div className="slot-skeleton" aria-hidden="true" />}
              {slotsError && (
                <p className="form-error" role="alert">
                  {slotsError}
                </p>
              )}

              {days.length > 0 && (
                <>
                  <div className="days" role="listbox" aria-label="Days">
                    {days.map((item) => (
                      <button
                        key={item.date}
                        type="button"
                        className={item.date === day ? "day-chip is-on" : "day-chip"}
                        aria-pressed={item.date === day}
                        onClick={() => {
                          setDay(item.date);
                          setSlotId("");
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div className="times">
                    {(selectedDay?.times || []).map((time) => (
                      <button
                        key={time.id}
                        type="button"
                        className={slotId === time.id ? "time-btn is-on" : "time-btn"}
                        disabled={!time.available}
                        aria-pressed={slotId === time.id}
                        onClick={() => setSlotId(time.id)}
                      >
                        {time.label}
                        <span>{time.available ? "45 min" : "Taken"}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}
              <button type="submit" className="btn btn-green btn-cta" disabled={submitting || !slotId}>
                {submitting ? "Booking…" : "Confirm this time →"}
              </button>
              <button type="button" className="text-btn back" onClick={() => setStage("details")}>
                ← Edit my details
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
