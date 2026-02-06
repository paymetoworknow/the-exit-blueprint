/**
 * File System Utilities
 * 
 * Handles file operations for the agent
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';

/**
 * Ensure directory exists
 */
export async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

/**
 * Write file with directory creation
 */
export async function writeFile(filePath, content) {
  await ensureDir(dirname(filePath));
  await fs.writeFile(filePath, content, 'utf8');
}

/**
 * Read file
 */
export async function readFile(filePath) {
  return fs.readFile(filePath, 'utf8');
}

/**
 * Check if file exists
 */
export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * List directory contents
 */
export async function listDir(dirPath) {
  try {
    return await fs.readdir(dirPath);
  } catch {
    return [];
  }
}

/**
 * Copy file
 */
export async function copyFile(src, dest) {
  await ensureDir(dirname(dest));
  await fs.copyFile(src, dest);
}

/**
 * Delete file or directory
 */
export async function remove(path) {
  try {
    const stat = await fs.stat(path);
    if (stat.isDirectory()) {
      await fs.rm(path, { recursive: true, force: true });
    } else {
      await fs.unlink(path);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
