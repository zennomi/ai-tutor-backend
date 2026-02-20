#!/usr/bin/env ts-node
/**
 * Test script for markdown-docx with patch.
 * Converts a markdown string to DOCX using test_template.docx.
 *
 * Usage:
 *   pnpm markdown-docx:test "## Hello\n\nThis is **bold** and *italic*."
 *   pnpm markdown-docx:test < input.md
 *   echo "## Title\n\nContent" | pnpm markdown-docx:test
 */

import * as fs from 'fs';
import * as path from 'path';
import { createInterface } from 'readline';

import { MarkdownDocx } from '@zennomi/markdown-docx';
import { Paragraph, patchDocument, PatchType, TextRun } from 'docx';

async function readMarkdownInput(): Promise<string> {
  const arg = process.argv[2];
  if (arg !== undefined) {
    if (arg === '-' || arg === '') {
      return readStdin();
    }
    if (fs.existsSync(arg)) {
      return fs.readFileSync(arg, 'utf-8');
    }
    return arg;
  }
  return readStdin();
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    const chunks: string[] = [];
    const rl = createInterface({ input: process.stdin });
    rl.on('line', (line) => chunks.push(line));
    rl.on('close', () => resolve(chunks.join('\n')));
  });
}

function extractTitle(markdown: string): string {
  const match = markdown.match(/^#+\s+(.+)$/m);
  return match ? match[1].trim() : 'Document';
}

async function main(): Promise<void> {
  const markdown = await readMarkdownInput();
  if (!markdown?.trim()) {
    console.error('Error: No markdown input provided.');
    console.error(
      'Usage: pnpm markdown-docx:test "<markdown>" | pnpm markdown-docx:test - < input.md | pnpm markdown-docx:test input.md',
    );
    process.exit(1);
  }

  const templatePath = path.join(
    process.cwd(),
    'src/utils/docx/test_template_2.docx',
  );
  if (!fs.existsSync(templatePath)) {
    console.error(`Error: Template not found at ${templatePath}`);
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath);
  const converter = new MarkdownDocx(markdown, {});
  const children = await converter.toSection();
  const title = extractTitle(markdown);

  const titleParagraph = new Paragraph({
    children: [
      new TextRun({
        text: title,
        bold: true,
      }),
    ],
  });

  const doc = await patchDocument({
    outputType: 'nodebuffer',
    data: template,
    keepOriginalStyles: false,
    patches: {
      main_patch: {
        type: PatchType.DOCUMENT,
        children,
      },
      title_patch: {
        type: PatchType.DOCUMENT,
        children: [titleParagraph],
      },
    },
  });

  const outputPath = path.join(
    process.cwd(),
    'dist',
    `markdown-docx-test-${Date.now()}.docx`,
  );
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, Buffer.from(doc));

  console.log(`Output written to ${outputPath}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
