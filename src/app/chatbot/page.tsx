'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { chatbot, type ChatbotInput, type ChatbotOutput } from '@/ai/flows/chatbot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Bot, User, Sprout } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'model';
  content: string;
};

export default function ChatbotPage() {
  const [isPending, startTransition] = useTransition();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    startTransition(async () => {
      const chatbotInput: ChatbotInput = {
        history: messages,
        message: input,
      };
      const result = await chatbot(chatbotInput);
      const modelMessage: Message = { role: 'model', content: result.response };
      setMessages([...newMessages, modelMessage]);
    });
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        // Use `querySelector` to find the viewport element within the `ScrollArea`
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);


  return (
    <Card className="h-[calc(100vh-5rem)] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bot /> Plant Care Chatbot</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="space-y-4 pr-4">
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
            onKeyDown={(e) => e.key === 'Enter' && !isPending && handleSendMessage()}
            placeholder="Ask about plant care..."
            disabled={isPending}
          />
          <Button onClick={handleSendMessage} disabled={isPending}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
