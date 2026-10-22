import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/600.css';
import '@fontsource/roboto/700.css';
import catalog from './activities.json';
import iconMap from './material-design-icons.json';
import './style.css';

const activityStartScreens = {
  grounding: 'ground-start', paced_breathing: 'breath-ready', brain_dump: 'brain-edit',
  unsent_letter: 'letter-home', name_a_feeling: 'feeling-pick', reach_out: 'reach-intent',
  short_movement: 'move-pick', one_song_break: 'song-ready',
};

const labParams = new URLSearchParams(window.location.search);
const embeddedActivity = labParams.get('embedded') === '1';
const launchActivityId = labParams.get('labActivity');
const returnLabel = embeddedActivity && labParams.get('labOrigin') === 'talk' ? 'Return to Talk' : 'Return to Activities';
if (embeddedActivity) document.body.classList.add('embedded-activity');

function App() {
  const [tab, setTab] = useState(embeddedActivity ? 'Activities' : 'Talk');
  const [voice, setVoice] = useState(false);
  const [typed, setTyped] = useState(false);
  const [talkDraft, setTalkDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [activityPreference, setActivityPreference] = useState('');
  const [help, setHelp] = useState(false);
  const [activity, setActivity] = useState(() => {
    if (!embeddedActivity) return null;
    const item = catalog.activities.find(value => value.id === launchActivityId);
    const icon = ({ grounding: 'eye-outline', brain_dump: 'notebook-edit-outline', one_small_step: 'checkbox-marked-circle-outline', name_a_feeling: 'emoticon-outline', unsent_letter: 'email-edit-outline', reach_out: 'message-text-outline', short_movement: 'walk', one_song_break: 'music-note-outline', paced_breathing: 'account-switch-outline' })[launchActivityId];
    return item ? { ...item, icon } : null;
  });
  const [activityStep, setActivityStep] = useState('');
  const [task, setTask] = useState('');
  const [firstMove, setFirstMove] = useState('');
  const [cue, setCue] = useState('');
  const [tried, setTried] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [choice, setChoice] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [noticeCount, setNoticeCount] = useState(0);
  const [breathing, setBreathing] = useState(false);
  const [savedOutputs, setSavedOutputs] = useState([]);
  const [selectedOutput, setSelectedOutput] = useState(null);
  const [journalScreen, setJournalScreen] = useState('home');
  const [journalText, setJournalText] = useState('');
  const [savedJournal, setSavedJournal] = useState(null);

  const activityById = Object.fromEntries(catalog.activities.map((item) => [item.id, item]));

  useEffect(() => {
    if (!embeddedActivity) return;
    const receive = event => {
      if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.type !== 'mira-lab:init') return;
      if (Array.isArray(event.data.outputs)) setSavedOutputs(event.data.outputs);
      if (event.data.resume && launchActivityId === 'one_small_step') {
        setTask(event.data.resume.title || ''); setFirstMove(event.data.resume.body || ''); setActivityStep('card');
      }
      if (event.data.resume && launchActivityId === 'reach_out') {
        setChoice(event.data.resume.title || ''); setDraft(event.data.resume.body || ''); setActivityStep('reach-review');
      }
    };
    window.addEventListener('message', receive);
    window.parent.postMessage({ type: 'mira-lab:ready' }, window.location.origin);
    return () => window.removeEventListener('message', receive);
  }, []);
  useEffect(() => {
    if (embeddedActivity && !activity) window.parent.postMessage({ type: 'mira-lab:return' }, window.location.origin);
  }, [activity]);
  useEffect(() => {
    if (embeddedActivity && savedOutputs.length) window.parent.postMessage({ type: 'mira-lab:outputs', outputs: savedOutputs }, window.location.origin);
  }, [savedOutputs]);
  useEffect(() => {
    if (embeddedActivity && activityPreference) window.parent.postMessage({ type: 'mira-lab:preference', value: activityPreference }, window.location.origin);
  }, [activityPreference]);

  return (
    <main className="phone">
      <header className="topbar">
        <div className="wordmark">Mira</div>
        <button className="help" onClick={() => setHelp(!help)} aria-expanded={help}>
          <Icon name="help-circle-outline" size={20} color="#183A35" /> Help
        </button>
      </header>

      {help && <div className="help-popover">How can we support you right now?</div>}

      {tab === 'Talk' ? (
        typed ? (
          <section className="talk-chat">
            <div className="chat-heading"><div className="chat-avatar">M</div><div><strong>Talk with Mira</strong><small>Text conversation</small></div></div>
            <div className="chat-feed">
              {messages.length ? messages.map((message, index) => <div className={`chat-bubble ${message.role}`} key={index}>{message.text}{message.proposal && <div className="talk-proposal"><strong>One Small Step</strong><button onClick={() => { const item = activityById.one_small_step; setActivity({ ...item, icon: 'checkbox-marked-circle-outline' }); setActivityStep(''); setTab('Activities'); }}>Explore this activity</button><button className="proposal-dismiss" onClick={() => setMessages((items) => items.map((item, at) => at === index ? { ...item, proposal: false } : item))}>Not now</button></div>}</div>) : <div className="chat-welcome"><div className="chat-avatar large">M</div><h1>What’s on your mind?</h1><p>You can start anywhere.</p></div>}
            </div>
            <form className="chat-composer" onSubmit={(event) => {
              event.preventDefault();
              const text = talkDraft.trim();
              if (!text) return;
              setMessages((items) => [...items, { role: 'you', text }, { role: 'mira', text: 'Thank you for sharing that. Would one small next step help right now?', proposal: true }]);
              setTalkDraft('');
            }}>
              <textarea rows="2" value={talkDraft} onChange={(event) => setTalkDraft(event.target.value)} placeholder="Write a message…" />
              <button className="send-button" disabled={!talkDraft.trim()} aria-label="Send message"><Icon name="send" size={18} /></button>
            </form>
            <button className="text-action" onClick={() => setTyped(false)}>Switch to voice</button>
          </section>
        ) : (
        <>
          <section className="talk-content">
            <div className="mascot-stage" aria-label="Mira mascot">
              <div className="halo">
                <span className="sparkle sparkle-one" />
                <span className="sparkle sparkle-two" />
                <span className="mascot-shadow" />
                <div className="mascot">
                  <span className="sprout-stem" />
                  <span className="sprout-leaf" />
                  <span className="arm arm-left" />
                  <span className="arm arm-right" />
                  <div className="face">
                    <div className="eyes"><i /><i /></div>
                    <div className="smile" />
                    <i className="cheek cheek-left" />
                    <i className="cheek cheek-right" />
                  </div>
                </div>
              </div>
            </div>
            <h1>{voice ? 'I’m listening' : typed ? 'What’s on your mind?' : 'Welcome'}</h1>
            <p>{voice ? 'Hold the mic while you speak.' : 'A little space to talk things through.'}</p>
          </section>

          <section className="controls">
            <button className="side-control" onClick={() => setTyped(!typed)}>
              <span className="type-icon">Aa</span><small>Type</small>
            </button>
            <button
              className={`mic ${voice ? 'mic-active' : ''}`}
              onPointerDown={() => setVoice(true)}
              onPointerUp={() => setVoice(false)}
              onPointerLeave={() => setVoice(false)}
              aria-label="Hold to talk"
            >
              <Icon name="microphone" size={56} color="#F6F6F6" />
            </button>
            <button className="side-control close-control" onClick={() => { setVoice(false); setTyped(false); }} aria-label="End conversation">
              <Icon name="close" size={32} color="#748278" />
            </button>
          </section>
          <p className="control-hint">Hold the mic to talk, or type instead</p>
        </>
        )
      ) : tab === 'Activities' ? (
        activity?.id === 'one_small_step' && activityStep ? (
          <section className="activity-flow">
            <button className="back-link" onClick={() => setActivityStep('')}>‹ &nbsp; One Small Step</button>
            {activityStep === 'edit' && <>
              <div className="activity-art small-step-art"><Icon name="checkbox-marked-circle-outline" size={50} color="#3c805e" /></div>
              <span className="eyebrow">YOUR TASK</span>
              <h1>What do you want to move forward?</h1>
              <p>Name one task, then write a first move that feels small enough to begin.</p>
              <label>Task<textarea value={task} onChange={(event) => setTask(event.target.value)} placeholder="Name the task in your own words" /></label>
              <label>Your first move<textarea value={firstMove} onChange={(event) => setFirstMove(event.target.value)} placeholder="Write one small, clear action" /></label>
              <button className="secondary-action" disabled={!task.trim()} onClick={() => setFirstMove(`Open ${task.trim()} and spend two minutes on the first part.`)}>Suggest a first move</button>
              <button className="primary-action" disabled={!firstMove.trim()} onClick={() => setActivityStep('card')}>Review my action card</button>
            </>}
            {activityStep === 'card' && <>
              <div className="activity-art small-step-art"><Icon name="checkbox-marked-circle-outline" size={50} color="#3c805e" /></div>
              <span className="eyebrow">YOUR NEXT ACTION</span>
              <h1>A first move you can change.</h1>
              <label>Task<textarea value={task} onChange={(event) => setTask(event.target.value)} /></label>
              <label>First move<textarea value={firstMove} onChange={(event) => setFirstMove(event.target.value)} /></label>
              <label>When might this fit? <span className="optional">Optional</span><input value={cue} onChange={(event) => setCue(event.target.value)} placeholder="A time or moment that works for you" /></label>
              <p className="flow-note">This is a cue for you, not a reminder.</p>
              <button className="primary-action" disabled={!firstMove.trim()} onClick={() => setActivityStep('trying')}>Try this move</button>
              <button className="secondary-action" onClick={() => { setSavedOutputs((items) => [{ kind: 'One Small Step', title: task, body: firstMove }, ...items]); setTried(false); setActivityStep('done'); }}>Save for later</button>
            </>}
            {activityStep === 'trying' && <>
              <div className="activity-art small-step-art"><Icon name="checkbox-marked-circle-outline" size={50} color="#3c805e" /></div>
              <span className="eyebrow">TRY THE FIRST MOVE</span>
              <h1>{firstMove}</h1>
              <p>You decide how long to spend. There’s no need to finish the whole task.</p>
              <button className="primary-action flow-bottom" onClick={() => setActivityStep('checkin')}>I’m ready to check in</button>
              <button className="secondary-action" onClick={() => setActivityStep('card')}>Back to action card</button>
            </>}
            {activityStep === 'checkin' && <>
              <div className="activity-art small-step-art"><Icon name="emoticon-outline" size={50} color="#3c805e" /></div>
              <span className="eyebrow">CHECK IN</span>
              <h1>How did that go?</h1>
              <p className="checkin-move">{firstMove}</p>
              <p>Only you know what happened. Choose what fits.</p>
              <button className="primary-action flow-bottom" onClick={() => { setTried(true); setActivityStep('done'); }}>I tried it</button>
              <button className="secondary-action" onClick={() => { setTried(false); setActivityStep('done'); }}>Not this time</button>
              <button className="text-action" onClick={() => setActivityStep('card')}>Back to action card</button>
            </>}
            {activityStep === 'done' && <>
              <div className="activity-art small-step-art"><Icon name={tried ? 'check-circle-outline' : 'checkbox-marked-circle-outline'} size={50} color="#3c805e" /></div>
              <span className="eyebrow">YOUR CHOICE</span>
              <h1>{tried ? 'You marked this move as tried.' : 'You can return to this when you want.'}</h1>
              <p className="checkin-move">{firstMove}</p>
              {cue && <p className="flow-note">Your cue: {cue}</p>}
              {!activityPreference ? <div className="preference-prompt"><span className="eyebrow">ONE SMALL STEP · OPTIONAL</span><h2>Would you like Mira to suggest this again?</h2><button className="secondary-action" onClick={() => setActivityPreference('Use again')}>Use again</button><button className="text-action" onClick={() => setActivityPreference('Keep private')}>Keep it private</button></div> : <p className="flow-note">{activityPreference} saved for this mock session.</p>}
              <button className="primary-action flow-bottom" onClick={() => { setActivityStep(''); setActivity(null); }}>{returnLabel}</button>
            </>}
          </section>
        ) : activity?.id === 'saved_outputs' && activityStep === 'outputs' ? (
          <section className="activity-flow">
            <button className="back-link" onClick={() => { setActivity(null); setActivityStep(''); }}>‹ &nbsp; Activities</button>
            <span className="eyebrow">YOUR WRITING AND ACTIVITY WORK</span>
            <h1>Saved work</h1>
            {savedOutputs.length ? savedOutputs.map((item, index) => (
              <button className="output-row" key={`${item.kind}-${index}`} onClick={() => { setSelectedOutput(item); setActivityStep('output-detail'); }}>
                <strong>{item.title || item.kind}</strong><small>{item.kind} · {item.body}</small>
              </button>
            )) : <p>Things you choose to save from activities will appear here.</p>}
          </section>
        ) : activity?.id === 'saved_outputs' && activityStep === 'output-detail' && selectedOutput ? (
          <section className="activity-flow">
            <button className="back-link" onClick={() => setActivityStep('outputs')}>‹ &nbsp; Saved work</button>
            <span className="eyebrow">{selectedOutput.kind}</span>
            <h1>{selectedOutput.title || selectedOutput.kind}</h1>
            <div className="saved-output-body">{selectedOutput.body}</div>
          </section>
        ) : activity && activityStep ? (
          <section className="activity-flow">
            <button className="back-link" onClick={() => setActivityStep('')}>‹ &nbsp; {activity.title}</button>

            {activity.id === 'grounding' && activityStep === 'ground-start' && <>
              <div className="activity-art"><Icon name="eye-outline" size={48} color="#3c805e" /></div><span className="eyebrow">FOLLOW A GUIDE</span><h1>Notice what is here, one sense at a time.</h1>
              <p>Look around, listen, and notice a comfortable point of contact. Skip any part or leave whenever you like.</p>
              <button className="primary-action flow-bottom" onClick={() => { setStepIndex(0); setNoticeCount(0); setActivityStep('ground-active'); }}>Begin</button>
            </>}
            {activity.id === 'grounding' && activityStep === 'ground-active' && <>
              <div className="activity-art"><Icon name={['eye-outline', 'ear-hearing', 'seat-outline'][stepIndex]} size={48} color="#3c805e" /></div><span className="eyebrow">NOTICE AT YOUR PACE · {stepIndex + 1} OF 3</span>
              <h1>{['Notice 3 things you can see.', 'Notice 2 things you can hear.', 'Notice one comfortable point of contact.'][stepIndex]}</h1>
              <p>{noticeCount} noticed. You can skip any sense.</p>
              <div className="notice-dots">{Array.from({ length: [3, 2, 1][stepIndex] }, (_, i) => <i className={i < noticeCount ? 'filled' : ''} key={i} />)}</div>
              <button className="secondary-action" onClick={() => setNoticeCount((value) => Math.min(value + 1, [3, 2, 1][stepIndex]))}>I noticed one</button>
              <button className="primary-action flow-bottom" disabled={!noticeCount} onClick={() => { if (stepIndex === 2) setActivityStep('ground-done'); else { setStepIndex((value) => value + 1); setNoticeCount(0); } }}>{stepIndex === 2 ? 'Finish' : 'Continue'}</button>
              <button className="text-action" onClick={() => { if (stepIndex === 2) setActivityStep('ground-done'); else { setStepIndex((value) => value + 1); setNoticeCount(0); } }}>Skip this sense</button>
            </>}
            {activity.id === 'grounding' && activityStep === 'ground-done' && <>
              <div className="activity-art"><Icon name="flower-outline" size={48} color="#3c805e" /></div><span className="eyebrow">GROUNDING COMPLETE</span><h1>You moved through the guide.</h1><p>You noticed your surroundings at your own pace. You can return to this activity whenever you like.</p>
              <button className="primary-action flow-bottom" onClick={() => { setActivity(null); setActivityStep(''); }}>Finish</button>
            </>}

            {activity.id === 'paced_breathing' && activityStep === 'breath-ready' && <>
              <div className="breath-orb"/><span className="eyebrow">FOLLOW A GUIDE</span><h1>Paced breathing</h1><p>Choose a rhythm or follow your own pace. Stop or pause whenever you like.</p>
              {['Even rhythm · in for 4, out for 4', 'Longer exhale · in for 4, out for 6', 'My own pace · no counting'].map((item) => <button className={`choice-row ${choice === item ? 'chosen' : ''}`} key={item} onClick={() => setChoice(item)}>{item}</button>)}
              <button className="primary-action flow-bottom" onClick={() => { setBreathing(true); setActivityStep('breath-active'); }}>Begin</button>
            </>}
            {activity.id === 'paced_breathing' && activityStep === 'breath-active' && <>
              <div className={`breath-orb ${breathing ? 'breathing' : ''}`}/><span className="eyebrow">YOUR OWN PACE</span><h1>{breathing ? 'Breathe gently' : 'Paused'}</h1><p>There is no right pace. Let your breath stay comfortable.</p>
              <button className="primary-action flow-bottom" onClick={() => { setBreathing(false); setActivityStep('breath-done'); }}>Finish</button>
              <button className="secondary-action" onClick={() => setBreathing((value) => !value)}>{breathing ? 'Pause' : 'Resume'}</button>
            </>}
            {activity.id === 'paced_breathing' && activityStep === 'breath-done' && <>
              <div className="breath-orb"/><span className="eyebrow">BREATHING COMPLETE</span><h1>You made space for a pause.</h1><p>Your breathing session was not saved.</p>
              <button className="primary-action flow-bottom" onClick={() => { setActivity(null); setActivityStep(''); }}>Finish</button>
            </>}

            {activity.id === 'brain_dump' && activityStep === 'brain-edit' && <>
              <div className="activity-art"><Icon name="notebook-edit-outline" size={48} color="#3c805e" /></div><span className="eyebrow">EXPRESS · BRAIN DUMP</span><h1>Put the thoughts somewhere.</h1><p>Write freely. Sorting it is optional. This draft is temporary.</p>
              <textarea className="large-writing" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Start anywhere…" />
              <button className="primary-action flow-bottom" disabled={!draft.trim()} onClick={() => setActivityStep('brain-review')}>Done · read it back</button>
              <button className="text-action" onClick={() => { setDraft(''); setActivityStep(''); }}>Clear and leave</button>
            </>}
            {activity.id === 'brain_dump' && activityStep === 'brain-review' && <>
              <span className="eyebrow">YOUR WORDS</span><h1>Read it back, if you like.</h1><div className="saved-output-body">{draft}</div>
              <p>This draft is temporary and stays inside this activity.</p>
              <button className="primary-action flow-bottom" onClick={() => { setDraft(''); setActivityStep('brain-done'); }}>Finish</button>
              <button className="secondary-action" onClick={() => setActivityStep('brain-edit')}>Edit</button>
            </>}
            {activity.id === 'brain_dump' && activityStep === 'brain-done' && <>
              <div className="activity-art"><Icon name="check-circle-outline" size={48} color="#3c805e" /></div><span className="eyebrow">DONE</span><h1>You can leave those thoughts here.</h1><p>Your writing was not saved.</p>
              <button className="primary-action flow-bottom" onClick={() => { setActivityStep(''); setActivity(null); }}>{returnLabel}</button>
            </>}

            {activity.id === 'unsent_letter' && activityStep === 'letter-home' && <>
              <div className="activity-art"><Icon name="email-edit-outline" size={48} color="#3c805e" /></div><span className="eyebrow">EXPRESS · UNSENT LETTER</span><h1>A letter that stays yours.</h1><p>Write what you wish you could say. Read it back or save it privately.</p>
              <button className="primary-action flow-bottom" onClick={() => { setDraft(''); setDraftTitle(''); setActivityStep('letter-edit'); }}>Write a new letter</button>
              <button className="secondary-action" onClick={() => setActivityStep('letter-library')}>Saved letters ({savedOutputs.filter((item) => item.kind === 'Unsent Letter').length})</button>
            </>}
            {activity.id === 'unsent_letter' && activityStep === 'letter-edit' && <>
              <div className="activity-art"><Icon name="email-edit-outline" size={48} color="#3c805e" /></div><span className="eyebrow">UNSENT LETTER</span><h1>Write what you wish you could say.</h1>
              <input className="field-input" value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} placeholder="Letter title (optional)" />
              <div className="prompt-chips">{['What happened?', 'What I needed', 'What I want now'].map((line) => <button key={line} onClick={() => setDraft((value) => `${value}${value ? '\n\n' : ''}${line}\n`)}>{line}</button>)}</div>
              <textarea className="large-writing letter-writing" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a few words, or as much as you want…" />
              <button className="primary-action flow-bottom" disabled={!draft.trim()} onClick={() => setActivityStep('letter-read')}>Read letter</button>
              <button className="secondary-action" disabled={!draft.trim()} onClick={() => { const item = { kind: 'Unsent Letter', title: draftTitle || 'Unsent letter', body: draft }; setSavedOutputs((items) => [item, ...items]); setActivityStep('letter-home'); }}>Save letter on this device</button>
            </>}
            {activity.id === 'unsent_letter' && activityStep === 'letter-read' && <>
              <div className="activity-art"><Icon name="email-open-outline" size={48} color="#3c805e" /></div><span className="eyebrow">YOUR LETTER</span><h1>{draftTitle || 'Unsent letter'}</h1><div className="saved-output-body letter-read">{draft}</div><p>This draft is temporary unless you choose to save it.</p>
              <button className="primary-action flow-bottom" onClick={() => { const item = { kind: 'Unsent Letter', title: draftTitle || 'Unsent letter', body: draft }; setSavedOutputs((items) => [item, ...items]); setActivityStep('letter-home'); }}>Save letter on this device</button>
              <button className="secondary-action" onClick={() => setActivityStep('letter-edit')}>Return to writing</button>
            </>}
            {activity.id === 'unsent_letter' && activityStep === 'letter-library' && <>
              <span className="eyebrow">PRIVATE ON THIS DEVICE</span><h1>Saved letters</h1>
              {savedOutputs.filter((item) => item.kind === 'Unsent Letter').length ? savedOutputs.filter((item) => item.kind === 'Unsent Letter').map((item, i) => <button className="output-row" key={i} onClick={() => { setSelectedOutput(item); setActivityStep('letter-saved-read'); }}><strong>{item.title}</strong><small>{item.body}</small></button>) : <p>No saved letters yet. A letter appears here only when you choose Save.</p>}
              <button className="secondary-action" onClick={() => setActivityStep('letter-home')}>Back to Letter home</button>
            </>}
            {activity.id === 'unsent_letter' && activityStep === 'letter-saved-read' && selectedOutput && <>
              <span className="eyebrow">SAVED LETTER</span><h1>{selectedOutput.title}</h1><div className="saved-output-body letter-read">{selectedOutput.body}</div>
              <button className="secondary-action" onClick={() => setActivityStep('letter-library')}>Back to Saved letters</button>
            </>}

            {activity.id === 'name_a_feeling' && activityStep === 'feeling-pick' && <>
              <div className="activity-art"><Icon name="emoticon-outline" size={48} color="#3c805e" /></div><span className="eyebrow">NOTICE & NAME</span><h1>What comes closest to this moment?</h1><p>Choose a word, use your own, or leave it uncertain.</p>
              <div className="feeling-grid">{['Calm', 'Worried', 'Sad', 'Frustrated', 'Hopeful', 'Numb', 'Something else', 'Not sure'].map((item) => <button className={choice === item ? 'chosen' : ''} key={item} onClick={() => setChoice(item)}>{item}</button>)}</div>
              <button className="primary-action flow-bottom" disabled={!choice} onClick={() => setActivityStep('feeling-note')}>Continue</button>
            </>}
            {activity.id === 'name_a_feeling' && activityStep === 'feeling-note' && <>
              <span className="eyebrow">NOTICE & NAME</span><h1>{choice} is here right now.</h1><p>You can add a few words, or finish here.</p>
              <textarea className="large-writing" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Anything you want to add? (Optional)" />
              <button className="primary-action flow-bottom" onClick={() => setActivityStep('feeling-done')}>Finish</button>
            </>}
            {activity.id === 'name_a_feeling' && activityStep === 'feeling-done' && <>
              <div className="activity-art"><Icon name="emoticon-happy-outline" size={48} color="#3c805e" /></div><span className="eyebrow">YOUR WORDS</span><h1>You named {choice.toLowerCase()}.</h1><p>{draft || 'You can let that be enough for now.'}</p>
              <button className="primary-action flow-bottom" onClick={() => { setActivityStep(''); setActivity(null); setDraft(''); setChoice(''); }}>Finish</button>
            </>}

            {activity.id === 'reach_out' && activityStep === 'reach-intent' && <>
              <div className="activity-art"><Icon name="message-text-outline" size={48} color="#3c805e" /></div><span className="eyebrow">MOVE FORWARD · REACH OUT</span><h1>What would feel helpful to ask for?</h1>
              <div className="feeling-grid">{['A listening ear', 'Practical help', 'Company', 'Something else'].map((item) => <button className={choice === item ? 'chosen' : ''} key={item} onClick={() => setChoice(item)}>{item}</button>)}</div>
              <button className="primary-action flow-bottom" disabled={!choice} onClick={() => setActivityStep('reach-write')}>Write a message</button>
            </>}
            {activity.id === 'reach_out' && activityStep === 'reach-write' && <>
              <span className="eyebrow">REACH OUT · YOUR WORDS</span><h1>Write it how you would say it.</h1><p>You can edit this message before deciding what to do with it.</p>
              <textarea className="large-writing" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message…" />
              <button className="primary-action flow-bottom" disabled={!draft.trim()} onClick={() => setActivityStep('reach-review')}>Review message</button>
            </>}
            {activity.id === 'reach_out' && activityStep === 'reach-review' && <>
              <span className="eyebrow">REACH OUT · REVIEW</span><h1>Does this sound like you?</h1><div className="saved-output-body">{draft}</div><p>Nothing is sent from this prototype.</p>
              <button className="primary-action flow-bottom" onClick={() => { setSavedOutputs((items) => [{ kind: 'Reach Out draft', title: choice, body: draft }, ...items]); setActivityStep('reach-done'); }}>Keep for later</button>
              <button className="secondary-action" onClick={() => setActivityStep('reach-write')}>Edit message</button>
            </>}
            {activity.id === 'reach_out' && activityStep === 'reach-done' && <>
              <div className="activity-art"><Icon name="check-circle-outline" size={48} color="#3c805e" /></div><span className="eyebrow">SAVED ON THIS DEVICE</span><h1>Your draft is here when you need it.</h1>
              <button className="primary-action flow-bottom" onClick={() => { setActivityStep(''); setActivity(null); setDraft(''); }}>{returnLabel}</button>
            </>}

            {activity.id === 'short_movement' && activityStep === 'move-pick' && <>
              <div className="activity-art movement-art"><Icon name="walk" size={48} color="#3c805e" /></div><span className="eyebrow">TAKE A BREAK</span><h1>Change your scene.</h1><p>Choose what feels comfortable. Movement is optional.</p>
              <div className="feeling-grid">{['A short walk', 'Stretch or move', 'Change where I am', 'No-movement break'].map((item) => <button className={choice === item ? 'chosen' : ''} key={item} onClick={() => setChoice(item)}>{item}</button>)}</div>
              <button className="primary-action flow-bottom" disabled={!choice} onClick={() => setActivityStep('move-active')}>Continue</button>
            </>}
            {activity.id === 'short_movement' && activityStep === 'move-active' && <>
              <div className="activity-art movement-art"><Icon name="walk" size={48} color="#3c805e" /></div><span className="eyebrow">YOUR BREAK</span><h1>{choice}</h1><p>Take the time you want. You can stop whenever you like.</p>
              <button className="primary-action flow-bottom" onClick={() => setActivityStep('move-done')}>I’m ready to return</button>
              <button className="secondary-action" onClick={() => setActivityStep('move-pick')}>Choose something else</button>
            </>}
            {activity.id === 'short_movement' && activityStep === 'move-done' && <>
              <div className="activity-art movement-art"><Icon name="check-circle-outline" size={48} color="#3c805e" /></div><span className="eyebrow">BREAK COMPLETE</span><h1>You took a moment for yourself.</h1><p>You chose: {choice.toLowerCase()}.</p>
              <button className="primary-action flow-bottom" onClick={() => { setActivityStep(''); setActivity(null); }}>Finish</button>
            </>}

            {activity.id === 'one_song_break' && activityStep === 'song-ready' && <>
              <div className="activity-art song-art"><Icon name="music-note-outline" size={48} color="#9a7847" /></div><span className="eyebrow">TAKE A BREAK</span><h1>One Song Break</h1><p>Choose a song in your music app, or take a quiet minute instead.</p>
              <button className="primary-action flow-bottom" onClick={() => setActivityStep('song-pick')}>Choose a song</button>
              <button className="secondary-action" onClick={() => { setChoice('A quiet minute'); setActivityStep('song-done'); }}>Take a quiet minute</button>
            </>}
            {activity.id === 'one_song_break' && activityStep === 'song-pick' && <>
              <div className="activity-art song-art"><Icon name="music-note-outline" size={48} color="#9a7847" /></div><span className="eyebrow">YOUR SONG</span><h1>What would you like to listen to?</h1><p>Choose music in another app. Mira can’t tell whether it plays.</p>
              <input className="field-input" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Song or artist (optional)" />
              <button className="primary-action flow-bottom" onClick={() => { setChoice(draft || 'A song you chose'); setActivityStep('song-done'); }}>I’ve chosen my song</button>
              <button className="text-action" onClick={() => { setChoice('A quiet minute'); setActivityStep('song-done'); }}>Skip music</button>
            </>}
            {activity.id === 'one_song_break' && activityStep === 'song-done' && <>
              <div className="activity-art song-art"><Icon name="music-note-outline" size={48} color="#9a7847" /></div><span className="eyebrow">YOUR BREAK</span><h1>{choice}</h1><p>Take this moment for as long as you like.</p>
              <button className="primary-action flow-bottom" onClick={() => { setActivityStep(''); setActivity(null); setDraft(''); }}>Finish</button>
            </>}
          </section>
        ) : activity ? (
          <section className="activity-detail">
            <button className="back-link" onClick={() => setActivity(null)}>‹ &nbsp; Activities</button>
            <div className="activity-art"><Icon name={activity.icon} size={48} color="#3c805e" /></div>
            <span className="eyebrow">{activity.category}</span>
            <h1>{activity.title}</h1>
            <p>{activity.summary}</p>
            <div className="detail-note">{activity.goal}</div>
            {activity.id === 'one_small_step' && <button className="primary-action" onClick={() => { setTask(''); setFirstMove(''); setCue(''); setTried(false); setActivityPreference(''); setActivityStep('edit'); }}>Start with a task</button>}
            {activityStartScreens[activity.id] && <button className="primary-action" onClick={() => { setDraft(''); setDraftTitle(''); setChoice(''); setStepIndex(0); setNoticeCount(0); setActivityStep(activityStartScreens[activity.id]); }}>Start activity</button>}
          </section>
        ) : (
          <section className="activities-page">
            <div className="section-heading">
              <span className="eyebrow">A little support, at your pace</span>
              <h1>Activities</h1>
            </div>
            <div className="activity-groups">
              {catalog.library_groups.map((group) => (
                <section className="activity-group" key={group.title}>
                  <h2>{group.title}</h2>
                  {group.ids.map((id) => {
                    const item = activityById[id];
                    const icon = ({ grounding: 'eye-outline', brain_dump: 'notebook-edit-outline', one_small_step: 'checkbox-marked-circle-outline', name_a_feeling: 'emoticon-outline', unsent_letter: 'email-edit-outline', reach_out: 'message-text-outline', short_movement: 'walk', one_song_break: 'music-note-outline', paced_breathing: 'account-switch-outline' })[id];
                    return (
                      <button className="activity-row" key={id} onClick={() => setActivity({ ...item, icon })}>
                        <span className="activity-icon"><Icon name={icon} size={22} color="#3c805e" /></span>
                        <span className="activity-copy"><strong>{item.title}</strong><small>{item.summary}</small></span>
                        <Icon name="chevron-right" size={22} color="#83918c" />
                      </button>
                    );
                  })}
                </section>
              ))}
            </div>
            <section className="activity-group">
              <h2>Your work</h2>
              <button className="activity-row" onClick={() => { setActivity({ id: 'saved_outputs' }); setActivityStep('outputs'); }}>
                <span className="activity-icon"><Icon name="bookmark-multiple-outline" size={22} color="#3c805e" /></span>
                <span className="activity-copy"><strong>Saved work</strong><small>Letters, message drafts, and action cards you chose to keep.</small></span>
                <Icon name="chevron-right" size={22} color="#83918c" />
              </button>
            </section>
            <section className="activity-group journal-activity-link">
              <h2>Write it out</h2>
              <button className="activity-row" onClick={() => { setTab('Journal'); setJournalScreen('home'); }}>
                <span className="activity-icon"><Icon name="book-open-page-variant-outline" size={22} color="#3c805e" /></span>
                <span className="activity-copy"><strong>Journal</strong><small>A space to put it into words.</small></span>
                <Icon name="chevron-right" size={22} color="#83918c" />
              </button>
            </section>
          </section>
        )
      ) : tab === 'Journal' ? (
        journalScreen === 'editor' ? (
          <section className="journal-editor">
            <button className="back-link" onClick={() => setJournalScreen('home')}><Icon name="arrow-left" size={18} /> Journal</button>
            <div className="journal-editor-heading">
              <span className="eyebrow">A private space for you</span>
              <h1>Take a moment to write.</h1>
              <p>Start anywhere. This entry is yours.</p>
            </div>
            <textarea
              value={journalText}
              onChange={(event) => setJournalText(event.target.value)}
              placeholder="What would you like to put into words?"
              autoFocus
            />
            <button className="primary-action" onClick={() => {
              if (journalText.trim()) setSavedJournal(journalText.trim());
              setJournalScreen('home');
            }}>Save entry</button>
          </section>
        ) : (
          <section className="journal-home">
            <span className="eyebrow">Journal</span>
            <h1>A space to put it into words.</h1>
            <button className="new-entry" onClick={() => { setJournalText(''); setJournalScreen('editor'); }}>
              <span className="new-entry-plus"><Icon name="plus" size={24} /></span>
              <span><strong>New entry</strong><small>Write at your own pace</small></span>
              <Icon name="chevron-right" size={24} />
            </button>
            <div className="recent-heading"><h2>Recent entries</h2></div>
            {savedJournal ? (
              <button className="recent-entry" onClick={() => { setJournalText(savedJournal); setJournalScreen('editor'); }}>
                <strong>Just now</strong><span>{savedJournal}</span><small>Tap to continue writing</small>
              </button>
            ) : (
              <button className="recent-entry" onClick={() => { setJournalText('A thought from last week…'); setJournalScreen('editor'); }}>
                <strong>Last week</strong><span>A thought from your journal</span><small>Tap to open this sample entry</small>
              </button>
            )}
            <p className="journal-footnote">Your words stay on this device.</p>
          </section>
        )
      ) : (
        <section className="coming-soon">
          <h1>{tab}</h1>
          <p>This screen comes in the next UI Lab step.</p>
        </section>
      )}

      <nav className="tabbar" aria-label="Main navigation">
        <button className={tab === 'Talk' ? 'selected' : ''} onClick={() => setTab('Talk')}>
          <Icon name="microphone" size={22} /><span>Talk</span>
        </button>
        <button className={tab === 'Activities' ? 'selected' : ''} onClick={() => { setTab('Activities'); setActivityStep(''); setActivity(null); }}>
          <Icon name="run-fast" size={24} /><span>Activities</span>
        </button>
        <button className={tab === 'Journal' ? 'selected' : ''} onClick={() => { setTab('Journal'); setJournalScreen('editor'); }}>
          <Icon name="book-open-page-variant-outline" size={22} /><span>Journal</span>
        </button>
      </nav>
    </main>
  );
}

function Icon({ name, size = 24, color = 'currentColor' }) {
  const code = iconMap[name] ?? iconMap['help-circle-outline'];
  return <span aria-hidden="true" className="mdi-icon" style={{ fontSize: size, color }}>{String.fromCodePoint(code)}</span>;
}

createRoot(document.getElementById('root')).render(<App />);
