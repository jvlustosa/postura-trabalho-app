import { app } from 'electron';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

export interface StoreFile {
  fileName: string;
}

const DATA_DIR_SUBPATH = 'data';

const ensureDir = async (dir: string): Promise<void> => {
  await fs.mkdir(dir, { recursive: true });
};

const dataDir = (): string => join(app.getPath('userData'), DATA_DIR_SUBPATH);

const filePath = (fileName: string): string => join(dataDir(), fileName);

export const readJsonFile = async <T = unknown>(fileName: string): Promise<T | null> => {
  try {
    const contents = await fs.readFile(filePath(fileName), 'utf8');
    if (!contents.trim()) return null;
    return JSON.parse(contents) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    return null;
  }
};

export const writeJsonFile = async (fileName: string, data: unknown): Promise<void> => {
  await ensureDir(dataDir());
  const tmp = `${filePath(fileName)}.tmp`;
  const target = filePath(fileName);
  const serialized = JSON.stringify(data);
  await fs.writeFile(tmp, serialized, 'utf8');
  await fs.rename(tmp, target);
};

export const getStorePath = (fileName: string): string => filePath(fileName);
