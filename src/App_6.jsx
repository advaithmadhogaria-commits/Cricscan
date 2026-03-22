import { useState, useRef, useEffect, useCallback } from "react";
import { auth, signInWithGoogle, signInWithEmail, registerWithEmail, logOut, onAuthChange, saveLiveMatch, getLiveMatch, clearLiveMatch, saveMatch, getMatchHistory, deleteMatch } from "./firebase";

const FontLink = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Barlow+Condensed:wght@300;400;500;600;700&family=Orbitron:wght@700;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg:#080c10; --bg2:#0e1318; --bg3:#151c24; --card:#111820; --border:#1e2d3d;
      --accent:#00e5ff; --accent2:#ff6b35; --accent3:#39ff14; --gold:#ffd700;
      --text:#e8f4f8; --muted:#4a6278; --danger:#ff3d5a; --rad:6px; --rad2:12px;
    }
    body { background:var(--bg); color:var(--text); font-family:"Barlow Condensed",sans-serif; overflow-x:hidden; }
    ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:var(--bg2)} ::-webkit-scrollbar-thumb{background:var(--accent);border-radius:2px}
    .glow{text-shadow:0 0 18px var(--accent),0 0 40px var(--accent)}
    .glow-o{text-shadow:0 0 14px var(--accent2)}
    @keyframes fadeInUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse-border{0%,100%{box-shadow:0 0 0 0 rgba(0,229,255,0.4)}50%{box-shadow:0 0 0 6px rgba(0,229,255,0)}}
    @keyframes bounce-in{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.15);opacity:1}100%{transform:scale(1)}}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
    .blink{animation:blink 1s infinite}
    .bounce-in{animation:bounce-in 0.4s ease forwards}
    input,select{outline:none}
    .pill-btn{padding:7px 14px;border-radius:20px;border:1px solid var(--border);background:var(--bg3);color:var(--muted);font-family:"Barlow Condensed";font-weight:700;font-size:13px;cursor:pointer;letter-spacing:1px;transition:all 0.15s}
    .pill-btn.active{background:var(--accent);color:#000;border-color:var(--accent)}
  `}</style>
);

const overStr = b => `${Math.floor(b/6)}.${b%6}`;
const calcRR = (score,balls) => balls>0?((score/balls)*6).toFixed(2):"0.00";
const calcRRR = (target,score,ballsLeft) => ballsLeft<=0?"—":(((target-score)/ballsLeft)*6).toFixed(2);

function mkPlayer(name){ return {name,runs:0,balls:0,fours:0,sixes:0,dismissed:false,dismissal:"",catchBy:"",ballsBowled:0,runsConceded:0,wickets:0,maidens:0,catches:0,runOuts:0,stumpings:0}; }
function mkTeam(name,playerNames){ return {name,players:playerNames.map(mkPlayer),score:0,wickets:0,balls:0,extras:{wide:0,noBall:0,bye:0,legBye:0},overs:[],fow:[],commentary:[]}; }

// ── Shared UI ─────────────────────────────────────────────────────────────────
const Card = ({title,children,style={}}) => (
  <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--rad2)",padding:16,...style}}>
    {title&&<div style={{fontFamily:"Barlow Condensed",fontWeight:700,letterSpacing:2,fontSize:11,color:"var(--muted)",marginBottom:10}}>{title}</div>}
    {children}
  </div>
);
const Label = ({children,style={}}) => <div style={{fontSize:11,color:"var(--muted)",letterSpacing:1,marginBottom:4,...style}}>{children}</div>;
const NavBtn = ({label,onClick,active}) => (
  <button onClick={onClick} style={{flex:1,padding:"10px 0",background:"transparent",color:active?"var(--accent)":"var(--muted)",border:"none",borderBottom:active?"2px solid var(--accent)":"2px solid transparent",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:12,letterSpacing:1,cursor:"pointer"}}>{label}</button>
);
const SectionHead = ({children}) => <div style={{fontFamily:"Barlow Condensed",fontWeight:700,letterSpacing:2,fontSize:11,color:"var(--muted)",marginBottom:5}}>{children}</div>;
const TableRow = ({cells,header}) => (
  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr",padding:"7px 10px",borderBottom:"1px solid var(--border)",background:header?"var(--bg2)":"transparent",alignItems:"center"}}>
    {cells.map((c,i)=><div key={i} style={{fontFamily:"Barlow Condensed",fontSize:header?10:13,fontWeight:header?700:400,color:header?"var(--muted)":i===0?"var(--text)":"var(--muted)",textAlign:i>0?"center":"left",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c}</div>)}
  </div>
);
function BallDot({ball}){
  const c=ball.type==="wide"||ball.type==="noBall"?"var(--accent2)":ball.type==="wicket"?"var(--danger)":ball.runs===4?"var(--gold)":ball.runs===6?"var(--accent3)":ball.runs===0?"var(--muted)":"var(--accent)";
  const label=ball.type==="wide"?"Wd":ball.type==="noBall"?"NB":ball.type==="wicket"?"W":ball.runs;
  return <div style={{width:26,height:26,borderRadius:"50%",border:`2px solid ${c}`,background:`${c}22`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Orbitron",fontSize:8,fontWeight:700,color:c,flexShrink:0}}>{label}</div>;
}
function AwardCard({icon,title,name,stat,color}){
  return (
    <div style={{background:"var(--bg3)",border:`1px solid ${color}33`,borderRadius:"var(--rad)",padding:"10px 12px"}}>
      <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
      <div style={{fontSize:10,color:"var(--muted)",letterSpacing:1,fontWeight:700,marginBottom:2}}>{title}</div>
      <div style={{fontSize:14,color:"var(--text)",fontFamily:"Rajdhani",fontWeight:700}}>{name||"—"}</div>
      <div style={{fontSize:11,color}}>{stat}</div>
    </div>
  );
}

// ── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({onLogin}){
  const [mode,setMode]=useState("login"); // login | register
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [confirmPass,setConfirmPass]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  const handleEmail=async()=>{
    setError(""); setLoading(true);
    try{
      if(mode==="register"){
        if(pass!==confirmPass){setError("Passwords don't match");setLoading(false);return;}
        if(pass.length<6){setError("Password must be at least 6 characters");setLoading(false);return;}
        await registerWithEmail(email,pass);
      } else {
        await signInWithEmail(email,pass);
      }
      onLogin();
    } catch(e){
      const msg=e.code==="auth/user-not-found"?"No account found with this email":
                e.code==="auth/wrong-password"?"Incorrect password":
                e.code==="auth/email-already-in-use"?"Email already registered":
                e.code==="auth/invalid-email"?"Invalid email address":
                e.message||"Something went wrong";
      setError(msg);
    }
    setLoading(false);
  };

  const handleGoogle=async()=>{
    setError(""); setLoading(true);
    try{ await signInWithGoogle(); onLogin(); }
    catch(e){ setError("Google sign-in failed. Try again."); }
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at center,#0d1f30 0%,#080c10 70%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px"}}>
      <div style={{width:"100%",maxWidth:380,animation:"fadeInUp 0.5s ease"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:48,marginBottom:8}}>🏏</div>
          <div style={{fontFamily:"Orbitron",fontSize:22,color:"var(--accent)",letterSpacing:3}} className="glow">CRICSCAN</div>
          <div style={{color:"var(--muted)",fontSize:12,marginTop:4,letterSpacing:2}}>{mode==="register"?"CREATE ACCOUNT":"SIGN IN TO CONTINUE"}</div>
        </div>

        {/* Google button */}
        <button onClick={handleGoogle} disabled={loading} style={{width:"100%",padding:"13px 0",background:"#fff",color:"#333",border:"none",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:15,cursor:loading?"not-allowed":"pointer",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"center",gap:10,opacity:loading?0.7:1}}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{flex:1,height:1,background:"var(--border)"}}/>
          <span style={{color:"var(--muted)",fontSize:12,fontFamily:"Barlow Condensed"}}>OR</span>
          <div style={{flex:1,height:1,background:"var(--border)"}}/>
        </div>

        {/* Email/Pass form */}
        <div style={{marginBottom:10}}>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address"
            style={{width:"100%",padding:"12px 14px",background:"var(--bg3)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontSize:15,marginBottom:8}} />
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password"
            style={{width:"100%",padding:"12px 14px",background:"var(--bg3)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontSize:15,marginBottom:mode==="register"?8:0}} />
          {mode==="register"&&<input type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="Confirm Password"
            style={{width:"100%",padding:"12px 14px",background:"var(--bg3)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontSize:15}} />}
        </div>

        {error&&<div style={{color:"var(--danger)",fontSize:13,fontFamily:"Barlow Condensed",marginBottom:10,padding:"8px 12px",background:"rgba(255,61,90,0.1)",borderRadius:"var(--rad)",border:"1px solid rgba(255,61,90,0.3)"}}>{error}</div>}

        <button onClick={handleEmail} disabled={loading||!email||!pass} style={{width:"100%",padding:"13px 0",background:email&&pass?"linear-gradient(135deg,var(--accent),#0099bb)":"var(--bg3)",color:email&&pass?"#000":"var(--muted)",border:"none",borderRadius:"var(--rad)",fontFamily:"Orbitron",fontWeight:700,fontSize:13,letterSpacing:2,cursor:email&&pass?"pointer":"default",marginBottom:16,opacity:loading?0.7:1}}>
          {loading?"LOADING...":(mode==="register"?"CREATE ACCOUNT →":"SIGN IN →")}
        </button>

        <div style={{textAlign:"center",color:"var(--muted)",fontSize:13,fontFamily:"Barlow Condensed"}}>
          {mode==="login"?"Don't have an account? ":"Already have an account? "}
          <span onClick={()=>{setMode(mode==="login"?"register":"login");setError("");}} style={{color:"var(--accent)",cursor:"pointer",fontWeight:700}}>
            {mode==="login"?"Register":"Sign In"}
          </span>
        </div>
      </div>
    </div>
  );
}


// ── SPLASH SCREEN ────────────────────────────────────────────────────────────
function SplashScreen({onStart,onSignOut,user}){
  const [visible,setVisible]=useState(false);
  useEffect(()=>{setTimeout(()=>setVisible(true),100);},[]);
  return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at center,#0d1f30 0%,#080c10 60%,#040608 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,position:"relative",overflow:"hidden"}}>
      {/* background glow orbs */}
      <div style={{position:"absolute",width:300,height:300,borderRadius:"50%",background:"rgba(0,229,255,0.04)",top:"10%",left:"50%",transform:"translateX(-50%)",filter:"blur(60px)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",width:200,height:200,borderRadius:"50%",background:"rgba(255,107,53,0.05)",bottom:"20%",right:"10%",filter:"blur(40px)",pointerEvents:"none"}}/>

      <div style={{textAlign:"center",opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(30px)",transition:"all 0.8s ease"}}>
        {/* Cricket bat icon */}
        <div style={{fontSize:72,marginBottom:16,filter:"drop-shadow(0 0 20px rgba(0,229,255,0.4))"}}>🏏</div>

        {/* CRICSCAN title */}
        <div style={{fontFamily:"Orbitron",fontSize:38,fontWeight:900,letterSpacing:6,color:"var(--accent)",marginBottom:6,textShadow:"0 0 30px rgba(0,229,255,0.6),0 0 60px rgba(0,229,255,0.3)"}}>CRICSCAN</div>

        {/* Tagline */}
        <div style={{fontFamily:"Barlow Condensed",fontSize:14,letterSpacing:4,color:"var(--muted)",marginBottom:6,textTransform:"uppercase"}}>AI Powered Cricket Scorer</div>

        {/* Divider */}
        <div style={{width:60,height:2,background:"linear-gradient(90deg,transparent,var(--accent),transparent)",margin:"16px auto 20px"}}/>

        {/* Made by */}
        <div style={{fontFamily:"Barlow Condensed",fontSize:15,color:"var(--muted)",letterSpacing:2,marginBottom:48}}>
          Made by <span style={{color:"var(--text)",fontWeight:700,letterSpacing:1}}>Advaith Madhogaria</span>
        </div>

        {/* CTA Button */}
        <button onClick={onStart} style={{padding:"16px 44px",background:"linear-gradient(135deg,#ffd700,#ffaa00)",color:"#000",fontFamily:"Orbitron",fontWeight:900,fontSize:15,letterSpacing:3,border:"none",borderRadius:50,cursor:"pointer",boxShadow:"0 0 30px rgba(255,215,0,0.4),0 4px 20px rgba(0,0,0,0.4)",transform:"scale(1)",transition:"transform 0.15s,box-shadow 0.15s",animation:"pulse-border 2s infinite"}}
          onMouseEnter={e=>{e.target.style.transform="scale(1.05)";e.target.style.boxShadow="0 0 40px rgba(255,215,0,0.6),0 6px 24px rgba(0,0,0,0.5)";}}
          onMouseLeave={e=>{e.target.style.transform="scale(1)";e.target.style.boxShadow="0 0 30px rgba(255,215,0,0.4),0 4px 20px rgba(0,0,0,0.4)";}}>
          LET'S GET STARTED! ▶
        </button>

        {/* Version tag */}
        <div style={{marginTop:32,fontSize:11,color:"var(--border)",fontFamily:"Barlow Condensed",letterSpacing:2}}>v2.0 · CRICSCAN</div>
        {user&&<div style={{marginTop:12,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
          <div style={{fontSize:11,color:"var(--muted)",fontFamily:"Barlow Condensed"}}>{user.email}</div>
          <button onClick={onSignOut} style={{fontSize:11,color:"var(--danger)",background:"none",border:"1px solid rgba(255,61,90,0.3)",borderRadius:20,padding:"4px 14px",fontFamily:"Barlow Condensed",fontWeight:700,cursor:"pointer",letterSpacing:1}}>SIGN OUT</button>
        </div>}
      </div>
    </div>
  );
}

// ── SETUP SCREEN ──────────────────────────────────────────────────────────────
function SetupScreen({onStart}){
  const [step,setStep]=useState(0);
  const [team1,setTeam1]=useState("Team Alpha");
  const [team2,setTeam2]=useState("Team Bravo");
  const [overs,setOvers]=useState(10);
  const [format,setFormat]=useState("limited");
  const [ballType,setBallType]=useState("tennis");
  const [players1,setPlayers1]=useState(Array(11).fill("").map((_,i)=>`Player ${i+1}`));
  const [players2,setPlayers2]=useState(Array(11).fill("").map((_,i)=>`Player ${i+1}`));
  const [captain1,setCaptain1]=useState(0);
  const [captain2,setCaptain2]=useState(0);
  const [wk1,setWk1]=useState(6);
  const [wk2,setWk2]=useState(6);
  const [tossWinner,setTossWinner]=useState(0);
  const [tossChoice,setTossChoice]=useState("bat");
  const [tab,setTab]=useState(0);

  // Load saved data on mount
  useEffect(()=>{
    try{
      const saved=JSON.parse(localStorage.getItem("cricscan_teams")||"{}");
      if(saved.team1)setTeam1(saved.team1);
      if(saved.team2)setTeam2(saved.team2);
      if(saved.players1)setPlayers1(saved.players1);
      if(saved.players2)setPlayers2(saved.players2);
      if(saved.captain1!=null)setCaptain1(saved.captain1);
      if(saved.captain2!=null)setCaptain2(saved.captain2);
      if(saved.wk1!=null)setWk1(saved.wk1);
      if(saved.wk2!=null)setWk2(saved.wk2);
    }catch{}
  },[]);

  // Save data whenever it changes
  useEffect(()=>{
    try{
      localStorage.setItem("cricscan_teams",JSON.stringify({team1,team2,players1,players2,captain1,captain2,wk1,wk2}));
    }catch{}
  },[team1,team2,players1,players2,captain1,captain2,wk1,wk2]);

  const upd=(team,idx,val)=>{if(team===0){const a=[...players1];a[idx]=val;setPlayers1(a);}else{const a=[...players2];a[idx]=val;setPlayers2(a);}};
  const clearSaved=()=>{
    localStorage.removeItem("cricscan_teams");
    setTeam1("Team Alpha");setTeam2("Team Bravo");
    setPlayers1(Array(11).fill("").map((_,i)=>`Player ${i+1}`));
    setPlayers2(Array(11).fill("").map((_,i)=>`Player ${i+1}`));
    setCaptain1(0);setCaptain2(0);setWk1(6);setWk2(6);
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 16px",background:"radial-gradient(ellipse at top,#0d1f2d 0%,#080c10 70%)"}}>
      <div style={{width:"100%",maxWidth:460}}>
        <div style={{textAlign:"center",marginBottom:24,animation:"fadeInUp 0.6s ease"}}>
          <div style={{fontFamily:"Orbitron",fontSize:26,letterSpacing:3,color:"var(--accent)"}} className="glow">🏏 CRICSCAN</div>
          <div style={{color:"var(--muted)",fontSize:11,letterSpacing:2,marginTop:3}}>AI POWERED SCORER</div>
        </div>

        {/* Step indicator */}
        <div style={{display:"flex",gap:8,marginBottom:20,justifyContent:"center"}}>
          {["Match Info","Squads"].map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:step>=i?"var(--accent)":"var(--bg3)",border:`1px solid ${step>=i?"var(--accent)":"var(--border)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:step>=i?"#000":"var(--muted)",fontFamily:"Orbitron"}}>{i+1}</div>
              <span style={{fontSize:12,color:step===i?"var(--accent)":"var(--muted)",fontFamily:"Barlow Condensed",fontWeight:700,letterSpacing:1}}>{s}</span>
              {i<1&&<span style={{color:"var(--border)"}}>›</span>}
            </div>
          ))}
        </div>

        {step===0 && (
          <div style={{animation:"fadeInUp 0.3s ease"}}>
            <Card title="TEAM NAMES" style={{marginBottom:12}}>
              <Label>Team 1</Label>
              <input value={team1} onChange={e=>setTeam1(e.target.value)} style={{width:"100%",padding:"9px 12px",background:"var(--bg3)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontSize:15,marginBottom:10}} />
              <Label>Team 2</Label>
              <input value={team2} onChange={e=>setTeam2(e.target.value)} style={{width:"100%",padding:"9px 12px",background:"var(--bg3)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontSize:15}} />
            </Card>

            <Card title="MATCH FORMAT" style={{marginBottom:12}}>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                {[["limited","🏏 Limited Overs"],["test","📋 Test Match"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setFormat(v)} style={{flex:1,padding:"10px 0",background:format===v?"rgba(0,229,255,0.12)":"var(--bg3)",color:format===v?"var(--accent)":"var(--muted)",border:`2px solid ${format===v?"var(--accent)":"var(--border)"}`,borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:13,cursor:"pointer",letterSpacing:1}}>{l}</button>
                ))}
              </div>

              {format==="limited" && (
                <>
                  <Label>Number of Overs</Label>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:4}}>
                    {[5,10,20,50].map(o=>(<button key={o} onClick={()=>setOvers(o)} style={{flex:1,padding:"9px 0",background:overs===o?"var(--accent)":"var(--bg3)",color:overs===o?"#000":"var(--text)",border:`1px solid ${overs===o?"var(--accent)":"var(--border)"}`,borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:14,cursor:"pointer"}}>{o}</button>))}
                    <input type="number" value={overs} onChange={e=>setOvers(Number(e.target.value))} placeholder="Custom" style={{width:70,padding:"9px 8px",background:"var(--bg3)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontSize:14,textAlign:"center"}} />
                  </div>
                </>
              )}

              {format==="test" && (
                <div style={{padding:"10px 12px",background:"rgba(0,229,255,0.05)",borderRadius:"var(--rad)",border:"1px solid rgba(0,229,255,0.15)",fontSize:13,color:"var(--muted)"}}>
                  📋 4 innings · Unlimited overs · Stumps, Tea, Lunch & Rain breaks available
                </div>
              )}
            </Card>

            <Card title="BALL TYPE" style={{marginBottom:20}}>
              <div style={{display:"flex",gap:8}}>
                {[["tennis","🎾 Tennis"],["rubber","⚫ Rubber"],["hard","🔴 Hard Ball"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setBallType(v)} style={{flex:1,padding:"10px 0",background:ballType===v?"rgba(0,229,255,0.12)":"var(--bg3)",color:ballType===v?"var(--accent)":"var(--muted)",border:`2px solid ${ballType===v?"var(--accent)":"var(--border)"}`,borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:12,cursor:"pointer",letterSpacing:1}}>{l}</button>
                ))}
              </div>
            </Card>

            <button onClick={()=>setStep(1)} style={{width:"100%",padding:"13px 0",background:"linear-gradient(135deg,var(--accent),#0099bb)",color:"#000",fontFamily:"Orbitron",fontWeight:700,fontSize:13,letterSpacing:2,border:"none",borderRadius:"var(--rad)",cursor:"pointer"}}>
              NEXT: ADD PLAYERS →
            </button>
          </div>
        )}

        {step===1 && (
          <div style={{animation:"fadeInUp 0.3s ease"}}>
            <Card title="SQUAD SETUP" style={{marginBottom:12}}>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                {[team1,team2].map((t,i)=>(<button key={i} onClick={()=>setTab(i)} style={{flex:1,padding:"8px 0",background:tab===i?"var(--accent2)":"var(--bg3)",color:tab===i?"#fff":"var(--muted)",border:`1px solid ${tab===i?"var(--accent2)":"var(--border)"}`,borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:13,cursor:"pointer"}}>{t}</button>))}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {(tab===0?players1:players2).map((p,i)=>{
                  const isCap=tab===0?captain1===i:captain2===i;
                  const isWk=tab===0?wk1===i:wk2===i;
                  const setCap=tab===0?setCaptain1:setCaptain2;
                  const setWkFn=tab===0?setWk1:setWk2;
                  return (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{color:"var(--muted)",fontSize:10,minWidth:14,fontFamily:"Orbitron",textAlign:"center"}}>{i+1}</span>
                      <input value={p} onChange={e=>upd(tab,i,e.target.value)} style={{flex:1,padding:"6px 8px",background:"var(--bg3)",color:"var(--text)",border:`1px solid ${isCap||isWk?"var(--accent2)":"var(--border)"}`,borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontSize:13}} />
                      <button onClick={()=>setCap(i)} title="Set Captain" style={{width:28,height:28,background:isCap?"rgba(255,215,0,0.25)":"var(--bg3)",color:isCap?"var(--gold)":"var(--muted)",border:`1px solid ${isCap?"var(--gold)":"var(--border)"}`,borderRadius:"var(--rad)",fontSize:11,fontFamily:"Barlow Condensed",fontWeight:700,cursor:"pointer",flexShrink:0}}>C</button>
                      <button onClick={()=>setWkFn(i)} title="Set Wicketkeeper" style={{width:28,height:28,background:isWk?"rgba(0,229,255,0.2)":"var(--bg3)",color:isWk?"var(--accent)":"var(--muted)",border:`1px solid ${isWk?"var(--accent)":"var(--border)"}`,borderRadius:"var(--rad)",fontSize:9,fontFamily:"Barlow Condensed",fontWeight:700,cursor:"pointer",flexShrink:0}}>WK</button>
                    </div>
                  );
                })}
              </div>
              <div style={{marginTop:8,fontSize:11,color:"var(--muted)",fontFamily:"Barlow Condensed"}}>
                Tap <b style={{color:"var(--gold)"}}>C</b> to set Captain &nbsp;·&nbsp; <b style={{color:"var(--accent)"}}>WK</b> to set Wicketkeeper
              </div>
            </Card>

            <Card title="🪙 TOSS" style={{marginBottom:14}}>
              <div style={{fontSize:12,color:"var(--muted)",marginBottom:5,letterSpacing:1}}>WHO WON THE TOSS?</div>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                {[team1,team2].map((t,i)=>(<button key={i} onClick={()=>setTossWinner(i)} style={{flex:1,padding:"8px 0",background:tossWinner===i?"rgba(255,215,0,0.15)":"var(--bg3)",color:tossWinner===i?"var(--gold)":"var(--muted)",border:`1px solid ${tossWinner===i?"var(--gold)":"var(--border)"}`,borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:13,cursor:"pointer"}}>{t}</button>))}
              </div>
              <div style={{fontSize:12,color:"var(--muted)",marginBottom:5,letterSpacing:1}}>ELECTED TO?</div>
              <div style={{display:"flex",gap:8}}>
                {[["bat","🏏 Bat First"],["bowl","🎳 Bowl First"]].map(([v,l])=>(<button key={v} onClick={()=>setTossChoice(v)} style={{flex:1,padding:"9px 0",background:tossChoice===v?"rgba(57,255,20,0.1)":"var(--bg3)",color:tossChoice===v?"var(--accent3)":"var(--muted)",border:`1px solid ${tossChoice===v?"var(--accent3)":"var(--border)"}`,borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:13,cursor:"pointer"}}>{l}</button>))}
              </div>
            </Card>

            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <button onClick={()=>setStep(0)} style={{flex:1,padding:"13px 0",background:"var(--bg3)",color:"var(--muted)",border:"1px solid var(--border)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:14,cursor:"pointer"}}>← BACK</button>
              <button onClick={()=>onStart({team1,team2,overs:format==="test"?9999:overs,format,ballType,players1:players1.filter(Boolean),players2:players2.filter(Boolean),captain1,captain2,wk1,wk2,tossWinner,tossChoice})}
                style={{flex:2,padding:"13px 0",background:"linear-gradient(135deg,var(--accent),#0099bb)",color:"#000",fontFamily:"Orbitron",fontWeight:700,fontSize:13,letterSpacing:2,border:"none",borderRadius:"var(--rad)",cursor:"pointer",animation:"pulse-border 2s infinite"}}>
                START MATCH ▶
              </button>
            </div>
            <button onClick={clearSaved} style={{width:"100%",padding:"8px 0",background:"transparent",color:"rgba(255,61,90,0.5)",border:"1px solid rgba(255,61,90,0.2)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:12,letterSpacing:1,cursor:"pointer"}}>🗑 CLEAR SAVED DATA</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── CAMERA SETUP ──────────────────────────────────────────────────────────────
function CameraSetup({onDone,onSkip}){
  const videoRef=useRef(null);const canvasRef=useRef(null);
  const [zones,setZones]=useState([]);const [drawing,setDrawing]=useState(false);const [start,setStart]=useState(null);
  const [selRuns,setSelRuns]=useState(4);const [streaming,setStreaming]=useState(false);const [error,setError]=useState("");
  useEffect(()=>{
    navigator.mediaDevices?.getUserMedia({video:{facingMode:"environment"}}).then(s=>{if(videoRef.current){videoRef.current.srcObject=s;setStreaming(true);}}).catch(()=>setError("Camera access denied. Skip to use manual scoring only."));
    return ()=>videoRef.current?.srcObject?.getTracks().forEach(t=>t.stop());
  },[]);
  const getPos=(e,el)=>{const r=el.getBoundingClientRect();return{x:((e.touches?.[0]?.clientX??e.clientX)-r.left)/r.width,y:((e.touches?.[0]?.clientY??e.clientY)-r.top)/r.height};};
  const onDown=e=>{const p=getPos(e,canvasRef.current);setStart(p);setDrawing(true);};
  const onUp=e=>{if(!drawing||!start)return;const p=getPos(e,canvasRef.current);setZones(z=>[...z,{x:Math.min(start.x,p.x),y:Math.min(start.y,p.y),w:Math.abs(p.x-start.x),h:Math.abs(p.y-start.y),runs:selRuns}]);setDrawing(false);setStart(null);};
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column",padding:16}}>
      <div style={{fontFamily:"Orbitron",color:"var(--accent)",fontSize:14,marginBottom:6,letterSpacing:2}}>📷 AI CAMERA ZONES</div>
      <div style={{color:"var(--muted)",fontSize:12,marginBottom:10,lineHeight:1.5}}>Point your phone at the pitch from a fixed position. Draw zones and tag them with runs. AI will auto-score when ball lands in a zone.</div>
      {error&&<div style={{color:"var(--danger)",background:"#1a0a0a",padding:10,borderRadius:"var(--rad)",marginBottom:10,fontSize:12}}>{error}</div>}
      <div style={{display:"flex",gap:6,marginBottom:8}}>
        {[1,2,3,4,6].map(r=>(<button key={r} onClick={()=>setSelRuns(r)} style={{flex:1,padding:"7px 0",background:selRuns===r?"var(--accent2)":"var(--bg3)",color:selRuns===r?"#fff":"var(--muted)",border:`1px solid ${selRuns===r?"var(--accent2)":"var(--border)"}`,borderRadius:"var(--rad)",fontFamily:"Orbitron",fontWeight:700,fontSize:14,cursor:"pointer"}}>{r}</button>))}
      </div>
      <div style={{position:"relative",width:"100%",aspectRatio:"16/9",background:"#000",borderRadius:"var(--rad2)",overflow:"hidden",border:"1px solid var(--border)",marginBottom:8}}>
        <video ref={videoRef} autoPlay playsInline muted style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        <canvas ref={canvasRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",cursor:"crosshair"}} onMouseDown={onDown} onMouseUp={onUp} onTouchStart={onDown} onTouchEnd={onUp}/>
        {zones.map((z,i)=>(<div key={i} style={{position:"absolute",left:`${z.x*100}%`,top:`${z.y*100}%`,width:`${z.w*100}%`,height:`${z.h*100}%`,border:"2px solid var(--accent2)",background:"rgba(255,107,53,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"var(--accent2)",fontFamily:"Orbitron",fontSize:12,fontWeight:700,textShadow:"0 0 6px #000"}}>{z.runs}</span></div>))}
        {!streaming&&!error&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)",fontSize:13}}>Starting camera...</div>}
        <div style={{position:"absolute",top:6,left:8,background:"rgba(0,0,0,0.7)",borderRadius:4,padding:"2px 8px",fontSize:11,color:"var(--muted)"}}>Zones: {zones.length}</div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>setZones([])} style={{flex:1,padding:10,background:"var(--bg3)",color:"var(--muted)",border:"1px solid var(--border)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:13,cursor:"pointer"}}>Clear All</button>
        <button onClick={onSkip} style={{flex:1,padding:10,background:"var(--bg3)",color:"var(--muted)",border:"1px solid var(--border)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:13,cursor:"pointer"}}>Skip →</button>
        <button onClick={()=>onDone(zones)} style={{flex:2,padding:10,background:"var(--accent)",color:"#000",border:"none",borderRadius:"var(--rad)",fontFamily:"Orbitron",fontWeight:700,fontSize:12,cursor:"pointer",letterSpacing:1}}>SAVE & START ✓</button>
      </div>
    </div>
  );
}

// ── CAMERA TRACKER ────────────────────────────────────────────────────────────
function CameraTracker({zones,onDetect,active}){
  const videoRef=useRef(null);const canvasRef=useRef(null);const animRef=useRef(null);const prevRef=useRef(null);
  const [detected,setDetected]=useState(null);const [streaming,setStreaming]=useState(false);
  useEffect(()=>{
    if(!active)return;
    navigator.mediaDevices?.getUserMedia({video:{facingMode:"environment"}}).then(s=>{if(videoRef.current){videoRef.current.srcObject=s;setStreaming(true);}}).catch(()=>{});
    return ()=>{videoRef.current?.srcObject?.getTracks().forEach(t=>t.stop());cancelAnimationFrame(animRef.current);};
  },[active]);
  useEffect(()=>{
    if(!streaming||!active)return;
    const canvas=canvasRef.current;const ctx=canvas.getContext("2d");
    const analyze=()=>{
      if(!videoRef.current?.readyState>=2){animRef.current=requestAnimationFrame(analyze);return;}
      canvas.width=videoRef.current.videoWidth||320;canvas.height=videoRef.current.videoHeight||240;
      ctx.drawImage(videoRef.current,0,0);
      const frame=ctx.getImageData(0,0,canvas.width,canvas.height);
      if(prevRef.current){
        let sx=0,sy=0,count=0;
        for(let i=0;i<frame.data.length;i+=4){const d=Math.abs(frame.data[i]-prevRef.current[i])+Math.abs(frame.data[i+1]-prevRef.current[i+1])+Math.abs(frame.data[i+2]-prevRef.current[i+2]);if(d>80){const px=(i/4)%canvas.width;const py=Math.floor((i/4)/canvas.width);sx+=px;sy+=py;count++;}}
        if(count>200){const cx=sx/count/canvas.width;const cy=sy/count/canvas.height;for(const z of zones){if(cx>=z.x&&cx<=z.x+z.w&&cy>=z.y&&cy<=z.y+z.h){setDetected({runs:z.runs,cx,cy});onDetect(z.runs);break;}}}
        else setDetected(null);
      }
      prevRef.current=frame.data.slice();animRef.current=requestAnimationFrame(analyze);
    };
    animRef.current=requestAnimationFrame(analyze);
    return ()=>cancelAnimationFrame(animRef.current);
  },[streaming,active,zones]);
  if(!active)return null;
  return (
    <div style={{position:"relative",width:"100%",aspectRatio:"16/9",background:"#000",borderRadius:"var(--rad)",overflow:"hidden",border:"1px solid var(--border)",marginBottom:10}}>
      <video ref={videoRef} autoPlay playsInline muted style={{width:"100%",height:"100%",objectFit:"cover"}}/>
      <canvas ref={canvasRef} style={{display:"none"}}/>
      {zones.map((z,i)=>(<div key={i} style={{position:"absolute",left:`${z.x*100}%`,top:`${z.y*100}%`,width:`${z.w*100}%`,height:`${z.h*100}%`,border:"1px solid rgba(0,229,255,0.3)",background:"rgba(0,229,255,0.04)"}}><span style={{color:"rgba(0,229,255,0.6)",fontFamily:"Orbitron",fontSize:8}}>{z.runs}</span></div>))}
      {detected&&<div style={{position:"absolute",left:`${detected.cx*100}%`,top:`${detected.cy*100}%`,transform:"translate(-50%,-50%)",background:"var(--accent2)",borderRadius:"50%",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Orbitron",fontWeight:900,fontSize:14,color:"#fff",boxShadow:"0 0 20px var(--accent2)"}} className="bounce-in">{detected.runs}</div>}
      <div style={{position:"absolute",top:6,right:8,background:"rgba(255,61,90,0.9)",borderRadius:3,padding:"2px 7px",fontSize:9,fontFamily:"Orbitron",color:"#fff",letterSpacing:1}}><span className="blink">●</span> LIVE AI</div>
    </div>
  );
}

// ── BATTER CHANGE DIALOG ─────────────────────────────────────────────────────
function BatterChangeDialog({title,players,currentStrikerIdx,currentNonStrikerIdx,onConfirm,onCancel,showBowlerChange,bowlerPlayers,currentBowlerName}){
  const [strikerIdx,setStrikerIdx]=useState(currentStrikerIdx);
  const [nonStrikerIdx,setNonStrikerIdx]=useState(currentNonStrikerIdx);
  const [newBowler,setNewBowler]=useState(currentBowlerName||"");
  const available=players.filter((_,i)=>!players[i]?.dismissed);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}>
      <div style={{background:"var(--card)",border:"1px solid var(--accent)",borderRadius:"var(--rad2)",padding:20,width:"100%",maxWidth:380,animation:"fadeInUp 0.25s ease"}}>
        <div style={{fontFamily:"Orbitron",color:"var(--accent)",fontSize:12,letterSpacing:2,marginBottom:14}}>{title}</div>

        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,color:"var(--accent)",letterSpacing:1,fontFamily:"Barlow Condensed",fontWeight:700,marginBottom:5}}>⚡ STRIKER (ON STRIKE)</div>
          <select value={strikerIdx} onChange={e=>setStrikerIdx(Number(e.target.value))} style={{width:"100%",padding:"10px 12px",background:"var(--bg3)",color:"var(--text)",border:"1px solid var(--accent)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontSize:15}}>
            {players.map((p,i)=>(!p.dismissed||i===currentStrikerIdx)&&<option key={i} value={i}>{p.name}{p.isCaptain?" (C)":""}{p.isWK?" (WK)":""}</option>)}
          </select>
        </div>

        <div style={{marginBottom:showBowlerChange?12:16}}>
          <div style={{fontSize:11,color:"var(--muted)",letterSpacing:1,fontFamily:"Barlow Condensed",fontWeight:700,marginBottom:5}}>NON-STRIKER</div>
          <select value={nonStrikerIdx} onChange={e=>setNonStrikerIdx(Number(e.target.value))} style={{width:"100%",padding:"10px 12px",background:"var(--bg3)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontSize:15}}>
            {players.map((p,i)=>(!p.dismissed||i===currentNonStrikerIdx)&&<option key={i} value={i}>{p.name}{p.isCaptain?" (C)":""}{p.isWK?" (WK)":""}</option>)}
          </select>
        </div>

        {showBowlerChange&&(
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:"var(--accent2)",letterSpacing:1,fontFamily:"Barlow Condensed",fontWeight:700,marginBottom:5}}>🎳 BOWLER</div>
            <select value={newBowler} onChange={e=>setNewBowler(e.target.value)} style={{width:"100%",padding:"10px 12px",background:"var(--bg3)",color:"var(--text)",border:"1px solid var(--accent2)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontSize:15}}>
              {(bowlerPlayers||[]).map((p,i)=><option key={i} value={p.name}>{p.name}{p.isCaptain?" (C)":""}</option>)}
            </select>
          </div>
        )}

        <div style={{display:"flex",gap:8}}>
          <button onClick={onCancel} style={{flex:1,padding:11,background:"var(--bg3)",color:"var(--muted)",border:"1px solid var(--border)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:14,cursor:"pointer"}}>Cancel</button>
          <button onClick={()=>onConfirm({strikerIdx,nonStrikerIdx,newBowler})} disabled={strikerIdx===nonStrikerIdx} style={{flex:2,padding:11,background:strikerIdx!==nonStrikerIdx?"var(--accent)":"var(--bg3)",color:strikerIdx!==nonStrikerIdx?"#000":"var(--muted)",border:"none",borderRadius:"var(--rad)",fontFamily:"Orbitron",fontWeight:700,fontSize:12,cursor:strikerIdx!==nonStrikerIdx?"pointer":"default",letterSpacing:1}}>CONFIRM ✓</button>
        </div>
        {strikerIdx===nonStrikerIdx&&<div style={{color:"var(--danger)",fontSize:11,textAlign:"center",marginTop:6,fontFamily:"Barlow Condensed"}}>Striker and non-striker must be different players</div>}
      </div>
    </div>
  );
}


// ── CHANGE PLAYER DIALOG ──────────────────────────────────────────────────────
function ChangePlayerDialog({ title, players, currentIdx, onSelect, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
      <div style={{ background: "var(--card)", border: "1px solid var(--accent)", borderRadius: "var(--rad2)", padding: 20, width: "100%", maxWidth: 340, animation: "fadeInUp 0.25s ease" }}>
        <div style={{ fontFamily: "Orbitron", color: "var(--accent)", fontSize: 12, letterSpacing: 2, marginBottom: 14 }}>{title}</div>
        <div style={{ maxHeight: 300, overflowY: "auto" }}>
          {players.map((p, i) => (
            <div key={i} onClick={() => onSelect(i)}
              style={{ padding: "11px 14px", marginBottom: 6, background: currentIdx === i ? "rgba(0,229,255,0.12)" : p.dismissed ? "rgba(255,61,90,0.05)" : "var(--bg3)", border: `1px solid ${currentIdx === i ? "var(--accent)" : p.dismissed ? "rgba(255,61,90,0.2)" : "var(--border)"}`, borderRadius: "var(--rad)", cursor: p.dismissed ? "default" : "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: p.dismissed ? 0.45 : 1 }}>
              <div>
                <span style={{ fontFamily: "Barlow Condensed", fontSize: 15, color: currentIdx === i ? "var(--accent)" : "var(--text)", fontWeight: currentIdx === i ? 700 : 400 }}>{p.name}</span>
                {p.isCaptain && <span style={{ marginLeft: 6, fontSize: 9, background: "rgba(255,215,0,0.2)", color: "var(--gold)", borderRadius: 3, padding: "1px 5px", fontFamily: "Barlow Condensed", fontWeight: 700 }}>C</span>}
                {p.isWK && <span style={{ marginLeft: 4, fontSize: 9, background: "rgba(0,229,255,0.15)", color: "var(--accent)", borderRadius: 3, padding: "1px 5px", fontFamily: "Barlow Condensed", fontWeight: 700 }}>WK</span>}
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "Barlow Condensed" }}>{p.runs || 0}({p.balls || 0})</span>
                {p.dismissed && <div style={{ fontSize: 9, color: "var(--danger)", fontFamily: "Barlow Condensed" }}>OUT</div>}
                {currentIdx === i && <div style={{ fontSize: 9, color: "var(--accent)", fontFamily: "Barlow Condensed" }}>CURRENT</div>}
              </div>
            </div>
          ))}
        </div>
        <button onClick={onCancel} style={{ width: "100%", marginTop: 10, padding: "10px 0", background: "var(--bg3)", color: "var(--muted)", border: "1px solid var(--border)", borderRadius: "var(--rad)", fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

// ── SCORING SCREEN ────────────────────────────────────────────────────────────
function ScoringScreen({match,onBall,onWicket,onUndo,onEndInnings,onStumps,onManualStrikeSwap,onLeave,onChangePlayer}){
  if(!match||!match.teams||!match.teams[match.batting]) return null;
  const bt=match.teams[match.batting];
  const isChasing=match.inning>0&&match.format!=="test";
  const target=isChasing?match.teams[0].score+1:null;
  const totalBalls=match.overs*6;
  const ballsLeft=Math.max(0,totalBalls-bt.balls);
  const runsNeeded=target?Math.max(0,target-bt.score):null;

  const [showCamera,setShowCamera]=useState(false);
  const [notif,setNotif]=useState(null);
  const [extraType,setExtraType]=useState(null);
  const [declareDialog,setDeclareDialog]=useState(null);
  const [declareRuns,setDeclareRuns]=useState("");
  const [showMenu,setShowMenu]=useState(false);
  const [showComm,setShowComm]=useState(false);
  const [changeDialog,setChangeDialog]=useState(null); // null | 'striker' | 'nonStriker' | 'bowler'
  const bt_players=bt.players||[];
  const bw_players=match.teams[match.bowling]?.players||[];
  const currentOver=bt.overs[bt.overs.length-1]||[];

  const notify=(msg,color="var(--accent)")=>{setNotif({msg,color});setTimeout(()=>setNotif(null),1800);};

  const handleRun=(r,type="normal")=>{
    onBall(r,type||extraType||"normal");setExtraType(null);
    notify(type==="wide"?`Wide +${r+1}`:type==="noBall"?`No Ball +${r}`:r===4?"FOUR! 🏏":r===6?"SIX! 🚀":r===0?"• Dot ball":`${r} run${r>1?"s":""}`,r===6?"var(--accent3)":r===4?"var(--gold)":"var(--accent)");
  };

  const handleDeclare=()=>{
    const r=parseInt(declareRuns);if(isNaN(r)||r<0)return;
    onBall(r,extraType||"normal");setExtraType(null);setDeclareDialog(null);setDeclareRuns("");
    notify(r===4?"FOUR! 🏏":r===6?"SIX! 🚀":`${r} run${r!==1?"s":""} declared`,r===6?"var(--accent3)":r===4?"var(--gold)":"var(--accent)");
  };

  const extraMap={"Wide":"wide","No Ball":"noBall","Bye":"bye","Leg Bye":"legBye"};

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column"}}>

      {/* Toast notification */}
      {notif&&<div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:notif.color,color:["var(--gold)","var(--accent3)"].includes(notif.color)?"#000":"#fff",padding:"9px 20px",borderRadius:30,fontFamily:"Orbitron",fontWeight:700,fontSize:14,zIndex:999,whiteSpace:"nowrap",boxShadow:"0 4px 20px rgba(0,0,0,0.5)"}} className="bounce-in">{notif.msg}</div>}

      {/* ════ HEADER ════ */}
      <div style={{background:"linear-gradient(180deg,#0d1f30 0%,#0a1520 100%)",borderBottom:"1px solid var(--border)",padding:"10px 14px 8px"}}>

        {/* Toss info strip — only show if toss info exists */}
        {match.toss&&<div style={{fontSize:10,color:"var(--muted)",background:"rgba(255,215,0,0.06)",borderRadius:4,padding:"3px 8px",marginBottom:6,fontFamily:"Barlow Condensed",letterSpacing:1}}>🪙 {match.toss}</div>}

        {/* Team name + format tag */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <div style={{fontFamily:"Orbitron",color:"var(--accent)",fontSize:10,letterSpacing:2}}>{bt.name}</div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <span style={{fontSize:10,color:"var(--muted)",background:"var(--bg3)",padding:"2px 8px",borderRadius:10,letterSpacing:1,fontFamily:"Barlow Condensed",fontWeight:700}}>{match.ballType?.toUpperCase()}</span>
            <span style={{fontSize:10,color:"var(--muted)",background:"var(--bg3)",padding:"2px 8px",borderRadius:10,letterSpacing:1,fontFamily:"Barlow Condensed",fontWeight:700}}>{match.format==="test"?`TEST INN ${match.inning+1}`:`${match.overs}ov`}</span>
          </div>
        </div>

        {/* Main score */}
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:4}}>
          <div>
            <div style={{fontFamily:"Orbitron",fontSize:42,fontWeight:900,color:"#fff",lineHeight:1,letterSpacing:-1}}>
              {bt.score}<span style={{color:"var(--danger)",fontSize:24}}>/{bt.wickets}</span>
            </div>
            <div style={{color:"var(--muted)",fontSize:12,marginTop:2,display:"flex",gap:10}}>
              <span>{overStr(bt.balls)} ov</span>
              <span>RR: <b style={{color:"var(--text)"}}>{calcRR(bt.score,bt.balls)}</b></span>
              {match.format!=="test"&&<span style={{color:"var(--muted)"}}>{ballsLeft}b left</span>}
            </div>
          </div>

          {/* Right side: Extras OR chase info */}
          <div style={{textAlign:"right"}}>
            {isChasing&&runsNeeded!==null ? (
              <div>
                <div style={{fontFamily:"Orbitron",fontSize:22,color:"var(--accent2)",fontWeight:900,lineHeight:1}}>{runsNeeded}</div>
                <div style={{color:"var(--muted)",fontSize:10,marginTop:1}}>runs needed</div>
                <div style={{color:"var(--muted)",fontSize:10}}>in {ballsLeft} balls</div>
                <div style={{color:"var(--accent2)",fontSize:12,fontWeight:700,marginTop:1}}>RRR {calcRRR(target,bt.score,ballsLeft)}</div>
              </div>
            ) : (
              <div>
                <div style={{color:"var(--muted)",fontSize:10,letterSpacing:1}}>EXTRAS</div>
                <div style={{color:"var(--text)",fontSize:20,fontFamily:"Rajdhani",fontWeight:600}}>{Object.values(bt.extras).reduce((a,b)=>a+b,0)}</div>
                <div style={{color:"var(--muted)",fontSize:10}}>W:{bt.extras.wide} NB:{bt.extras.noBall}</div>
              </div>
            )}
          </div>
        </div>

        {/* Show extras separately when chasing */}
        {isChasing&&<div style={{fontSize:10,color:"var(--muted)",marginBottom:4}}>Extras: {Object.values(bt.extras).reduce((a,b)=>a+b,0)} (W:{bt.extras.wide} NB:{bt.extras.noBall} B:{bt.extras.bye} LB:{bt.extras.legBye})</div>}

        {/* Current over balls */}
        <div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:10,color:"var(--muted)",fontFamily:"Barlow Condensed",marginRight:2}}>THIS OVER:</span>
          {currentOver.map((b,i)=><BallDot key={i} ball={b}/>)}
          {currentOver.length<6&&Array(6-currentOver.length).fill(0).map((_,i)=>(<div key={"e"+i} style={{width:26,height:26,borderRadius:"50%",border:"1px dashed var(--border)",flexShrink:0}}/>))}
        </div>

        {/* Striker / Non-striker / Bowler — tap batters to declare */}
        <div style={{display:"flex",gap:6}}>
          {/* STRIKER — tap name to declare, tap pencil to change */}
          <div style={{flex:1.2,background:"rgba(0,229,255,0.06)",border:"1.5px solid var(--accent)",borderRadius:"var(--rad)",padding:"6px 8px",position:"relative"}}>
            <div style={{fontSize:8,color:"var(--accent)",letterSpacing:1,fontWeight:700,fontFamily:"Barlow Condensed",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
              <span>⚡ STRIKER</span>
              <span onClick={e=>{e.stopPropagation();setChangeDialog("striker");}} style={{fontSize:10,cursor:"pointer",padding:"1px 4px",background:"rgba(0,229,255,0.15)",borderRadius:3}}>✎</span>
            </div>
            <div style={{fontSize:13,color:"var(--text)",fontFamily:"Rajdhani",fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{match.striker?.name||"—"}</div>
            <div style={{fontSize:11,display:"flex",gap:6,marginTop:1}}>
              <span style={{color:"var(--accent)",fontWeight:700}}>{match.striker?.runs||0}</span>
              <span style={{color:"var(--muted)"}}>({match.striker?.balls||0}b)</span>
              <span style={{color:"var(--muted)",fontSize:10}}>SR {match.striker?.balls>0?((match.striker.runs/match.striker.balls)*100).toFixed(0):0}</span>
            </div>
            <div style={{position:"absolute",top:4,right:5,fontSize:8,color:"var(--accent)",opacity:0.5,fontFamily:"Barlow Condensed"}}>TAP</div>
          </div>

          {/* NON-STRIKER */}
          <div style={{flex:1,background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:"var(--rad)",padding:"6px 8px",position:"relative"}}>
            <div style={{fontSize:8,color:"var(--muted)",letterSpacing:1,fontWeight:700,fontFamily:"Barlow Condensed",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
              <span>NON-STRIKE</span>
              <span onClick={e=>{e.stopPropagation();setChangeDialog("nonStriker");}} style={{fontSize:10,cursor:"pointer",padding:"1px 4px",background:"rgba(255,255,255,0.08)",borderRadius:3,color:"var(--muted)"}}>✎</span>
            </div>
            <div onClick={()=>setDeclareDialog("nonStriker")} style={{cursor:"pointer"}}>
              <div style={{fontSize:13,color:"var(--text)",fontFamily:"Rajdhani",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{match.nonStriker?.name||"—"}</div>
              <div style={{fontSize:11,display:"flex",gap:6,marginTop:1}}>
                <span style={{color:"var(--muted)"}}>{match.nonStriker?.runs||0}</span>
                <span style={{color:"var(--muted)"}}>({match.nonStriker?.balls||0}b)</span>
              </div>
            </div>
          </div>

          {/* BOWLER */}
          <div style={{flex:1,background:"var(--bg3)",border:"1px solid rgba(255,107,53,0.25)",borderRadius:"var(--rad)",padding:"6px 8px"}}>
            <div style={{fontSize:8,color:"var(--accent2)",letterSpacing:1,fontWeight:700,fontFamily:"Barlow Condensed",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
              <span>BOWLING</span>
              <span onClick={e=>{e.stopPropagation();setChangeDialog("bowler");}} style={{fontSize:10,cursor:"pointer",padding:"1px 4px",background:"rgba(255,107,53,0.15)",borderRadius:3,color:"var(--accent2)"}}>✎</span>
            </div>
            <div style={{fontSize:13,color:"var(--text)",fontFamily:"Rajdhani",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{match.currentBowler?.name||"—"}</div>
            <div style={{fontSize:11,color:"var(--muted)",marginTop:1}}>{match.currentBowler?.wickets||0}/{match.currentBowler?.runsConceded||0} <span style={{fontSize:9}}>{overStr(match.currentBowler?.ballsBowled||0)}ov</span></div>
          </div>
        </div>
      </div>

      {/* ════ DECLARE RUNS DIALOG ════ */}
      {declareDialog&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}>
          <div style={{background:"var(--card)",border:"1px solid var(--accent)",borderRadius:"var(--rad2)",padding:20,width:"100%",maxWidth:340,animation:"fadeInUp 0.25s ease"}}>
            <div style={{fontFamily:"Orbitron",color:"var(--accent)",fontSize:12,letterSpacing:2,marginBottom:4}}>DECLARE RUNS</div>
            <div style={{color:"var(--muted)",fontSize:13,marginBottom:14}}><b style={{color:"var(--text)"}}>{declareDialog==="striker"?match.striker?.name:match.nonStriker?.name}</b> — how many runs this ball?</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:12}}>
              {[1,2,3,4,5,6,7,8].map(r=>(<button key={r} onClick={()=>setDeclareRuns(String(r))} style={{padding:"11px 0",background:declareRuns===String(r)?"var(--accent)":"var(--bg3)",color:declareRuns===String(r)?"#000":"var(--text)",border:`1px solid ${declareRuns===String(r)?"var(--accent)":"var(--border)"}`,borderRadius:"var(--rad)",fontFamily:"Orbitron",fontWeight:700,fontSize:16,cursor:"pointer"}}>{r}</button>))}
            </div>
            <input type="number" min="0" value={declareRuns} onChange={e=>setDeclareRuns(e.target.value)} placeholder="Custom number..." style={{width:"100%",padding:"9px 12px",background:"var(--bg3)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontSize:17,marginBottom:12}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{setDeclareDialog(null);setDeclareRuns("");}} style={{flex:1,padding:10,background:"var(--bg3)",color:"var(--muted)",border:"1px solid var(--border)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:14,cursor:"pointer"}}>Cancel</button>
              <button onClick={handleDeclare} disabled={!declareRuns} style={{flex:2,padding:10,background:declareRuns?"var(--accent)":"var(--bg2)",color:declareRuns?"#000":"var(--muted)",border:"none",borderRadius:"var(--rad)",fontFamily:"Orbitron",fontWeight:700,fontSize:12,cursor:declareRuns?"pointer":"default",letterSpacing:1}}>CONFIRM ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* ════ CONTROLS ════ */}
      <div style={{flex:1,overflowY:"auto",padding:"10px 14px"}}>

        {/* AI Camera toggle */}
        <button onClick={()=>setShowCamera(s=>!s)} style={{width:"100%",padding:"7px 0",marginBottom:8,background:showCamera?"rgba(0,229,255,0.08)":"var(--bg3)",color:"var(--accent)",border:`1px solid ${showCamera?"var(--accent)":"rgba(0,229,255,0.3)"}`,borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:13,letterSpacing:1,cursor:"pointer"}}>
          {showCamera?"📷 HIDE AI CAMERA":"📷 SHOW AI CAMERA"}
        </button>
        {showCamera&&<CameraTracker zones={match.zones||[]} onDetect={r=>handleRun(r,"camera")} active={showCamera}/>}

        {/* Extra mode indicator */}
        {extraType&&(
          <div style={{background:"rgba(255,107,53,0.1)",border:"1px solid var(--accent2)",borderRadius:"var(--rad)",padding:"7px 12px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{color:"var(--accent2)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:13,letterSpacing:1}}>MODE: {extraType.toUpperCase()} — Now tap runs</span>
            <button onClick={()=>setExtraType(null)} style={{background:"none",border:"none",color:"var(--muted)",fontSize:18,cursor:"pointer",lineHeight:1}}>✕</button>
          </div>
        )}

        {/* ── RUN BUTTONS ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:8}}>
          {[0,1,2,3,4,6].map(r=>(
            <button key={r} onClick={()=>handleRun(r,extraType||"normal")} style={{padding:"17px 0",background:r===4?"rgba(255,215,0,0.1)":r===6?"rgba(57,255,20,0.1)":"var(--bg3)",color:r===4?"var(--gold)":r===6?"var(--accent3)":"var(--text)",border:`2px solid ${r===4?"rgba(255,215,0,0.5)":r===6?"rgba(57,255,20,0.5)":"var(--border)"}`,borderRadius:"var(--rad2)",fontFamily:"Orbitron",fontWeight:900,fontSize:r===6?28:r===4?22:20,cursor:"pointer",transition:"transform 0.1s",WebkitTapHighlightColor:"transparent"}}>
              {r===0?"•":r}
            </button>
          ))}
        </div>

        {/* ── EXTRAS ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:8}}>
          {["Wide","No Ball","Bye","Leg Bye"].map(e=>(
            <button key={e} onClick={()=>setExtraType(prev=>prev===extraMap[e]?null:extraMap[e])} style={{padding:"11px 0",background:extraType===extraMap[e]?"rgba(255,107,53,0.18)":"var(--bg3)",color:extraType===extraMap[e]?"var(--accent2)":"var(--muted)",border:`1px solid ${extraType===extraMap[e]?"var(--accent2)":"var(--border)"}`,borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:14,letterSpacing:1,cursor:"pointer"}}>
              {e.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ── PRIMARY ACTIONS ── */}
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:7,marginBottom:8}}>
          <button onClick={onWicket} style={{padding:"14px 0",background:"rgba(255,61,90,0.12)",color:"var(--danger)",border:"2px solid rgba(255,61,90,0.5)",borderRadius:"var(--rad2)",fontFamily:"Orbitron",fontWeight:700,fontSize:13,cursor:"pointer",letterSpacing:1}}>🔴 WICKET</button>
          <button onClick={onUndo} style={{padding:"14px 0",background:"var(--bg3)",color:"var(--muted)",border:"1px solid var(--border)",borderRadius:"var(--rad2)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:14,cursor:"pointer"}}>↩ UNDO</button>
          <button onClick={()=>setShowMenu(s=>!s)} style={{padding:"14px 0",background:showMenu?"rgba(0,229,255,0.1)":"var(--bg3)",color:showMenu?"var(--accent)":"var(--muted)",border:`1px solid ${showMenu?"var(--accent)":"var(--border)"}`,borderRadius:"var(--rad2)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:18,cursor:"pointer"}}>⚙️</button>
        </div>

        {/* ── ⚙️ EXPANDED MENU ── */}
        {showMenu&&(
          <div style={{background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:"var(--rad)",padding:12,marginBottom:8,animation:"fadeInUp 0.2s ease"}}>
            <div style={{fontSize:10,color:"var(--muted)",letterSpacing:2,fontFamily:"Barlow Condensed",fontWeight:700,marginBottom:8}}>MORE OPTIONS</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
              <button onClick={()=>{onEndInnings();setShowMenu(false);}} style={{padding:"10px 0",background:"rgba(255,107,53,0.1)",color:"var(--accent2)",border:"1px solid rgba(255,107,53,0.3)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:12,cursor:"pointer",letterSpacing:1}}>📋 DECLARE INNINGS</button>
              <button onClick={()=>{onManualStrikeSwap();setShowMenu(false);}} style={{padding:"10px 0",background:"rgba(0,229,255,0.06)",color:"var(--accent)",border:"1px solid rgba(0,229,255,0.2)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:12,cursor:"pointer",letterSpacing:1}}>🔄 SWAP STRIKE</button>
            </div>
            {/* Test match breaks — only show in test format */}
            {match.format==="test"&&(
              <>
                <div style={{fontSize:10,color:"var(--muted)",letterSpacing:2,fontFamily:"Barlow Condensed",fontWeight:700,margin:"10px 0 6px"}}>TEST MATCH BREAKS</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                  {[["🌙","STUMPS"],["☕","TEA"],["🍽","LUNCH"],["🌧","RAIN STOP"]].map(([icon,label])=>(
                    <button key={label} onClick={()=>{onStumps(`${icon} ${label}`);setShowMenu(false);}} style={{padding:"10px 0",background:"rgba(0,229,255,0.04)",color:"var(--muted)",border:"1px solid var(--border)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:12,cursor:"pointer",letterSpacing:1}}>{icon} {label}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── COMMENTARY (collapsible) ── */}
        <button onClick={()=>setShowComm(s=>!s)} style={{width:"100%",padding:"7px 0",background:"transparent",color:"var(--muted)",border:"1px solid var(--border)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:12,letterSpacing:1,cursor:"pointer",marginBottom:showComm?6:0}}>
          {showComm?"▲ HIDE COMMENTARY":"▼ SHOW COMMENTARY"}
        </button>
        {showComm&&(
          <div style={{background:"var(--bg2)",borderRadius:"var(--rad)",padding:"8px 10px",maxHeight:140,overflowY:"auto"}}>
            {[...(bt.commentary||[])].reverse().slice(0,15).map((c,i)=>(
              <div key={i} style={{fontSize:12,color:i===0?"var(--text)":"var(--muted)",borderBottom:"1px solid var(--border)",padding:"4px 0",lineHeight:1.4}}>{c}</div>
            ))}
            {!bt.commentary?.length&&<div style={{color:"var(--muted)",fontSize:12}}>No commentary yet...</div>}
          </div>
        )}

        {/* ── LEAVE MATCH ── */}
        <div style={{marginTop:20,paddingTop:14,borderTop:"1px solid var(--border)"}}>
          <button onClick={onLeave} style={{width:"100%",padding:"12px 0",background:"transparent",color:"var(--danger)",border:"1px solid rgba(255,61,90,0.3)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:14,letterSpacing:2,cursor:"pointer"}}>
            ✕ LEAVE MATCH
          </button>
          <div style={{textAlign:"center",fontSize:10,color:"var(--muted)",marginTop:6,fontFamily:"Barlow Condensed"}}>Match progress will be saved</div>
        </div>

      </div>

      {/* ── CHANGE PLAYER DIALOGS ── */}
      {changeDialog==="striker"&&(
        <ChangePlayerDialog
          title="CHANGE STRIKER"
          players={bt_players}
          currentIdx={match.strikerIdx}
          onSelect={idx=>{onChangePlayer("striker",idx);setChangeDialog(null);}}
          onCancel={()=>setChangeDialog(null)}
        />
      )}
      {changeDialog==="nonStriker"&&(
        <ChangePlayerDialog
          title="CHANGE NON-STRIKER"
          players={bt_players}
          currentIdx={match.nonStrikerIdx}
          onSelect={idx=>{onChangePlayer("nonStriker",idx);setChangeDialog(null);}}
          onCancel={()=>setChangeDialog(null)}
        />
      )}
      {changeDialog==="bowler"&&(
        <ChangePlayerDialog
          title="CHANGE BOWLER"
          players={bw_players}
          currentIdx={match.currentBowlerIdx}
          onSelect={idx=>{onChangePlayer("bowler",idx);setChangeDialog(null);}}
          onCancel={()=>setChangeDialog(null)}
        />
      )}
    </div>
  );
}

// ── WICKET DIALOG ─────────────────────────────────────────────────────────────
function WicketDialog({batters,fieldingTeam,onConfirm,onCancel}){
  const [outBatter,setOutBatter]=useState(0);
  const [dismissal,setDismissal]=useState("Bowled");
  const [fielder,setFielder]=useState("");
  const dismissals=["Bowled","Caught","LBW","Run Out","Stumped","Hit Wicket","Handled Ball","Obstructing Field","Timed Out","Hit Ball Twice"];
  const needsFielder=["Caught","Run Out","Stumped"].includes(dismissal);
  const ss={width:"100%",padding:"9px 12px",background:"var(--bg3)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontSize:15,marginBottom:10};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:150,padding:16}}>
      <div style={{background:"var(--card)",border:"1px solid var(--danger)",borderRadius:"var(--rad2)",padding:20,width:"100%",maxWidth:380,animation:"fadeInUp 0.25s ease"}}>
        <div style={{fontFamily:"Orbitron",color:"var(--danger)",fontSize:14,marginBottom:14,letterSpacing:2}}>🔴 WICKET!</div>
        <Label>OUT BATTER</Label>
        <select value={outBatter} onChange={e=>setOutBatter(Number(e.target.value))} style={ss}>
          {batters.map((b,i)=><option key={i} value={i}>{b.name} — {b.runs}({b.balls})</option>)}
        </select>
        <Label>DISMISSAL TYPE</Label>
        <select value={dismissal} onChange={e=>setDismissal(e.target.value)} style={ss}>
          {dismissals.map(d=><option key={d}>{d}</option>)}
        </select>
        {needsFielder&&<>
          <Label>{dismissal==="Caught"?"CAUGHT BY":dismissal==="Run Out"?"RUN OUT BY":"STUMPED BY"}</Label>
          <select value={fielder} onChange={e=>setFielder(e.target.value)} style={ss}>
            <option value="">— Select fielder —</option>
            {fieldingTeam.map((p,i)=><option key={i} value={p.name}>{p.name}</option>)}
          </select>
        </>}
        <div style={{display:"flex",gap:8,marginTop:4}}>
          <button onClick={onCancel} style={{flex:1,padding:11,background:"var(--bg3)",color:"var(--muted)",border:"1px solid var(--border)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:14,cursor:"pointer"}}>Cancel</button>
          <button onClick={()=>onConfirm({outIdx:outBatter,dismissal,fielder})} style={{flex:1,padding:11,background:"var(--danger)",color:"#fff",border:"none",borderRadius:"var(--rad)",fontFamily:"Orbitron",fontWeight:700,fontSize:12,cursor:"pointer",letterSpacing:1}}>CONFIRM OUT</button>
        </div>
      </div>
    </div>
  );
}

// ── BOWLER SELECT ─────────────────────────────────────────────────────────────
function BowlerSelectDialog({players,currentBowler,onSelect}){
  const [sel,setSel]=useState(null);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:150,padding:16}}>
      <div style={{background:"var(--card)",border:"1px solid var(--accent2)",borderRadius:"var(--rad2)",padding:20,width:"100%",maxWidth:360,animation:"fadeInUp 0.25s ease"}}>
        <div style={{fontFamily:"Orbitron",color:"var(--accent2)",fontSize:12,marginBottom:4,letterSpacing:2}}>NEW OVER</div>
        <div style={{fontFamily:"Orbitron",color:"var(--accent2)",fontSize:14,marginBottom:14,letterSpacing:2}}>SELECT BOWLER</div>
        <div style={{maxHeight:260,overflowY:"auto"}}>
          {players.filter(p=>p.name!==currentBowler).map((p,i)=>(
            <div key={i} onClick={()=>setSel(p.name)} style={{padding:"11px 14px",marginBottom:6,background:sel===p.name?"rgba(255,107,53,0.15)":"var(--bg3)",border:`1px solid ${sel===p.name?"var(--accent2)":"var(--border)"}`,borderRadius:"var(--rad)",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontFamily:"Barlow Condensed",fontSize:15,color:sel===p.name?"var(--accent2)":"var(--text)",fontWeight:sel===p.name?700:400}}>{p.name}</span>
              <span style={{color:"var(--muted)",fontSize:12,fontFamily:"Barlow Condensed"}}>{overStr(p.ballsBowled||0)}ov · {p.wickets||0}/{p.runsConceded||0}</span>
            </div>
          ))}
        </div>
        <button onClick={()=>sel&&onSelect(sel)} disabled={!sel} style={{width:"100%",marginTop:10,padding:11,background:sel?"var(--accent2)":"var(--bg3)",color:sel?"#fff":"var(--muted)",border:"none",borderRadius:"var(--rad)",fontFamily:"Orbitron",fontWeight:700,fontSize:12,cursor:sel?"pointer":"default",letterSpacing:1}}>BOWL THIS OVER ▶</button>
      </div>
    </div>
  );
}

// ── STRIKE SWAP DIALOG ────────────────────────────────────────────────────────
function StrikeSwapDialog({striker,nonStriker,onConfirm,onCancel}){
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:150,padding:20}}>
      <div style={{background:"var(--card)",border:"1px solid var(--accent)",borderRadius:"var(--rad2)",padding:22,width:"100%",maxWidth:300,textAlign:"center",animation:"fadeInUp 0.25s ease"}}>
        <div style={{fontSize:36,marginBottom:8}}>🔄</div>
        <div style={{fontFamily:"Orbitron",color:"var(--accent)",fontSize:12,letterSpacing:2,marginBottom:10}}>CHANGE STRIKE?</div>
        <div style={{color:"var(--muted)",fontSize:13,marginBottom:4,lineHeight:1.6}}>
          <b style={{color:"var(--accent)"}}>{striker?.name}</b> scored an odd number of runs.<br/>
          Should <b style={{color:"var(--text)"}}>{nonStriker?.name}</b> take strike?
        </div>
        <div style={{display:"flex",gap:8,marginTop:16}}>
          <button onClick={onCancel} style={{flex:1,padding:"12px 0",background:"var(--bg3)",color:"var(--muted)",border:"1px solid var(--border)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:14,cursor:"pointer",letterSpacing:1}}>NO CHANGE</button>
          <button onClick={onConfirm} style={{flex:1,padding:"12px 0",background:"var(--accent)",color:"#000",border:"none",borderRadius:"var(--rad)",fontFamily:"Orbitron",fontWeight:700,fontSize:12,cursor:"pointer",letterSpacing:1}}>YES SWAP ✓</button>
        </div>
      </div>
    </div>
  );
}

// ── STUMPS / BREAK DIALOG ─────────────────────────────────────────────────────
function StumpsDialog({type,onResume,onEnd}){
  const icon=type.includes("STUMPS")?"🌙":type.includes("TEA")?"☕":type.includes("LUNCH")?"🍽":"🌧";
  const msgs={"🌙":"Day's play is over. Stumps are drawn.","☕":"Tea break. Players are off the field.","🍽":"Lunch break. Players are off the field.","🌧":"Rain has stopped play."};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}}>
      <div style={{background:"var(--card)",border:"1px solid var(--accent)",borderRadius:"var(--rad2)",padding:28,width:"100%",maxWidth:300,textAlign:"center",animation:"fadeInUp 0.25s ease"}}>
        <div style={{fontSize:48,marginBottom:10}}>{icon}</div>
        <div style={{fontFamily:"Orbitron",color:"var(--accent)",fontSize:14,letterSpacing:2,marginBottom:8}}>{type}</div>
        <div style={{color:"var(--muted)",fontSize:13,marginBottom:22,lineHeight:1.6}}>{msgs[icon]||"Play is paused."}</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onEnd} style={{flex:1,padding:11,background:"var(--bg3)",color:"var(--muted)",border:"1px solid var(--border)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:13,cursor:"pointer"}}>End Day</button>
          <button onClick={onResume} style={{flex:1,padding:11,background:"var(--accent)",color:"#000",border:"none",borderRadius:"var(--rad)",fontFamily:"Orbitron",fontWeight:700,fontSize:12,cursor:"pointer",letterSpacing:1}}>RESUME ▶</button>
        </div>
      </div>
    </div>
  );
}

// ── SCORECARD SCREEN ──────────────────────────────────────────────────────────
function ScorecardScreen({match,onBack}){
  const [tab,setTab]=useState(0);
  const t=match.teams[tab];
  const bwTeam=match.teams[1-tab];
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column"}}>
      <div style={{background:"linear-gradient(135deg,#0a1520,#0d1f2e)",borderBottom:"1px solid var(--border)",padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"var(--accent)",fontSize:22,cursor:"pointer",lineHeight:1}}>←</button>
        <div style={{fontFamily:"Orbitron",color:"var(--accent)",fontSize:13,letterSpacing:2}}>SCORECARD</div>
        {match.format&&<span style={{marginLeft:"auto",fontSize:10,color:"var(--muted)",background:"var(--bg3)",padding:"2px 8px",borderRadius:10,fontFamily:"Barlow Condensed",fontWeight:700,letterSpacing:1}}>{match.format.toUpperCase()} · {match.ballType?.toUpperCase()}</span>}
      </div>
      {match.toss&&<div style={{padding:"4px 14px 6px",fontSize:10,color:"var(--muted)",fontFamily:"Barlow Condensed",letterSpacing:1}}>🪙 {match.toss}</div>}
      <div style={{display:"flex",borderBottom:"1px solid var(--border)"}}>
        {match.teams.map((tm,i)=>(<button key={i} onClick={()=>setTab(i)} style={{flex:1,padding:"10px 0",background:tab===i?"var(--bg3)":"transparent",color:tab===i?"var(--accent)":"var(--muted)",border:"none",borderBottom:tab===i?"2px solid var(--accent)":"2px solid transparent",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:13,cursor:"pointer",letterSpacing:1}}>{tm.name}</button>))}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:14}}>
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--rad2)",padding:14,marginBottom:14}}>
          <div style={{fontFamily:"Orbitron",color:"var(--accent)",fontSize:24,fontWeight:900,marginBottom:4}}>{t.score}<span style={{color:"var(--danger)",fontSize:16}}>/{t.wickets}</span></div>
          <div style={{display:"flex",gap:14,color:"var(--muted)",fontSize:12}}>
            <span>Overs: {overStr(t?.balls||0)}</span>
            <span>RR: <b style={{color:"var(--text)"}}>{calcRR(t?.score||0,t?.balls||0)}</b></span>
          </div>
          <div style={{color:"var(--muted)",fontSize:11,marginTop:4}}>Extras: {Object.values(t.extras).reduce((a,b)=>a+b,0)} (W:{t.extras.wide} NB:{t.extras.noBall} B:{t.extras.bye} LB:{t.extras.legBye})</div>
        </div>
        <SectionHead>BATTING</SectionHead>
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--rad)",overflow:"hidden",marginBottom:14}}>
          <TableRow header cells={["BATTER","R","B","4s","6s","SR"]}/>
          {t.players.map((p,i)=>(
            <TableRow key={i} cells={[
              <span key="n">
                <span style={{fontWeight:p.dismissed?400:600,display:"flex",alignItems:"center",gap:3,flexWrap:"wrap"}}>
                  {p.name}
                  {!p.dismissed&&<span style={{color:"var(--accent3)",fontSize:9}}> *</span>}
                  {p.isCaptain&&<span style={{fontSize:8,background:"rgba(255,215,0,0.2)",color:"var(--gold)",borderRadius:3,padding:"1px 4px",fontFamily:"Barlow Condensed",fontWeight:700}}>C</span>}
                  {p.isWK&&<span style={{fontSize:8,background:"rgba(0,229,255,0.15)",color:"var(--accent)",borderRadius:3,padding:"1px 4px",fontFamily:"Barlow Condensed",fontWeight:700}}>WK</span>}
                </span>
                {p.dismissed&&<span style={{display:"block",color:"var(--muted)",fontSize:9,fontWeight:400}}>{p.dismissal}{p.catchBy?` (${p.catchBy})`:""}</span>}
              </span>,
              p.runs||0,p.balls||0,p.fours||0,p.sixes||0,
              p.balls>0?((p.runs/p.balls)*100).toFixed(0):"-"
            ]}/>
          ))}
        </div>
        <SectionHead>BOWLING</SectionHead>
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--rad)",overflow:"hidden",marginBottom:14}}>
          <TableRow header cells={["BOWLER","O","M","R","W","ECO"]}/>
          {bwTeam.players.filter(p=>(p.ballsBowled||0)>0).map((p,i)=>(
            <TableRow key={i} cells={[p.name,overStr(p.ballsBowled||0),p.maidens||0,p.runsConceded||0,p.wickets||0,((p.runsConceded||0)/(p.ballsBowled||1)*6).toFixed(2)]}/>
          ))}
        </div>
        {t.fow?.length>0&&<>
          <SectionHead>FALL OF WICKETS</SectionHead>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:14}}>
            {t.fow.map((f,i)=>(<div key={i} style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:"var(--rad)",padding:"3px 8px",fontSize:11,color:"var(--muted)"}}>{i+1}‑{f.score} ({f.name}, {f.over})</div>))}
          </div>
        </>}
        {t.commentary?.length>0&&<>
          <SectionHead>COMMENTARY</SectionHead>
          <div style={{background:"var(--bg2)",borderRadius:"var(--rad)",padding:"8px 10px"}}>
            {[...t.commentary].reverse().map((c,i)=>(<div key={i} style={{fontSize:12,color:i===0?"var(--text)":"var(--muted)",borderBottom:"1px solid var(--border)",padding:"5px 0",lineHeight:1.4}}>{c}</div>))}
          </div>
        </>}
      </div>
    </div>
  );
}

// ── RESULT SCREEN ─────────────────────────────────────────────────────────────
function ResultScreen({match,onNewMatch}){
  const [tab,setTab]=useState("awards");
  if(!match||!match.teams||!match.teams[0]||!match.teams[1]) return null;
  const [t0,t1]=match.teams;
  const isTest=match.format==="test";

  // ── Auto-analyse all players ──
  const all=[...(t0.players||[]).map(p=>({...p,team:t0.name})),...(t1.players||[]).map(p=>({...p,team:t1.name}))];
  if(!all.length) return null;

  // POTM score = weighted formula
  const potmScore=p=>{
    const batSR=p.balls>0?(p.runs/p.balls)*100:0;
    const batScore=(p.runs||0)*1.2 + (p.fours||0)*0.5 + (p.sixes||0)*1.5 + (batSR>130?10:batSR>100?5:0);
    const bowlEco=p.ballsBowled>0?(p.runsConceded/p.ballsBowled)*6:99;
    const bowlScore=(p.wickets||0)*25 + (bowlEco<6?10:bowlEco<8?5:0) + (p.maidens||0)*5;
    const fieldScore=((p.catches||0)+(p.runOuts||0))*10 + (p.stumpings||0)*12;
    return batScore+bowlScore+fieldScore;
  };

  const potm=all.length>0?all.reduce((a,b)=>potmScore(b)>potmScore(a)?b:a,all[0]):{name:"—",team:""};

  // Best batter = most runs, tiebreak by SR
  const batters=all.filter(p=>(p.balls||0)>0);
  const bestBatter=batters.length>0?batters.reduce((a,b)=>{
    if((b.runs||0)!==(a.runs||0))return(b.runs||0)>(a.runs||0)?b:a;
    return((b.runs/b.balls)>(a.runs/a.balls))?b:a;
  },batters[0]):all[0]||{name:"—",runs:0,balls:0,team:""};

  // Best bowler = most wickets, tiebreak by economy
  const bowlers=all.filter(p=>(p.ballsBowled||0)>0);
  const bestBowler=bowlers.length?bowlers.reduce((a,b)=>{
    if((b.wickets||0)!==(a.wickets||0))return(b.wickets||0)>(a.wickets||0)?b:a;
    const ea=(a.runsConceded||0)/(a.ballsBowled||1);const eb=(b.runsConceded||0)/(b.ballsBowled||1);
    return eb<ea?b:a;
  },bowlers[0]):null;

  // Best fielder = most dismissals
  const bestFielder=all.length>0?all.reduce((a,b)=>((b.catches||0)+(b.runOuts||0)+(b.stumpings||0))>((a.catches||0)+(a.runOuts||0)+(a.stumpings||0))?b:a,all[0]):{name:"—",team:""};

  // Impact player = highest potm score excluding POTM winner (so 2 different players)
  const impactPool=all.filter(p=>p.name!==potm.name);
  const impact=impactPool.length>0?impactPool.reduce((a,b)=>potmScore(b)>potmScore(a)?b:a,impactPool[0]):{name:"—",team:""};

  const result=t0.score>t1.score?`${t0.name} won by ${t0.score-t1.score} runs!`:t1.score>t0.score?`${t1.name} won by ${10-t1.wickets} wickets!`:"Match Tied!";

  // For test: build innings history from match.inningsHistory
  const innings=match.inningsHistory||[];

  const tabs=["awards",...(isTest?innings.map((_,i)=>`inn${i}`):[])];

  return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at top,#0d2030 0%,#080c10 70%)",display:"flex",flexDirection:"column",paddingBottom:30}}>

      {/* Result banner */}
      <div style={{textAlign:"center",padding:"24px 18px 16px",animation:"fadeInUp 0.5s ease"}}>
        <div style={{fontSize:50,marginBottom:8}}>🏆</div>
        <div style={{fontFamily:"Orbitron",fontSize:20,color:"var(--gold)",marginBottom:10,lineHeight:1.3}} className="glow-o">{result}</div>
        <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
          {[t0,t1].map((t,i)=>(<div key={i} style={{background:"var(--card)",borderRadius:"var(--rad)",padding:"8px 14px",border:"1px solid var(--border)",textAlign:"center"}}>
            <div style={{fontSize:10,color:"var(--muted)",fontFamily:"Barlow Condensed",fontWeight:700,letterSpacing:1}}>{t.name}</div>
            <div style={{fontFamily:"Orbitron",fontSize:18,color:"var(--text)",fontWeight:700}}>{t.score}<span style={{color:"var(--danger)",fontSize:13}}>/{t.wickets}</span></div>
            <div style={{fontSize:10,color:"var(--muted)"}}>{overStr(t?.balls||0)} ov</div>
          </div>))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:"1px solid var(--border)",background:"var(--bg2)",overflowX:"auto"}}>
        <NavBtn active={tab==="awards"} onClick={()=>setTab("awards")} label="AWARDS"/>
        {isTest&&innings.map((inn,i)=>(<NavBtn key={i} active={tab===`inn${i}`} onClick={()=>setTab(`inn${i}`)} label={`INN ${i+1}`}/>))}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:16}}>

        {/* ── AWARDS TAB ── */}
        {tab==="awards"&&<>
          {/* POTM — auto selected */}
          <Card title="🏅 PLAYER OF THE MATCH" style={{marginBottom:14}}>
            <div style={{background:"rgba(255,215,0,0.07)",border:"1px solid rgba(255,215,0,0.25)",borderRadius:"var(--rad)",padding:"14px 16px",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:6}}>⭐</div>
              <div style={{fontFamily:"Orbitron",color:"var(--gold)",fontSize:18,fontWeight:700,marginBottom:4}}>{potm.name}</div>
              <div style={{color:"var(--muted)",fontSize:12,fontFamily:"Barlow Condensed"}}>{potm.team}</div>
              <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:8,flexWrap:"wrap"}}>
                {(potm.runs||0)>0&&<span style={{background:"var(--bg3)",borderRadius:10,padding:"2px 8px",fontSize:11,color:"var(--accent)",fontFamily:"Barlow Condensed",fontWeight:700}}>{potm.runs}r ({potm.balls}b)</span>}
                {(potm.wickets||0)>0&&<span style={{background:"var(--bg3)",borderRadius:10,padding:"2px 8px",fontSize:11,color:"var(--accent2)",fontFamily:"Barlow Condensed",fontWeight:700}}>{potm.wickets}w/{potm.runsConceded}r</span>}
                {((potm.catches||0)+(potm.runOuts||0)+(potm.stumpings||0))>0&&<span style={{background:"var(--bg3)",borderRadius:10,padding:"2px 8px",fontSize:11,color:"var(--accent3)",fontFamily:"Barlow Condensed",fontWeight:700}}>{(potm.catches||0)+(potm.runOuts||0)+(potm.stumpings||0)} dismissal{(potm.catches||0)+(potm.runOuts||0)+(potm.stumpings||0)>1?"s":""}</span>}
              </div>
              <div style={{color:"var(--muted)",fontSize:10,marginTop:8,fontFamily:"Barlow Condensed",letterSpacing:1}}>AUTO-SELECTED BY AI ANALYSIS</div>
            </div>
          </Card>

          <Card title="MATCH AWARDS" style={{marginBottom:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <AwardCard icon="🏏" title="BEST BATTER" name={bestBatter?.name} stat={`${bestBatter?.runs||0}r (${bestBatter?.balls||0}b) SR:${bestBatter?.balls>0?((bestBatter.runs/bestBatter.balls)*100).toFixed(0):0}`} color="var(--accent)"/>
              <AwardCard icon="🎳" title="BEST BOWLER" name={bestBowler?.name||"—"} stat={bestBowler?`${bestBowler.wickets}w · Eco:${((bestBowler.runsConceded||0)/(bestBowler.ballsBowled||1)*6).toFixed(2)}`:"No wickets"} color="var(--accent2)"/>
              <AwardCard icon="🧤" title="BEST FIELDER" name={bestFielder?.name} stat={`C:${bestFielder?.catches||0} RO:${bestFielder?.runOuts||0} St:${bestFielder?.stumpings||0}`} color="var(--accent3)"/>
              <AwardCard icon="⚡" title="IMPACT PLAYER" name={impact?.name} stat={`${impact?.runs||0}r · ${impact?.wickets||0}w`} color="var(--gold)"/>
            </div>
          </Card>

          {/* Performance summary */}
          <Card title="PERFORMANCE SUMMARY" style={{marginBottom:20}}>
            {all.sort((a,b)=>potmScore(b)-potmScore(a)).slice(0,5).map((p,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{fontFamily:"Orbitron",fontSize:12,color:i===0?"var(--gold)":"var(--muted)",width:20}}>#{i+1}</div>
                  <div>
                    <div style={{fontFamily:"Barlow Condensed",fontWeight:700,fontSize:14,color:"var(--text)"}}>{p.name}</div>
                    <div style={{fontSize:11,color:"var(--muted)",fontFamily:"Barlow Condensed"}}>{p.team}</div>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
                    {(p.runs||0)>0&&<span style={{fontSize:11,color:"var(--accent)",fontFamily:"Barlow Condensed",fontWeight:700}}>{p.runs}r</span>}
                    {(p.wickets||0)>0&&<span style={{fontSize:11,color:"var(--accent2)",fontFamily:"Barlow Condensed",fontWeight:700}}>{p.wickets}w</span>}
                    {((p.catches||0)+(p.runOuts||0))>0&&<span style={{fontSize:11,color:"var(--accent3)",fontFamily:"Barlow Condensed",fontWeight:700}}>{(p.catches||0)+(p.runOuts||0)}f</span>}
                  </div>
                  <div style={{fontSize:10,color:"var(--border)",fontFamily:"Barlow Condensed"}}>score: {potmScore(p).toFixed(0)}</div>
                </div>
              </div>
            ))}
          </Card>
        </>}

        {/* ── INNINGS TABS (Test only) ── */}
        {isTest&&innings.map((inn,i)=>tab===`inn${i}`&&(
          <div key={i}>
            <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--rad2)",padding:14,marginBottom:14}}>
              <div style={{fontFamily:"Barlow Condensed",fontWeight:700,letterSpacing:2,fontSize:11,color:"var(--muted)",marginBottom:4}}>INNINGS {i+1} — {inn.teamName}</div>
              <div style={{fontFamily:"Orbitron",color:"var(--accent)",fontSize:24,fontWeight:900,marginBottom:4}}>{inn.score}<span style={{color:"var(--danger)",fontSize:16}}>/{inn.wickets}</span></div>
              <div style={{display:"flex",gap:14,color:"var(--muted)",fontSize:12}}>
                <span>Overs: {overStr(inn?.balls||0)}</span>
                <span>RR: {calcRR(inn?.score||0,inn?.balls||0)}</span>
              </div>
              {inn.extras&&<div style={{color:"var(--muted)",fontSize:11,marginTop:4}}>Extras: {Object.values(inn.extras).reduce((a,b)=>a+b,0)} (W:{inn.extras.wide} NB:{inn.extras.noBall} B:{inn.extras.bye} LB:{inn.extras.legBye})</div>}
            </div>

            <SectionHead>BATTING</SectionHead>
            <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--rad)",overflow:"hidden",marginBottom:14}}>
              <TableRow header cells={["BATTER","R","B","4s","6s","SR"]}/>
              {(inn.players||[]).map((p,j)=>(
                <TableRow key={j} cells={[
                  <span key="n"><span style={{fontWeight:p.dismissed?400:600}}>{p.name}{!p.dismissed&&<span style={{color:"var(--accent3)",fontSize:9}}> *</span>}</span>{p.dismissed&&<span style={{display:"block",color:"var(--muted)",fontSize:9}}>{p.dismissal}{p.catchBy?` (${p.catchBy})`:""}</span>}</span>,
                  p.runs||0,p.balls||0,p.fours||0,p.sixes||0,
                  p.balls>0?((p.runs/p.balls)*100).toFixed(0):"-"
                ]}/>
              ))}
            </div>

            <SectionHead>BOWLING</SectionHead>
            <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--rad)",overflow:"hidden",marginBottom:14}}>
              <TableRow header cells={["BOWLER","O","M","R","W","ECO"]}/>
              {(inn.bowlers||[]).filter(p=>(p.ballsBowled||0)>0).map((p,j)=>(
                <TableRow key={j} cells={[p.name,overStr(p.ballsBowled||0),p.maidens||0,p.runsConceded||0,p.wickets||0,((p.runsConceded||0)/(p.ballsBowled||1)*6).toFixed(2)]}/>
              ))}
            </div>

            {inn.fow?.length>0&&<>
              <SectionHead>FALL OF WICKETS</SectionHead>
              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:14}}>
                {inn.fow.map((f,j)=>(<div key={j} style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:"var(--rad)",padding:"3px 8px",fontSize:11,color:"var(--muted)"}}>{j+1}‑{f.score} ({f.name})</div>))}
              </div>
            </>}
          </div>
        ))}

        <button onClick={onNewMatch} style={{width:"100%",padding:"14px 0",background:"linear-gradient(135deg,var(--accent),#0099bb)",color:"#000",fontFamily:"Orbitron",fontWeight:700,fontSize:13,letterSpacing:2,border:"none",borderRadius:"var(--rad)",cursor:"pointer"}}>🏏 NEW MATCH</button>
      </div>
    </div>
  );
}

// ── HISTORY SCREEN ────────────────────────────────────────────────────────────
function HistoryScreen({onBack,onView,user}){
  const [records,setRecords]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    const load=async()=>{
      setLoading(true);
      try{
        if(user){
          const matches=await getMatchHistory(user.uid);
          setRecords(matches);
        } else {
          setRecords(JSON.parse(localStorage.getItem("cricscan_history")||"[]").reverse());
        }
      }catch{setRecords([]);}
      setLoading(false);
    };
    load();
  },[user]);
  const del=async id=>{
    if(user){ await deleteMatch(user.uid,id); }
    else { const u=JSON.parse(localStorage.getItem("cricscan_history")||"[]").filter(r=>r.id!==id); localStorage.setItem("cricscan_history",JSON.stringify(u)); }
    setRecords(r=>r.filter(x=>x.id!==id));
  };
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column"}}>
      <div style={{background:"linear-gradient(135deg,#0a1520,#0d1f2e)",borderBottom:"1px solid var(--border)",padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"var(--accent)",fontSize:22,cursor:"pointer",lineHeight:1}}>←</button>
        <div style={{fontFamily:"Orbitron",color:"var(--accent)",fontSize:13,letterSpacing:2}}>MATCH HISTORY</div>
        <span style={{marginLeft:"auto",fontSize:11,color:"var(--muted)",fontFamily:"Barlow Condensed"}}>{records.length} matches</span>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:14}}>
        {records.length===0?(
          <div style={{textAlign:"center",color:"var(--muted)",marginTop:80}}>
            <div style={{fontSize:40,marginBottom:12}}>📋</div>
            <div style={{fontSize:15}}>No matches recorded yet!</div>
            <div style={{fontSize:12,marginTop:4}}>Completed matches will appear here.</div>
          </div>
        ):records.map(r=>(
          <div key={r.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--rad2)",padding:14,marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"Rajdhani",fontWeight:700,fontSize:16,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.teams[0].name} vs {r.teams[1].name}</div>
                <div style={{display:"flex",gap:8,marginTop:2,flexWrap:"wrap"}}>
                  <span style={{fontSize:11,color:"var(--muted)"}}>{r.date}</span>
                  {r.format&&<span style={{fontSize:10,color:"var(--muted)",background:"var(--bg3)",padding:"1px 6px",borderRadius:8,fontFamily:"Barlow Condensed",fontWeight:700}}>{r.format.toUpperCase()}</span>}
                  {r.ballType&&<span style={{fontSize:10,color:"var(--muted)",background:"var(--bg3)",padding:"1px 6px",borderRadius:8,fontFamily:"Barlow Condensed",fontWeight:700}}>{r.ballType}</span>}
                </div>
                <div style={{color:"var(--accent2)",fontSize:13,marginTop:5,fontFamily:"Barlow Condensed",fontWeight:700}}>{r.result}</div>
              </div>
              <button onClick={()=>del(r.id,r.firestoreId)} style={{background:"none",border:"none",color:"var(--muted)",fontSize:18,cursor:"pointer",padding:"0 0 0 8px",flexShrink:0}}>🗑</button>
            </div>
            <div style={{display:"flex",gap:8,marginTop:10}}>
              {r.teams.map((t,i)=>(<div key={i} style={{flex:1,background:"var(--bg3)",borderRadius:"var(--rad)",padding:"8px 10px"}}>
                <div style={{fontSize:10,color:"var(--muted)",fontFamily:"Barlow Condensed",fontWeight:700,letterSpacing:1}}>{t.name}</div>
                <div style={{fontFamily:"Orbitron",fontSize:18,color:"var(--text)",fontWeight:700,marginTop:2}}>{t.score}<span style={{color:"var(--danger)",fontSize:12}}>/{t.wickets}</span></div>
                <div style={{fontSize:11,color:"var(--muted)"}}>({overStr(t?.balls||0)} ov)</div>
              </div>))}
            </div>
            <button onClick={()=>onView(r)} style={{width:"100%",marginTop:10,padding:"8px 0",background:"rgba(0,229,255,0.06)",color:"var(--accent)",border:"1px solid rgba(0,229,255,0.25)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:13,cursor:"pointer",letterSpacing:1}}>VIEW FULL SCORECARD →</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App(){
  const [screen,setScreen]=useState("login");
  const [user,setUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [match,setMatch]=useState(null);
  const [showWicket,setShowWicket]=useState(false);
  const [showBowlerSelect,setShowBowlerSelect]=useState(false);
  const [showStrikeSwap,setShowStrikeSwap]=useState(false);
  const [historyMatch,setHistoryMatch]=useState(null);
  const [stumpsType,setStumpsType]=useState(null);
  const [showLeaveConfirm,setShowLeaveConfirm]=useState(false);
  const [showBatterChange,setShowBatterChange]=useState(false);

  // Auth state listener
  useEffect(()=>{
    const unsub = onAuthChange(async u=>{
      setUser(u);
      setAuthLoading(false);
      if(u){
        // Try restore live match from Firebase
        try{
          const live = await getLiveMatch(u.uid);
          if(live&&!live.ended&&live.teams&&live.teams.length===2&&live.striker&&live.currentBowler){
            setMatch(live); setScreen("scoring"); return;
          }
        }catch(e){}
        setScreen("splash");
      } else {
        setScreen("login");
      }
    });
    return ()=>unsub();
  },[]);

  // Auto-save live match to Firebase on every change
  useEffect(()=>{
    if(match&&!match.ended&&user){
      saveLiveMatch(user.uid, match);
    }
  },[match, user]);

  const startMatch=useCallback(({team1,team2,overs,format,ballType,players1,players2,captain1,captain2,wk1,wk2,tossWinner,tossChoice})=>{
    const t0=mkTeam(team1,players1);const t1=mkTeam(team2,players2);
    if(t0.players[captain1])t0.players[captain1].isCaptain=true;
    if(t0.players[wk1])t0.players[wk1].isWK=true;
    if(t1.players[captain2])t1.players[captain2].isCaptain=true;
    if(t1.players[wk2])t1.players[wk2].isWK=true;
    const battingFirst=tossChoice==="bat"?tossWinner:1-tossWinner;
    const bowlingFirst=1-battingFirst;
    const tossMsg=`${[team1,team2][tossWinner]} won the toss and elected to ${tossChoice} first`;
    const newMatch={teams:[t0,t1],overs,format,ballType,
      batting:battingFirst,bowling:bowlingFirst,inning:0,
      toss:tossMsg,
      striker:{...t0.players[0]},nonStriker:{...t0.players[1]},strikerIdx:0,nonStrikerIdx:1,nextBatterIdx:2,
      currentBowler:{...t1.players[0]},currentBowlerIdx:0,history:[],zones:[],
      matchId:"match_"+Date.now()};
    setMatch(newMatch);
    // Show batter/bowler selector at start
    setShowBatterChange(true);
    setScreen("camera");
  },[]);

  const addComm=(nm,text)=>{const bt=nm.teams[nm.batting];if(!bt.commentary)bt.commentary=[];bt.commentary.push(`${overStr(bt.balls)} · ${text}`);};

  const handleBall=useCallback((runs,type)=>{
    setMatch(m=>{
      const nm=JSON.parse(JSON.stringify(m));
      const bt=nm.teams[nm.batting];const bw=nm.teams[nm.bowling];
      const striker=nm.striker;const bowler=nm.currentBowler;
      const isExtra=type==="wide"||type==="noBall";const isLegal=!isExtra;

      bt.score+=runs+(isExtra?1:0);
      if(isExtra)bt.extras[type]=(bt.extras[type]||0)+1+(runs>0?runs:0);
      if(isLegal||type==="bye"||type==="legBye"){striker.balls++;bt.balls++;bowler.ballsBowled++;}
      if(type==="normal"||type==="camera"){striker.runs+=runs;if(runs===4)striker.fours++;if(runs===6)striker.sixes++;}
      bowler.runsConceded=(bowler.runsConceded||0)+runs+(isExtra?1:0);

      nm.striker=striker;nm.currentBowler=bowler;
      bt.players[nm.strikerIdx]={...bt.players[nm.strikerIdx],runs:striker.runs,balls:striker.balls,fours:striker.fours,sixes:striker.sixes};
      bw.players[nm.currentBowlerIdx]={...bw.players[nm.currentBowlerIdx],runsConceded:bowler.runsConceded,ballsBowled:bowler.ballsBowled};

      addComm(nm,type==="wide"?"Wide ball":type==="noBall"?`No ball (${runs} run${runs!==1?"s":""})`:runs===4?`FOUR! ${striker.name} drives to the boundary`:runs===6?`SIX! ${striker.name} goes big!`:runs===0?`Dot ball. Defended by ${striker.name}.`:`${runs} run${runs>1?"s":""} taken by ${striker.name}`);

      const overEnded=isLegal&&bt.balls%6===0&&bt.balls>0;
      if(overEnded){bt.overs.push([]);nm.needBowler=true;const t=nm.striker;nm.striker=nm.nonStriker;nm.nonStriker=t;const ti=nm.strikerIdx;nm.strikerIdx=nm.nonStrikerIdx;nm.nonStrikerIdx=ti;}
      else{if(!bt.overs.length)bt.overs.push([]);bt.overs[bt.overs.length-1].push({runs,type});}

      if(isLegal&&!overEnded&&runs%2===1)nm.pendingStrikeSwap=true;
      nm.history.push({score:bt.score,balls:bt.balls});
      return nm;
    });
  },[]);

  const handleWicket=()=>setShowWicket(true);

  const confirmWicket=({outIdx,dismissal,fielder})=>{
    setShowWicket(false);
    setMatch(m=>{
      const nm=JSON.parse(JSON.stringify(m));
      const bt=nm.teams[nm.batting];const bw=nm.teams[nm.bowling];
      bt.wickets++;bt.balls++;
      if(!bt.overs.length)bt.overs.push([]);
      bt.overs[bt.overs.length-1].push({runs:0,type:"wicket"});
      bt.players[nm.strikerIdx].dismissed=true;
      bt.players[nm.strikerIdx].dismissal=dismissal;
      bt.players[nm.strikerIdx].catchBy=fielder||"";
      bt.fow.push({score:bt.score,name:bt.players[nm.strikerIdx].name,over:overStr(bt.balls)});
      nm.currentBowler.wickets=(nm.currentBowler.wickets||0)+1;
      bw.players[nm.currentBowlerIdx].wickets=nm.currentBowler.wickets;
      if(fielder){const fi=bw.players.findIndex(p=>p.name===fielder);if(fi>=0){if(dismissal==="Caught")bw.players[fi].catches=(bw.players[fi].catches||0)+1;if(dismissal==="Run Out")bw.players[fi].runOuts=(bw.players[fi].runOuts||0)+1;if(dismissal==="Stumped")bw.players[fi].stumpings=(bw.players[fi].stumpings||0)+1;}}
      addComm(nm,`WICKET! ${bt.players[nm.strikerIdx].name} — ${dismissal}${fielder?` by ${fielder}`:""}`);
      const next=nm.nextBatterIdx<bt.players.length?nm.nextBatterIdx:-1;
      if(next>=0){nm.strikerIdx=next;nm.striker={...bt.players[next]};nm.nextBatterIdx++;}
      if(bt.wickets>=10||bt.balls>=nm.overs*6)nm.needInningsEnd=true;
      else nm.needBatterChange=true; // show batter change after wicket
      return nm;
    });
  };

  const handleUndo=()=>{
    setMatch(m=>{
      if(!m.history.length)return m;
      const nm=JSON.parse(JSON.stringify(m));nm.history.pop();
      const bt=nm.teams[nm.batting];const last=bt.overs[bt.overs.length-1];
      if(last?.length){const ball=last.pop();if(ball.type!=="wide"&&ball.type!=="noBall")bt.balls=Math.max(0,bt.balls-1);bt.score=Math.max(0,bt.score-ball.runs);}
      if(bt.commentary?.length)bt.commentary.pop();
      return nm;
    });
  };

  const saveHistory=m=>{
    try{
      // For test: save the final innings before result
      let finalM=m;
      if(m.format==="test"){
        const nm=JSON.parse(JSON.stringify(m));
        if(!nm.inningsHistory)nm.inningsHistory=[];
        const bt=nm.teams[nm.batting];const bw=nm.teams[nm.bowling];
        nm.inningsHistory.push({
          teamName:bt.name,score:bt.score,wickets:bt.wickets,balls:bt.balls,
          extras:{...bt.extras},fow:[...(bt.fow||[])],
          players:bt.players.map(p=>({...p})),
          bowlers:bw.players.filter(p=>(p.ballsBowled||0)>0).map(p=>({...p})),
        });
        finalM=nm;
      }
      const m2=finalM;
      const [t0,t1]=m2.teams;
      const result=t0.score>t1.score?`${t0.name} won by ${t0.score-t1.score} runs`:t1.score>t0.score?`${t1.name} won by ${10-t1.wickets} wickets`:"Match Tied";
      const rec={id:Date.now(),date:new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}),overs:m2.overs,format:m2.format,ballType:m2.ballType,
        inningsHistory:m2.inningsHistory||[],
        teams:[{name:t0.name,score:t0.score,wickets:t0.wickets,balls:t0.balls,players:t0.players,extras:t0.extras,fow:t0.fow,commentary:t0.commentary},{name:t1.name,score:t1.score,wickets:t1.wickets,balls:t1.balls,players:t1.players,extras:t1.extras,fow:t1.fow,commentary:t1.commentary}],result};
      const prev=JSON.parse(localStorage.getItem("cricscan_history")||"[]");prev.push(rec);
      localStorage.setItem("cricscan_history",JSON.stringify(prev));localStorage.removeItem("cricscan_live");
    }catch{}
  };

  const handleEndInnings=useCallback(()=>{
    setMatch(m=>{
      if(!m)return m;
      const nm=JSON.parse(JSON.stringify(m));
      saveInningsSnapshot(nm);
      const maxInnings=nm.format==="test"?3:1;
      if(nm.inning<maxInnings){
        nm.inning++;const nb=nm.inning%2;const nw=1-nb;
        nm.batting=nb;nm.bowling=nw;
        const p=nm.teams[nb].players;
        nm.striker={...p[0]};nm.strikerIdx=0;nm.nonStriker={...p[1]};nm.nonStrikerIdx=1;nm.nextBatterIdx=2;
        nm.currentBowler={...nm.teams[nw].players[0]};nm.currentBowlerIdx=0;nm.needBowler=false;
        if(nm.format==="test"){
          // Save completed innings snapshot before resetting
          if(!nm.inningsHistory)nm.inningsHistory=[];
          const completedTeam=nm.teams[nm.batting];
          const bowlingTeam=nm.teams[nm.bowling];
          nm.inningsHistory.push({
            teamName:completedTeam.name,
            score:completedTeam.score,wickets:completedTeam.wickets,balls:completedTeam.balls,
            extras:{...completedTeam.extras},fow:[...(completedTeam.fow||[])],
            players:completedTeam.players.map(p=>({...p})),
            bowlers:bowlingTeam.players.filter(p=>(p.ballsBowled||0)>0).map(p=>({...p})),
          });
          // Reset batting team for next innings
          nm.teams[nb].players.forEach(p=>{p.runs=0;p.balls=0;p.dismissed=false;p.dismissal="";p.catchBy="";p.fours=0;p.sixes=0;});
          nm.teams[nb].score=0;nm.teams[nb].wickets=0;nm.teams[nb].balls=0;nm.teams[nb].overs=[];nm.teams[nb].fow=[];nm.teams[nb].commentary=[];
          // Reset bowling team's bowling stats for new innings
          nm.teams[nw].players.forEach(p=>{p.ballsBowled=0;p.runsConceded=0;p.wickets=0;p.maidens=0;});
        }
        return nm;
      }
      nm.ended=true;return nm;
    });
    setTimeout(()=>{
      setMatch(m=>{
        if(m?.ended||(m?.inning>=(m?.format==="test"?3:1))){saveHistory(m);setScreen("result");}
        return m;
      });
    },100);
  },[]);

  const confirmBatterChange=({strikerIdx,nonStrikerIdx,newBowler})=>{
    setShowBatterChange(false);
    setMatch(m=>{
      if(!m)return m;
      const nm=JSON.parse(JSON.stringify(m));
      const bt=nm.teams[nm.batting];
      const bw=nm.teams[nm.bowling];
      nm.strikerIdx=strikerIdx;
      nm.striker={...bt.players[strikerIdx]};
      nm.nonStrikerIdx=nonStrikerIdx;
      nm.nonStriker={...bt.players[nonStrikerIdx]};
      nm.nextBatterIdx=Math.max(strikerIdx,nonStrikerIdx)+1;
      if(newBowler){
        const bi=bw.players.findIndex(p=>p.name===newBowler);
        if(bi>=0){nm.currentBowlerIdx=bi;nm.currentBowler={...bw.players[bi]};}
      }
      return nm;
    });
  };

  const confirmBowler=name=>{
    setMatch(m=>{const nm=JSON.parse(JSON.stringify(m));const idx=nm.teams[nm.bowling].players.findIndex(p=>p.name===name);if(idx>=0){nm.currentBowler={...nm.teams[nm.bowling].players[idx]};nm.currentBowlerIdx=idx;}nm.needBowler=false;return nm;});
    setShowBowlerSelect(false);
  };

  const handleChangePlayer = (role, idx) => {
    setMatch(m => {
      const nm = JSON.parse(JSON.stringify(m));
      const bt = nm.teams[nm.batting];
      const bw = nm.teams[nm.bowling];
      if (role === "striker") {
        nm.strikerIdx = idx;
        nm.striker = { ...bt.players[idx] };
      } else if (role === "nonStriker") {
        nm.nonStrikerIdx = idx;
        nm.nonStriker = { ...bt.players[idx] };
      } else if (role === "bowler") {
        nm.currentBowlerIdx = idx;
        nm.currentBowler = { ...bw.players[idx] };
      }
      return nm;
    });
  };

  const doStrikeSwap=()=>{
    setMatch(m=>{const nm=JSON.parse(JSON.stringify(m));nm.pendingStrikeSwap=false;const t=nm.striker;nm.striker=nm.nonStriker;nm.nonStriker=t;const ti=nm.strikerIdx;nm.strikerIdx=nm.nonStrikerIdx;nm.nonStrikerIdx=ti;return nm;});
  };
  const cancelStrikeSwap=()=>{setMatch(m=>{const nm=JSON.parse(JSON.stringify(m));nm.pendingStrikeSwap=false;return nm;});};

  useEffect(()=>{
    if(match?.needBowler&&!showBowlerSelect)setShowBowlerSelect(true);
    if(match?.needInningsEnd)handleEndInnings();
    if(match?.pendingStrikeSwap&&!showStrikeSwap)setShowStrikeSwap(true);
    if(match?.needBatterChange&&!showBatterChange){
      setShowBatterChange(true);
      setMatch(m=>m?({...m,needBatterChange:false}):m);
    }
  },[match?.needBowler,match?.needInningsEnd,match?.pendingStrikeSwap,match?.needBatterChange]);

  useEffect(()=>{
    if(!match)return;
    const bt=match.teams[match.batting];
    if(bt.wickets>=10||bt.balls>=match.overs*6){
      if(match.inning<(match.format==="test"?3:1))handleEndInnings();
      else{saveHistory(match);setScreen("result");}
    }
  },[match?.teams?.[0]?.balls,match?.teams?.[1]?.balls,match?.teams?.[0]?.wickets,match?.teams?.[1]?.wickets]);

  const handleNewMatch=()=>{
    if(user)clearLiveMatch(user.uid);
    localStorage.removeItem("cricscan_live");
    setMatch(null);setScreen("splash");
  };
  const handleSignOut=async()=>{ await logOut(); setMatch(null); setScreen("login"); };

  return (
    <>
      <FontLink/>
      {authLoading&&(
        <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}>
          <div style={{fontFamily:"Orbitron",color:"var(--accent)",fontSize:24}} className="glow">🏏</div>
          <div style={{color:"var(--muted)",fontSize:13,fontFamily:"Barlow Condensed",letterSpacing:2}}>LOADING...</div>
        </div>
      )}
      {!authLoading&&screen==="login"&&<LoginScreen onLogin={()=>{}}/>}
      {!authLoading&&screen==="splash"&&<SplashScreen onStart={()=>setScreen("setup")}/>}
      {!authLoading&&screen==="setup"&&(
        <div style={{position:"relative"}}>
          <div style={{position:"absolute",top:16,right:16,zIndex:10,display:"flex",gap:6}}>
            <button onClick={()=>setScreen("history")} style={{background:"var(--bg3)",border:"1px solid var(--border)",color:"var(--muted)",borderRadius:"var(--rad)",padding:"6px 10px",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:12,cursor:"pointer"}}>📋</button>
            <button onClick={handleSignOut} style={{background:"var(--bg3)",border:"1px solid var(--border)",color:"var(--muted)",borderRadius:"var(--rad)",padding:"6px 10px",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:12,cursor:"pointer"}}>⏏ OUT</button>
          </div>
          <SetupScreen onStart={startMatch}/>
        </div>
      )}
      {screen==="camera"&&<CameraSetup onDone={z=>{setMatch(m=>({...m,zones:z}));setScreen("scoring");}} onSkip={()=>setScreen("scoring")}/>}
      {screen==="scoring"&&match&&(
        <>
          <div style={{display:"flex",borderBottom:"1px solid var(--border)",background:"var(--bg2)",alignItems:"center"}}>
            <NavBtn active label="SCORE"/>
            <NavBtn onClick={()=>setScreen("scorecard")} label="SCORECARD"/>
            <NavBtn onClick={()=>setScreen("history")} label="HISTORY"/>
            {user&&<div style={{padding:"0 8px",fontSize:10,color:"var(--muted)",fontFamily:"Barlow Condensed",borderLeft:"1px solid var(--border)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:80}}>{user.displayName||user.email?.split("@")[0]}</div>}
          </div>
          <ScoringScreen match={match} onBall={handleBall} onWicket={handleWicket} onUndo={handleUndo} onEndInnings={handleEndInnings} onStumps={t=>setStumpsType(t)} onManualStrikeSwap={doStrikeSwap} onLeave={()=>setShowLeaveConfirm(true)} onChangePlayer={handleChangePlayer}/>
          {showWicket&&<WicketDialog batters={[match.striker,match.nonStriker]} fieldingTeam={match.teams[match.bowling].players} onConfirm={confirmWicket} onCancel={()=>setShowWicket(false)}/>}
          {showBowlerSelect&&<BowlerSelectDialog players={match.teams[match.bowling].players} currentBowler={match.currentBowler?.name} onSelect={confirmBowler}/>}
          {showStrikeSwap&&<StrikeSwapDialog striker={match.striker} nonStriker={match.nonStriker} onConfirm={()=>{doStrikeSwap();setShowStrikeSwap(false);}} onCancel={()=>{cancelStrikeSwap();setShowStrikeSwap(false);}}/>}
          {stumpsType&&<StumpsDialog type={stumpsType} onResume={()=>setStumpsType(null)} onEnd={()=>{setStumpsType(null);handleEndInnings();}}/>}
          {showBatterChange&&match&&(
            <BatterChangeDialog
              title={match.teams[match.batting]?.wickets>0?"SELECT NEW BATTER":"CONFIRM OPENING PAIR"}
              players={match.teams[match.batting]?.players||[]}
              currentStrikerIdx={match.strikerIdx||0}
              currentNonStrikerIdx={match.nonStrikerIdx||1}
              showBowlerChange={true}
              bowlerPlayers={match.teams[match.bowling]?.players||[]}
              currentBowlerName={match.currentBowler?.name}
              onConfirm={confirmBatterChange}
              onCancel={()=>setShowBatterChange(false)}
            />
          )}
          {showLeaveConfirm&&(
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:20}}>
              <div style={{background:"var(--card)",border:"1px solid var(--danger)",borderRadius:"var(--rad2)",padding:24,width:"100%",maxWidth:300,textAlign:"center",animation:"fadeInUp 0.25s ease"}}>
                <div style={{fontSize:36,marginBottom:10}}>🚪</div>
                <div style={{fontFamily:"Orbitron",color:"var(--danger)",fontSize:13,letterSpacing:2,marginBottom:8}}>LEAVE MATCH?</div>
                <div style={{color:"var(--muted)",fontSize:13,marginBottom:6,lineHeight:1.6}}>Your match progress is saved. You can continue later.</div>
                <div style={{color:"var(--muted)",fontSize:12,marginBottom:20}}>Are you sure you want to leave?</div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setShowLeaveConfirm(false)} style={{flex:1,padding:"11px 0",background:"var(--bg3)",color:"var(--muted)",border:"1px solid var(--border)",borderRadius:"var(--rad)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:14,cursor:"pointer"}}>STAY</button>
                  <button onClick={()=>{setShowLeaveConfirm(false);setScreen("splash");}} style={{flex:1,padding:"11px 0",background:"var(--danger)",color:"#fff",border:"none",borderRadius:"var(--rad)",fontFamily:"Orbitron",fontWeight:700,fontSize:11,cursor:"pointer",letterSpacing:1}}>LEAVE ✕</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {screen==="scorecard"&&match&&<ScorecardScreen match={match} onBack={()=>setScreen("scoring")}/>}
      {screen==="result"&&match&&<ResultScreen match={{...match,inningsHistory:match.inningsHistory||[]}} onNewMatch={handleNewMatch}/>}
      {screen==="history"&&<HistoryScreen onBack={()=>setScreen(match?"scoring":"setup")} onView={r=>{setHistoryMatch(r);setScreen("historycard");}} user={user}/>}
      {screen==="historycard"&&historyMatch&&<ScorecardScreen match={{teams:historyMatch.teams,batting:0,bowling:1,format:historyMatch.format,ballType:historyMatch.ballType}} onBack={()=>setScreen("history")}/>}
    </>
  );
}
