/**
 * Filesystem Tools — read_file, write_file, list_files
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';
import { z } from 'zod';

export const readFileSchema = z.object({
  path: z.string().describe('Absolute or relative path to the file to read'),
});

export const writeFileSchema = z.object({
  path: z.string().describe('Absolute or relative path to write the file'),
  content: z.string().describe('Content to write to the file'),
});

export const listFilesSchema = z.object({
  path: z.string().describe('Directory path to list'),
  recursive: z.boolean().optional().describe('List recursively (default: false)'),
});

export function executeReadFile(args: z.infer<typeof readFileSchema>): string {
  if (!existsSync(args.path)) {
    return `Error: File not found: ${args.path}`;
  }
  try {
    return readFileSync(args.path, 'utf-8');
  } catch (err) {
    return `Error reading file: ${(err as Error).message}`;
  }
}

export function executeWriteFile(args: z.infer<typeof writeFileSchema>): string {
  try {
    writeFileSync(args.path, args.content, 'utf-8');
    return `File written successfully: ${args.path}`;
  } catch (err) {
    return `Error writing file: ${(err as Error).message}`;
  }
}

export function executeListFiles(args: z.infer<typeof listFilesSchema>): string {
  if (!existsSync(args.path)) {
    return `Error: Directory not found: ${args.path}`;
  }

  try {
    const entries: string[] = [];

    function walk(dir: string): void {
      const items = readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.name.startsWith('.') || item.name === 'node_modules') continue;
        const fullPath = join(dir, item.name);
        const relPath = relative(args.path, fullPath);
        if (item.isDirectory()) {
          entries.push(`📁 ${relPath}/`);
          if (args.recursive) walk(fullPath);
        } else {
          const stat = statSync(fullPath);
          const size = stat.size < 1024 ? `${stat.size}B` : `${(stat.size / 1024).toFixed(1)}KB`;
          entries.push(`   ${relPath} (${size})`);
        }
      }
    }

    walk(args.path);
    return entries.length > 0 ? entries.join('\n') : '(empty directory)';
  } catch (err) {
    return `Error listing files: ${(err as Error).message}`;
  }
}
