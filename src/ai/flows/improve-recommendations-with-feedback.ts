'use server';

/**
 * @fileOverview A flow that improves plant health recommendations based on user feedback.
 *
 * This file exports:
 * - `improveRecommendationsWithFeedback`: Function to update plant recommendations with user feedback.
 * - `ImproveRecommendationsWithFeedbackInput`: The input type for the `improveRecommendationsWithFeedback` function.
 * - `ImproveRecommendationsWithFeedbackOutput`: The output type for the `improveRecommendationsWithFeedback` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveRecommendationsWithFeedbackInputSchema = z.object({
  plantName: z.string().describe('The name of the plant the recommendations are for.'),
  recommendation: z.string().describe('The original recommendation given to the user.'),
  feedback: z.string().describe('The user feedback on the recommendation.'),
  historicalData: z.string().optional().describe('Historical data about the plant, if available'),
});
export type ImproveRecommendationsWithFeedbackInput = z.infer<typeof ImproveRecommendationsWithFeedbackInputSchema>;

const ImproveRecommendationsWithFeedbackOutputSchema = z.object({
  improvedRecommendation: z.string().describe('The improved recommendation based on user feedback.'),
});
export type ImproveRecommendationsWithFeedbackOutput = z.infer<typeof ImproveRecommendationsWithFeedbackOutputSchema>;

const prompt = ai.definePrompt({
  name: 'improveRecommendationsWithFeedbackPrompt',
  input: {schema: ImproveRecommendationsWithFeedbackInputSchema},
  output: {schema: ImproveRecommendationsWithFeedbackOutputSchema},
  prompt: `You are an AI assistant designed to refine plant care recommendations based on user feedback.

  You will receive the original recommendation, the user's feedback, the plant name, and optionally any historical data about the plant, then generate an improved recommendation that takes the feedback into account.

  Original Recommendation: {{{recommendation}}}
  User Feedback: {{{feedback}}}
  Plant Name: {{{plantName}}}
  {{#if historicalData}}
  Historical Data: {{{historicalData}}}
  {{/if}}

  Improved Recommendation:`,
});

const improveRecommendationsWithFeedbackFlow = ai.defineFlow(
  {
    name: 'improveRecommendationsWithFeedbackFlow',
    inputSchema: ImproveRecommendationsWithFeedbackInputSchema,
    outputSchema: ImproveRecommendationsWithFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {improvedRecommendation: output!.improvedRecommendation};
  }
);


export async function improveRecommendationsWithFeedback(
  input: ImproveRecommendationsWithFeedbackInput
): Promise<ImproveRecommendationsWithFeedbackOutput> {
  return improveRecommendationsWithFeedbackFlow(input);
}
