import type { AnalysisResponse } from '@dream-analyzer/shared-types';

export function parseAnalysisResponse(response: string): AnalysisResponse {
  // Extract JSON from markdown code block if present
  const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
  const jsonText = jsonMatch ? jsonMatch[1] : response;

  try {
    const parsed = JSON.parse(jsonText);

    // Validate required fields
    if (!parsed.psychologicalInterpretation) {
      throw new Error('Missing psychologicalInterpretation');
    }
    if (!Array.isArray(parsed.symbols)) {
      throw new Error('Missing or invalid symbols array');
    }
    if (!Array.isArray(parsed.themes)) {
      throw new Error('Missing or invalid themes array');
    }
    if (!parsed.emotionalAnalysis) {
      throw new Error('Missing emotionalAnalysis');
    }
    if (!Array.isArray(parsed.underlyingMeanings)) {
      throw new Error('Missing or invalid underlyingMeanings array');
    }
    if (!Array.isArray(parsed.insights)) {
      throw new Error('Missing or invalid insights array');
    }

    return parsed as AnalysisResponse;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse JSON response: ${error.message}`);
    }
    throw error;
  }
}
