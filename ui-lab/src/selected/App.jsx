import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import previewFixtures from '../../design/step-06/preview-fixtures.json';
import {paletteOptions} from './palettes';
import Talk from './Talk';
import Activities from './Activities';
import Journal from './Journal';
import {Button,Icon,Sheet,Keyboard,copy,fixtures} from './ui';
import '../../design/step-04/style.css';
import './selected.css';

function App(){
  const query=new URLSearchParams(location.search);
  const [logo,setLogo]=useState(()=>new URLSearchParams(location.search).get('logo')||'signature-forest');
  const [theme,setTheme]=useState(()=>new URLSearchParams(location.search).get('theme')||'warm-light');
  const screenOnly=query.get('screenOnly')==='1';
  const [route,setRoute]=useState(()=>query.get('screen')||'talk'),[activity,setActivity]=useState(null),[preferred,setPreferred]=useState([]),[outputs,setOutputs]=useState([]);
  const [talkOutcome,setTalkOutcome]=useState('offer'),[journalOutcome,setJournalOutcome]=useState('success'),[localError,setLocalError]=useState(false);
  const [width,setWidth]=useState('360'),[keyboard,setKeyboard]=useState(false),[motion,setMotion]=useState(true),[help,setHelp]=useState(false),[newVersion,setNewVersion]=useState(0),[sampleVersion,setSampleVersion]=useState(0),[journalOrigin,setJournalOrigin]=useState('talk'),[approvedExcerpt,setApprovedExcerpt]=useState('');
  const [visible,setVisible]=useState(!document.hidden);
  useEffect(()=>{const update=()=>setVisible(!document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
  const frame=useRef(null),bridgeData=useRef({outputs,resume:null});
  useEffect(()=>{bridgeData.current={outputs,resume:activity?.resume};},[outputs,activity]);
  const navigate=next=>{
    setKeyboard(false);setHelp(false);
    if(next==='new-journal'){setJournalOrigin('journal-home');setNewVersion(n=>n+1);setRoute('journal-entry');return;}
    setRoute(next);
  };
  const journalTab=()=>{setJournalOrigin(route.startsWith('journal')?'activities':route==='activity'?'activities':route);setNewVersion(n=>n+1);navigate('journal-entry');};
  const launch=(id,origin='activities',resume=null)=>{setActivity({id,origin,resume,key:crypto.randomUUID()});navigate('activity');};
  useEffect(()=>{
    const handler=e=>{
      if(e.origin!==window.location.origin||e.source!==frame.current?.contentWindow)return;
      if(e.data?.type==='mira-lab:ready')frame.current.contentWindow.postMessage({type:'mira-lab:init',...bridgeData.current},window.location.origin);
      if(e.data?.type==='mira-lab:return'){setRoute(activity?.origin||'activities');setActivity(null);}
      if(e.data?.type==='mira-lab:outputs'&&Array.isArray(e.data.outputs))setOutputs(e.data.outputs);
      if(e.data?.type==='mira-lab:preference'&&activity){
        setPreferred(ids=>e.data.value==='Use again'?[activity.id,...ids.filter(id=>id!==activity.id)]:ids.filter(id=>id!==activity.id));
      }
    };
    window.addEventListener('message',handler);return()=>window.removeEventListener('message',handler);
  },[activity]);
  const activeTab=route==='activity'?'activities':route.startsWith('journal')?'journal':route;
  const title=activeTab==='journal'?copy('journal.title'):activeTab==='activities'?copy('activities.title'):'';
  const showKeyboard=keyboard&&(route==='talk'||route==='journal-entry');
  const logoFilter=logo==='signature-forest'?'grayscale(1) brightness(0) saturate(100%) invert(29%) sepia(12%) saturate(830%) hue-rotate(95deg) brightness(90%) contrast(85%)':logo==='signature-black'?'grayscale(1) brightness(0) saturate(100%)':'none';
  const colors=paletteOptions[theme]?.colors||paletteOptions['warm-light'].colors;
  return <main className={`selected-lab ${screenOnly?'screen-only':''} ${motion&&visible&&route==='talk'?'motion-on':''}`} style={{...Object.fromEntries(Object.entries(colors).map(([k,v])=>['--'+k,v])),'--font':"'Nunito Sans'",'--display':"'Nunito Sans'",'--width':width+'px'}}>
    <header className="lab-heading"><div><p className="eyebrow">MIRA / DIRECTION A</p><h1>Little company.</h1><p>Interactive UI study · voice, audio, AI replies and saving are simulated · memory resets on reload</p></div><div className="lab-links"><a href="/design/step-07/visual-language.html">Visual language</a><a href="/design/theme-options/comparison.html">Compare palettes</a><a href="/design/logo-options/comparison.html">Logo comparison</a><a href="/control.html">Previous control</a><a href="/design/step-04/comparison-board.html">Compare A / B / C</a></div></header>
    <aside className="lab-toolbar" aria-label="Preview controls">
      <label>Logo color<select value={logo} onChange={e=>setLogo(e.target.value)}><option value="signature-blue">Casual signature / blue</option><option value="signature-forest">Casual signature / forest</option><option value="signature-black">Casual signature / black</option></select></label>
      <label>Palette<select value={theme} onChange={e=>setTheme(e.target.value)}>{Object.entries(paletteOptions).map(([id,item])=><option value={id} key={id}>{item.label}</option>)}</select></label>
      <label>Phone width<select value={width} onChange={e=>setWidth(e.target.value)}><option>360</option><option>412</option></select></label>
      <label>Next Talk reply<select value={talkOutcome} onChange={e=>setTalkOutcome(e.target.value)}><option value="offer">Reply + activity offer</option><option value="reply">Reply only</option><option value="error">Voice / text failure</option><option value="offline">Worker unavailable</option></select></label>
      <label>Next Journal result<select value={journalOutcome} onChange={e=>setJournalOutcome(e.target.value)}><option value="success">Save + follow-up</option><option value="followup-failure">Saved / follow-up unavailable</option><option value="save-failure">Save failed</option></select></label>
      <label className="check"><input type="checkbox" checked={localError} onChange={e=>setLocalError(e.target.checked)}/> Saved-item read failure</label>
      <label className="check"><input type="checkbox" checked={keyboard} onChange={e=>setKeyboard(e.target.checked)}/> Keyboard layout</label>
      <label className="check"><input type="checkbox" checked={motion} onChange={e=>setMotion(e.target.checked)}/> Motion</label>
      <button className="sample-control" onClick={()=>{setPreferred(['one_small_step']);setOutputs(previewFixtures.outputs);setSampleVersion(n=>n+1);navigate('activities');}}>Load sample state</button>
    </aside>
    <div className="live-phone-shell"><section className={`phone a live-phone ${showKeyboard?'has-keyboard':''}`} aria-label="Mira selected design">
      <div className="system"><span>9:41</span><span className="system-icons"><Icon name="signal"/><Icon name="wifi"/><Icon name="battery-80"/></span></div>
      <header className="phone-header">{route==='activity'?<Button icon="arrow-left" onClick={()=>{navigate(activity.origin);setActivity(null);}}>Back to {activity.origin==='talk'?'Talk':'Activities'}</Button>:route==='journal-read'?<Button icon="arrow-left" onClick={()=>navigate('journal-home')}>Journal</Button>:activeTab==='talk'?<img className="handwritten-brand" src="/design/logo-options/04-casual-signature.png" alt="Mira" style={{filter:logoFilter}}/>:<h1>{title}</h1>}<Button className="help" icon="help-circle-outline" onClick={()=>setHelp(true)}>{copy('shared.help')}</Button></header>
      <div className="surface-slot" hidden={route!=='talk'}><Talk active={route==='talk'} outcome={talkOutcome} onActivity={launch} keyboard={keyboard} setKeyboard={setKeyboard} approvedExcerpt={approvedExcerpt}/></div>
      {route==='activities'&&<Activities preferred={preferred} outputs={outputs} setOutputs={setOutputs} onActivity={launch} onJournal={()=>navigate('journal-home')} localError={localError}/>}
      <div className="surface-slot" hidden={!route.startsWith('journal')}><Journal route={route} navigate={navigate} newVersion={newVersion} sampleVersion={sampleVersion} outcome={journalOutcome} setKeyboard={setKeyboard} onFinish={()=>navigate(journalOrigin)} onApprove={setApprovedExcerpt}/></div>
      {route==='activity'&&activity&&<iframe ref={frame} key={activity.key} className="activity-frame" title={fixtures.activities.all.find(a=>a.id===activity.id)?.title||'Activity'} src={`/control.html?embedded=1&labActivity=${encodeURIComponent(activity.id)}&labOrigin=${activity.origin}`}/>}
      {showKeyboard&&<Keyboard/>}
      {route!=='activity'&&!showKeyboard&&<nav className="nav" aria-label="Main navigation">{[['talk','Talk','microphone-outline'],['activities','Activities','shape-outline'],['journal','Journal','notebook-outline']].map(([id,label,icon])=><Button key={id} className={activeTab===id?'active':''} aria-current={activeTab===id?'page':undefined} icon={icon} onClick={()=>id==='journal'?journalTab():navigate(id)}>{label}</Button>)}</nav>}
      {help&&<Sheet title={copy('shared.help')} onClose={()=>setHelp(false)}><p>How can we support you right now?</p><p className="support muted">This UI study doesn’t connect support services.</p><Button className="primary" onClick={()=>{setHelp(false);navigate('talk');}}>Return to Talk</Button></Sheet>}
    </section></div>
    <footer className="lab-footer">75% preview · bundled catalog and local assets · browser simulation only · native app unchanged</footer>
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
