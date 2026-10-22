import React from 'react';
import { randomUUID } from 'expo-crypto';
import { createLocalActivityRun, finishLocalActivityRun, type LocalActivityRun } from '../../runtime/activityEngine';
import { requestActivityAssistance, type ThoughtAnglesRequest } from '../../assistance/assistanceClient';
import { saveWording } from '../../../../shared/savedWordings';
import { wordingFor } from './noticeNameData';

export type NoticeNameStage = 'feelings' | 'body' | 'phrase' | 'thought_inputs' | 'thought_results' | 'done';
type AngleId = 'one' | 'two';

export function useNoticeNameExperience() {
  const [runId] = React.useState(() => randomUUID());
  const [run, setRun] = React.useState<LocalActivityRun>(() => createLocalActivityRun(runId, 'name_a_feeling'));
  const [stage, setStage] = React.useState<NoticeNameStage>('feelings');
  const [feelings, setFeelings] = React.useState<string[]>([]);
  const [expandedFeeling, setExpandedFeeling] = React.useState<string>();
  const [customWord, setCustomWord] = React.useState('');
  const [body, setBody] = React.useState<string[]>([]);
  const [sentence, setSentenceState] = React.useState('');
  const [sentenceEdited, setSentenceEdited] = React.useState(false);
  const [situation, setSituationState] = React.useState('');
  const [interpretation, setInterpretationState] = React.useState('');
  const [angles, setAngles] = React.useState<[string, string]>();
  const [selectedAngles, setSelectedAngles] = React.useState<AngleId[]>([]);
  const [angleDraft, setAngleDraft] = React.useState('');
  const [assistance, setAssistance] = React.useState<'idle' | 'requesting' | 'failed'>('idle');
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const revision = React.useRef(0);
  const generation = React.useRef(0);
  const controller = React.useRef<AbortController | undefined>(undefined);

  React.useEffect(() => () => controller.current?.abort(), []);

  function syncSentence(nextFeelings = feelings, nextBody = body) {
    if (!sentenceEdited) setSentenceState(wordingFor(nextFeelings, nextBody));
  }
  function toggleFeeling(value: string) {
    const next = feelings.includes(value) ? feelings.filter((item) => item !== value) : [...feelings, value];
    setFeelings(next); syncSentence(next);
  }
  function toggleBody(value: string) {
    const next = body.includes(value) ? body.filter((item) => item !== value) : [...body, value];
    setBody(next); syncSentence(feelings, next);
  }
  function addCustomWord() {
    const value = customWord.trim().slice(0, 60);
    if (!value) return;
    if (!feelings.includes(value)) toggleFeeling(value);
    setCustomWord('');
  }
  function setSentence(value: string) { setSentenceState(value); setSentenceEdited(true); }

  function invalidateAngles() {
    revision.current += 1;
    generation.current += 1;
    controller.current?.abort(); controller.current = undefined;
    setAngles(undefined); setSelectedAngles([]); setAssistance('idle');
  }
  function setSituation(value: string) { setSituationState(value); invalidateAngles(); }
  function setInterpretation(value: string) { setInterpretationState(value); invalidateAngles(); }

  async function offerAngles() {
    const currentSituation = situation.trim(); const currentInterpretation = interpretation.trim();
    if (!currentSituation || !currentInterpretation || currentSituation.length > 2000 || currentInterpretation.length > 2000) return;
    controller.current?.abort();
    const abortController = new AbortController(); controller.current = abortController;
    const requestId = randomUUID(); const currentGeneration = ++generation.current; const currentRevision = revision.current;
    setAssistance('requesting'); setStatus(''); setAngles(undefined);
    const request: ThoughtAnglesRequest = {
      contract_version: 1, request_id: requestId, activity_run_id: runId, source_revision: currentRevision,
      source_text: `Situation: ${currentSituation}\nInterpretation: ${currentInterpretation}`,
      operation: 'thought_angles', situation: currentSituation, interpretation: currentInterpretation,
    };
    try {
      const response = await requestActivityAssistance(request, abortController.signal);
      if (abortController.signal.aborted || currentGeneration !== generation.current || currentRevision !== revision.current || response.operation !== 'thought_angles' || response.request_id !== requestId) return;
      setAngles([response.angle_one, response.angle_two]); setSelectedAngles([]); setAngleDraft(''); setAssistance('idle'); setStage('thought_results');
    } catch {
      if (!abortController.signal.aborted && currentGeneration === generation.current) setAssistance('failed');
    } finally { if (controller.current === abortController) controller.current = undefined; }
  }

  function cancelAngles() {
    generation.current += 1;
    controller.current?.abort(); controller.current = undefined;
    setAssistance('idle');
  }

  function toggleAngle(id: AngleId) {
    setSelectedAngles((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }
  function applySelectedAngles(combine: boolean) {
    if (!angles || !selectedAngles.length || (combine && selectedAngles.length !== 2)) return;
    const selected = selectedAngles.map((id) => angles[id === 'one' ? 0 : 1]);
    setAngleDraft(combine ? selected.join(' ') : selected[0]);
  }
  function rejectAngles() { setSelectedAngles([]); setSentence(interpretation.trim()); setStage('phrase'); setStatus('Kept your original wording.'); }
  function acceptAngles() { if (!angleDraft.trim()) return; setSentence(angleDraft.trim()); setStage('phrase'); }

  async function saveCurrentWording() {
    if (!sentence.trim() || saving) return;
    setSaving(true); setStatus('');
    try {
      const item = await saveWording({ sourceRunId: runId, text: sentence, bodyLocations: body });
      setStatus('Saved on this device.');
      return item.id;
    } catch { setStatus('This wording could not be saved on this device.'); return undefined; }
    finally { setSaving(false); }
  }
  function finish() {
    if (run.state === 'started') setRun(finishLocalActivityRun(run, 'completed'));
    setStage('done');
  }

  return { runId, run, stage, setStage, feelings, expandedFeeling, setExpandedFeeling, customWord, setCustomWord, body, sentence, setSentence, setStatus,
    situation, setSituation, interpretation, setInterpretation, angles, selectedAngles, toggleAngle, angleDraft, setAngleDraft,
    assistance, saving, status, toggleFeeling, toggleBody, addCustomWord, offerAngles, applySelectedAngles,
    rejectAngles, acceptAngles, cancelAngles, saveCurrentWording, finish };
}

export type NoticeNameExperience = ReturnType<typeof useNoticeNameExperience>;
