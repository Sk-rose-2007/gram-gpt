import { config } from 'dotenv';
config();

import '@/ai/flows/generate-health-report.ts';
import '@/ai/flows/improve-recommendations-with-feedback.ts';
import '@/ai/flows/analyze-image-and-detect-disease.ts';
import '@/ai/flows/process-voice-input.ts';