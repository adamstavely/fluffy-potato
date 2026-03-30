import type { SaSelectOption } from '../../../ui/sa-select.component';

export interface GoblinLlmToolConfig {
  systemPrompt: string;
  inputLabel: string;
  inputPlaceholder: string;
  /** Primary button label */
  runLabel: string;
  /** When set, show tone select (formalizer). */
  toneOptions?: SaSelectOption<string>[];
}

const FORMALIZER_TONES: SaSelectOption<string>[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'concise', label: 'Concise' },
  { value: 'neutral', label: 'Neutral / plain' },
  { value: 'persuasive', label: 'Persuasive' },
];

/** Per-tool prompts and UI copy. Wording is original (not copied from third-party sites). */
export const GOBLIN_LLM_CONFIG: Record<string, GoblinLlmToolConfig> = {
  'magic-todo': {
    systemPrompt:
      'You help break down tasks into clear, ordered subtasks. Respond with a numbered or bulleted list. ' +
      'Keep items actionable and specific. If the input is vague, infer reasonable steps and note assumptions briefly at the end.',
    inputLabel: 'Task or goal',
    inputPlaceholder: 'Describe what you need to accomplish…',
    runLabel: 'Break down',
  },
  formalizer: {
    systemPrompt:
      'You rewrite user text to match the requested tone while preserving the original meaning and facts. ' +
      'Do not add new claims. Output only the rewritten text unless the input is empty.',
    inputLabel: 'Text to rewrite',
    inputPlaceholder: 'Paste the text you want rephrased…',
    runLabel: 'Rewrite',
    toneOptions: FORMALIZER_TONES,
  },
  judge: {
    systemPrompt:
      'You read short passages and describe likely emotional tone, intent, and subtext in plain language. ' +
      'Be concise. If the text is too short to judge, say so. Do not claim certainty you cannot support.',
    inputLabel: 'Text to read',
    inputPlaceholder: 'Paste message, email, or note…',
    runLabel: 'Analyze',
  },
  professor: {
    systemPrompt:
      'You explain concepts clearly for an adult reader. Use short sections or bullets when helpful. ' +
      'If the question is ambiguous, state your interpretation first. Avoid unnecessary jargon; define terms when you use them.',
    inputLabel: 'Topic or question',
    inputPlaceholder: 'What should be explained…',
    runLabel: 'Explain',
  },
  consultant: {
    systemPrompt:
      'You help with decisions by summarizing tradeoffs, listing pros and cons, and suggesting a practical recommendation when possible. ' +
      'If critical information is missing, list what would change your answer. Stay neutral and avoid moralizing.',
    inputLabel: 'Situation and options',
    inputPlaceholder:
      'Describe the context, constraints, and the options you are choosing between…',
    runLabel: 'Discuss',
  },
  estimator: {
    systemPrompt:
      'You produce rough time estimates for activities described by the user. Give a range when uncertainty is high ' +
      '(e.g. a few hours vs a few days) and mention what would push the estimate up or down. Use the user’s implied skill level if stated; otherwise assume an average adult.',
    inputLabel: 'Activity',
    inputPlaceholder: 'Describe what needs to be done…',
    runLabel: 'Estimate',
  },
  compiler: {
    systemPrompt:
      'You turn unstructured notes into a concise list of concrete next actions. Each item should start with a verb when possible. ' +
      'Merge duplicates. If something is only a reminder, separate it from true tasks. Output a numbered or bulleted list.',
    inputLabel: 'Notes or braindump',
    inputPlaceholder: 'Dump thoughts, meeting notes, or ideas…',
    runLabel: 'Compile',
  },
};

export function resolveGoblinLlmConfig(toolId: string): GoblinLlmToolConfig | null {
  return GOBLIN_LLM_CONFIG[toolId] ?? null;
}

export function buildUserMessage(
  cfg: GoblinLlmToolConfig,
  toolId: string,
  rawInput: string,
  formalizerTone: string,
): string {
  const t = rawInput.trim();
  if (toolId === 'formalizer' && cfg.toneOptions?.length) {
    const label =
      cfg.toneOptions.find((o) => o.value === formalizerTone)?.label ?? formalizerTone;
    return `Rewrite the following text in a ${label.toLowerCase()} tone (${formalizerTone}):\n\n${t}`;
  }
  return t;
}
