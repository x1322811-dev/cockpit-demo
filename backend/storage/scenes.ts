import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { Scene } from '../../shared/types.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORAGE_PATH = join(__dirname, 'scenes.json');

function load(): Scene[] {
  if (!existsSync(STORAGE_PATH)) return [];
  try {
    return JSON.parse(readFileSync(STORAGE_PATH, 'utf-8')) as Scene[];
  } catch {
    return [];
  }
}

function persist(scenes: Scene[]): void {
  writeFileSync(STORAGE_PATH, JSON.stringify(scenes, null, 2), 'utf-8');
}

export const scenesStorage = {
  list: (): Scene[] => load(),

  save: (scene: Scene): void => {
    const scenes = load();
    const idx = scenes.findIndex(s => s.name === scene.name);
    if (idx >= 0) scenes[idx] = scene;
    else scenes.push(scene);
    persist(scenes);
  },

  findByName: (name: string): Scene | null =>
    load().find(s => s.name === name || s.triggerPhrase === name) ?? null,
};
