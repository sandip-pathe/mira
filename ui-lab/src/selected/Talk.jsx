import React, {useEffect, useRef, useState} from 'react';
import {Art,Button,Icon,Sheet,copy,fixtures} from './ui';

export default function Talk({active,outcome,onActivity,keyboard,setKeyboard,approvedExcerpt}) {
  const [mode,setMode]=useState('voice'),[state,setState]=useState('welcome');
  const [draft,setDraft]=useState(''),[messages,setMessages]=useState([]),[offer,setOffer]=useState(false),[captions,setCaptions]=useState(false),[pending,setPending]=useState(false),[failed,setFailed]=useState('');
  const timers=useRef([]),holding=useRef(false),currentState=useRef('welcome'),feed=useRef(null),request=useRef('');
  const [failureMode,setFailureMode]=useState('');
  const change=s=>{currentState.current=s;setState(s);};
  const clear=()=>{timers.current.forEach(clearTimeout);timers.current=[];};
  const later=(fn,ms)=>timers.current.push(setTimeout(fn,ms));
  const stop=()=>{clear();holding.current=false;if(request.current)setFailed(request.current);request.current='';setPending(false);change('ended');};
  useEffect(()=>{
    if(!active){stop();setCaptions(false);}
    const blur=()=>{if(holding.current||['processing','speaking'].includes(currentState.current))stop();};
    const hidden=()=>{if(document.hidden)blur();};
    window.addEventListener('blur',blur);document.addEventListener('visibilitychange',hidden);
    return ()=>{clear();holding.current=false;window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',hidden);};
  },[active]);
  useEffect(()=>{feed.current?.scrollTo({top:feed.current.scrollHeight});},[messages,pending]);
  const start=()=>{
    if(!active||mode!=='voice'||holding.current)return;
    clear();setPending(false);holding.current=true;change('recording');
  };
  const cancel=()=>{if(holding.current){holding.current=false;clear();change('ended');}};
  const finish=()=>{
    if(!holding.current)return;
    holding.current=false;change('processing');
    later(()=>{
      if(outcome==='error'||outcome==='offline'){setFailureMode(outcome);change('error');return;}
      setMessages(m=>[...m,{role:'user',text:fixtures.talk.user_message},{role:'mira',text:fixtures.talk.mira_reply}]);
      if(outcome==='offer')setOffer(true);
      change('speaking');later(()=>change('ready'),2200);
    },850);
  };
  const switchMode=next=>{stop();setMode(next);setKeyboard(false);};
  const reply=(text,retry=false)=>{
    if(!text.trim()||pending)return;
    clear();setFailed('');setPending(true);request.current=text;
    if(!retry){setMessages(m=>[...m,{role:'user',text}]);setDraft('');}
    later(()=>{
      setPending(false);request.current='';
      if(outcome==='error'||outcome==='offline'){setFailureMode(outcome);setFailed(text);return;}
      setMessages(m=>[...m,{role:'mira',text:fixtures.talk.mira_reply}]);
      if(outcome==='offer')setOffer(true);
    },850);
  };
  const offerView=offer&&<section className="offer"><h3>{copy('talk.offer_title')}</h3><p className="muted">{copy('talk.offer_reason')}</p><div className="offer-actions"><Button className="primary" onClick={()=>{stop();setOffer(false);onActivity('one_small_step','talk');}}>{copy('talk.offer_accept')}</Button><Button onClick={()=>setOffer(false)}>{copy('talk.offer_decline')}</Button></div></section>;
  const conversation=<>{messages.length?messages.map((m,i)=><div className={`bubble ${m.role==='user'?'user':''}`} key={i}>{m.text}</div>):<p className="muted conversation-empty">Your conversation will appear here.</p>}</>;
  if(mode==='text')return <>
    <section className="content text-view">
      {approvedExcerpt&&<details className="approved-context"><summary>Approved excerpt</summary><p>{approvedExcerpt}</p></details>}
      <div className="message-feed" ref={feed} aria-label="Conversation">{conversation}{pending&&<p className="support muted" role="status">{copy('talk.reply_wait')}</p>}{failed&&<div className="inline-error" role="alert">{failureMode==='offline'&&<p>Mira’s temporarily offline.</p>}<p>{copy('talk.reply_failed')}</p><Button onClick={()=>reply(failed,true)}>{copy('talk.retry_text')}</Button></div>}{offerView}</div>
      <Button onClick={()=>switchMode('voice')} icon="microphone-outline">{copy('talk.voice')}</Button>
      <form className="composer" onSubmit={e=>{e.preventDefault();reply(draft.trim());}}><textarea rows="1" aria-label="Message to Mira" placeholder={copy('talk.placeholder')} value={draft} onChange={e=>setDraft(e.target.value)} onFocus={()=>setKeyboard(true)}/><button type="submit" className="primary send" disabled={!draft.trim()||pending} aria-label={copy('talk.send')}><Icon name="arrow-up"/></button></form>
    </section>
  </>;
  const labels={welcome:['welcome','welcome_help'],ready:['welcome','welcome_help'],recording:['recording','release'],processing:['processing',null],speaking:['speaking','interrupt'],error:['retry_title','retry_help'],ended:['ended','restart']};
  const [title,helper]=labels[state];
  return <>
    <section className={`content talk-body ${state} ${offer?'has-offer':''}`}>
      <div className="greeting" role="status" aria-live="polite"><h2>{state==='error'&&failureMode==='offline'?'Mira’s temporarily offline.':copy('talk.'+title)}</h2>{helper&&<p className="support muted">{copy('talk.'+helper)}</p>}</div>
      <div className="hero-zone"><Art pose={state==='recording'?0:state==='processing'?1:state==='speaking'?2:undefined} className="hero-art"/><Button className="conversation icon-button" icon="closed-caption-outline" aria-label={copy('talk.show_captions')} onClick={()=>{cancel();setCaptions(true);}}/></div>
      {offerView}
      <div className="voice-actions"><div className="control-row"><Button icon="format-text" className="side-control" onClick={()=>switchMode('text')}>{copy('talk.type')}</Button>
        <button type="button" className="mic" aria-label={copy('talk.hold')} aria-pressed={state==='recording'} style={{touchAction:'none'}} onPointerDown={e=>{if(e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);start();}} onPointerUp={finish} onPointerCancel={cancel} onLostPointerCapture={cancel} onContextMenu={e=>e.preventDefault()} onKeyDown={e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat)start();}}} onKeyUp={e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();finish();}}} onBlur={cancel}><Icon name={state==='recording'?'microphone':'microphone-outline'}/></button>
        <Button icon="close" className="side-control" onClick={stop} disabled={state==='welcome'||state==='ended'}>{copy('talk.end')}</Button></div><p className="hold-label">{state==='recording'?copy('talk.release'):copy('talk.hold')}</p></div>
    </section>
    {captions&&<Sheet title="Conversation" onClose={()=>setCaptions(false)}><div className="sheet-conversation">{conversation}</div></Sheet>}
  </>;
}
