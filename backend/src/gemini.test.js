const { validateResponse } = require('./gemini');

describe('validateResponse', () => {
  test('should return a valid response when the input is correct', () => {
    const responseText = '{"label":"educational","confidence":0.9,"reason":"A clear, step-by-step tutorial on how to create something."}';
    const result = validateResponse(responseText);
    expect(result).toEqual({
      label: 'educational',
      confidence: 0.9,
      reason: 'A clear, step-by-step tutorial on how to create something.',
    });
  });

  test('should return an uncertain response when the input is not valid JSON', () => {
    const responseText = 'not a json';
    const result = validateResponse(responseText);
    expect(result).toEqual({
      label: 'uncertain',
      confidence: 0.0,
      reason: 'Malformed JSON response.',
    });
  });

  test('should return an uncertain response when the label is missing', () => {
    const responseText = '{"confidence":0.9,"reason":"A clear, step-by-step tutorial on how to create something."}';
    const result = validateResponse(responseText);
    expect(result).toEqual({
      label: 'uncertain',
      confidence: 0.0,
      reason: 'Invalid or missing label.',
    });
  });

  test('should return an uncertain response when the confidence is missing', () => {
    const responseText = '{"label":"educational","reason":"A clear, step-by-step tutorial on how to create something."}';
    const result = validateResponse(responseText);
    expect(result).toEqual({
      label: 'uncertain',      confidence: 0.0,
      reason: 'Invalid or missing confidence.',
    });
  });

  test('should return an uncertain response when the reason is missing', () => {
    const responseText = '{"label":"educational","confidence":0.9}';
    const result = validateResponse(responseText);
    expect(result).toEqual({
      label: 'uncertain',
      confidence: 0.0,
      reason: 'Invalid or missing reason.',
    });
  });
});
