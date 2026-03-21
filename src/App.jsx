import { useState, useRef, useEffect, useCallback } from "react";

// ── Fonts ──────────────────────────────────────────────────────────────────────
const FontLink = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Barlow+Condensed:wght@300;400;500;600;700&family=Orbitron:wght@700;900&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #080c10;
      --bg2: #0e1318;
      --bg3: #151c24;
      --card: #111820;
      --border: #1e2d3d;
      --accent: #00e5ff;
      --accent2: #ff6b35;
      --accent3: #39ff14;
      --gold: #ffd700;
      --text: #e8f4f8;
      --muted: #4a6278;
      --danger: #ff3d5a;
      --success: #39ff14;
      --rad: 6px;
      --rad2: 12px;
    }

    body { background: var(--bg); color: var(--text); font-family: 'Barlow Condensed', sans-serif; overflow-x: hidden; }

    /* scrollbar */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg2); }
    ::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 2px; }

    /* glow utility */
    .glow { text-shadow: 0 0 18px var(--accent), 0 0 40px var(--accent); }
    .glow-o { text-shadow: 0 0 14px var(--accent2); }

    /* shimmer line */
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    .shimmer-text {
      background: linear-gradient(90deg, var(--accent) 0%, #fff 50%, var(--accent) 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: shimmer 3s linear infinite;
    }

    @keyframes pulse-border {
      0%,100% { box-shadow: 0 0 0 0 rgba(0,229,255,0.4); }
      50% { box-shadow: 0 0 0 6px rgba(0,229,255,0); }
    }

    @keyframes fadeInUp {
      from { opacity:0; transform:translateY(16px); }
      to { opacity:1; transform:translateY(0); }
    }

    @keyframes scanline {
      0% { top: -5%; }
      100% { top: 105%; }
    }

    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
    .blink { animation: blink 1s infinite; }

    @keyframes bounce-in {
      0% { transform:scale(0.5); opacity:0; }
      60% { transform:scale(1.15); opacity:1; }
      100% { transform:scale(1); }
    }
    .bounce-in { animation: bounce-in 0.4s ease forwards; }
  `}</style>
);

// ─── helpers ──────────────────────────────────────────────────────────────────
const over = (b) => `${Math.floor(b / 6)}.${b % 6}`;

function initTeam(name) {
  return { name, players: [], score: 0, wickets: 0, balls: 0, extras: { wide: 0, noBall: 0, bye: 0, legBye: 0 }, overs: [] };
}

function newBall(runs, type, batter, bowler) {
  return { runs, type, batter, bowler };
}

// ─── SETUP SCREEN ──────────────────────────────────────────────────────────────
function SetupScreen({ onStart }) {
  const [team1, setTeam1] = useState("Team Alpha");
  const [team2, setTeam2] = useState("Team Bravo");
  const [overs, setOvers] = useState(10);
  const [players1, setPlayers1] = useState(Array(11).fill("").map((_, i) => `Player ${i + 1}`));
  const [players2, setPlayers2] = useState(Array(11).fill("").map((_, i) => `Player ${i + 1}`));
  const [tab, setTab] = useState(0);

  const updatePlayer = (team, idx, val) => {
    if (team === 0) { const a = [...players1]; a[idx] = val; setPlayers1(a); }
    else { const a = [...players2]; a[idx] = val; setPlayers2(a); }
  };

  const handle = () => {
    onStart({ team1name: team1, team2name: team2, overs, players1: players1.filter(Boolean), players2: players2.filter(Boolean) });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "20px 16px", background: "radial-gradient(ellipse at top, #0d1f2d 0%, #080c10 70%)" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* logo */}
        <div style={{ textAlign: "center", marginBottom: 32, animation: "fadeInUp 0.6s ease" }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 28, letterSpacing: 3, color: "var(--accent)" }} className="glow">🏏 CRICSCAN</div>
          <div style={{ color: "var(--muted)", fontSize: 13, letterSpacing: 2, marginTop: 4 }}>AI POWERED SCORER</div>
        </div>

        {/* match settings */}
        <Card title="MATCH SETUP" style={{ marginBottom: 16 }}>
          <Label>Team 1 Name</Label>
          <Input value={team1} onChange={e => setTeam1(e.target.value)} />
          <Label style={{ marginTop: 12 }}>Team 2 Name</Label>
          <Input value={team2} onChange={e => setTeam2(e.target.value)} />
          <Label style={{ marginTop: 12 }}>Overs</Label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[5, 10, 20, 50].map(o => (
              <button key={o} onClick={() => setOvers(o)} style={{ flex: 1, padding: "8px 0", background: overs === o ? "var(--accent)" : "var(--bg3)", color: overs === o ? "#000" : "var(--text)", border: `1px solid ${overs === o ? "var(--accent)" : "var(--border)"}`, borderRadius: "var(--rad)", fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>{o}</button>
            ))}
            <input type="number" value={overs} onChange={e => setOvers(Number(e.target.value))} style={{ width: 70, padding: "8px 10px", background: "var(--bg3)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "var(--rad)", fontFamily: "'Barlow Condensed'", fontSize: 15 }} />
          </div>
        </Card>

        {/* players tab */}
        <Card title="SQUAD SETUP" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[team1, team2].map((t, i) => (
              <button key={i} onClick={() => setTab(i)} style={{ flex: 1, padding: "7px 0", background: tab === i ? "var(--accent2)" : "var(--bg3)", color: tab === i ? "#fff" : "var(--muted)", border: `1px solid ${tab === i ? "var(--accent2)" : "var(--border)"}`, borderRadius: "var(--rad)", fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 13, cursor: "pointer", letterSpacing: 1 }}>{t}</button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {(tab === 0 ? players1 : players2).map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "var(--muted)", fontSize: 11, minWidth: 16 }}>{i + 1}</span>
                <input value={p} onChange={e => updatePlayer(tab, i, e.target.value)} style={{ flex: 1, padding: "6px 8px", background: "var(--bg3)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "var(--rad)", fontFamily: "'Barlow Condensed'", fontSize: 14 }} />
              </div>
            ))}
          </div>
        </Card>

        <button onClick={handle} style={{ width: "100%", padding: "14px 0", background: "linear-gradient(135deg, var(--accent), #0099bb)", color: "#000", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: 2, border: "none", borderRadius: "var(--rad)", cursor: "pointer", animation: "pulse-border 2s infinite" }}>
          START MATCH ▶
        </button>
      </div>
    </div>
  );
}

// ─── CAMERA ZONE SETUP ─────────────────────────────────────────────────────────
function CameraSetup({ onDone, onSkip }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [zones, setZones] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [start, setStart] = useState(null);
  const [selectedRuns, setSelectedRuns] = useState(4);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" } })
      .then(s => { if (videoRef.current) { videoRef.current.srcObject = s; setStreaming(true); } })
      .catch(() => setError("Camera access denied. Use manual scoring or grant camera permission."));
    return () => { videoRef.current?.srcObject?.getTracks().forEach(t => t.stop()); };
  }, []);

  const getPos = (e, el) => {
    const r = el.getBoundingClientRect();
    const cx = (e.touches?.[0]?.clientX ?? e.clientX) - r.left;
    const cy = (e.touches?.[0]?.clientY ?? e.clientY) - r.top;
    return { x: cx / r.width, y: cy / r.height };
  };

  const onDown = e => { const p = getPos(e, canvasRef.current); setStart(p); setDrawing(true); };
  const onUp = e => {
    if (!drawing || !start) return;
    const p = getPos(e, canvasRef.current);
    setZones(z => [...z, { x: Math.min(start.x, p.x), y: Math.min(start.y, p.y), w: Math.abs(p.x - start.x), h: Math.abs(p.y - start.y), runs: selectedRuns }]);
    setDrawing(false); setStart(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", padding: 16 }}>
      <div style={{ fontFamily: "'Orbitron',sans-serif", color: "var(--accent)", fontSize: 16, marginBottom: 8, letterSpacing: 2 }} className="glow">📷 CAMERA ZONE SETUP</div>
      <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>Draw zones on the pitch view and assign runs to each zone. The AI will detect where the ball lands.</div>

      {error ? <div style={{ color: "var(--danger)", background: "#1a0a0a", padding: 12, borderRadius: "var(--rad)", marginBottom: 12, fontSize: 13 }}>{error}</div> : null}

      {/* run selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {[1, 2, 3, 4, 6, "BOUNDARY"].map(r => (
          <button key={r} onClick={() => setSelectedRuns(r)} style={{ padding: "6px 12px", background: selectedRuns === r ? "var(--accent2)" : "var(--bg3)", color: selectedRuns === r ? "#fff" : "var(--muted)", border: `1px solid ${selectedRuns === r ? "var(--accent2)" : "var(--border)"}`, borderRadius: "var(--rad)", fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{r}</button>
        ))}
      </div>

      {/* video + canvas overlay */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#000", borderRadius: "var(--rad2)", overflow: "hidden", border: "1px solid var(--border)", marginBottom: 12 }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "crosshair" }}
          onMouseDown={onDown} onMouseUp={onUp} onTouchStart={onDown} onTouchEnd={onUp} />
        {/* draw saved zones */}
        {zones.map((z, i) => (
          <div key={i} style={{ position: "absolute", left: `${z.x * 100}%`, top: `${z.y * 100}%`, width: `${z.w * 100}%`, height: `${z.h * 100}%`, border: "2px solid var(--accent2)", background: "rgba(255,107,53,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "var(--accent2)", fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 700 }}>{z.runs}</span>
          </div>
        ))}
        {!streaming && !error && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13 }}>Starting camera...</div>}
      </div>

      <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 12 }}>Zones defined: {zones.length} &nbsp;|&nbsp; Drag on camera to draw a zone</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setZones([])} style={{ flex: 1, padding: 10, background: "var(--bg3)", color: "var(--muted)", border: "1px solid var(--border)", borderRadius: "var(--rad)", fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Clear Zones</button>
        <button onClick={onSkip} style={{ flex: 1, padding: 10, background: "var(--bg3)", color: "var(--muted)", border: "1px solid var(--border)", borderRadius: "var(--rad)", fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Skip (Manual Only)</button>
        <button onClick={() => onDone(zones)} style={{ flex: 1, padding: 10, background: "var(--accent)", color: "#000", border: "none", borderRadius: "var(--rad)", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>DONE ✓</button>
      </div>
    </div>
  );
}

// ─── LIVE CAMERA TRACKER (during match) ───────────────────────────────────────
function CameraTracker({ zones, onDetect, active }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const prevFrameRef = useRef(null);
  const [detected, setDetected] = useState(null);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    if (!active) return;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" } })
      .then(s => { if (videoRef.current) { videoRef.current.srcObject = s; setStreaming(true); } })
      .catch(() => {});
    return () => { videoRef.current?.srcObject?.getTracks().forEach(t => t.stop()); cancelAnimationFrame(animRef.current); };
  }, [active]);

  useEffect(() => {
    if (!streaming || !active) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const analyze = () => {
      if (!videoRef.current?.readyState >= 2) { animRef.current = requestAnimationFrame(analyze); return; }
      canvas.width = videoRef.current.videoWidth || 320;
      canvas.height = videoRef.current.videoHeight || 240;
      ctx.drawImage(videoRef.current, 0, 0);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (prevFrameRef.current) {
        // simple motion detection — find centroid of changed pixels
        let sx = 0, sy = 0, count = 0;
        for (let i = 0; i < frame.data.length; i += 4) {
          const dr = Math.abs(frame.data[i] - prevFrameRef.current[i]);
          const dg = Math.abs(frame.data[i + 1] - prevFrameRef.current[i + 1]);
          const db = Math.abs(frame.data[i + 2] - prevFrameRef.current[i + 2]);
          if (dr + dg + db > 80) {
            const px = (i / 4) % canvas.width;
            const py = Math.floor((i / 4) / canvas.width);
            sx += px; sy += py; count++;
          }
        }
        if (count > 200) {
          const cx = sx / count / canvas.width;
          const cy = sy / count / canvas.height;
          // check which zone
          for (const z of zones) {
            if (cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h) {
              setDetected({ runs: z.runs, cx, cy });
              onDetect(z.runs);
              break;
            }
          }
        } else {
          setDetected(null);
        }
      }
      prevFrameRef.current = frame.data.slice();
      animRef.current = requestAnimationFrame(analyze);
    };
    animRef.current = requestAnimationFrame(analyze);
    return () => cancelAnimationFrame(animRef.current);
  }, [streaming, active, zones]);

  if (!active) return null;

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#000", borderRadius: "var(--rad)", overflow: "hidden", border: "1px solid var(--border)", marginBottom: 10 }}>
      <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      {/* zone overlays */}
      {zones.map((z, i) => (
        <div key={i} style={{ position: "absolute", left: `${z.x * 100}%`, top: `${z.y * 100}%`, width: `${z.w * 100}%`, height: `${z.h * 100}%`, border: "1px solid rgba(0,229,255,0.4)", background: "rgba(0,229,255,0.05)" }}>
          <span style={{ color: "rgba(0,229,255,0.7)", fontFamily: "'Orbitron',sans-serif", fontSize: 10 }}>{z.runs}</span>
        </div>
      ))}
      {detected && (
        <div style={{ position: "absolute", left: `${detected.cx * 100}%`, top: `${detected.cy * 100}%`, transform: "translate(-50%,-50%)", background: "var(--accent2)", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Orbitron',sans-serif", fontWeight: 900, fontSize: 13, color: "#fff", animation: "bounce-in 0.3s ease" }}>
          {detected.runs}
        </div>
      )}
      {/* scanline effect */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 50%, rgba(0,0,0,0.03) 50%)", backgroundSize: "100% 3px", pointerEvents: "none", opacity: 0.4 }} />
      <div style={{ position: "absolute", top: 6, right: 8, background: "rgba(255,61,90,0.9)", borderRadius: 3, padding: "2px 6px", fontSize: 10, fontFamily: "'Orbitron',sans-serif", color: "#fff", letterSpacing: 1 }}>
        <span className="blink">●</span> LIVE AI
      </div>
    </div>
  );
}

// ─── SCORING SCREEN ────────────────────────────────────────────────────────────
function ScoringScreen({ match, onBall, onWicket, onUndo, onEndInnings }) {
  const { batting, bowling, overs } = match;
  const bt = match.teams[batting];
  const bw = match.teams[bowling];
  const balls = bt.balls;
  const rem = overs * 6 - balls;
  const currentOver = bt.overs[bt.overs.length - 1] || [];

  const [showCamera, setShowCamera] = useState(false);
  const [notification, setNotification] = useState(null);
  const [extraType, setExtraType] = useState(null); // null | 'wide' | 'noBall' | 'bye' | 'legBye'

  const notify = (msg, color = "var(--accent)") => {
    setNotification({ msg, color });
    setTimeout(() => setNotification(null), 1500);
  };

  const handleRun = (r, type = "normal") => {
    onBall(r, type || extraType || "normal");
    setExtraType(null);
    notify(type === "wide" ? `Wide +${r + 1}` : type === "noBall" ? `No Ball +${r + 1}` : r === 4 ? "FOUR! 🏏" : r === 6 ? "SIX! 🚀" : r === 0 ? "Dot Ball" : `${r} Run${r > 1 ? "s" : ""}`, r === 6 ? "var(--accent3)" : r === 4 ? "var(--gold)" : "var(--accent)");
  };

  const handleWicket = () => { onWicket(); notify("WICKET! 🔴", "var(--danger)"); };

  const runBtns = [0, 1, 2, 3, 4, 6];
  const extraBtns = ["Wide", "No Ball", "Bye", "Leg Bye"];
  const extraMap = { "Wide": "wide", "No Ball": "noBall", "Bye": "bye", "Leg Bye": "legBye" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>

      {/* notification toast */}
      {notification && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: notification.color, color: notification.color === "var(--gold)" || notification.color === "var(--accent3)" ? "#000" : "#fff", padding: "10px 24px", borderRadius: 30, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: 16, zIndex: 999, animation: "bounce-in 0.3s ease", whiteSpace: "nowrap" }}>
          {notification.msg}
        </div>
      )}

      {/* scoreboard header */}
      <div style={{ background: "linear-gradient(135deg, #0a1520 0%, #0d1f2e 100%)", borderBottom: "1px solid var(--border)", padding: "12px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", color: "var(--accent)", fontSize: 11, letterSpacing: 2, marginBottom: 2 }}>{bt.name} BATTING</div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
              {bt.score}<span style={{ color: "var(--danger)", fontSize: 22 }}>/{bt.wickets}</span>
            </div>
            <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
              {over(balls)} ov &nbsp;·&nbsp; RR: {balls > 0 ? ((bt.score / balls) * 6).toFixed(2) : "0.00"} &nbsp;·&nbsp; {rem} balls left
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "var(--muted)", fontSize: 11, letterSpacing: 1 }}>EXTRAS</div>
            <div style={{ color: "var(--text)", fontSize: 18, fontFamily: "'Rajdhani',sans-serif", fontWeight: 600 }}>
              {(bt.extras.wide || 0) + (bt.extras.noBall || 0) + (bt.extras.bye || 0) + (bt.extras.legBye || 0)}
            </div>
            <div style={{ color: "var(--muted)", fontSize: 10 }}>W:{bt.extras.wide || 0} NB:{bt.extras.noBall || 0}</div>
          </div>
        </div>

        {/* current over balls */}
        <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
          {currentOver.map((b, i) => (
            <BallDot key={i} ball={b} />
          ))}
          {currentOver.length < 6 && Array(6 - currentOver.length).fill(0).map((_, i) => (
            <div key={"e" + i} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px dashed var(--border)" }} />
          ))}
        </div>

        {/* batter/bowler info */}
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <PlayerChip label="ON STRIKE" name={match.striker?.name || "—"} stat={`${match.striker?.runs || 0}(${match.striker?.balls || 0})`} color="var(--accent)" />
          <PlayerChip label="NON-STRIKE" name={match.nonStriker?.name || "—"} stat={`${match.nonStriker?.runs || 0}(${match.nonStriker?.balls || 0})`} color="var(--muted)" />
          <PlayerChip label="BOWLING" name={match.currentBowler?.name || "—"} stat={`${match.currentBowler?.wickets || 0}/${match.currentBowler?.runs || 0}`} color="var(--accent2)" />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>

        {/* camera toggle */}
        <button onClick={() => setShowCamera(s => !s)} style={{ width: "100%", padding: "8px 0", marginBottom: 10, background: showCamera ? "rgba(0,229,255,0.1)" : "var(--bg3)", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: "var(--rad)", fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 14, letterSpacing: 1, cursor: "pointer" }}>
          {showCamera ? "📷 HIDE CAMERA" : "📷 SHOW AI CAMERA"}
        </button>

        {showCamera && <CameraTracker zones={match.zones || []} onDetect={r => handleRun(r, "camera")} active={showCamera} />}

        {/* extra type selector */}
        {extraType && (
          <div style={{ background: "rgba(255,107,53,0.12)", border: "1px solid var(--accent2)", borderRadius: "var(--rad)", padding: "8px 12px", marginBottom: 10, fontSize: 13, color: "var(--accent2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Mode: <b>{extraType.toUpperCase()}</b> — Now tap runs</span>
            <button onClick={() => setExtraType(null)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 18, cursor: "pointer" }}>✕</button>
          </div>
        )}

        {/* run buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>
          {runBtns.map(r => (
            <button key={r} onClick={() => handleRun(r, extraType || "normal")} style={{ padding: "18px 0", background: r === 4 ? "rgba(255,215,0,0.12)" : r === 6 ? "rgba(57,255,20,0.12)" : "var(--bg3)", color: r === 4 ? "var(--gold)" : r === 6 ? "var(--accent3)" : "var(--text)", border: `2px solid ${r === 4 ? "var(--gold)" : r === 6 ? "var(--accent3)" : "var(--border)"}`, borderRadius: "var(--rad2)", fontFamily: "'Orbitron',sans-serif", fontWeight: 900, fontSize: r === 6 ? 28 : 22, cursor: "pointer", transition: "all 0.15s" }}>
              {r === 0 ? "•" : r}
            </button>
          ))}
        </div>

        {/* extras */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          {extraBtns.map(e => (
            <button key={e} onClick={() => setExtraType(prev => prev === extraMap[e] ? null : extraMap[e])} style={{ padding: "12px 0", background: extraType === extraMap[e] ? "rgba(255,107,53,0.2)" : "var(--bg3)", color: extraType === extraMap[e] ? "var(--accent2)" : "var(--muted)", border: `1px solid ${extraType === extraMap[e] ? "var(--accent2)" : "var(--border)"}`, borderRadius: "var(--rad)", fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 15, letterSpacing: 1, cursor: "pointer" }}>
              {e.toUpperCase()}
            </button>
          ))}
        </div>

        {/* action row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
          <button onClick={handleWicket} style={{ padding: "14px 0", background: "rgba(255,61,90,0.15)", color: "var(--danger)", border: "2px solid var(--danger)", borderRadius: "var(--rad2)", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, cursor: "pointer" }}>
            🔴 OUT
          </button>
          <button onClick={onUndo} style={{ padding: "14px 0", background: "var(--bg3)", color: "var(--muted)", border: "1px solid var(--border)", borderRadius: "var(--rad2)", fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            ↩ UNDO
          </button>
          <button onClick={onEndInnings} style={{ padding: "14px 0", background: "var(--bg3)", color: "var(--muted)", border: "1px solid var(--border)", borderRadius: "var(--rad2)", fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: "pointer" }}>
            END INN
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── WICKET DIALOG ──────────────────────────────────────────────────────────────
function WicketDialog({ batters, bowlers, onConfirm, onCancel }) {
  const [outBatter, setOutBatter] = useState(0);
  const [newBatter, setNewBatter] = useState(null);
  const [dismissal, setDismissal] = useState("Bowled");
  const dismissals = ["Bowled", "Caught", "LBW", "Run Out", "Stumped", "Hit Wicket", "Obstructing Field", "Timed Out"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
      <div style={{ background: "var(--card)", border: "1px solid var(--danger)", borderRadius: "var(--rad2)", padding: 20, width: "100%", maxWidth: 380, animation: "fadeInUp 0.3s ease" }}>
        <div style={{ fontFamily: "'Orbitron',sans-serif", color: "var(--danger)", fontSize: 16, marginBottom: 16, letterSpacing: 2 }}>🔴 WICKET</div>
        <Label>Out Batter</Label>
        <select value={outBatter} onChange={e => setOutBatter(Number(e.target.value))} style={selectStyle}>
          {batters.map((b, i) => <option key={i} value={i}>{b.name}</option>)}
        </select>
        <Label style={{ marginTop: 10 }}>Dismissal Type</Label>
        <select value={dismissal} onChange={e => setDismissal(e.target.value)} style={selectStyle}>
          {dismissals.map(d => <option key={d}>{d}</option>)}
        </select>
        <Label style={{ marginTop: 10 }}>New Batter</Label>
        <select value={newBatter ?? ""} onChange={e => setNewBatter(e.target.value)} style={selectStyle}>
          <option value="">-- Select --</option>
          {bowlers.map((p, i) => <option key={i} value={p.name}>{p.name}</option>)}
        </select>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 10, background: "var(--bg3)", color: "var(--muted)", border: "1px solid var(--border)", borderRadius: "var(--rad)", fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => onConfirm({ outIdx: outBatter, dismissal, newBatter })} style={{ flex: 1, padding: 10, background: "var(--danger)", color: "#fff", border: "none", borderRadius: "var(--rad)", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>CONFIRM</button>
        </div>
      </div>
    </div>
  );
}

// ─── OVER END / BOWLER SELECT ──────────────────────────────────────────────────
function BowlerSelectDialog({ players, currentBowler, onSelect }) {
  const [sel, setSel] = useState(null);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
      <div style={{ background: "var(--card)", border: "1px solid var(--accent2)", borderRadius: "var(--rad2)", padding: 20, width: "100%", maxWidth: 340 }}>
        <div style={{ fontFamily: "'Orbitron',sans-serif", color: "var(--accent2)", fontSize: 14, marginBottom: 14, letterSpacing: 2 }}>SELECT NEXT BOWLER</div>
        {players.filter(p => p.name !== currentBowler).map((p, i) => (
          <div key={i} onClick={() => setSel(p.name)} style={{ padding: "10px 12px", marginBottom: 6, background: sel === p.name ? "rgba(255,107,53,0.15)" : "var(--bg3)", border: `1px solid ${sel === p.name ? "var(--accent2)" : "var(--border)"}`, borderRadius: "var(--rad)", cursor: "pointer", fontFamily: "'Barlow Condensed'", fontSize: 15, color: sel === p.name ? "var(--accent2)" : "var(--text)" }}>
            {p.name} &nbsp;<span style={{ color: "var(--muted)", fontSize: 12 }}>{p.overs || 0} ov · {p.wickets || 0}/{p.runs || 0}</span>
          </div>
        ))}
        <button onClick={() => sel && onSelect(sel)} disabled={!sel} style={{ width: "100%", marginTop: 8, padding: 10, background: sel ? "var(--accent2)" : "var(--bg3)", color: sel ? "#fff" : "var(--muted)", border: "none", borderRadius: "var(--rad)", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: 13, cursor: sel ? "pointer" : "default" }}>BOWL THIS OVER</button>
      </div>
    </div>
  );
}

// ─── SCORECARD SCREEN ──────────────────────────────────────────────────────────
function ScorecardScreen({ match, onBack }) {
  const [tab, setTab] = useState(0);
  const teamNames = match.teams.map(t => t.name);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(135deg, #0a1520, #0d1f2e)", borderBottom: "1px solid var(--border)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 20, cursor: "pointer" }}>←</button>
        <div style={{ fontFamily: "'Orbitron',sans-serif", color: "var(--accent)", fontSize: 14, letterSpacing: 2 }}>SCORECARD</div>
      </div>

      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)" }}>
        {teamNames.map((n, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ flex: 1, padding: "10px 0", background: tab === i ? "var(--bg3)" : "transparent", color: tab === i ? "var(--accent)" : "var(--muted)", border: "none", borderBottom: tab === i ? "2px solid var(--accent)" : "2px solid transparent", fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: 1 }}>{n}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {/* team summary */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--rad2)", padding: 14, marginBottom: 14 }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", color: "var(--accent)", fontSize: 20, marginBottom: 4 }}>
            {match.teams[tab].score}/{match.teams[tab].wickets}
          </div>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            Overs: {over(match.teams[tab].balls)} &nbsp;·&nbsp; RR: {match.teams[tab].balls > 0 ? ((match.teams[tab].score / match.teams[tab].balls) * 6).toFixed(2) : "0.00"}
          </div>
          <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
            Extras: {Object.values(match.teams[tab].extras).reduce((a, b) => a + b, 0)} (W:{match.teams[tab].extras.wide || 0} NB:{match.teams[tab].extras.noBall || 0} B:{match.teams[tab].extras.bye || 0} LB:{match.teams[tab].extras.legBye || 0})
          </div>
        </div>

        {/* batting table */}
        <div style={{ marginBottom: 14 }}>
          <SectionHead>BATTING</SectionHead>
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--rad)", overflow: "hidden" }}>
            <TableRow header cells={["BATTER", "R", "B", "4s", "6s", "SR"]} />
            {match.teams[tab].players.map((p, i) => (
              <TableRow key={i} cells={[
                <span key="n">{p.name} {p.dismissed ? <span style={{ color: "var(--muted)", fontSize: 10 }}>c/b {p.dismissal}</span> : <span style={{ color: "var(--accent3)", fontSize: 10 }}>*</span>}</span>,
                p.runs || 0, p.balls || 0, p.fours || 0, p.sixes || 0,
                p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(0) : "-"
              ]} />
            ))}
          </div>
        </div>

        {/* bowling table */}
        <div>
          <SectionHead>BOWLING</SectionHead>
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--rad)", overflow: "hidden" }}>
            <TableRow header cells={["BOWLER", "O", "M", "R", "W", "ECO"]} />
            {match.teams[1 - tab].players.filter(p => p.overs > 0 || p.ballsBowled > 0).map((p, i) => (
              <TableRow key={i} cells={[
                p.name, over(p.ballsBowled || 0), p.maidens || 0, p.runs || 0, p.wickets || 0,
                p.ballsBowled > 0 ? ((p.runs / p.ballsBowled) * 6).toFixed(2) : "-"
              ]} />
            ))}
          </div>
        </div>

        {/* fall of wickets */}
        {match.teams[tab].fow?.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <SectionHead>FALL OF WICKETS</SectionHead>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {match.teams[tab].fow.map((f, i) => (
                <div key={i} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--rad)", padding: "4px 8px", fontSize: 12, color: "var(--muted)" }}>
                  {i + 1}-{f.score} ({f.name}, {f.over} ov)
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── RESULT SCREEN ─────────────────────────────────────────────────────────────
function ResultScreen({ match, onNewMatch }) {
  const [t0, t1] = match.teams;
  let result = "";
  if (t0.score > t1.score) result = `${t0.name} won by ${t0.score - t1.score} runs!`;
  else if (t1.score > t0.score) result = `${t1.name} won by ${10 - t1.wickets} wickets!`;
  else result = "Match Tied!";

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at center, #0d2030 0%, #080c10 70%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ textAlign: "center", animation: "fadeInUp 0.6s ease" }}>
        <div style={{ fontSize: 60, marginBottom: 10 }}>🏆</div>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, color: "var(--gold)", marginBottom: 8 }} className="glow-o">{result}</div>
        <div style={{ color: "var(--muted)", marginBottom: 24, fontSize: 14 }}>
          {t0.name}: {t0.score}/{t0.wickets} ({over(t0.balls)} ov) &nbsp;|&nbsp; {t1.name}: {t1.score}/{t1.wickets} ({over(t1.balls)} ov)
        </div>
        <button onClick={onNewMatch} style={{ padding: "14px 32px", background: "linear-gradient(135deg, var(--accent), #0099bb)", color: "#000", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: 2, border: "none", borderRadius: "var(--rad)", cursor: "pointer" }}>NEW MATCH</button>
      </div>
    </div>
  );
}

// ─── SHARED COMPONENTS ─────────────────────────────────────────────────────────
function Card({ title, children, style }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--rad2)", padding: 16, ...style }}>
      {title && <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 2, fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>{title}</div>}
      {children}
    </div>
  );
}
function Label({ children, style }) {
  return <div style={{ fontSize: 12, color: "var(--muted)", letterSpacing: 1, marginBottom: 5, ...style }}>{children}</div>;
}
function Input({ value, onChange, placeholder }) {
  return <input value={value} onChange={onChange} placeholder={placeholder} style={{ width: "100%", padding: "9px 12px", background: "var(--bg3)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "var(--rad)", fontFamily: "'Barlow Condensed'", fontSize: 15, outline: "none" }} />;
}
const selectStyle = { width: "100%", padding: "9px 12px", background: "var(--bg3)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "var(--rad)", fontFamily: "'Barlow Condensed'", fontSize: 15, marginTop: 2 };

function BallDot({ ball }) {
  const c = ball.type === "wide" || ball.type === "noBall" ? "var(--accent2)" : ball.type === "wicket" ? "var(--danger)" : ball.runs === 4 ? "var(--gold)" : ball.runs === 6 ? "var(--accent3)" : ball.runs === 0 ? "var(--muted)" : "var(--accent)";
  const label = ball.type === "wide" ? "Wd" : ball.type === "noBall" ? "NB" : ball.type === "wicket" ? "W" : ball.runs;
  return (
    <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${c}`, background: `${c}22`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Orbitron',sans-serif", fontSize: 9, fontWeight: 700, color: c }}>
      {label}
    </div>
  );
}

function PlayerChip({ label, name, stat, color }) {
  return (
    <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: `1px solid ${color}33`, borderRadius: "var(--rad)", padding: "5px 8px" }}>
      <div style={{ fontSize: 9, color: color, letterSpacing: 1, fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 13, color: "var(--text)", fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>{stat}</div>
    </div>
  );
}

function SectionHead({ children }) {
  return <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 2, fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>{children}</div>;
}

function TableRow({ cells, header }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", padding: "8px 12px", borderBottom: "1px solid var(--border)", background: header ? "var(--bg2)" : "transparent", alignItems: "center" }}>
      {cells.map((c, i) => (
        <div key={i} style={{ fontFamily: "'Barlow Condensed'", fontSize: header ? 11 : 13, fontWeight: header ? 700 : 400, color: header ? "var(--muted)" : i === 0 ? "var(--text)" : "var(--muted)", letterSpacing: header ? 1 : 0, textAlign: i > 0 ? "center" : "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c}</div>
      ))}
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("setup"); // setup | camera | scoring | scorecard | result
  const [match, setMatch] = useState(null);
  const [showWicket, setShowWicket] = useState(false);
  const [showBowlerSelect, setShowBowlerSelect] = useState(false);

  const startMatch = useCallback(({ team1name, team2name, overs, players1, players2 }) => {
    const mkPlayers = (names) => names.map(n => ({ name: n, runs: 0, balls: 0, fours: 0, sixes: 0, dismissed: false, dismissal: "", ballsBowled: 0, overs: 0, wickets: 0, maidens: 0, runsConceded: 0 }));
    const t0 = { ...initTeam(team1name), players: mkPlayers(players1), fow: [] };
    const t1 = { ...initTeam(team2name), players: mkPlayers(players2), fow: [] };
    setMatch({
      teams: [t0, t1], overs,
      batting: 0, bowling: 1,
      inning: 0,
      striker: { ...mkPlayers([players1[0]])[0] },
      nonStriker: { ...mkPlayers([players1[1]])[0] },
      strikerIdx: 0, nonStrikerIdx: 1, nextBatterIdx: 2,
      currentBowler: { ...mkPlayers([players2[0]])[0] },
      currentBowlerIdx: 0,
      history: [],
      zones: [],
    });
    setScreen("camera");
  }, []);

  const handleBall = useCallback((runs, type) => {
    setMatch(m => {
      const nm = JSON.parse(JSON.stringify(m));
      const bt = nm.teams[nm.batting];
      const bw = nm.teams[nm.bowling];
      const striker = nm.striker;
      const bowler = nm.currentBowler;

      const isExtra = type === "wide" || type === "noBall";
      const isLegal = !isExtra;

      // runs
      bt.score += runs + (isExtra ? 1 : 0);
      if (isExtra) bt.extras[type] = (bt.extras[type] || 0) + 1 + (runs > 0 ? runs : 0);

      // striker stats
      if (isLegal || type === "bye" || type === "legBye") { striker.balls++; bt.balls++; bowler.ballsBowled++; }
      if (type === "normal" || type === "camera") {
        striker.runs += runs;
        if (runs === 4) striker.fours++;
        if (runs === 6) striker.sixes++;
      }

      // bowler concedes
      bowler.runs += runs + (isExtra ? 1 : 0);
      // sync back
      nm.striker = striker;
      nm.currentBowler = bowler;
      // sync to team arrays
      bt.players[nm.strikerIdx] = { ...bt.players[nm.strikerIdx], runs: striker.runs, balls: striker.balls, fours: striker.fours, sixes: striker.sixes };
      bw.players[nm.currentBowlerIdx] = { ...bw.players[nm.currentBowlerIdx], runs: bowler.runs, ballsBowled: bowler.ballsBowled };

      // strike rotation
      if (isLegal && (runs % 2 === 1)) {
        const tmp = nm.striker; nm.striker = nm.nonStriker; nm.nonStriker = tmp;
        const tmpI = nm.strikerIdx; nm.strikerIdx = nm.nonStrikerIdx; nm.nonStrikerIdx = tmpI;
      }

      // over end
      const overBalls = bt.balls % 6;
      if (isLegal && overBalls === 0 && bt.balls > 0) {
        // swap strike
        const tmp2 = nm.striker; nm.striker = nm.nonStriker; nm.nonStriker = tmp2;
        const tmpI2 = nm.strikerIdx; nm.strikerIdx = nm.nonStrikerIdx; nm.nonStrikerIdx = tmpI2;
        bt.overs.push([]);
        nm.needBowler = true;
      } else {
        if (!bt.overs.length) bt.overs.push([]);
        bt.overs[bt.overs.length - 1].push({ runs, type });
      }

      // history for undo
      nm.history.push({ bt: JSON.parse(JSON.stringify(bt)), striker: JSON.parse(JSON.stringify(striker)), bowler: JSON.parse(JSON.stringify(bowler)) });

      return nm;
    });
  }, []);

  const handleWicket = () => setShowWicket(true);

  const confirmWicket = ({ outIdx, dismissal, newBatter }) => {
    setShowWicket(false);
    setMatch(m => {
      const nm = JSON.parse(JSON.stringify(m));
      const bt = nm.teams[nm.batting];
      bt.wickets++;
      bt.balls++;
      bt.overs[bt.overs.length - 1]?.push({ runs: 0, type: "wicket" });
      // mark dismissed
      bt.players[nm.strikerIdx].dismissed = true;
      bt.players[nm.strikerIdx].dismissal = dismissal;
      bt.fow.push({ score: bt.score, name: bt.players[nm.strikerIdx].name, over: over(bt.balls) });
      // bowler wicket
      nm.currentBowler.wickets = (nm.currentBowler.wickets || 0) + 1;
      nm.teams[nm.bowling].players[nm.currentBowlerIdx].wickets = nm.currentBowler.wickets;
      // new batter
      if (newBatter) {
        const idx = bt.players.findIndex(p => p.name === newBatter);
        nm.strikerIdx = idx >= 0 ? idx : nm.nextBatterIdx;
        nm.striker = { ...bt.players[nm.strikerIdx] };
        nm.nextBatterIdx++;
      }
      // check innings end
      if (bt.wickets >= 10 || bt.balls >= nm.overs * 6) nm.needInningsEnd = true;
      return nm;
    });
  };

  const handleUndo = () => {
    setMatch(m => {
      if (!m.history.length) return m;
      const nm = JSON.parse(JSON.stringify(m));
      nm.history.pop();
      // simple undo — just decrement last ball (full undo state would be more complex)
      const bt = nm.teams[nm.batting];
      const last = bt.overs[bt.overs.length - 1];
      if (last?.length) {
        const ball = last.pop();
        if (ball.type !== "wide" && ball.type !== "noBall") { bt.balls = Math.max(0, bt.balls - 1); }
        bt.score = Math.max(0, bt.score - ball.runs);
      }
      return nm;
    });
  };

  const handleEndInnings = () => {
    setMatch(m => {
      const nm = JSON.parse(JSON.stringify(m));
      if (nm.inning === 0) {
        nm.inning = 1;
        nm.batting = 1; nm.bowling = 0;
        const p2 = nm.teams[1].players;
        nm.striker = { ...p2[0] }; nm.strikerIdx = 0;
        nm.nonStriker = { ...p2[1] }; nm.nonStrikerIdx = 1;
        nm.nextBatterIdx = 2;
        nm.currentBowler = { ...nm.teams[0].players[0] }; nm.currentBowlerIdx = 0;
        nm.needBowler = false;
        return nm;
      }
      nm.ended = true;
      return nm;
    });
    if (match?.inning === 1) setScreen("result");
  };

  const confirmBowler = (name) => {
    setMatch(m => {
      const nm = JSON.parse(JSON.stringify(m));
      const bwTeam = nm.teams[nm.bowling];
      const idx = bwTeam.players.findIndex(p => p.name === name);
      if (idx >= 0) { nm.currentBowler = { ...bwTeam.players[idx] }; nm.currentBowlerIdx = idx; }
      nm.needBowler = false;
      return nm;
    });
    setShowBowlerSelect(false);
  };

  useEffect(() => {
    if (match?.needBowler && !showBowlerSelect) setShowBowlerSelect(true);
    if (match?.needInningsEnd) handleEndInnings();
  }, [match?.needBowler, match?.needInningsEnd]);

  // check innings end automatically
  useEffect(() => {
    if (!match) return;
    const bt = match.teams[match.batting];
    if (bt.wickets >= 10 || bt.balls >= match.overs * 6) {
      if (match.inning === 0) handleEndInnings();
      else setScreen("result");
    }
  }, [match?.teams?.[0]?.balls, match?.teams?.[1]?.balls, match?.teams?.[0]?.wickets, match?.teams?.[1]?.wickets]);

  return (
    <>
      <FontLink />
      {screen === "setup" && <SetupScreen onStart={startMatch} />}
      {screen === "camera" && (
        <CameraSetup
          onDone={zones => { setMatch(m => ({ ...m, zones })); setScreen("scoring"); }}
          onSkip={() => setScreen("scoring")}
        />
      )}
      {screen === "scoring" && match && (
        <>
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "var(--bg2)" }}>
            <NavBtn active={true} label="SCORE" />
            <NavBtn onClick={() => setScreen("scorecard")} label="CARD" />
          </div>
          <ScoringScreen match={match} onBall={handleBall} onWicket={handleWicket} onUndo={handleUndo} onEndInnings={handleEndInnings} />
          {showWicket && (
            <WicketDialog
              batters={[match.striker, match.nonStriker]}
              bowlers={match.teams[match.batting].players.filter((_, i) => i !== match.strikerIdx && i !== match.nonStrikerIdx && !match.teams[match.batting].players[i]?.dismissed)}
              onConfirm={confirmWicket}
              onCancel={() => setShowWicket(false)}
            />
          )}
          {showBowlerSelect && (
            <BowlerSelectDialog
              players={match.teams[match.bowling].players}
              currentBowler={match.currentBowler?.name}
              onSelect={confirmBowler}
            />
          )}
        </>
      )}
      {screen === "scorecard" && match && <ScorecardScreen match={match} onBack={() => setScreen("scoring")} />}
      {screen === "result" && match && <ResultScreen match={match} onNewMatch={() => setScreen("setup")} />}
    </>
  );
}

function NavBtn({ label, onClick, active }) {
  return (
    <button onClick={onClick} style={{ flex: 1, padding: "10px 0", background: "transparent", color: active ? "var(--accent)" : "var(--muted)", border: "none", borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent", fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 13, letterSpacing: 2, cursor: "pointer" }}>{label}</button>
  );
}
