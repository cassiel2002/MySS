/**
 * Registro central de todos los problemas disponibles.
 * Importa aquí para agregar nuevos problemas al sistema.
 */

import type { ProblemDefinition } from '../types';
import problem1 from './problem1';
import problem2 from './problem2';
import problem3 from './problem3';
import problem4 from './problem4';
import problem5 from './problem5';

export const problems: ProblemDefinition[] = [
  problem1,
  problem2,
  problem3,
  problem4,
  problem5,
];

export const getProblem = (id: number): ProblemDefinition | undefined =>
  problems.find(p => p.id === id);
