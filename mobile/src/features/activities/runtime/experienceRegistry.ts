import type { RegisteredActivityId } from '../../../shared/activityRegistry';
import { BrainDumpScreen } from '../experiences/brain-dump/BrainDumpScreen';
import { OneSmallStepScreen } from '../experiences/one-small-step/OneSmallStepScreen';
import { GroundingScreen } from '../experiences/grounding/GroundingScreen';
import { PacedBreathingScreen } from '../experiences/paced-breathing/PacedBreathingScreen';
import { NoticeNameScreen } from '../experiences/notice-name/NoticeNameScreen';
import { UnsentLetterScreen } from '../experiences/unsent-letter/UnsentLetterScreen';
import { ReachOutScreen } from '../experiences/reach-out/ReachOutScreen';
import { MoveSceneScreen } from '../experiences/move-scene/MoveSceneScreen';
import { OneSongScreen } from '../experiences/one-song/OneSongScreen';
import type { ActivityExperienceDefinition } from './contracts';

export const experienceRegistry: Partial<Record<RegisteredActivityId, ActivityExperienceDefinition>> = {
  brain_dump: { component: BrainDumpScreen },
  one_small_step: { component: OneSmallStepScreen },
  grounding: { component: GroundingScreen },
  paced_breathing: { component: PacedBreathingScreen },
  name_a_feeling: { component: NoticeNameScreen },
  unsent_letter: { component: UnsentLetterScreen },
  reach_out: { component: ReachOutScreen },
  short_movement: { component: MoveSceneScreen },
  one_song_break: { component: OneSongScreen },
};
