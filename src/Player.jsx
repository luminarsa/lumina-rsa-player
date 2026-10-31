import React,{useEffect,useMemo,useRef,useState} from "react";
import Hls from "hls.js";
import {Play,Pause,Volume2,VolumeX,Maximize,Minimize,Settings2,LoaderCircle,AlertCircle,RotateCcw,RotateCw,Captions,ChevronDown} from "lucide-react";

const TEST_STREAM="https://sabconeta.cdn.mangomolo.com/sabc1/smil:sabc1.stream.smil/master.m3u8";
function routeInfo(){
 const p=location.pathname.split("/").filter(Boolean);
 if((p[0]==="embed"||p[0]==="")&&p[1]==="tv") return {kind:"TV",id:p[2],season:p[3],episode:p[4]};
 if((p[0]==="embed"||p[0]==="")&&p[1]==="movie") return {kind:"MOVIE",id:p[2]};
 if(p[0]==="tv") return {kind:"TV",id:p[1],season:p[2],episode:p[3]};
 if(p[0]==="movie") return {kind:"MOVIE",id:p[1]};
 return {kind:"PREVIEW"};
}
export default function Player(){
 const video=useRef(null),shell=useRef(null),hls=useRef(null),hide=useRef(null);
 const route=useMemo(routeInfo,[]);
 const params=new URLSearchParams(location.search);
 const isVidrockEmbed=(route.kind==="MOVIE"||route.kind==="TV")&&!params.get("src");
 const vidrockUrl=route.kind==="MOVIE"?`https://vidrock.to/movie/${encodeURIComponent(route.id)}`:route.kind==="TV"?`https://vidrock.to/tv/${encodeURIComponent(route.id)}/${encodeURIComponent(route.season)}/${encodeURIComponent(route.episode)}`:"";
 const [src]=useState(params.get("src")||import.meta.env.VITE_TEST_STREAM||TEST_STREAM);
 const [title]=useState(params.get("title")||(route.kind==="PREVIEW"?"SABC1 · Live test":"Lumina"));
 const [playing,setPlaying]=useState(false),[muted,setMuted]=useState(false),[volume,setVolume]=useState(.8);
 const [time,setTime]=useState(0),[duration,setDuration]=useState(0),[status,setStatus]=useState("loading"),[error,setError]=useState("");
 const [levels,setLevels]=useState([]),[level,setLevel]=useState(-1),[menu,setMenu]=useState(false),[visible,setVisible]=useState(true),[fullscreen,setFullscreen]=useState(false);
 useEffect(()=>{
  const v=video.current;if(isVidrockEmbed||!v||!src)return;
  setStatus("loading");setError("");
  let instance;
  if(Hls.isSupported()){
   instance=new Hls({enableWorker:true,capLevelToPlayerSize:true});hls.current=instance;
   instance.loadSource(src);instance.attachMedia(v);
   instance.on(Hls.Events.MANIFEST_PARSED,(_,data)=>{setLevels(data.levels.map((x,i)=>({i,label:x.height?`${x.height}p`:`${Math.round(x.bitrate/1000)} kbps`})));setStatus("ready");});
   instance.on(Hls.Events.ERROR,(_,data)=>{if(data.fatal){setStatus("error");setError(data.type===Hls.ErrorTypes.NETWORK_ERROR?"The playlist or video segments could not be reached. The stream host may block browser playback.":"The browser could not decode this stream.");instance.destroy();hls.current=null;}});
  }else if(v.canPlayType("application/vnd.apple.mpegurl")){
   v.src=src;v.onloadedmetadata=()=>setStatus("ready");v.onerror=()=>{setStatus("error");setError("The browser could not load this HLS stream.");};
  }else{setStatus("error");setError("HLS playback is not supported in this browser.");}
  return()=>{instance?.destroy();if(hls.current===instance)hls.current=null;v.pause();v.removeAttribute("src");v.load();};
 },[src,isVidrockEmbed]);
 useEffect(()=>{const v=video.current;if(!v)return;const t=()=>setTime(v.currentTime||0),d=()=>setDuration(Number.isFinite(v.duration)?v.duration:0);v.addEventListener("timeupdate",t);v.addEventListener("durationchange",d);return()=>{v.removeEventListener("timeupdate",t);v.removeEventListener("durationchange",d)}},[]);
 useEffect(()=>{const f=()=>setFullscreen(!!document.fullscreenElement);document.addEventListener("fullscreenchange",f);return()=>document.removeEventListener("fullscreenchange",f)},[]);
 const reveal=()=>{setVisible(true);clearTimeout(hide.current);hide.current=setTimeout(()=>{if(video.current&&!video.current.paused)setVisible(false)},2800)};
 const play=async()=>{if(!video.current)return;if(video.current.paused){try{await video.current.play()}catch{setError("Playback could not start. Press play to retry.")}}else video.current.pause()};
 const fmt=n=>{if(!Number.isFinite(n))return"0:00";let h=Math.floor(n/3600),m=Math.floor(n%3600/60),s=Math.floor(n%60);return h?`${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${m}:${String(s).padStart(2,"0")}`};
 const seek=n=>{if(video.current&&duration)video.current.currentTime=Number(n)};
 const fs=async()=>{if(!document.fullscreenElement)await shell.current?.requestFullscreen?.();else await document.exitFullscreen?.()};
 return <main className="page"><section className="player" ref={shell} onMouseMove={reveal} onMouseLeave={()=>playing&&setVisible(false)} onTouchStart={reveal}>
  {isVidrockEmbed?<iframe className="external-player" src={vidrockUrl} title={`VidRock ${route.kind==="MOVIE"?"movie":"episode"} ${route.id}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>:<video ref={video} playsInline preload="metadata" onClick={play} onPlay={()=>{setPlaying(true);setStatus("ready")}} onPause={()=>setPlaying(false)} onWaiting={()=>setStatus("loading")} onPlaying={()=>setStatus("ready")}/ >}
  <div className={`top ${isVidrockEmbed||visible?"show":"hide"}`}><div className="brand">LUMINA<span>.</span></div><div className="route">{route.kind}{route.id?` · ${route.id}`:""}{route.season?` · S${route.season} E${route.episode}`:""}</div></div>
  {!isVidrockEmbed&&status==="loading"&&<div className="state"><LoaderCircle className="spin" size={34}/><span>Preparing your experience</span></div>}
  {!isVidrockEmbed&&status==="error"&&<div className="state error"><AlertCircle size={32}/><b>Unable to play this source</b><span>{error}</span><button onClick={()=>{setStatus("loading");if(hls.current)hls.current.startLoad()}}>Try again</button></div>}
  {!isVidrockEmbed&&status==="ready"&&!playing&&<button className="bigplay" onClick={play} aria-label="Play"><Play fill="currentColor"/></button>}
  {!isVidrockEmbed&&<div className={`controls ${visible?"show":"hide"}`}>
   <div className="now"><div><small>NOW PLAYING</small><strong>{title}</strong></div><span className="live"><i/> STREAM</span></div>
   <input className="seek" aria-label="Seek" type="range" min="0" max={duration||100} step=".1" value={Math.min(time,duration||100)} onChange={e=>seek(e.target.value)} style={{"--pct":`${duration?time/duration*100:0}%`}}/>
   <div className="times"><span>{fmt(time)}</span><span>{duration?fmt(duration):"LIVE"}</span></div>
   <div className="bar"><div className="group">
    <button className="btn mainbtn" onClick={play} aria-label="Play pause">{playing?<Pause fill="currentColor"/>:<Play fill="currentColor"/>}</button>
    <button className="btn" onClick={()=>seek(Math.max(0,time-10))} aria-label="Back 10 seconds"><RotateCcw/></button>
    <button className="btn" onClick={()=>seek(Math.min(duration,time+10))} aria-label="Forward 10 seconds"><RotateCw/></button>
    <button className="btn" onClick={()=>{setMuted(!muted);if(video.current)video.current.muted=!muted}} aria-label="Mute">{muted?<VolumeX/>:<Volume2/>}</button>
    <input className="volume" type="range" min="0" max="1" step=".05" value={muted?0:volume} onChange={e=>{let n=+e.target.value;setVolume(n);setMuted(n===0);video.current.volume=n}}/>
   </div><div className="group right">
    {levels.length>0&&<div className="quality"><button className="qualitybtn" onClick={()=>setMenu(!menu)}><Settings2 size={14}/>{level===-1?"AUTO":levels.find(x=>x.i===level)?.label}<ChevronDown size={12}/></button>{menu&&<div className="menu"><button onClick={()=>{setLevel(-1);hls.current.currentLevel=-1;setMenu(false)}}>Auto</button>{levels.map(x=><button key={x.i} onClick={()=>{setLevel(x.i);hls.current.currentLevel=x.i;setMenu(false)}}>{x.label}</button>)}</div>}</div>}
    <button className="btn" title="Subtitle tracks depend on stream" aria-label="Subtitles"><Captions/></button>
    <button className="btn" onClick={fs} aria-label="Fullscreen">{fullscreen?<Minimize/>:<Maximize/>}</button>
   </div></div>
  </div>}
 </section><footer><span className="footbrand">LUMINA<span>.</span></span><span>A quieter way to watch.</span></footer></main>
}