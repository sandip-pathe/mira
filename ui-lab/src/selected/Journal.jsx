import React,{useEffect,useRef,useState} from 'react';
import {Art,Button,Sheet,copy,fixtures} from './ui';
import previewFixtures from '../../design/step-06/preview-fixtures.json';

const prompts=[['Check in','How was your day?','What is taking up the most space in your mind right now?','What would feel helpful to write about?'],['Notice','What is one moment from today you want to remember?','What has felt easier than you expected?','What is something small you appreciate today?'],['Reflect','What has been on your mind lately?','What do you wish someone understood right now?','What is one thing you want to make room for this week?']];
const colors=['#F7F1E7','#EEEEEE','#AEC6FF','#A8E6CF','#C7E59F','#B3D9FF','#D6E4FF','#D9C2FF','#E6CCFF','#E0C2FF','#E5B8FF','#E8D1FF','#F5A3B3','#FF7F7F','#FFAD87','#E8A5A1','#F0B6C2','#FFD700','#EEC39A','#F2C099','#E0A87E','#F8D24E','#B5D99C','#A7D89C','#C4D7C6','#E4C3E6','#B7E1CD','#EAEAEA','#F0F0F0','#C0C8CA'];
const fresh=()=>({id:crypto.randomUUID(),prompt:copy('journal.prompt'),text:'',entries:[],notes:[],color:colors[0],size:17,finished:false});
export default function Journal({route,navigate,newVersion,sampleVersion,outcome,setKeyboard,onFinish,onApprove}) {
  const [book,setBook]=useState(()=>{const s=fresh();return {id:s.id,sessions:[s]};});
  const [sheet,setSheet]=useState(''),[status,setStatus]=useState(''),[busy,setBusy]=useState(false),[noteState,setNoteState]=useState('idle'),[playing,setPlaying]=useState(''),[excerpt,setExcerpt]=useState(''),[pendingExcerpt,setPendingExcerpt]=useState(''),[excerptApproved,setExcerptApproved]=useState(false);
  const [feedback,setFeedback]=useState(null),[excerptRevoked,setExcerptRevoked]=useState(false),[noteDuration,setNoteDuration]=useState(0);
  const timers=useRef([]),generation=useRef(0),mounted=useRef(true),recordingStarted=useRef(0),playback=useRef(null);
  const current=book.sessions.find(s=>s.id===book.id);
  const update=patch=>setBook(b=>({...b,sessions:b.sessions.map(s=>s.id===b.id?{...s,...(typeof patch==='function'?patch(s):patch)}:s)}));
  const clear=()=>{generation.current++;timers.current.forEach(clearTimeout);timers.current=[];setBusy(false);};
  const later=(fn,ms)=>{const gen=generation.current;timers.current.push(setTimeout(()=>{if(mounted.current&&gen===generation.current)fn();},ms));};
  const openSheet=s=>{setKeyboard(false);setSheet(s);};
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;timers.current.forEach(clearTimeout);clearTimeout(playback.current);};},[]);
  useEffect(()=>{
    if(newVersion===0)return;
    clear();const s=fresh();setBook(b=>({id:s.id,sessions:[s,...b.sessions]}));setStatus('');setNoteState('idle');setPlaying('');setSheet('');
  },[newVersion]);
  useEffect(()=>{
    if(!sampleVersion)return;
    clear();const a={...fresh(),text:fixtures.journal.draft},b={...fresh(),finished:true,entries:[{text:'Taking a walk gave me a little space.',followUp:''}]};
    setBook({id:a.id,sessions:[a,b]});setStatus('');setNoteState('idle');setSheet('');setFeedback(previewFixtures.feedback);
  },[sampleVersion]);
  useEffect(()=>{clearTimeout(playback.current);setPlaying('');if(route!=='journal-entry'){clear();setNoteState('idle');setSheet('');setStatus('');}},[route]);
  const followUp=()=>{
    setStatus(copy('journal.follow_up_pending'));
    later(()=>{
      if(outcome==='followup-failure'){setStatus(copy('journal.follow_up_unavailable'));return;}
      update(s=>({entries:s.entries.map((e,i)=>i===s.entries.length-1?{...e,followUp:fixtures.journal.follow_up}:e)}));
      setStatus(copy('journal.saved'));
    },900);
  };
  const save=()=>{
    if(!current.text.trim()||busy||current.finished)return;
    clear();setKeyboard(false);setBusy(true);setStatus(copy('journal.saving'));
    const text=current.text.trim();
    later(()=>{
      setBusy(false);
      if(outcome==='save-failure'){setStatus(copy('journal.save_failed'));return;}
      update(s=>({text:'',entries:[...s.entries,{text,followUp:''}]}));followUp();
    },450);
  };
  const finish=()=>{
    if(busy||noteState==='recording'||noteState==='ready')return;
    clear();setBusy(true);setKeyboard(false);setStatus(copy('journal.saving'));
    later(()=>{
      setBusy(false);
      if(outcome==='save-failure'){setStatus(copy('journal.save_failed'));return;}
      update(s=>({finished:true,text:'',entries:s.text.trim()?[...s.entries,{text:s.text.trim(),followUp:''}]:s.entries}));
      setStatus('');onFinish();
    },450);
  };
  const visibleSessions=book.sessions.filter(s=>s.text.trim()||s.entries.length||s.notes.length);
  const chooseSession=s=>{clear();setBook(b=>({...b,id:s.id}));setStatus('');navigate(s.finished?'journal-read':'journal-entry');};
  const stopNote=()=>{setNoteDuration(Math.max(1,Math.round((Date.now()-recordingStarted.current)/1000)));setNoteState('ready');setStatus(copy('journal.note_ready'));};
  const saveNote=()=>{
    if(outcome==='save-failure'){setStatus(copy('journal.note_failed'));return;}
    update(s=>({notes:[...s.notes,{id:crypto.randomUUID(),seconds:noteDuration}]}));setNoteState('idle');setStatus(copy('journal.note_saved'));
  };
  const write=text=>{clear();update({text});setStatus('');};
  const feedbackView=feedback&&<details className="feedback-details"><summary>Outcomes Mira can remember</summary><p>{feedback.text}</p><Button disabled={busy||noteState!=='idle'} onClick={()=>setFeedback(f=>({...f,reuse:!f.reuse}))}>{feedback.reuse?'Stop future use':'Allow future use'}</Button><Button disabled={busy||noteState!=='idle'} onClick={()=>setFeedback(null)}>Delete feedback context</Button></details>;
  const home=<section className="content journal-home-a"><Art part={2} className="home-art"/><h2>A new page, whenever you want.</h2><Button className="primary new-entry-button" icon="plus" onClick={()=>navigate('new-journal')}>{copy('journal.new_entry')}</Button><h3>{copy('journal.recent')}</h3>{visibleSessions.length?visibleSessions.map(s=><button className="recent-record" key={s.id} onClick={()=>chooseSession(s)}><strong>{s.entries[0]?.text.slice(0,50)||s.text.slice(0,50)||'Voice note'}</strong><small>{s.finished?copy('journal.saved_session'):copy('journal.draft')} · {s.entries.length} {s.entries.length===1?'entry':'entries'}</small></button>):<div className="empty-journal"><p>{copy('journal.empty')}</p><p className="support muted">{copy('journal.empty_help')}</p></div>}{pendingExcerpt&&<Button onClick={()=>openSheet('excerpt')}>Mira’s context</Button>}{feedbackView}</section>;
  const readOnly=route==='journal-read'||current.finished;
  return <>
    {route==='journal-home'?home:<section className={`content journal-body ${current.text||current.entries.length||readOnly?'written':''}`} style={{background:current.color}}>
      {readOnly?<div className="journal-finished"><p>{copy('journal.finished')}</p><Button onClick={()=>navigate('journal-home')} icon="arrow-left">{copy('journal.recent')}</Button></div>:!current.text&&!current.entries.length&&<div className="journal-invitation"><h2>{copy('journal.intro')}</h2><Art part={2} className="journal-art"/></div>}
      {!readOnly&&<div className="prompt-row"><p className="journal-prompt">{current.prompt}</p><Button icon="chevron-down" onClick={()=>openSheet('prompts')}>{copy('journal.pick_prompt')}</Button></div>}
      <div className="journal-writing-area">
        {current.entries.map((e,i)=><article key={i} className="saved-entry-a"><p className="entry-words" style={{fontSize:current.size}}>{e.text}</p>{e.followUp&&<p className="journal-followup">{e.followUp}</p>}</article>)}
        {!readOnly&&<textarea className="writing" aria-label="Journal entry" placeholder={copy('journal.placeholder')} value={current.text} maxLength={12000} style={{fontSize:current.size}} onFocus={()=>setKeyboard(true)} onChange={e=>write(e.target.value)} disabled={busy}/>}
        {current.notes.map(n=><div className="voice-note-row" key={n.id}><Button icon={playing===n.id?'pause':'play'} disabled={busy||noteState!=='idle'} aria-label={playing===n.id?copy('journal.pause'):copy('journal.play')} onClick={()=>{clearTimeout(playback.current);if(playing===n.id){setPlaying('');return;}setPlaying(n.id);playback.current=setTimeout(()=>setPlaying(''),n.seconds*1000);}}>{n.seconds}s</Button><span className="support">Voice note</span>{!readOnly&&<Button icon="trash-can-outline" className="icon-button" aria-label={copy('journal.delete_note')} onClick={()=>openSheet('delete-note:'+n.id)}/>}</div>)}
        {current.entries.length>0&&<Button className="excerpt-action" onClick={()=>{if(!pendingExcerpt)setExcerpt(current.entries.map(e=>e.text).join('\n\n').slice(0,500));openSheet('excerpt');}}>{pendingExcerpt?'Mira’s context':copy('journal.excerpt')}</Button>}
        {feedbackView}
      </div>
      {status&&<div className={`journal-status ${status.includes('didn’t save')?'inline-error':''}`} role="status"><p>{status}</p>{status===copy('journal.follow_up_unavailable')&&<Button onClick={followUp}>{copy('journal.retry_follow_up')}</Button>}</div>}
      {noteState==='recording'&&<div className="note-controls"><p role="status">{copy('journal.recording')}</p><Button icon="stop" onClick={stopNote}>{copy('journal.stop_recording')}</Button></div>}
      {noteState==='ready'&&<div className="note-controls"><Button onClick={saveNote} className="primary">{copy('journal.save_note')}</Button><Button onClick={()=>{setNoteState('idle');setStatus('');}}>{copy('journal.discard_note')}</Button></div>}
      {!readOnly&&<><div className="journal-tools"><Button icon="palette-outline" onClick={()=>openSheet('style')} disabled={busy}>{copy('journal.appearance')}</Button><Button icon="microphone-outline" disabled={busy||noteState!=='idle'} onClick={()=>{clear();setKeyboard(false);recordingStarted.current=Date.now();setNoteState('recording');setStatus('');}}>{copy('journal.voice')}</Button></div><div className="save-row"><Button className="primary" onClick={save} disabled={!current.text.trim()||busy||noteState!=='idle'}>{busy?copy('journal.saving'):copy('journal.save_entry')}</Button><Button onClick={finish} disabled={busy||noteState!=='idle'||!current.text.trim()&&!current.entries.length&&!current.notes.length} title={copy('journal.finish_help')}>{copy('journal.finish')}</Button></div></>}
    </section>}
    {sheet&&<Sheet title={sheet==='prompts'?copy('journal.pick_prompt'):sheet==='style'?copy('journal.appearance'):sheet==='excerpt'?copy('journal.excerpt_review'):'Delete voice note?'} onClose={()=>setSheet('')}>
      {sheet==='prompts'&&<div className="prompt-options">{prompts.map(([group,...list])=><section key={group}><h3>{group}</h3>{list.map(p=><Button key={p} aria-pressed={p===current.prompt} onClick={()=>{update({prompt:p});setSheet('');}}>{p}</Button>)}</section>)}</div>}
      {sheet==='style'&&<><p className="support muted">Page color</p><div className="color-options">{colors.map((c,i)=><button className="color-option" key={c} aria-label={`Page color ${i+1}`} aria-pressed={c===current.color} style={{background:c,color:'#111111'}} onClick={()=>update({color:c})}>{c===current.color?'✓':''}</button>)}</div><label className="writing-size">{copy('journal.font_size')}<input type="range" min="16" max="26" step="1" value={current.size} onChange={e=>update({size:Number(e.target.value)})}/><span>{current.size}</span></label><p className="color-preview" style={{background:current.color,color:'#111111',fontSize:current.size}}>Your words, your page.</p><Button className="primary" onClick={()=>setSheet('')}>Done</Button></>}
      {sheet==='excerpt'&&<><p className="support muted">{copy('journal.excerpt_help')}</p><textarea className="excerpt-field" aria-label="Editable excerpt" maxLength={500} value={excerpt} disabled={!!pendingExcerpt} onChange={e=>setExcerpt(e.target.value)}/>{!pendingExcerpt?<Button className="primary" disabled={!excerpt.trim()} onClick={()=>{setPendingExcerpt(excerpt.trim());setExcerptRevoked(false);setExcerptApproved(false);}}>{copy('journal.excerpt_pending')}</Button>:excerptRevoked?<p role="status">Revoked</p>:!excerptApproved?<Button className="primary" onClick={()=>{onApprove(pendingExcerpt);setExcerptApproved(true);}}>{copy('journal.excerpt_approve')}</Button>:<><p role="status">Approved for Talk.</p><Button onClick={()=>{onApprove('');setExcerptApproved(false);setExcerptRevoked(true);}}>Revoke future use</Button></>}{pendingExcerpt&&<Button onClick={()=>{onApprove('');setPendingExcerpt('');setExcerptApproved(false);setExcerptRevoked(false);setSheet('');}}>Delete context</Button>}</>}
      {sheet.startsWith('delete-note:')&&<><Button className="primary" onClick={()=>{const id=sheet.split(':')[1];update(s=>({notes:s.notes.filter(n=>n.id!==id)}));if(playing===id)setPlaying('');setSheet('');}}>{copy('journal.delete_note')}</Button><Button onClick={()=>setSheet('')}>{copy('shared.cancel')}</Button></>}
    </Sheet>}
  </>;
}
