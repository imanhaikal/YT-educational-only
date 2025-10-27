
jest.mock('../src/gemini', () => ({
  ...jest.requireActual('../src/gemini'),
  callGemini: jest.fn().mockResolvedValue({
    label: 'educational',
    confidence: 0.9,
    reason: 'This is a test.',
  }),
}));
