/**
 * Build a strict JSON-only system prompt followed by the transcript.
 * The user message is just the transcript; the system message carries format rules.
 */
export function buildPRDPrompt(transcript) {
  const system = [
    'You are an expert product manager and UX designer.',
    'Analyze the following meeting transcript as a product discovery session.',
    '',
    'Return ONLY a valid JSON object. Do NOT wrap the answer in markdown fences.',
    'Escape all newline characters inside JSON strings as \\n. Do not include literal unescaped line breaks inside string values.',
    'The JSON must have exactly these keys:',
    '',
    '  prd                    string   — Product Requirements Document in markdown.',
    '  userStories            array    — Each story: { id, asA, iWantTo, soThatICan, acceptanceCriteria: [string] }',
    '  functionalRequirements array of strings — atomic requirements.',
    '  uiUxWireframes         string   — Structural text representation (ASCII/Markdown) of the UI screens.',
    '',
    'Rules:',
    '- VALIDATION: First, check if the transcript is related to software/product development. If it is irrelevant (e.g., ordering food, casual chat), do not hallucinate. Return a JSON with a polite warning in the "prd" field, empty arrays for lists, and a placeholder string for "uiUxWireframes".',
    '- "prd" must be a thorough markdown document with sections for Overview, Goals, Scope,',
    '  Target Users, Key Features, Non-Functional Requirements, and Success Metrics.',
    '- "userStories" must have at least 3 stories with realistic acceptance criteria.',
    '- "functionalRequirements" must list clear, testable, atomic requirements.',
    '- "uiUxWireframes" must clearly describe the UI visual layout using HTML. Assume PaperCSS is loaded. Structure the UI like a real app. Wrap each screen in a <div class="card margin-bottom-large"><div class="card-body">. Use PaperCSS classes like "row", "col-4", "col-8", "form-group", "badge", and "btn-block" for layout alignment. Output raw HTML only without markdown fences.',
    '- Output ONLY the JSON object. No explanations before or after.',
  ].join('\n');

  const user = `Meeting transcript:\n\n${transcript}`;

  return [
    { role: 'system', content: system },
    { role: 'user',   content: user },
  ];
}
