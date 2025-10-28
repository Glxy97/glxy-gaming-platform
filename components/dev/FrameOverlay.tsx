'use client';
import { useEffect, useRef, useState } from 'react';
export default function FrameOverlay(){
  const last = useRef(performance.now());
  const [p95, setP95] = useState(0);
  const buf:number[]=[];
  function tick(){
    const now = performance.now();
    const dt = now - last.current; last.current = now; buf.push(dt);
    if (buf.length > 300) buf.shift();
    const sorted=[...buf].sort((a,b)=>a-b);
    setP95(sorted[Math.floor(sorted.length*0.95)]||0);
    requestAnimationFrame(tick);
  }
  useEffect(()=>{ requestAnimationFrame(tick); },[]);
  return <div style={{position:'fixed',right:8,bottom:8,padding:6,background:'rgba(0,0,0,.5)'}}>
    <div>P95 Frame‑Time: {p95.toFixed(1)} ms</div>
  </div>;
}