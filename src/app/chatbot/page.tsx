'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { chatbot, type ChatbotInput } from '@/ai/flows/chatbot';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Bot, User, Sprout, Mic, StopCircle, CornerDownLeft, VolumeX, Languages } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Message = {
  role: 'user' | 'model';
  content: string;
};

const defaultQuestions = [
  "What's the market price for organic basil?",
  "What's the best soil type for tomatoes?",
  "How can I encourage more growth in my fiddle leaf fig?",
];

const supportedLanguages = [
    { value: "en-US", label: "English" },
    { value: "es-ES", label: "Spanish" },
    { value: "fr-FR", label: "French" },
    { value: "de-DE", label: "German" },
    { value: "hi-IN", label: "Hindi" },
    { value: "ja-JP", label: "Japanese" },
    { value: "zh-CN", label: "Chinese" },
];

export default function ChatbotPage() {
  const [isPending, startTransition] = useTransition();
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [language, setLanguage] = useState("en-US");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  useEffect(() => {
    if(typeof window !== 'undefined' && window.navigator) {
        setLanguage(navigator.language || 'en-US');
    }

    const audioEl = audioRef.current;
    const onAudioPlay = () => setIsAudioPlaying(true);
    const onAudioEnd = () => setIsAudioPlaying(false);

    if (audioEl) {
      audioEl.addEventListener('play', onAudioPlay);
      audioEl.addEventListener('ended', onAudioEnd);
      audioEl.addEventListener('pause', onAudioEnd);
    }
    
    return () => {
      if (audioEl) {
        audioEl.removeEventListener('play', onAudioPlay);
        audioEl.removeEventListener('ended', onAudioEnd);
        audioEl.removeEventListener('pause', onAudioEnd);
      }
    };
  }, []);

  const playAudio = async (text: string) => {
    if (audioRef.current && isAudioPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audioResult = await textToSpeech({ text });
    if (audioRef.current) {
      audioRef.current.src = audioResult.audioDataUri;
      audioRef.current.play();
    }
  };

  const handleSendMessage = (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage: Message = { role: 'user', content: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    startTransition(async () => {
      const chatbotInput: ChatbotInput = {
        history: messages,
        message: messageText,
        language: language,
      };
      const result = await chatbot(chatbotInput);
      const modelMessage: Message = { role: 'model', content: result.response };
      setMessages([...newMessages, modelMessage]);

      playAudio(result.response);
    });
  };

  const startRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.start();
        setIsRecording(true);
        toast({ title: 'Recording started...' });
      } catch (err) {
        console.error("Error accessing microphone:", err);
        toast({ variant: 'destructive', title: 'Microphone Error', description: 'Could not access microphone. Please check permissions.' });
      }
    } else {
      toast({ variant: 'destructive', title: 'Unsupported Browser', description: 'Audio recording is not supported by your browser.' });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: 'Recording stopped. Processing...' });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        const audioBlob = new Blob([event.data], { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          sendAudioMessage(base64Audio);
        };
      };
    }
  };

  const sendAudioMessage = (audioDataUri: string) => {
      startTransition(async () => {
          const chatbotInput: ChatbotInput = {
              history: messages,
              audio: audioDataUri,
              language: language,
          };
          // First, get the transcribed text to display it
          const transcriptionResult = await chatbot({ audio: audioDataUri, history: [] }); // Pass empty history for transcription only
          if (!transcriptionResult.response) {
            toast({ variant: 'destructive', title: 'Transcription Failed', description: 'Could not understand audio. Please try again.' });
            return;
          }
          const userMessage: Message = { role: 'user', content: transcriptionResult.response };
          const newMessages = [...messages, userMessage];
          setMessages(newMessages);

          // Then, get the actual chatbot response with full history
          const chatbotResponseInput = { ...chatbotInput, message: transcriptionResult.response };
          const result = await chatbot(chatbotResponseInput);
          const modelMessage: Message = { role: 'model', content: result.response };
          setMessages([...newMessages, modelMessage]);
          
          playAudio(result.response);
      });
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  return (
    <Card className="h-[calc(100vh-5rem)] flex flex-col">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="flex items-center gap-2"><Bot /> Anything Else</CardTitle>
        <div className="w-48">
            <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full">
                    <Languages className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                    {supportedLanguages.map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="space-y-4 pr-4">
             {messages.length === 0 && !isPending && (
                <div className="text-center text-muted-foreground">
                    <p className="mb-4">Ask me anything about plant care, or try one of these questions:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {defaultQuestions.map((q, i) => (
                            <Button key={i} variant="outline" className="h-auto whitespace-normal" onClick={() => handleSendMessage(q)}>
                                {q}
                            </Button>
                        ))}
                    </div>
                </div>
             )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'model' && (
                  <Avatar className="w-8 h-8">
                     <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Sprout className="h-5 w-5" />
                    </div>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 text-sm',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {message.content}
                </div>
                 {message.role === 'user' && (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="https://picsum.photos/seed/user/40/40" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {isPending && (
                <div className="flex items-start gap-3 justify-start">
                    <Avatar className="w-8 h-8">
                         <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Sprout className="h-5 w-5" />
                        </div>
                    </Avatar>
                    <div className="max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 text-sm bg-muted">
                        <Skeleton className="w-24 h-4" />
                    </div>
                </div>
             )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-center space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isPending && handleSendMessage(input)}
            placeholder="Ask about plant care..."
            disabled={isPending || isRecording}
          />
           {isAudioPlaying ? (
             <Button variant="destructive" size="icon" onClick={stopAudio} aria-label="Stop audio">
                <VolumeX className="h-5 w-5" />
             </Button>
           ) : (
            <Button onClick={() => handleSendMessage(input)} disabled={isPending || isRecording || !input.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
           )}
          <Button 
            variant={isRecording ? "destructive" : "outline"} 
            size="icon" 
            onClick={isRecording ? stopRecording : startRecording} 
            disabled={isPending}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? <StopCircle className="h-5 w-5 animate-pulse" /> : <Mic className="h-4 w-4" />}
          </Button>
        </div>
      </CardFooter>
       <audio ref={audioRef} className="hidden" />
    </Card>
  );
}

    