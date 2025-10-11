'use server';

/**
 * @fileOverview This file defines a Genkit flow for processing voice input, converting it to text,
 * and providing plant health and growth recommendations in the same language.
 *
 * - processVoiceInput - Processes voice input and returns plant health recommendations.
 * - ProcessVoiceInputInput - The input type for the processVoiceInput function.
 * - ProcessVoiceInputOutput - The return type for the processVoiceInput function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessVoiceInputInputSchema = z.object({
  voiceDataUri: z
    .string()
    .describe(
      'Voice input as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
  language: z.string().describe('The language of the voice input.'),
});
export type ProcessVoiceInputInput = z.infer<typeof ProcessVoiceInputInputSchema>;

const ProcessVoiceInputOutputSchema = z.object({
  textOutput: z.string().describe('Plant health and growth recommendations in the same language as the input.'),
});
export type ProcessVoiceInputOutput = z.infer<typeof ProcessVoiceInputOutputSchema>;

export async function processVoiceInput(input: ProcessVoiceInputInput): Promise<ProcessVoiceInputOutput> {
  return processVoiceInputFlow(input);
}

const processVoiceInputPrompt = ai.definePrompt({
  name: 'processVoiceInputPrompt',
  input: {schema: ProcessVoiceInputInputSchema},
  output: {schema: ProcessVoiceInputOutputSchema},
  prompt: `You are a helpful AI assistant specialized in providing plant health and growth recommendations.
  The user will provide voice input in their native language.  Your task is to convert the voice input to text, analyze it for plant-related inquiries, and provide actionable recommendations in the same language.

  Voice Input ({{language}}):
  {{media url=voiceDataUri}}

  Provide clear, concise, and actionable recommendations for improving the plant's health and growth based on the user's input.
`,
});

const processVoiceInputFlow = ai.defineFlow(
  {
    name: 'processVoiceInputFlow',
    inputSchema: ProcessVoiceInputInputSchema,
    outputSchema: ProcessVoiceInputOutputSchema,
  },
  async input => {
    const {output} = await processVoiceInputPrompt(input);
    return output!;
  }
);
