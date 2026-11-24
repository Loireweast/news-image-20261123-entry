// The Daily World — news-image-20261123 entry (Node 22, standard library only).
// The entry is a newspaper front page summing up Monday 23 November 2026.
// It ships as entry.png beside this file; the program copies it to the
// output directory the grader provides. No network, no dependencies.
//
// Run locally:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
copyFileSync(new URL('./entry.png', import.meta.url), join(outDir, 'entry.png'));
