/**
 * Registro central de problemas disponibles.
 */

import type { ProblemDefinition } from '../types';
import problem6 from './problem6';
import problem7 from './problem7';
import problem8 from './problem8';
import problem9 from './problem9';
import problem10 from './problem10';
import problem11 from './problem11';
import problem12 from './problem12';
import problem13 from './problem13';
import problem14 from './problem14';
import problem15 from './problem15';

export const problems: ProblemDefinition[] = [
  problem6,
  problem7,
  problem8,
  problem9,
  problem10,
  problem11,
  problem12,
  problem13,
  problem14,
  problem15,
];

export const getProblem = (id: number): ProblemDefinition | undefined =>
  problems.find(p => p.id === id);
