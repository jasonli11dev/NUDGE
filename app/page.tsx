"use client";

import { useState, useEffect, useRef } from "react";

function WavyDivider() {
  return (
    <div style={{ margin: "0 52px", borderTop: "0.5px solid #C8C8C8" }} />
  );
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Calendar helpers
  const HOUR_PX = 40;
  const START_HOUR = 8;
  const HEADER_Y = 24;
  const END_HOUR = 19; // 7pm
  const CAL_HEIGHT = HEADER_Y + (END_HOUR - START_HOUR) * HOUR_PX; // 464

  function timeToY(hour: number, minute = 0) {
    return HEADER_Y + (hour - START_HOUR) * HOUR_PX + (minute / 60) * HOUR_PX;
  }

  // Get Mon–Sun of the week containing `now`
  const weekDays = (() => {
    const day = now.getDay(); // 0=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  })();

  const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const COL_CENTERS = [96, 192, 288, 384, 480, 576, 672];
  const COL_STARTS  = [48, 144, 240, 336, 432, 528, 624];

  const todayColIndex = (() => {
    const d = now.getDay();
    return d === 0 ? 6 : d - 1; // Mon=0 … Sun=6
  })();

  const nowY = timeToY(now.getHours(), now.getMinutes());
  const nowVisible = now.getHours() >= START_HOUR && now.getHours() < END_HOUR;

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  type CalEvent = { col: number; sh: number; sm: number; eh: number; em: number; label: string; accent: boolean };

  const [events, setEvents] = useState<CalEvent[]>([
    { col: 0, sh: 9,  sm: 0,  eh: 9,  em: 45, label: "Landing page",  accent: true  },
    { col: 1, sh: 10, sm: 0,  eh: 10, em: 45, label: "User research",  accent: false },
    { col: 2, sh: 11, sm: 0,  eh: 11, em: 45, label: "Deep work",      accent: false },
    { col: 3, sh: 9,  sm: 0,  eh: 9,  em: 30, label: "Investor call",  accent: false },
    { col: 4, sh: 14, sm: 0,  eh: 14, em: 45, label: "Interviews",     accent: false },
  ]);

  type RecordState = "idle" | "recording" | "processing";
  const [recordState, setRecordState] = useState<RecordState>("idle");
  const [transcript, setTranscript] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { alert("Speech recognition not supported. Use Chrome or Edge."); return; }

    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    recognitionRef.current = rec;

    rec.onstart = () => setRecordState("recording");

    rec.onresult = async (e: any) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setRecordState("processing");

      try {
        const res = await fetch("/api/parse-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: text }),
        });
        const data = await res.json();
        if (data.tasks?.length) {
          setEvents((prev) => [...prev, ...data.tasks.map((t: Omit<CalEvent, "accent">) => ({ ...t, accent: false }))]);
        }
      } catch {
        // silently fail
      }
      setRecordState("idle");
    };

    rec.onerror = () => setRecordState("idle");
    rec.onend = () => { if (recordState === "recording") setRecordState("idle"); };

    rec.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setRecordState("idle");
  }

  function handleTalkButton() {
    if (recordState === "idle") startListening();
    else if (recordState === "recording") stopListening();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message);
      setEmail("");
    } catch {
      setMessage("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  return (
    <main style={{ position: "relative", zIndex: 1 }}>
      {/* NAV */}
      <nav
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "40px 52px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 300,
            fontSize: 12,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#2A2520",
          }}
        >
          Nudge
        </span>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {["How it works", "Pricing"].map((link) => (
            <a
              key={link}
              href="#"
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 200,
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#9A8B70",
                textDecoration: "none",
              }}
            >
              {link}
            </a>
          ))}
          <a
            href="#"
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 200,
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#2A2520",
              textDecoration: "none",
              borderBottom: "0.5px solid #2A2520",
              paddingBottom: 2,
            }}
          >
            Start free
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section
        className="hero-section"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          minHeight: "calc(100vh - 112px)",
          padding: "0 52px",
          alignItems: "center",
        }}
      >
        {/* Left — text */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <h1
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "clamp(28px, 3.2vw, 52px)",
              lineHeight: 1.3,
              color: "#1A1714",
              fontWeight: 300,
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Speak your goals.
            <br />
            <span style={{ color: "#E8533A", fontWeight: 600 }}>NUDGE</span> turns them
            <br />
            into calendar blocks.
          </h1>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 200,
              fontSize: "clamp(11px, 1.1vw, 14px)",
              lineHeight: 1.85,
              color: "#6A6058",
              margin: 0,
              maxWidth: 360,
            }}
          >
            Talk to Nudge on Sunday. It listens, understands your week,
            and writes focused time blocks directly to your Google Calendar.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 200,
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#9A8B70",
              }}
            >
              ↓ Try it now
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 200,
                fontSize: 10,
                color: "#C8C2B6",
                letterSpacing: "0.1em",
              }}
            >
              No sign-up required
            </span>
          </div>
        </div>

        {/* Right — Talk button */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
            position: "relative",
          }}
        >
          <div style={{ position: "relative", width: 280, height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Pulse rings */}
            <div
              className="talk-ring-3"
              style={{
                position: "absolute",
                width: 280,
                height: 280,
                borderRadius: "50%",
                border: "1px solid #2A2520",
              }}
            />
            <div
              className="talk-ring-2"
              style={{
                position: "absolute",
                width: 280,
                height: 280,
                borderRadius: "50%",
                border: "1px solid #2A2520",
              }}
            />
            <div
              className="talk-ring-1"
              style={{
                position: "absolute",
                width: 280,
                height: 280,
                borderRadius: "50%",
                border: "1.5px solid #2A2520",
              }}
            />

            {/* Core button */}
            <div
              className="talk-core"
              onClick={handleTalkButton}
              style={{
                width: 200,
                height: 200,
                borderRadius: "50%",
                background: recordState === "recording" ? "#E8533A" : recordState === "processing" ? "#333" : "#1A1714",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                boxShadow: recordState === "recording"
                  ? "0 8px 48px rgba(232,83,58,0.35), 0 2px 12px rgba(232,83,58,0.2)"
                  : "0 8px 48px rgba(26,23,20,0.18), 0 2px 12px rgba(26,23,20,0.12)",
                position: "relative",
                zIndex: 1,
                transition: "background 0.3s ease, box-shadow 0.3s ease",
              }}
            >
              {/* Waveform bars */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, height: 32 }}>
                {[16, 26, 32, 26, 16].map((h, i) => (
                  <div
                    key={i}
                    className={recordState === "recording" ? "wave-bar" : ""}
                    style={{
                      width: 3,
                      height: recordState === "recording" ? h : recordState === "processing" ? 8 : h,
                      borderRadius: 2,
                      background: "#E0E0E0",
                      opacity: recordState === "processing" ? 0.3 : 0.9,
                      transition: "height 0.2s ease",
                    }}
                  />
                ))}
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 300,
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "#E0E0E0",
                  opacity: 0.85,
                }}
              >
                {recordState === "idle" ? "Tap to speak" : recordState === "recording" ? "Listening..." : "Processing..."}
              </span>
            </div>
          </div>

          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 200,
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#9A8B70",
            }}
          >
            Talk to Nudge
          </span>

          {/* Transcript */}
          {transcript && (
            <p style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 200,
              fontSize: 11,
              color: "#888888",
              maxWidth: 280,
              textAlign: "center",
              lineHeight: 1.7,
              margin: 0,
            }}>
              &ldquo;{transcript}&rdquo;
            </p>
          )}
        </div>
      </section>

      <WavyDivider />

      {/* WEEKLY CALENDAR */}
      <section className="calendar-section" style={{ padding: "0 52px", marginTop: 32 }}>
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 200, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.22em", color: "#1A1714" }}>
            Week of {weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 200, fontSize: 10, letterSpacing: "0.16em", color: "#888888" }}>
            {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </span>
        </div>

        <svg width="100%" viewBox={`0 0 756 ${CAL_HEIGHT}`} style={{ overflow: "visible" }}>

          {/* Day headers */}
          {weekDays.map((d, i) => (
            <text
              key={i}
              x={COL_CENTERS[i]}
              y={18}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={9}
              fontWeight={i === todayColIndex ? 400 : 200}
              fill={i === todayColIndex ? "#1A1714" : i >= 5 ? "#BBBBBB" : "#888888"}
            >
              {DAY_LABELS[i]} {d.getDate()}
            </text>
          ))}

          {/* Header rule */}
          <path d={`M0,${HEADER_Y} L756,${HEADER_Y}`} stroke="#C0C0C0" strokeWidth={0.5} strokeDasharray="2,4" fill="none" />

          {/* Horizontal hour rules */}
          {hours.map((h) => (
            <path
              key={h}
              d={`M48,${timeToY(h)} L756,${timeToY(h)}`}
              stroke="#C8C8C8"
              strokeWidth={0.4}
              strokeDasharray="2,4"
              fill="none"
            />
          ))}

          {/* Vertical dividers */}
          {COL_STARTS.map((x) => (
            <path
              key={x}
              d={`M${x},${HEADER_Y} L${x},${CAL_HEIGHT}`}
              stroke="#C8C8C8"
              strokeWidth={0.4}
              strokeDasharray="2,4"
              fill="none"
            />
          ))}

          {/* Time labels */}
          {hours.map((h) => (
            <text
              key={h}
              x={40}
              y={timeToY(h) + 4}
              textAnchor="end"
              fontFamily="var(--font-mono)"
              fontSize={9}
              fontWeight={200}
              fill="#AAAAAA"
            >
              {h === 12 ? "12pm" : h > 12 ? `${h - 12}pm` : `${h}am`}
            </text>
          ))}

          {/* Event blocks */}
          {events.map((ev, i) => {
            const y = timeToY(ev.sh, ev.sm);
            const h = timeToY(ev.eh, ev.em) - y;
            const x = COL_STARTS[ev.col] + 2;
            const w = 92;
            const cx = COL_CENTERS[ev.col];
            return (
              <g key={i} className={`block-${i + 1}`}>
                <rect
                  x={x} y={y} width={w} height={h} rx={1}
                  fill={ev.accent ? "#F5D8D0" : i === 3 ? "#1A1714" : "#E4E4E4"}
                  stroke={ev.accent ? "#E8533A" : i === 3 ? "#1A1714" : "#AAAAAA"}
                  strokeWidth={0.5}
                />
                <text x={cx} y={y + h * 0.42} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={9} fontWeight={300}
                  fill={ev.accent ? "#C0311A" : i === 3 ? "#E0E0E0" : "#444444"}>
                  {ev.label}
                </text>
                <text x={cx} y={y + h * 0.72} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={8} fontWeight={200}
                  fill={ev.accent ? "#E8533A" : i === 3 ? "#AAAAAA" : "#777777"}>
                  {`${ev.sh}:${String(ev.sm).padStart(2, "0")}–${ev.eh}:${String(ev.em).padStart(2, "0")}`}
                </text>
              </g>
            );
          })}

          {/* Now indicator */}
          {nowVisible && (
            <g>
              <circle cx={48} cy={nowY} r={2.5} fill="#E8533A" />
              <path d={`M50,${nowY} L756,${nowY}`} stroke="#E8533A" strokeWidth={0.6} fill="none" />
              <text x={44} y={nowY - 4} fontFamily="var(--font-mono)" fontSize={8} fontWeight={200} fill="#E8533A" textAnchor="end">
                {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </text>
            </g>
          )}
        </svg>
      </section>

      <WavyDivider />

      {/* THIS WEEK TASKS */}
      <section className="tasks-section" style={{ padding: "32px 52px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 200,
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.22em",
            color: "#2A2520",
            marginBottom: 16,
          }}
        >
          This week
        </div>

        {[
          {
            index: "01.",
            title: "Launch landing page",
            meta: "Mon · 9:00 – 9:45am",
            badge: "Active",
            badgeColor: "#8A5A30",
            badgeBorder: "#B8845A",
          },
          {
            index: "02.",
            title: "Write investor update",
            meta: "Wed · 1:00 – 1:30pm",
            badge: "Upcoming",
            badgeColor: "#7A6830",
            badgeBorder: "#AE9C60",
          },
          {
            index: "03.",
            title: "User interviews × 2",
            meta: "Fri · 2:00 – 2:45pm",
            badge: "Upcoming",
            badgeColor: "#4A7870",
            badgeBorder: "#7AADA8",
          },
        ].map((task) => (
          <div
            key={task.index}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 16,
              padding: "11px 0",
              borderBottom: "0.5px solid #D4CFC5",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 200,
                fontSize: 10,
                color: "#B8B0A4",
                minWidth: 24,
              }}
            >
              {task.index}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 300,
                fontSize: 13,
                color: "#2A2520",
                flex: 1,
              }}
            >
              {task.title}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 200,
                fontSize: 10,
                color: "#9A8B70",
              }}
            >
              {task.meta}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 200,
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                border: `0.5px solid ${task.badgeBorder}`,
                color: task.badgeColor,
                padding: "2px 8px",
              }}
            >
              {task.badge}
            </span>
          </div>
        ))}
      </section>

      <WavyDivider />

      {/* BOTTOM CTA */}
      <section
        className="cta-section"
        style={{
          padding: "32px 52px 52px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 20,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 200,
            fontSize: 13,
            lineHeight: 1.9,
            color: "#6A6058",
            maxWidth: 420,
            margin: 0,
          }}
        >
          Nudge calls you Sunday. You talk. It turns your goals into time blocks
          and writes them to your Google Calendar — then keeps you on track all
          week.
        </p>

        {/* Waitlist form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 200,
              fontSize: 12,
              color: "#2A2520",
              background: "transparent",
              border: "none",
              borderBottom: "0.5px solid #D4CFC5",
              padding: "6px 0",
              outline: "none",
              width: 220,
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 300,
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              color: "#2A2520",
              borderBottom: "0.8px solid #2A2520",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              background: "none",
              cursor: loading ? "not-allowed" : "pointer",
              padding: "4px 0",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? "Joining..." : "Join the waitlist →"}
          </button>
        </form>

        {message && (
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 200,
              fontSize: 11,
              color: "#9A8B70",
              margin: 0,
            }}
          >
            {message}
          </p>
        )}

        <button
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 200,
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.22em",
            color: "#9A8B70",
            border: "none",
            background: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          See how it works
        </button>

        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 200,
            fontSize: 10,
            letterSpacing: "0.1em",
            color: "#B8B0A4",
            margin: 0,
          }}
        >
          No credit card required · Works with Google Calendar
        </p>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .hero-section {
            grid-template-columns: 1fr !important;
            padding: 48px 24px !important;
            min-height: unset !important;
            gap: 52px;
          }
          nav {
            padding: 24px !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }
          .calendar-section,
          .tasks-section,
          .cta-section {
            padding-left: 24px !important;
            padding-right: 24px !important;
          }
        }
      `}</style>
    </main>
  );
}
