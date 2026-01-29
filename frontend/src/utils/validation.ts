export interface ValidationIssue {
  type: 'capitalization' | 'punctuation' | 'placeholder' | 'whitespace';
  message: string;
}

// Check if strings match capitalization pattern
function checkCapitalization(original: string, translation: string): ValidationIssue | null {
  if (!original || !translation) return null;

  const originalFirstChar = original.charAt(0);
  const translationFirstChar = translation.charAt(0);

  const originalIsUpper = originalFirstChar === originalFirstChar.toUpperCase() &&
                          originalFirstChar !== originalFirstChar.toLowerCase();
  const originalIsLower = originalFirstChar === originalFirstChar.toLowerCase() &&
                          originalFirstChar !== originalFirstChar.toUpperCase();

  const translationIsUpper = translationFirstChar === translationFirstChar.toUpperCase() &&
                             translationFirstChar !== translationFirstChar.toLowerCase();
  const translationIsLower = translationFirstChar === translationFirstChar.toLowerCase() &&
                             translationFirstChar !== translationFirstChar.toUpperCase();

  if (originalIsUpper && translationIsLower) {
    return {
      type: 'capitalization',
      message: 'Translation should start with uppercase letter',
    };
  }

  if (originalIsLower && translationIsUpper) {
    return {
      type: 'capitalization',
      message: 'Translation should start with lowercase letter',
    };
  }

  return null;
}

// Check if strings match ending punctuation
function checkPunctuation(original: string, translation: string): ValidationIssue | null {
  if (!original || !translation) return null;

  // Order matters: check longer patterns first (... before .)
  const punctuationMarks = ['...', '。', '！', '？', '.', '!', '?', ':', ';', ','];

  const originalTrimmed = original.trim();
  const translationTrimmed = translation.trim();

  const originalEnding = punctuationMarks.find(p => originalTrimmed.endsWith(p));
  const translationEnding = punctuationMarks.find(p => translationTrimmed.endsWith(p));

  // Original has punctuation but translation doesn't
  if (originalEnding && !translationEnding) {
    return {
      type: 'punctuation',
      message: `Translation should end with "${originalEnding}"`,
    };
  }

  // Translation has punctuation but original doesn't
  if (!originalEnding && translationEnding) {
    return {
      type: 'punctuation',
      message: `Translation should not end with "${translationEnding}"`,
    };
  }

  // Both have punctuation but they are different
  if (originalEnding && translationEnding && originalEnding !== translationEnding) {
    return {
      type: 'punctuation',
      message: `Translation ends with "${translationEnding}", but source ends with "${originalEnding}"`,
    };
  }

  return null;
}

// Check if placeholders are preserved
function checkPlaceholders(original: string, translation: string): ValidationIssue | null {
  if (!original || !translation) return null;

  // Common placeholder patterns
  const placeholderPatterns = [
    /%[sd@]/g,           // %s, %d, %@
    /%\d+\$[sd@]/g,      // %1$s, %2$d
    /\{[^}]+\}/g,        // {name}, {0}
    /\{\{[^}]+\}\}/g,    // {{variable}}
    /<[^>]+>/g,          // <tag>, </tag>
    /\$\{[^}]+\}/g,      // ${variable}
    /\$\w+/g,            // $variable
  ];

  const extractPlaceholders = (text: string): string[] => {
    const found: string[] = [];
    for (const pattern of placeholderPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        found.push(...matches);
      }
    }
    return found.sort();
  };

  const originalPlaceholders = extractPlaceholders(original);
  const translationPlaceholders = extractPlaceholders(translation);

  const missingInTranslation = originalPlaceholders.filter(
    p => !translationPlaceholders.includes(p)
  );

  if (missingInTranslation.length > 0) {
    return {
      type: 'placeholder',
      message: `Missing placeholder(s): ${missingInTranslation.join(', ')}`,
    };
  }

  return null;
}

// Check whitespace issues
function checkWhitespace(original: string, translation: string): ValidationIssue | null {
  if (!original || !translation) return null;

  const originalLeadingSpace = original.startsWith(' ');
  const originalTrailingSpace = original.endsWith(' ');
  const translationLeadingSpace = translation.startsWith(' ');
  const translationTrailingSpace = translation.endsWith(' ');

  if (originalLeadingSpace !== translationLeadingSpace) {
    return {
      type: 'whitespace',
      message: originalLeadingSpace
        ? 'Translation should start with a space'
        : 'Translation should not start with a space',
    };
  }

  if (originalTrailingSpace !== translationTrailingSpace) {
    return {
      type: 'whitespace',
      message: originalTrailingSpace
        ? 'Translation should end with a space'
        : 'Translation should not end with a space',
    };
  }

  return null;
}

export function validateTranslation(original: string, translation: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const capIssue = checkCapitalization(original, translation);
  if (capIssue) issues.push(capIssue);

  const punctIssue = checkPunctuation(original, translation);
  if (punctIssue) issues.push(punctIssue);

  const placeholderIssue = checkPlaceholders(original, translation);
  if (placeholderIssue) issues.push(placeholderIssue);

  const whitespaceIssue = checkWhitespace(original, translation);
  if (whitespaceIssue) issues.push(whitespaceIssue);

  return issues;
}

export function hasValidationIssues(original: string, translation: string): boolean {
  return validateTranslation(original, translation).length > 0;
}

// Auto-fix common formatting issues
export function autoFixTranslation(original: string, translation: string): string {
  if (!original || !translation) return translation;

  let fixed = translation;

  // Fix capitalization
  const originalFirstChar = original.charAt(0);
  const translationFirstChar = fixed.charAt(0);

  const originalIsUpper = originalFirstChar === originalFirstChar.toUpperCase() &&
                          originalFirstChar !== originalFirstChar.toLowerCase();
  const originalIsLower = originalFirstChar === originalFirstChar.toLowerCase() &&
                          originalFirstChar !== originalFirstChar.toUpperCase();

  const translationIsUpper = translationFirstChar === translationFirstChar.toUpperCase() &&
                             translationFirstChar !== translationFirstChar.toLowerCase();
  const translationIsLower = translationFirstChar === translationFirstChar.toLowerCase() &&
                             translationFirstChar !== translationFirstChar.toUpperCase();

  if (originalIsUpper && translationIsLower) {
    fixed = fixed.charAt(0).toUpperCase() + fixed.slice(1);
  } else if (originalIsLower && translationIsUpper) {
    fixed = fixed.charAt(0).toLowerCase() + fixed.slice(1);
  }

  // Fix whitespace (leading/trailing spaces)
  const originalLeadingSpace = original.startsWith(' ');
  const originalTrailingSpace = original.endsWith(' ');

  // Remove existing leading/trailing spaces first to normalize
  fixed = fixed.trim();

  // Add back spaces as needed
  if (originalLeadingSpace) {
    fixed = ' ' + fixed;
  }
  if (originalTrailingSpace) {
    fixed = fixed + ' ';
  }

  // Fix punctuation
  // Order matters: check longer patterns first (... before .)
  const punctuationMarks = ['...', '。', '！', '？', '.', '!', '?', ':', ';', ','];
  const originalTrimmed = original.trim();
  let fixedTrimmed = fixed.trim();

  const originalEnding = punctuationMarks.find(p => originalTrimmed.endsWith(p));
  const translationEnding = punctuationMarks.find(p => fixedTrimmed.endsWith(p));

  // Remove existing punctuation from translation if it exists
  if (translationEnding) {
    fixedTrimmed = fixedTrimmed.slice(0, -translationEnding.length);
  }

  // Add correct punctuation if original has one
  if (originalEnding) {
    fixedTrimmed = fixedTrimmed + originalEnding;
  }

  // Reconstruct with proper spacing
  fixed = (originalLeadingSpace ? ' ' : '') + fixedTrimmed + (originalTrailingSpace ? ' ' : '');

  return fixed;
}

// Check if auto-fix can help (excludes placeholder issues which can't be auto-fixed)
export function canAutoFix(original: string, translation: string): boolean {
  const issues = validateTranslation(original, translation);
  return issues.some(issue =>
    issue.type === 'capitalization' ||
    issue.type === 'punctuation' ||
    issue.type === 'whitespace'
  );
}
