import React, { useEffect, useRef } from 'react';
import icons from '../material-design-icons.json';
import content from '../../design/step-03/comparison-content.json';
export const copy = key => content.copy[key].text;
export const fixtures = content.fixtures;
export function Icon({name, className=''}) { return <i aria-hidden="true" className={`mdi-icon ${className}`}>{String.fromCodePoint(icons[name] || icons['circle-outline'])}</i>; }
export function Button({children, icon, className='', ...props}) { return <button type="button" className={className} {...props}>{icon && <Icon name={icon}/>}<span>{children}</span></button>; }
export function Art({part=0, pose, className=''}) {
  const isPose=pose!==undefined;
  return <div className={className} aria-hidden="true"><svg className="art" viewBox={`${724*(isPose?pose:part)} 0 724 724`}><image href={isPose?'/design/step-06/assets/mascot-poses.png':'/design/step-04/assets/illustrations/a-plate.png'} width="2172" height="724"/></svg></div>;
}
export function Sheet({title,onClose,children}) {
  const ref=useRef(null);
  useEffect(()=>{
    const previous=document.activeElement;
    const node=ref.current;
    const targets=()=>[...node.querySelectorAll('button:not(:disabled),input,textarea,select,a[href]')];
    targets()[0]?.focus();
    const key=e=>{
      if(e.key==='Escape'){e.preventDefault();onClose();}
      if(e.key==='Tab'){
        const list=targets(),first=list[0],last=list.at(-1);
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
      }
    };
    node.addEventListener('keydown',key);
    return ()=>{node.removeEventListener('keydown',key);if(previous?.isConnected)previous.focus();};
  },[]);
  return <div className="sheet-backdrop" onPointerDown={e=>{if(e.target===e.currentTarget)onClose();}}><section ref={ref} className="sheet" role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><Button icon="close" className="icon-button" aria-label={copy('shared.close')} onClick={onClose}/></header>{children}</section></div>;
}
export function Keyboard() {return <div className="keyboard" aria-label="Illustrative keyboard"><div className="key-row">{'qwertyuiop'.split('').map(c=><span key={c} className="key">{c}</span>)}</div><div className="key-row">{'asdfghjkl'.split('').map(c=><span key={c} className="key">{c}</span>)}</div><div className="key-row">{'⇧zxcvbnm⌫'.split('').map(c=><span key={c} className="key">{c}</span>)}</div><div className="key-row"><span className="key">?123</span><span className="key key-space">space</span><span className="key">↵</span></div></div>;}
