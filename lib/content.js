export const WA_NUMBER = "971565480898";

export function waLink(text) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

export const WA_GENERAL = waLink(
  "Hi Senyara, I would like to book a Free Online Clarity Session."
);

export const AGES = ["5 to 8", "9 to 11", "12 to 14", "15 to 18"];
export const AREAS = ["Dubai", "Sharjah", "Ajman", "Abu Dhabi", "Other emirate"];
export const STARTS = [
  "As soon as possible",
  "Within the next month",
  "Next term",
  "Just exploring for now",
];

export const PATHS = [
  {
    id: "sen",
    title: "“My child tries hard, but something isn’t clicking.”",
    sub: "Reading, focus, memory or confidence",
  },
  {
    id: "after",
    title: "“School subjects feel harder than they should.”",
    sub: "Marks, homework or organisation",
  },
  {
    id: "unsure",
    title: "Not sure yet",
    sub: "Start here",
  },
];

export const QUESTIONS = [
  {
    text: "How does your child manage focus during learning or homework?",
    options: [
      { label: "Stays focused until it’s done", tag: "", mirror: "" },
      { label: "Focuses in short bursts", tag: "busy", mirror: "Focus comes in short bursts" },
      { label: "Gets distracted easily", tag: "busy", mirror: "Your child gets distracted easily" },
      { label: "Finds it very hard to get started", tag: "busy", mirror: "Getting started is very hard" },
    ],
  },
  {
    text: "When learning feels hard, how does your child usually react?",
    options: [
      { label: "Keeps trying", tag: "", mirror: "" },
      { label: "Gets frustrated or upset", tag: "worry", mirror: "Your child gets frustrated or upset when learning feels hard" },
      { label: "Avoids it or shuts down", tag: "worry", mirror: "Your child avoids or shuts down when learning feels hard" },
      { label: "Says things like “I can’t do this”", tag: "worry", mirror: "Your child says things like “I can’t do this”" },
    ],
  },
  {
    text: "Which feels harder for your child right now?",
    options: [
      { label: "English reading and writing", tag: "gap", mirror: "English reading and writing feel harder" },
      { label: "Maths, or feels anxious about maths", tag: "gap", mirror: "Maths feels harder, or makes your child anxious" },
      { label: "Both English and maths", tag: "gap", mirror: "Both English and maths feel harder" },
      { label: "Neither right now", tag: "", mirror: "" },
    ],
  },
  {
    text: "How often does your child seem confused by what’s being taught?",
    options: [
      { label: "Rarely", tag: "", mirror: "" },
      { label: "Sometimes", tag: "effort", mirror: "Your child is sometimes confused by new learning" },
      { label: "Often, even after explanations", tag: "gap", mirror: "Your child is often confused, even after explanations" },
      { label: "Most of the time", tag: "gap", mirror: "Your child feels confused most of the time" },
    ],
  },
  {
    text: "How long have you noticed this?",
    options: [
      { label: "A few weeks", tag: "", mirror: "You noticed this a few weeks ago" },
      { label: "A few months", tag: "", mirror: "You’ve noticed this for a few months" },
      { label: "Over a year", tag: "time", mirror: "You’ve noticed this for over a year" },
      { label: "Since they started school", tag: "time", mirror: "You’ve noticed this since your child started school" },
    ],
  },
];

export const RESULTS = {
  effort: {
    key: "effort",
    name: "The Effortful Learner",
    text: "Your child is putting in effort, but it isn’t turning into progress yet. When this goes on, children often start to believe the problem is them. Usually the missing piece is strategy and structure, not ability.",
  },
  busy: {
    key: "busy",
    name: "The Busy Mind",
    text: "Starting and staying on task takes a lot of energy, and it shows at home. Clear routines and step-by-step structure usually make the biggest difference.",
  },
  worry: {
    key: "worry",
    name: "The Quiet Worrier",
    text: "Your child’s confidence is being affected. Confidence grows back with small, steady wins and someone who understands how they learn.",
  },
  gap: {
    key: "gap",
    name: "The Gap Builder",
    text: "Small gaps have been building for a while. Focused support on the right areas helps stop them from growing.",
  },
  steady: {
    key: "steady",
    name: "The Steady Learner",
    text: "Things are mostly on track. Clear structure can help your child keep building with confidence.",
  },
};

export function buildInsight(picks) {
  const counts = {};
  picks.forEach((option) => {
    if (option.tag) counts[option.tag] = (counts[option.tag] || 0) + 1;
  });
  let best = "steady";
  let top = 0;
  Object.keys(counts).forEach((key) => {
    if (counts[key] > top) {
      best = key;
      top = counts[key];
    }
  });
  const result = RESULTS[best];
  let mirror = picks.map((option) => option.mirror).filter(Boolean).slice(0, 4);
  if (mirror.length === 0) mirror = ["Things feel mostly on track right now"];
  const areas = picks.slice(0, 4).filter((option) => option.tag).length;
  const duration = picks[4]?.label || "";
  const durationText =
    duration === "Since they started school"
      ? ", since they started school"
      : duration
        ? `, for ${duration.toLowerCase()}`
        : "";
  const summaryLine =
    areas > 0
      ? `You’ve noticed ${areas} ${areas === 1 ? "area" : "areas"} where your child may need more support${durationText}. When effort doesn’t turn into progress for a while, it’s usually a sign that learning needs to be structured differently, not that your child isn’t trying.`
      : "Things look mostly steady right now. A Clarity Session can still help you build on your child’s strengths.";
  return { result, mirror, summaryLine, areas };
}

export const STACK = [
  {
    n: "1",
    t: "Personal Learning Profile",
    d: "How your child approaches learning, understands and retains information, their strengths, and what may be getting in the way.",
  },
  {
    n: "2",
    t: "3 Study-Habit Strategies",
    d: "Simple strategies matched to how your child learns, to use at home straight away.",
  },
  {
    n: "3",
    t: "Learning Routine Checklist",
    d: "A simple, calm weekly routine to keep learning steady at home.",
  },
];

export const PAINS = [
  { t: "You’ve tried helping at home", d: "Evenings of explaining, practising and encouraging, and it still isn’t clicking." },
  { t: "You’ve tried extra tutoring", d: "More hours, the same explanations, and similar results." },
  { t: "Confidence is starting to drop", d: "Your child is beginning to doubt themselves, even though they keep trying." },
  { t: "You’re not sure what support they need", d: "Everyone has advice. Nobody has shown you how your child actually learns." },
];

export const ROUTINE = [
  { t: "Same time, same place:", d: "a short learning slot on the same days each week" },
  { t: "Start small:", d: "one clear task first, using the “first, then” card" },
  { t: "Short and focused:", d: "20 minutes with a movement break" },
  { t: "Say it back:", d: "your child explains one idea in their own words" },
  { t: "Close calmly:", d: "name one win and pack the bag for tomorrow" },
];

export const STRATEGIES = [
  { t: "One step at a time", w: "Long spoken instructions get in the way", h: "Give one instruction, then ask your child to say it back." },
  { t: "A “first, then” card", w: "Getting started is the hardest part", h: "A simple visual card shows what comes first and what comes next." },
  { t: "Name one win", w: "Worry about mistakes lowers confidence", h: "End each day by naming one thing your child did well." },
];

export const GROWTH = [
  { k: "START", t: "Establish priorities", d: "Agree what matters most and the learning strategies that fit your child." },
  { k: "BUILD", t: "Strengthen skills and habits", d: "Targeted support on the skills and learning habits your child needs." },
  { k: "REVIEW", t: "Check progress", d: "See what’s working and adjust support together." },
  { k: "NEXT", t: "Agree new priorities", d: "Set the focus for the next learning period." },
];

export const PROFILE = [
  { a: "Attention & focus", s: "Building", tone: "building" },
  { a: "Understanding & remembering learning", s: "Needs support", tone: "support" },
  { a: "Applying & expressing ideas", s: "Strength", tone: "strength" },
  { a: "Confidence & independence", s: "Building", tone: "building" },
];

export const STEPS = [
  { k: "STEP 1 · 1 MINUTE", t: "Book your free session", d: "Pick a time that suits your family, online from anywhere in the UAE." },
  { k: "STEP 2 · LIVE ONLINE", t: "Meet a Learning Specialist", d: "Talk through how your child learns and what may be getting in the way." },
  { k: "STEP 3 · YOURS TO KEEP", t: "Leave with a clear plan", d: "Your Personal Learning Profile, 3 Study-Habit Strategies and a Learning Routine Checklist." },
];

export const STANDARDS = [
  { t: "Trained educators", d: "Specialists who look at how a child learns, not only the subject in front of them." },
  { t: "SEN experience", d: "Support for learners who need a different approach, including children who have been pulled out of class." },
  { t: "Focused on how your child learns", d: "The whole learner, not just the next topic." },
  { t: "Works alongside school", d: "Strategies that fit what your child’s school expects." },
];

export const FAQS = [
  ["Is the Clarity Session really free?", "Yes. The session and everything you receive are free, with no obligation to continue."],
  ["How long is the session?", "45 minutes, online. Every time you can book is a 45-minute Free Online Clarity Session."],
  ["What happens in the session?", "A Senyara Learning Specialist looks at how your child learns, what may be getting in the way, and what you can do next. You receive a Personal Learning Profile, 3 Study-Habit Strategies and a Learning Routine Checklist."],
  ["What do we need for an online session?", "A phone, tablet or laptop with a stable connection, and a quiet space. Your child can join you, or you can meet the specialist on your own."],
  ["Is this medical support?", "No. Senyara provides structured, specialist-led learning support. Nothing medical."],
  ["Do we need a report or label first?", "No. Many families start without one."],
  ["What happens after the session?", "If you’d like ongoing support, your specialist explains the options: SEN & LBLD support in person at our Dubai centre, or After-School support online. You decide, with no pressure."],
  ["How do fees work for ongoing support?", "Fees depend on the support your child needs and are explained clearly after your free session."],
];
