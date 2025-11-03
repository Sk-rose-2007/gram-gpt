'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { chatbot, type ChatbotInput } from '@/ai/flows/chatbot';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Sprout, Mic, StopCircle, Languages, MessageCircle, Play, Pause } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
  audioDataUri?: string;
  isPlaying?: boolean;
  audioProgress?: number;
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
    { value: "ta-IN", label: "Tamil" },
    { value: "pa-IN", label: "Punjabi" },
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
  const [activeAudioMessageId, setActiveAudioMessageId] = useState<string | null>(null);

  useEffect(() => {
    if(typeof window !== 'undefined' && window.navigator) {
        setLanguage(navigator.language || 'en-US');
    }

    const audioEl = audioRef.current;

    const onAudioEnd = () => {
      if (activeAudioMessageId) {
        setMessages(prev => prev.map(m => m.id === activeAudioMessageId ? { ...m, isPlaying: false, audioProgress: 0 } : m));
        setActiveAudioMessageId(null);
      }
    };

    const onTimeUpdate = () => {
        if (audioEl && activeAudioMessageId && audioEl.duration > 0) {
            const progress = (audioEl.currentTime / audioEl.duration) * 100;
             setMessages(prev => prev.map(m => m.id === activeAudioMessageId ? { ...m, audioProgress: progress } : m));
        }
    };
    
    if (audioEl) {
      audioEl.addEventListener('ended', onAudioEnd);
      audioEl.addEventListener('pause', onAudioEnd);
      audioEl.addEventListener('timeupdate', onTimeUpdate);
    }
    
    return () => {
      if (audioEl) {
        audioEl.removeEventListener('ended', onAudioEnd);
        audioEl.removeEventListener('pause', onAudioEnd);
        audioEl.removeEventListener('timeupdate', onTimeUpdate);
      }
    };
  }, [activeAudioMessageId]);


  const toggleAudioPlayback = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !message.audioDataUri) return;

    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (activeAudioMessageId === messageId) { // Currently playing, so pause it
      audioEl.pause();
    } else { // Not playing, or another message is playing
      if (activeAudioMessageId) {
        audioEl.pause(); // stop the current one
      }
      audioEl.src = message.audioDataUri;
      audioEl.play();
      setActiveAudioMessageId(messageId);
      setMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, isPlaying: true } :
          (m.id === activeAudioMessageId ? { ...m, isPlaying: false, audioProgress: 0 } : m)
      ));
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollAreaRef.current?.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  };

  const handleSendMessage = (content: string) => {
    if (!content.trim() && !mediaRecorderRef.current) return;
    setInput('');

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    scrollToBottom();

    startTransition(async () => {
      const history = messages.map(({ audioDataUri, isPlaying, audioProgress, ...rest }) => rest);
      
      const chatbotInput: ChatbotInput = {
        history: history,
        message: content,
        language: language,
      };

      try {
        const result = await chatbot(chatbotInput);
        const aiResponse = result.response;

        const modelMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', content: aiResponse, audioProgress: 0 };
        setMessages(prev => [...prev, modelMessage]);
        scrollToBottom();
        
        try {
          const audioResult = await textToSpeech({ text: aiResponse, language: language });
          setMessages(prev => prev.map(m => m.id === modelMessage.id ? { ...m, audioDataUri: audioResult.audioDataUri } : m));
        } catch (ttsError) {
          console.error('TTS Error:', ttsError);
          toast({
            variant: "destructive",
            title: "Text-to-Speech Failed",
            description: "Could not generate audio. You may have exceeded the API quota.",
          });
        }
        
      } catch (error) {
        console.error('Error with chatbot:', error);
        toast({
          variant: "destructive",
          title: "AI Error",
          description: "There was a problem communicating with the AI. Please try again.",
        });
        setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      }
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const audioChunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          handleVoiceMessage(base64Audio);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      toast({ title: 'Recording started...' });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        variant: 'destructive',
        title: 'Recording Error',
        description: 'Could not start recording. Please check microphone permissions.',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: 'Recording stopped. Processing...' });
    }
  };

  const handleVoiceMessage = (audioDataUri: string) => {
    // Add a temporary user message
    const tempUserMessageId = Date.now().toString();
    const userMessage: Message = { id: tempUserMessageId, role: 'user', content: "🎤 Processing voice..." };
    setMessages(prev => [...prev, userMessage]);
    scrollToBottom();

    startTransition(async () => {
      const history = messages.filter(m => m.id !== tempUserMessageId).map(({ audioDataUri, isPlaying, audioProgress, ...rest }) => rest);
      
      try {
        const result = await chatbot({ history, audio: audioDataUri, language });
        const aiResponse = result.response;
        const transcribedMessage = result.transcribedMessage;

        // Update the user message with the transcription
        if (transcribedMessage) {
            setMessages(prev => prev.map(m => m.id === tempUserMessageId ? { ...m, content: `🎤: ${transcribedMessage}` } : m));
        } else {
            // If transcription fails, remove the temp message
            setMessages(prev => prev.filter(m => m.id !== tempUserMessageId));
            throw new Error("Transcription failed");
        }
        
        const modelMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', content: aiResponse, audioProgress: 0 };
        setMessages(prev => [...prev, modelMessage]);
        scrollToBottom();

        try {
          const audioResult = await textToSpeech({ text: aiResponse, language: language });
          setMessages(prev => prev.map(m => m.id === modelMessage.id ? { ...m, audioDataUri: audioResult.audioDataUri } : m));
        } catch (ttsError) {
          console.error('TTS Error:', ttsError);
          toast({
              variant: "destructive",
              title: "Text-to-Speech Failed",
              description: "Could not generate audio. You may have exceeded the API quota.",
          });
        }

      } catch (error) {
        console.error('Error with voice message:', error);
        toast({
          variant: "destructive",
          title: "AI Error",
          description: "There was a problem processing your voice message.",
        });
        setMessages(prev => prev.filter(m => m.id !== tempUserMessageId));
      }
    });
  };

  return (
    <div className="flex h-[calc(100vh_-_57px)]">
       <audio ref={audioRef} className="hidden" />
      <Card className="w-full h-full flex flex-col bg-card/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-primary" />
            <CardTitle>Plant care chat</CardTitle>
          </div>
          <div className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-muted-foreground" />
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  {supportedLanguages.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea ref={scrollAreaRef} className="h-full">
            <div className="p-4 space-y-4">
              {messages.length === 0 && (
                 <div className="text-center text-muted-foreground p-8">
                  <Sprout className="mx-auto h-12 w-12 mb-4" />
                  <h3 className="text-lg font-semibold">Welcome to GramGPT</h3>
                  <p className="text-sm">Your personal plant care assistant. Try asking one of the questions below or use the microphone to talk.</p>
                 </div>
              )}
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} toggleAudioPlayback={toggleAudioPlayback} />
              ))}
               {isPending && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex items-start gap-3 justify-start">
                  <Avatar className="w-8 h-8 border">
                    <AvatarFallback><Sprout className="w-5 h-5" /></AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3 max-w-[75%] space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-4 border-t">
          <div className="w-full space-y-2">
             {messages.length === 0 && (
                <div className="flex flex-wrap gap-2 justify-center mb-2">
                  {defaultQuestions.map((q, i) => (
                    <Button key={i} variant="outline" size="sm" onClick={() => handleSendMessage(q)}>{q}</Button>
                  ))}
                </div>
             )}
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
                placeholder="Ask about your plants..."
                disabled={isPending}
              />
              <Button onClick={() => handleSendMessage(input)} disabled={isPending}>
                <Send />
              </Button>
              <Button onClick={isRecording ? stopRecording : startRecording} disabled={isPending} variant={isRecording ? "destructive" : "outline"}>
                {isRecording ? <StopCircle className="animate-pulse" /> : <Mic />}
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

const ChatMessage = ({ message, toggleAudioPlayback }: { message: Message, toggleAudioPlayback: (id: string) => void }) => {
  const isUser = message.role === 'user';
  return (
    <div className={cn("flex items-start gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar className="w-8 h-8 border">
          <AvatarFallback><Sprout className="w-5 h-5" /></AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'rounded-lg p-3 max-w-[85%] flex items-center gap-2',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-card'
        )}
      >
        <div className="flex-1 space-y-1">
          <p className="whitespace-pre-wrap">{message.content}</p>
          {message.audioDataUri && (
            <div className="space-y-2 pt-2">
              <Progress value={message.audioProgress || 0} className="h-1 bg-primary/20" />
            </div>
          )}
        </div>
        {message.audioDataUri && (
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full w-8 h-8 shrink-0 bg-primary/20 hover:bg-primary/30"
            onClick={() => toggleAudioPlayback(message.id)}
          >
            {message.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span className="sr-only">{message.isPlaying ? "Pause" : "Play"}</span>
          </Button>
        )}
      </div>
      {isUser && (
        <Avatar className="w-8 h-8 border">
          <AvatarFallback>You</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};
