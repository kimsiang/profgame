/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.2: the shapes the game passes around, as global declarations. The game code is still classic JavaScript sharing the
   global scope (DESIGN.md, v13.0), so these describe it rather than constrain it; new code is written as .ts against them,
   and `npm run typecheck` keeps this file honest. Extend as files are converted. */

/** A KPI name; S.k holds the six, 0–100. */
type KpiId = 'research' | 'teaching' | 'team' | 'rep' | 'safety' | 'integrity';

/** Grades and the numbers behind the week review (src/rules/data.js BAL). */
interface Balance {
  grades: [number, number, number, number];   // S, A, B, C thresholds
  wbFloor: number; wbPenalty: number;          // Sunday wellbeing below the floor costs this per point
  expiredWb: number;
  [k: string]: unknown;
}

/** Dossier (grant / paper) components and their weights, src/rules/data.js DOSSIER. */
interface DossierComponent { id: string; n: string; src: string; w: number }
interface DossierSpec { n: string; comps: DossierComponent[] }
type DossierStars = Record<string, number>;   // component id → 0–3

/** One scripted event as the week script stores it (assets/data/content/week.json → C()). */
interface GameEvent {
  id: string; day: number; at: number; until?: number; win: number; loc: string; who: string; tag: string; title: string; line: string;
  npc: string | null; mood?: string; urgent?: boolean; alarm?: boolean; phone?: boolean; pro?: boolean; synthetic?: boolean; table?: boolean;
  state: 'pending' | 'active' | 'resolved' | 'expired'; deadline?: number; marker?: unknown; start: string;
  nodes: Record<string, { say?: [string, string][]; choices?: Choice[] }>;
}
interface Choice { t: string; d?: string; fx?: Partial<Record<KpiId | 'energy' | 'wellbeing' | 'trust' | 'full' | 'bladder', number>>; min?: number; fb?: [string, string][]; run?: () => void }

/** What a week leaves behind for the career (src/game.js freshCareer, saves.js endWeek). */
interface Career {
  cv: number; week: number; pts: number; rank: number; post: string | null; postWeeks: number; postCool: number; acadNext: number; acadTries: number;
  history: { week: number; grade: string; pts: number; grant: string; paper: string; lost: number; grantOk: boolean; accept: boolean; trust: number }[];
  trust: Record<string, number>; lost: string[]; flags: Record<string, number>; wb: number; k: Record<KpiId, number> | null;
  fam: Record<string, number> | null; dos: Record<'grant' | 'paper', DossierStars> | null; fin: unknown; rankLog: unknown[]; postLog: unknown[]; done: boolean;
  tableSeen?: string[];
}

/** The live week state, src/game.js newState(). Only the fields other files read are listed; the rest is unknown on purpose. */
interface GameState {
  week: number; career: Career; day: number; t: number; wb: number; v: { energy: number; full: number; bladder: number };
  k: Record<KpiId, number>; trust: Record<string, number>; lost: string[]; mem: Record<string, { day: number; kind: string; title: string }[]>;
  intent: string | null; events: GameEvent[]; totals: { done: number; missed: number; all: number }; collapses: number; homeNights: number;
  dos: Record<'grant' | 'paper', DossierStars>; submitted: boolean; paperSubmitted: boolean; flags: Record<string, number>;
  weekResult?: { grade: string; score: number; pts: number; homeCap: boolean; kAvg: number; grantQ: number | null; paperQ: number | null };
  [k: string]: unknown;
}

/** src/rules/pure.js — the tested arithmetic. */
interface RulesApi {
  pmt(principal: number, yearlyRate: number, months: number): number;
  dossierScore(comps: DossierComponent[], stars: DossierStars): number;
  gradeOf(score: number, grades: Balance['grades']): 'S' | 'A' | 'B' | 'C' | 'D';
  weekScore(w: { avg: number; pts: number; done: number; all: number; collapses: number; wb: number; homeNights: number }, bal: Balance): { score: number; grade: 'S' | 'A' | 'B' | 'C' | 'D'; homeCap: boolean };
  trustGain(n: number, intent: string | null): number;
}

declare const Rules: RulesApi;
declare const BAL: Balance;
declare const DOSSIER: Record<'grant' | 'paper', DossierSpec>;
declare let S: GameState;
