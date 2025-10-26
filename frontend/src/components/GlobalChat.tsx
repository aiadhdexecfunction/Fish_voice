import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { X, MessageCircle, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { getChatResponse } from '../utils/messageGenerator';

interface GlobalChatProps {
  personality: 'gentle' | 'funny' | 'pushy';
  voiceTone: 'ariana' | 'gordon' | 'snoop';
  voiceEnabled: boolean;
}

export default function GlobalChat({ personality, voiceTone, voiceEnabled }: GlobalChatProps) {
  const { user } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ from: string; text: string }[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [localVoiceEnabled, setLocalVoiceEnabled] = useState(voiceEnabled);

  // Sync with parent voiceEnabled prop
  useEffect(() => {
    setLocalVoiceEnabled(voiceEnabled);
  }, [voiceEnabled]);

  // Get initial message based on personality
  const getInitialChatMessage = () => {
    if (personality === 'gentle') {
      if (voiceTone === 'ariana') return "👋 Hi babe! I'm your body double! I'm here to support you! 💕✨";
      if (voiceTone === 'gordon') return "👋 Hello. I'm here to keep you focused and on track. Let's work!";
      return "👋 Yo! I'm your body double, homie! Let's stay focused together! 😎";
    } else if (personality === 'funny') {
      if (voiceTone === 'ariana') return "👋 Hey! I'm your body double... I guess I'm stuck with you! 😏✨";
      if (voiceTone === 'gordon') return "👋 Right, I'm your body double. Let's see if you can stay focused!";
      return "👋 Sup! I'm your body double! Try to keep up, aight? 😂";
    } else {
      if (voiceTone === 'ariana') return "👋 I'm your body double! Let's GET TO WORK! No excuses! 💪";
      if (voiceTone === 'gordon') return "👋 I'm your body double! You WILL stay focused or you'll hear from me!";
      return "👋 Yo! Body double here! Let's hustle, no slackin'! ⏰";
    }
  };

  // Load chat history when chat dialog opens
  useEffect(() => {
    if (showChat && user?.username) {
      const loadHistory = async () => {
        try {
          const response = await fetch(API_ENDPOINTS.chat.history(user.username), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.messages && data.messages.length > 0) {
              const formattedMessages = data.messages.slice(-10).reverse().map((msg: any) => ({
                from: msg.role === 'user' ? 'user' : 'body-double',
                text: msg.content
              }));
              setChatMessages(formattedMessages);
            } else {
              // Set initial message if no history
              setChatMessages([{ from: 'body-double', text: getInitialChatMessage() }]);
            }
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
          setChatMessages([{ from: 'body-double', text: getInitialChatMessage() }]);
        }
      };
      
      loadHistory();
    } else if (!showChat) {
      // Reset messages when chat is closed
      setChatMessages([]);
    }
  }, [showChat, user?.username, personality, voiceTone]);

  const playVoice = async (text: string, voiceModel?: string) => {
    try {
      const payload: any = {
        text: text,
        user_id: user?.username,
        format: 'mp3'
      };
      
      if (voiceModel) {
        payload.reference_id = voiceModel;
      }
      
      const response = await fetch(API_ENDPOINTS.voice.say, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }
        
        const blob = new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play();
        
        audio.onended = () => {
          URL.revokeObjectURL(url);
        };
      }
    } catch (error) {
      console.error('Error playing voice:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !user?.username) return;
    
    const newMessage = { from: 'user', text: messageInput };
    setChatMessages(prev => [...prev, newMessage]);
    const userInput = messageInput;
    setMessageInput('');
    setIsSendingMessage(true);
    
    try {
      const response = await fetch(API_ENDPOINTS.chat.send, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.username,
          text: userInput,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const responseText = data.text || getChatResponse({ personality, voiceTone });
        const agentResponse = {
          from: 'body-double',
          text: responseText
        };
        setChatMessages(prev => [...prev, agentResponse]);
        
        // Play voice if enabled
        if (localVoiceEnabled && data.text && data.voice_model) {
          playVoice(responseText, data.voice_model);
        }
      } else {
        console.error('Chat API error:', response.status);
        const fallbackResponse = getChatResponse({ personality, voiceTone });
        setChatMessages(prev => [...prev, { from: 'body-double', text: fallbackResponse }]);
      }
    } catch (error) {
      console.error('Error sending message to chat API:', error);
      const fallbackResponse = getChatResponse({ personality, voiceTone });
      setChatMessages(prev => [...prev, { from: 'body-double', text: fallbackResponse }]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!showChat && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setShowChat(true)}
              size="lg"
              style={{
                background: '#F7A64B',
                color: '#FFF9F4',
                fontFamily: 'Inter, sans-serif',
                borderRadius: '50%',
                width: '64px',
                height: '64px',
                padding: '0',
                border: '3px solid #FFF9F4',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
              }}
            >
              <MessageCircle className="size-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Dialog */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            className="fixed right-6 bottom-6 z-50"
            style={{ width: '380px', height: '500px' }}
          >
            <Card 
              className="flex flex-col h-full overflow-hidden"
              style={{
                background: 'rgba(255, 249, 244, 0.98)',
                borderRadius: '20px',
                border: '3px solid #CFE8ED',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
              }}
            >
              <div 
                className="p-4 border-b flex items-center justify-between flex-shrink-0"
                style={{ borderColor: '#CFE8ED' }}
              >
                <h4 
                  style={{ 
                    fontFamily: 'Poppins, sans-serif',
                    color: '#8B5E3C',
                    fontSize: '1rem'
                  }}
                >
                  💬 Chat with Body Double
                </h4>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setLocalVoiceEnabled(!localVoiceEnabled)}
                    style={{
                      color: localVoiceEnabled ? '#F7A64B' : '#8B5E3C'
                    }}
                    title="Toggle voice output"
                  >
                    {localVoiceEnabled ? (
                      <Volume2 className="size-4" />
                    ) : (
                      <VolumeX className="size-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowChat(false)}
                    style={{
                      color: '#8B5E3C'
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden p-4">
                <ScrollArea style={{ height: '100%' }}>
                  <div className="space-y-3">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-xl p-3`}
                          style={{
                            background: msg.from === 'user' ? '#F7A64B' : 'rgba(207, 232, 237, 0.8)',
                            color: msg.from === 'user' ? '#FFF9F4' : '#2D2D2D',
                            fontFamily: 'Lexend Deca, sans-serif',
                            fontSize: '0.875rem'
                          }}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div 
                className="p-4 border-t flex-shrink-0"
                style={{ borderColor: '#CFE8ED' }}
              >
                <div className="flex gap-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') sendMessage();
                    }}
                    style={{
                      fontFamily: 'Lexend Deca, sans-serif',
                      borderRadius: '12px',
                      borderColor: '#CFE8ED'
                    }}
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={isSendingMessage || !messageInput.trim()}
                    size="sm"
                    style={{
                      background: isSendingMessage || !messageInput.trim() ? '#CCC' : '#F7A64B',
                      color: '#FFF9F4',
                      borderRadius: '12px',
                      cursor: isSendingMessage || !messageInput.trim() ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSendingMessage ? '...' : <MessageCircle className="size-4" />}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

