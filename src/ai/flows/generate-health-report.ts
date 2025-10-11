'use server';

/**
 * @fileOverview Generates a comprehensive health report for a plant, detailing its overall health,
 * potential issues, and customized recommendations for soil, fertilization, watering, and disease treatment,
 * leveraging the user's historical data.
 *
 * - generateHealthReport - A function that generates the health report.
 * - GenerateHealthReportInput - The input type for the generateHealthReport function.
 * - GenerateHealthReportOutput - The return type for the generateHealthReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHealthReportInputSchema = z.object({
  plantName: z.string().describe('The name of the plant for which to generate the report.'),
  plantDescription: z.string().describe('A description of the plant including species, age, and any known issues.'),
  historicalData: z.string().describe('Historical data about the plant, including previous diagnoses, treatments, and user feedback.'),
});
export type GenerateHealthReportInput = z.infer<typeof GenerateHealthReportInputSchema>;

const GenerateHealthReportOutputSchema = z.object({
  overallHealth: z.string().describe('An assessment of the plants overall health.'),
  potentialIssues: z.string().describe('Any potential issues identified with the plant, such as diseases or nutrient deficiencies.'),
  recommendations: z.string().describe('Customized recommendations for soil, fertilization, watering, and disease treatment.'),
});
export type GenerateHealthReportOutput = z.infer<typeof GenerateHealthReportOutputSchema>;

const generateHealthReportPrompt = ai.definePrompt({
  name: 'generateHealthReportPrompt',
  input: {schema: GenerateHealthReportInputSchema},
  output: {schema: GenerateHealthReportOutputSchema},
  prompt: `You are an expert in plant health and care.

  Based on the provided information, generate a comprehensive health report for the plant.

  Plant Name: {{{plantName}}}
  Plant Description: {{{plantDescription}}}
  Historical Data: {{{historicalData}}}

  Consider the plant's historical data, description, and any potential issues to provide customized recommendations for soil, fertilization, watering, and disease treatment.

  Overall Health: <overall health assessment>
  Potential Issues: <list of potential issues>
  Recommendations: <customized recommendations>
  `,
});

const generateHealthReportFlow = ai.defineFlow(
  {
    name: 'generateHealthReportFlow',
    inputSchema: GenerateHealthReportInputSchema,
    outputSchema: GenerateHealthReportOutputSchema,
  },
  async input => {
    const {output} = await generateHealthReportPrompt(input);
    return output!;
  }
);


export async function generateHealthReport(input: GenerateHealthReportInput): Promise<GenerateHealthReportOutput> {
  return generateHealthReportFlow(input);
}
