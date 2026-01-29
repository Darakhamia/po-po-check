declare module 'gettext-parser' {
  export interface POTranslation {
    msgid: string;
    msgid_plural?: string;
    msgstr: string | string[];
    msgctxt?: string;
    comments?: {
      translator?: string;
      reference?: string;
      extracted?: string;
      flag?: string;
      previous?: string;
    };
  }

  export interface POData {
    charset: string;
    headers: Record<string, string>;
    translations: Record<string, Record<string, POTranslation>>;
  }

  export const po: {
    parse: (buffer: Buffer | string) => POData;
    compile: (data: POData) => Buffer;
  };

  export const mo: {
    parse: (buffer: Buffer) => POData;
    compile: (data: POData) => Buffer;
  };
}
