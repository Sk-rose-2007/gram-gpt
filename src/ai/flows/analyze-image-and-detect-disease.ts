'use server';
/**
 * @fileOverview Analyzes an image of a plant to detect potential diseases and provide diagnosis and treatment recommendations.
 *
 * - analyzeImageAndDetectDisease - A function that handles the image analysis and disease detection process.
 * - AnalyzeImageAndDetectDiseaseInput - The input type for the analyzeImageAndDetectDisease function.
 * - AnalyzeImageAndDetectDiseaseOutput - The return type for the analyzeImageAndDetectDisease function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeImageAndDetectDiseaseInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().describe('Any additional description of the plant or its symptoms.'),
  history: z.string().optional().describe('The history of the plant, including previous diagnoses and treatments.'),
  language: z.string().optional().describe('The language for the output (e.g., "en-US", "es-ES").'),
});
export type AnalyzeImageAndDetectDiseaseInput = z.infer<typeof AnalyzeImageAndDetectDiseaseInputSchema>;

const AnalyzeImageAndDetectDiseaseOutputSchema = z.object({
  diagnosis: z.string().describe('The diagnosis of the plant, including potential diseases.'),
  treatmentRecommendations: z.string().describe('Recommended treatments for the identified diseases.'),
});
export type AnalyzeImageAndDetectDiseaseOutput = z.infer<typeof AnalyzeImageAndDetectDiseaseOutputSchema>;

const prompt = ai.definePrompt({
  name: 'analyzeImageAndDetectDiseasePrompt',
  input: {schema: AnalyzeImageAndDetectDiseaseInputSchema},
  output: {schema: AnalyzeImageAndDetectDiseaseOutputSchema},
  prompt: `You are an expert in plant diseases. Analyze the provided image and description to detect potential diseases and provide treatment recommendations.
Respond in the following language: {{language}}.
Description: {{{description}}}
{{#if history}}
History: {{{history}}}
{{/if}}
Image: {{media url=photoDataUri}}`,
});

const analyzeImageAndDetectDiseaseFlow = ai.defineFlow(
  {
    name: 'analyzeImageAndDetectDiseaseFlow',
    inputSchema: AnalyzeImageAndDetectDiseaseInputSchema,
    outputSchema: AnalyzeImageAndDetectDiseaseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);


export async function analyzeImageAndDetectDisease(input: AnalyzeImageAndDetectDiseaseInput): Promise<AnalyzeImageAndDetectDiseaseOutput> {
  return analyzeImageAndDetectDiseaseFlow(input);
}
