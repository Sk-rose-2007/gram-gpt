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

const getMarketPriceTool = ai.defineTool(
  {
    name: 'getMarketPrice',
    description: 'Get the current market price for a specific crop.',
    inputSchema: z.object({
      cropName: z.string().describe('The name of the crop to get the price for, e.g., "organic basil"'),
    }),
    outputSchema: z.object({
      price: z.number().describe('The market price per standard unit (e.g., per pound).'),
    }),
  },
  async ({ cropName }) => {
    // In a real application, you would fetch this from a real-time market data API.
    // For demonstration, we'll generate a random price.
    const price = parseFloat((Math.random() * 5 + 1).toFixed(2));
    return { price };
  }
);


const messageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatbotInputSchema = z.object({
  history: z.array(messageSchema).describe('The conversation history.'),
  message: z.string().optional().describe('The latest user message as text.'),
  audio: z.string().optional().describe("The user's voice message as a data URI."),
  language: z.string().optional().describe('The language of the user input (e.g., "en-US").'),
});
export type ChatbotInput = z.infer<typeof ChatbotInputSchema>;

const ChatbotOutputSchema = z.object({
  response: z.string().describe('The AI\'s response.'),
});
export type ChatbotOutput = z.infer<typeof ChatbotOutputSchema>;

const chatbotPrompt = ai.definePrompt(
  {
    name: 'chatbotPrompt',
    input: {schema: z.object({
        history: z.array(messageSchema),
        message: z.string(),
        language: z.string().optional(),
    })},
    output: {schema: z.object({ response: z.string() })},
    tools: [getMarketPriceTool],
    prompt: `You are a friendly and knowledgeable plant care expert named Verdant. Engage in a conversation with the user, providing helpful advice and answering their questions about plants. Respond in the user's language, which is '{{language}}'.

    If the user asks for the market price of a crop, use the getMarketPrice tool to find the information.

    Here is the conversation history so far:
    {{#each history}}
    {{role}}: {{{content}}}
    {{/each}}

    And here is the new user message:
    user: {{{message}}}

    Your response should be helpful, friendly, and continue the conversation naturally in the user's language.
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
    let userMessage = input.message;

    // If there's audio, transcribe it to get the text message
    if (input.audio) {
      const transcribePrompt = ai.definePrompt({
          name: 'transcribePrompt',
          input: { schema: z.object({ audio: z.string() }) },
          output: { schema: z.object({ transcription: z.string() }) },
          prompt: `Transcribe the following audio: {{media url=audio}}`,
      });
      const { output } = await transcribePrompt({ audio: input.audio });
      userMessage = output?.transcription || '';
    }

    if (!userMessage) {
        return { response: "I'm sorry, I couldn't understand that. Could you please repeat?" };
    }

    const { output } = await chatbotPrompt({
        history: input.history,
        message: userMessage,
        language: input.language,
    });
    
    return output!;
  }
);


export async function chatbot(input: ChatbotInput): Promise<ChatbotOutput> {
  return chatbotFlow(input);
}
