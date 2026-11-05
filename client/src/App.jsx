import { useState } from "react";
import { Booking } from "./Booking.jsx";
import {
  FAQS,
  GROWTH,
  PAINS,
  PROFILE,
  ROUTINE,
  STACK,
  STANDARDS,
  STEPS,
  STRATEGIES,
  WA_GENERAL,
} from "./content.js";

function Check() {
  return (
    <svg className="tick" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12.5 9.2 17 19 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5v14l11-7z" fill="#113B24" />
    </svg>
  );
}

function Header() {
  return (
    <>
      <div className="topbar">
        <strong>Free Online Clarity Session</strong> · Answer 5 quick questions, then pick a time that suits you
      </div>
      <header className="site-header">
        <div className="wrap header-row">
          <a href="#top" className="logo-link">
            <img src="/logo.png" alt="Senyara Learning, where every child is seen" />
          </a>
          <nav className="nav hide-sm" aria-label="Page">
            <a href="#offer">What you leave with</a>
            <a href="#how">How it works</a>
            <a href="#faq">Questions</a>
          </nav>
          <div className="header-actions">
            <a className="btn btn-line" href={WA_GENERAL} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
            <a className="btn btn-gold hide-sm" href="#book">
              Book free session
            </a>
          </div>
        </div>
      </header>
    </>
  );
}

function Hero() {
  const [open, setOpen] = useState(false);
  return (
    <section className="hero">
      <div className="hero-inner">
        <p className="pill">Free Online Clarity Session · For parents across the UAE</p>
        <h1>
          Your child is putting in the effort.
          <span>So what’s still getting in the way?</span>
        </h1>
        <p className="hero-copy">
          Homework battles, effort that isn’t showing, confidence slipping. Watch this 2-minute message, then book a free online session to find out what’s really going on.
        </p>
        <div className="video">
          <span className="badge gold">Watch first · 2 min</span>
          <span className="badge ghost">Captions on</span>
          {open ? (
            <div className="video-copy">
              <p className="video-kicker">The message</p>
              <p className="video-quote">“Sometimes your child doesn’t need you to do more. They need you to understand them better.”</p>
              <p>
                Tutoring looks at the next topic. A Senyara Learning Specialist looks at how your child approaches learning, holds on to it, and builds confidence.
              </p>
              <div className="video-actions">
                <a className="btn btn-gold" href="#book">
                  Book my free session
                </a>
                <button type="button" className="text-btn light" onClick={() => setOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              <button type="button" className="play" aria-label="Play the message" onClick={() => setOpen(true)}>
                <PlayIcon />
              </button>
              <p className="video-quote">“Sometimes your child doesn’t need you to do more. They need you to understand them better.”</p>
            </>
          )}
        </div>
        <div className="cta-block">
          <a className="btn btn-green btn-cta" href="#book">
            Book my Free Online Clarity Session →
          </a>
          <span>2 quick steps: 5 questions about your child, then pick a time</span>
        </div>
        <div className="chips">
          {STACK.map((item) => (
            <span key={item.t} className="chip">
              <Check /> {item.t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="band">
      <div className="wrap faq">
        <p className="eyebrow center">Quick answers</p>
        <h2 className="display center">Before you book</h2>
        <div className="faq-list">
          {FAQS.map(([question, answer], index) => {
            const isOpen = open === index;
            return (
              <div key={question} className="faq-item">
                <button
                  type="button"
                  className="faq-q"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : index)}
                >
                  <span>{question}</span>
                  <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && <p className="faq-a">{answer}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <div className="page" id="top">
      <a className="skip" href="#book">
        Skip to booking
      </a>
      <Header />
      <main>
        <Hero />

        <section className="trust" aria-label="Where Senyara works">
          <div className="wrap trust-row">
            <span><Check /> Senyara Learning Specialists</span>
            <span><Check /> Online, anywhere in the UAE</span>
            <span><Check /> Centre in Deira, Dubai</span>
          </div>
        </section>

        <section className="band band-plain">
          <div className="wrap section">
            <p className="eyebrow center">Does this sound familiar?</p>
            <h2 className="display center">
              You’ve tried everything you can. <em>The struggles continue.</em>
            </h2>
            <div className="cards four">
              {PAINS.map((item) => (
                <article key={item.t} className="card pain">
                  <h3>{item.t}</h3>
                  <p>{item.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="band band-plain tight">
          <div className="wrap">
            <div className="reframe">
              <p className="eyebrow gold">Why it keeps happening</p>
              <p className="reframe-title">
                Without understanding how your child learns, you may simply be <em>repeating the same approach and getting the same results.</em>
              </p>
              <p>At Senyara Learning, we believe every child deserves to be understood. That’s where real progress starts.</p>
              <a className="btn btn-gold" href="#book">
                Understand my child’s learning
              </a>
            </div>
          </div>
        </section>

        <section id="offer" className="band">
          <div className="wrap section">
            <p className="eyebrow center">Your free online clarity session</p>
            <h2 className="display center">
              What you’ll <em>leave with</em>
            </h2>
            <p className="lede-sm center">A clearer picture of your child’s learning, and practical next steps. Free, and yours to keep.</p>
            <div className="cards three">
              {STACK.map((item) => (
                <article key={item.n} className="card offer">
                  <span className="num">{item.n}</span>
                  <h3>{item.t}</h3>
                  <p>{item.d}</p>
                </article>
              ))}
            </div>
            <div className="cta-block">
              <a className="btn btn-green btn-cta" href="#book">
                Book my Free Online Clarity Session →
              </a>
              <span>Takes 2 minutes to book</span>
            </div>
          </div>
        </section>

        <section className="band band-plain">
          <div className="wrap section">
            <p className="eyebrow center">A look inside</p>
            <h2 className="display center">
              Not a homework plan. <em>A picture of how your child learns.</em>
            </h2>
            <p className="lede-sm center">
              Tutoring looks at the next topic. A Senyara Learning Specialist looks at the whole learner: how they approach learning, understand and retain information, work through tasks, and build confidence and independence.
            </p>
            <div className="samples">
              <article className="sample">
                <span className="ribbon">Sample</span>
                <header>
                  <h3>Personal Learning Profile</h3>
                  <p>Learner: A.M. · Age 9</p>
                </header>
                <div className="profile">
                  {PROFILE.map((row) => (
                    <div key={row.a} className="profile-row">
                      <span>{row.a}</span>
                      <span className={`badge ${row.tone}`}>{row.s}</span>
                    </div>
                  ))}
                </div>
                <div className="pair">
                  <div className="pair-good">
                    <strong>Learns best when</strong>
                    Steps are shown visually · Tasks are short · Ideas are talked through first
                  </div>
                  <div className="pair-hard">
                    <strong>What gets in the way</strong>
                    Long spoken instructions · Getting started · Worry about mistakes
                  </div>
                </div>
                <p className="priorities">
                  <strong>Support priorities</strong>
                  <br />
                  1. Start tasks with more independence
                  <br />
                  2. Understand and remember new learning more securely
                  <br />
                  3. Build on their strength in sharing ideas
                </p>
              </article>

              <article className="sample">
                <span className="ribbon">Sample</span>
                <header>
                  <h3>Learning Routine Checklist</h3>
                  <p>A calm weekly routine to keep learning steady at home</p>
                </header>
                <div className="routine">
                  {ROUTINE.map((item) => (
                    <div key={item.t} className="routine-item">
                      <span className="box">
                        <Check />
                      </span>
                      <p>
                        <strong>{item.t}</strong> {item.d}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <div className="cards three strategy-row">
              {STRATEGIES.map((item) => (
                <article key={item.t} className="card strategy">
                  <p className="eyebrow">Study-habit strategy</p>
                  <h3>{item.t}</h3>
                  <p className="gets">{item.w}</p>
                  <p>{item.h}</p>
                </article>
              ))}
            </div>
            <p className="fine">Illustrative samples. Every profile and routine is written for the individual learner.</p>
          </div>
        </section>

        <section id="how" className="band">
          <div className="wrap section">
            <p className="eyebrow center">How it works</p>
            <h2 className="display center">
              3 simple steps, <em>all online</em>
            </h2>
            <div className="cards three">
              {STEPS.map((item) => (
                <article key={item.k} className="card step">
                  <p className="eyebrow">{item.k}</p>
                  <h3>{item.t}</h3>
                  <p>{item.d}</p>
                </article>
              ))}
            </div>
            <div className="cta-block">
              <a className="btn btn-green btn-cta" href="#book">
                Book my Free Online Clarity Session →
              </a>
            </div>
          </div>
        </section>

        <section className="band band-plain">
          <div className="wrap section">
            <p className="eyebrow center">Beyond the first session</p>
            <h2 className="display center">
              Support that grows <em>with your child</em>
            </h2>
            <p className="lede-sm center">If you choose ongoing support, it follows your child’s development, not just the school calendar.</p>
            <div className="cards four">
              {GROWTH.map((item) => (
                <article key={item.k} className="card">
                  <span className="kicker">{item.k}</span>
                  <h3>{item.t}</h3>
                  <p>{item.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="band band-plain tight" id="specialist">
          <div className="wrap who">
            <div className="who-copy">
              <p className="eyebrow">Who you’ll meet</p>
              <h2 className="display">
                A Senyara <em>Learning Specialist</em>
              </h2>
              <p>A trained specialist who looks at how your child learns, not just what they’re studying.</p>
              <p className="founder">Senyara was started by a parent whose own child was pulled out of class for support.</p>
              <div className="photo-row">
                <figure className="photo">
                  <img src="/hero.jpg" alt="A parent and child working together at a table" />
                  <figcaption>Learning that starts with being understood</figcaption>
                </figure>
                <div className="centre">
                  <p className="eyebrow gold">The centre</p>
                  <p>Block A, Business Village, Deira, Dubai</p>
                  <p>Monday to Saturday, 9am to 6pm GST</p>
                  <a href="https://www.google.com/maps/search/?api=1&query=Block+A+Business+Village+Deira+Dubai" target="_blank" rel="noreferrer">
                    Open in Maps
                  </a>
                </div>
              </div>
            </div>
            <div className="who-side">
              <div className="cards two">
                {STANDARDS.map((item) => (
                  <article key={item.t} className="card compact">
                    <h3><Check /> {item.t}</h3>
                    <p>{item.d}</p>
                  </article>
                ))}
              </div>
              <div className="cards two">
                <article className="card compact proof">
                  <h3>Started by a parent</h3>
                  <p>The centre exists because one family needed support that looked at the child, not only the class they were missing.</p>
                </article>
                <article className="card compact proof">
                  <h3>Free, and yours to keep</h3>
                  <p>The session and the profile, strategies, and routine are free. Continuing afterwards is your decision.</p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <Faq />
        <Booking />
      </main>

      <footer className="site-footer">
        <div className="wrap foot">
          <div>
            <p className="brand">Senyara Learning</p>
            <p className="tag">Where every child is seen.</p>
            <p>A structured, specialist-led learning support center.</p>
          </div>
          <div>
            <p className="foot-label">Visit us</p>
            <p>Block A, Business Village, Deira, Dubai, UAE</p>
            <p>Monday to Saturday, 9am to 6pm GST</p>
          </div>
          <div>
            <p className="foot-label">Contact</p>
            <a href="tel:+97143764924">+971 4 376 4924</a>
            <a href="https://wa.me/971565480898" target="_blank" rel="noreferrer">WhatsApp +971 56 548 0898</a>
            <a href="mailto:learn@senyaralearning.com">learn@senyaralearning.com</a>
          </div>
          <div>
            <p className="foot-label">Follow</p>
            <a href="https://www.instagram.com/senyaralearning/" target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://www.facebook.com/people/Senyara-Learning/61591473929124/" target="_blank" rel="noreferrer">Facebook</a>
            <a href="https://www.linkedin.com/company/senyara-learning/" target="_blank" rel="noreferrer">LinkedIn</a>
          </div>
          <p className="legal">© 2026 Senyara Learning FZCO · Dubai, UAE</p>
        </div>
      </footer>

      <div className="sticky-bar">
        <a className="btn btn-line" href={WA_GENERAL} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
        <a className="btn btn-green btn-cta" href="#book">
          Book free session
        </a>
      </div>
    </div>
  );
}
