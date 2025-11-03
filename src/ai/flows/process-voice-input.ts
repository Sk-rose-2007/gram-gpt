'use server';

/**
 * @fileOverview This file defines a Genkit flow for processing voice input, converting it to text.
 *
 * - processVoiceInput - Processes voice input and returns the transcribed text.
 * - ProcessVoiceInputInput - The input type for the processVoiceInput function.
 * - ProcessVoiceInputOutput - The return type for the processVoiceInput function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessVoiceInputInputSchema = z.object({
  voiceDataUri: z
    .string()
    .describe(
      "Voice input as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'." 
    ),
  language: z.string().describe('The language of the voice input (e.g., en-US, es-ES).'),
});
export type ProcessVoiceInputInput = z.infer<typeof ProcessVoiceInputInputSchema>;

const ProcessVoiceInputOutputSchema = z.object({
  textOutput: z.string().describe('The transcribed text from the voice input in the specified language.'),
});
export type ProcessVoiceInputOutput = z.infer<typeof ProcessVoiceInputOutputSchema>;

const processVoiceInputPrompt = ai.definePrompt({
  name: 'processVoiceInputPrompt',
  input: {schema: ProcessVoiceInputInputSchema},
  output: {schema: ProcessVoiceInputOutputSchema},
  prompt: `Transcribe the following audio recording. The user is speaking in {{language}}.

  Voice Input:
  {{media url=voiceDataUri}}

  Your output should be only the transcribed text.`,
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


export async function processVoiceInput(input: ProcessVoiceInputInput): Promise<ProcessVoiceInputOutput> {
  return processVoiceInputFlow(input);
}
