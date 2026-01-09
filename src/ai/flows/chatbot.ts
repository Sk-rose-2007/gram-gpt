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
import { processVoiceInput } from './process-voice-input';

// Simulated market price data for common items in India (prices in INR per kg)
const marketPrices: { [key: string]: { min: number; max: number } } = {
  // Vegetables
  "tomato": { min: 20, max: 40 },
  "potato": { min: 15, max: 30 },
  "onion": { min: 25, max: 45 },
  "carrot": { min: 30, max: 50 },
  "cabbage": { min: 15, max: 25 },
  "cauliflower": { min: 25, max: 40 },
  "spinach": { min: 10, max: 20 }, // per bunch
  "brinjal": { min: 20, max: 35 },
  "ladyfinger": { min: 30, max: 45 },
  "okra": { min: 30, max: 45 },
  "capsicum": { min: 40, max: 60 },
  "bell pepper": { min: 40, max: 60 },
  "cucumber": { min: 20, max: 35 },
  
  // Fruits
  "apple": { min: 100, max: 180 },
  "banana": { min: 30, max: 50 }, // per dozen
  "mango": { min: 60, max: 120 },
  "orange": { min: 50, max: 80 },
  "grapes": { min: 80, max: 120 },
  "guava": { min: 40, max: 60 },
  "watermelon": { min: 15, max: 25 },
  
  // Other
  "organic basil": { min: 80, max: 120 },
  "basil": { min: 50, max: 80 },
};


const getMarketPriceTool = ai.defineTool(
  {
    name: 'getMarketPrice',
    description: 'Get the current market price for a specific crop in Indian Rupees (INR).',
    inputSchema: z.object({
      cropName: z.string().describe('The name of the crop to get the price for, e.g., "organic basil"'),
    }),
    outputSchema: z.object({
      price: z.number().describe('The market price in INR per standard unit (e.g., per kg).'),
      currency: z.string().describe('The currency of the price, which is always INR.'),
    }),
  },
  async ({ cropName }) => {
    const normalizedCropName = cropName.toLowerCase();
    const priceRange = marketPrices[normalizedCropName];
    
    let price: number;
    if (priceRange) {
      // Generate a price within the defined range for that crop
      price = parseFloat((Math.random() * (priceRange.max - priceRange.min) + priceRange.min).toFixed(2));
    } else {
      // Generate a generic price for items not in the list
      price = parseFloat((Math.random() * 100 + 50).toFixed(2));
    }

    return { price, currency: 'INR' };
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
  transcribedMessage: z.string().optional().describe('The transcribed text from audio input.')
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
    prompt: `You are a friendly and knowledgeable plant care expert named GramGPT. Your only purpose is to answer questions about plants. If a user asks about any other topic, you must politely decline and state that you are a plant care expert.

    Engage in a conversation with the user, providing helpful advice and answering their questions about plants. Respond in the user's language, which is '{{language}}'.

    If the user asks for the market price of a crop, use the getMarketPrice tool to find the information. The price will be in Indian Rupees (INR). Make sure to state the currency in your response.

    Here is the conversation history so far:
    {{#each history}}
    {{role}}: {{{content}}}
    {{/each}}

    And here is the new user message:
    user: {{{message}}}

    Your response should be helpful, friendly, and continue the conversation naturally in the user's language, but only if it's about plants.
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
    let transcribedMessage: string | undefined = undefined;

    // If there's audio, transcribe it to get the text message
    if (input.audio && input.language) {
        try {
            const { textOutput } = await processVoiceInput({
                voiceDataUri: input.audio,
                language: input.language,
            });
            userMessage = textOutput;
            transcribedMessage = textOutput;
        } catch (error) {
            console.error('Voice input processing error:', error);
            return { response: "I'm sorry, I had trouble understanding your audio. Could you please try again?" };
        }
    }

    if (!userMessage) {
        return { response: "I'm sorry, I couldn't understand that. Could you please repeat?" };
    }

    try {
        const {output} = await chatbotPrompt({
            history: input.history,
            message: userMessage,
            language: input.language,
        });
        
        if (!output) {
          return { response: "I'm sorry, I couldn't generate a response. Please try again." };
        }
        
        return { ...output, transcribedMessage: transcribedMessage };
    } catch (error) {
        console.error('Chatbot flow error:', error);
        return { response: "Sorry, I'm having a little trouble connecting to my knowledge base. Please try again in a moment." };
    }
  }
);


export async function chatbot(input: ChatbotInput): Promise<ChatbotOutput> {
  return chatbotFlow(input);
}
