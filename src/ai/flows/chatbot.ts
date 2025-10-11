'use server';

/**
 * @fileOverview A conversational chatbot for plant care.
 *
 * - chatbot - A function that handles the chatbot conversation.
 * - ChatbotInput - The input type for the chatbot function.
 * - ChatbotOutput - The return type for the chatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const messageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatbotInputSchema = z.object({
  history: z.array(messageSchema).describe('The conversation history.'),
  message: z.string().describe('The latest user message.'),
});
export type ChatbotInput = z.infer<typeof ChatbotInputSchema>;

const ChatbotOutputSchema = z.object({
  response: z.string().describe('The AI\'s response.'),
});
export type ChatbotOutput = z.infer<typeof ChatbotOutputSchema>;

export async function chatbot(input: ChatbotInput): Promise<ChatbotOutput> {
  return chatbotFlow(input);
}

const chatbotPrompt = ai.definePrompt(
  {
    name: 'chatbotPrompt',
    input: {schema: ChatbotInputSchema},
    output: {schema: z.object({ response: z.string() })},
    prompt: `You are a friendly and knowledgeable plant care expert. Your name is Verdant. Engage in a conversation with the user, providing helpful advice and answering their questions about plants.

    Here is the conversation history so far:
    {{#each history}}
    {{role}}: {{{content}}}
    {{/each}}

    And here is the new user message:
    user: {{{message}}}

    Your response should be helpful, friendly, and continue the conversation naturally.
    `,
  },
);

const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatbotInputSchema,
    outputSchema: ChatbotOutputSchema,
  },
  async (input) => {
    const { output } = await chatbotPrompt(input);
    return output!;
  }
);
