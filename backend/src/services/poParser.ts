import * as gettextParser from 'gettext-parser';
import type { POTranslation, POData } from 'gettext-parser';

export interface POEntry {
  msgid: string;
  msgidPlural?: string;
  msgstr: string[];
  msgctxt?: string;
  comments?: {
    translator?: string;
    reference?: string;
    extracted?: string;
    flag?: string;
    previous?: string;
  };
}

export interface POFile {
  charset: string;
  headers: Record<string, string>;
  translations: Record<string, Record<string, POTranslation>>;
}

export function parsePOFile(buffer: Buffer): POFile {
  const parsed = gettextParser.po.parse(buffer);
  return parsed as POFile;
}

export function compilePOFile(data: POData): Buffer {
  return gettextParser.po.compile(data);
}

export function extractEntries(poFile: POFile): POEntry[] {
  const entries: POEntry[] = [];

  for (const context of Object.keys(poFile.translations)) {
    for (const msgid of Object.keys(poFile.translations[context])) {
      if (msgid === '') continue; // Skip header entry

      const entry = poFile.translations[context][msgid];
      const msgstr = entry.msgstr;
      entries.push({
        msgid: entry.msgid,
        msgidPlural: entry.msgid_plural,
        msgstr: Array.isArray(msgstr) ? msgstr : [msgstr || ''],
        msgctxt: entry.msgctxt || context || undefined,
        comments: entry.comments,
      });
    }
  }

  return entries;
}

export function buildPOFile(entries: POEntry[], headers: Record<string, string> = {}): POFile {
  const defaultHeaders = {
    'Content-Type': 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding': '8bit',
    'MIME-Version': '1.0',
    ...headers,
  };

  const translations: Record<string, Record<string, any>> = {
    '': {
      '': {
        msgid: '',
        msgstr: Object.entries(defaultHeaders)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n'),
      },
    },
  };

  for (const entry of entries) {
    const context = entry.msgctxt || '';
    if (!translations[context]) {
      translations[context] = {};
    }

    translations[context][entry.msgid] = {
      msgid: entry.msgid,
      msgid_plural: entry.msgidPlural,
      msgstr: entry.msgstr,
      msgctxt: entry.msgctxt,
      comments: entry.comments,
    };
  }

  return {
    charset: 'utf-8',
    headers: defaultHeaders,
    translations,
  };
}
