import { Card } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { X, Sparkles, Heart, Flame, Zap } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

interface PersonalityCustomizationProps {
  personality: string;
  setPersonality: (value: string) => void;
  voiceTone: string;
  setVoiceTone: (value: string) => void;
  onClose: () => void;
}

export default function PersonalityCustomization({
  personality,
  setPersonality,
  voiceTone,
  setVoiceTone,
  onClose,
}: PersonalityCustomizationProps) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" 
      style={{ 
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)'
      }}
    >
      <Card 
        className="w-full max-w-lg p-6 animate-fade-in relative my-4"
        style={{ 
          background: '#FFF9F4', 
          borderRadius: '24px',
          border: '2px solid #F7A64B',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Close Button */}
        <Button
          onClick={onClose}
          variant="outline"
          size="icon"
          className="absolute top-3 right-3"
          style={{
            borderRadius: '10px',
            borderColor: '#E8DDD0',
          }}
        >
          <X className="size-4" />
        </Button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3 animate-bounce-gentle inline-block">🎭</div>
          <h2 
            className="mb-1" 
            style={{ 
              fontFamily: 'Poppins, sans-serif',
              fontSize: '1.5rem',
              color: '#F7A64B'
            }}
          >
            Customize Your Body Double
          </h2>
          <p 
            style={{ 
              fontFamily: 'Lexend Deca, sans-serif',
              color: '#8B5E3C',
              fontSize: '0.875rem'
            }}
          >
            Choose how your virtual companion talks to you
          </p>
        </div>

        <div className="space-y-6">
          {/* Personality Style */}
          <div>
            <Label 
              className="mb-3 block"
              style={{ 
                fontFamily: 'Poppins, sans-serif',
                fontSize: '1rem',
                color: '#2D2D2D'
              }}
            >
              🎨 Personality Style
            </Label>
            <RadioGroup value={personality} onValueChange={setPersonality}>
              <div className="space-y-2">
                {/* Gentle */}
                <label
                  className="flex items-start p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.01]"
                  style={{
                    background: personality === 'gentle' ? '#CFE8ED' : '#FFFFFF',
                    border: `2px solid ${personality === 'gentle' ? '#F7A64B' : '#E8DDD0'}`,
                  }}
                >
                  <RadioGroupItem value="gentle" id="gentle" className="mt-0.5" />
                  <div className="ml-2 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Heart className="size-4" style={{ color: '#F7A64B' }} />
                      <span 
                        style={{ 
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 600,
                          color: '#2D2D2D',
                          fontSize: '0.875rem'
                        }}
                      >
                        Gentle, Calming, Encouraging
                      </span>
                    </div>
                    <p 
                      style={{ 
                        fontFamily: 'Lexend Deca, sans-serif',
                        color: '#8B5E3C',
                        fontSize: '0.75rem'
                      }}
                    >
                      Supportive and kind. Perfect for when you need a gentle push.
                    </p>
                  </div>
                </label>

                {/* Funny */}
                <label
                  className="flex items-start p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.01]"
                  style={{
                    background: personality === 'funny' ? '#CFE8ED' : '#FFFFFF',
                    border: `2px solid ${personality === 'funny' ? '#F7A64B' : '#E8DDD0'}`,
                  }}
                >
                  <RadioGroupItem value="funny" id="funny" className="mt-0.5" />
                  <div className="ml-2 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Sparkles className="size-4" style={{ color: '#F7A64B' }} />
                      <span 
                        style={{ 
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 600,
                          color: '#2D2D2D',
                          fontSize: '0.875rem'
                        }}
                      >
                        Funny, Judgy, Black Humored
                      </span>
                    </div>
                    <p 
                      style={{ 
                        fontFamily: 'Lexend Deca, sans-serif',
                        color: '#8B5E3C',
                        fontSize: '0.75rem'
                      }}
                    >
                      Sarcastic and witty. Keeps things interesting with dark humor.
                    </p>
                  </div>
                </label>

                {/* Pushy */}
                <label
                  className="flex items-start p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.01]"
                  style={{
                    background: personality === 'pushy' ? '#CFE8ED' : '#FFFFFF',
                    border: `2px solid ${personality === 'pushy' ? '#F7A64B' : '#E8DDD0'}`,
                  }}
                >
                  <RadioGroupItem value="pushy" id="pushy" className="mt-0.5" />
                  <div className="ml-2 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Flame className="size-4" style={{ color: '#F7A64B' }} />
                      <span 
                        style={{ 
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 600,
                          color: '#2D2D2D',
                          fontSize: '0.875rem'
                        }}
                      >
                        Mean and Pushy
                      </span>
                    </div>
                    <p 
                      style={{ 
                        fontFamily: 'Lexend Deca, sans-serif',
                        color: '#8B5E3C',
                        fontSize: '0.75rem'
                      }}
                    >
                      No-nonsense and demanding. For when you need tough love.
                    </p>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Voice Tone */}
          <div>
            <Label 
              className="mb-3 block"
              style={{ 
                fontFamily: 'Poppins, sans-serif',
                fontSize: '1rem',
                color: '#2D2D2D'
              }}
            >
              🎤 Voice Tone
            </Label>
            <RadioGroup value={voiceTone} onValueChange={setVoiceTone}>
              <div className="space-y-2">
                {/* Ariana Grande */}
                <label
                  className="flex items-start p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.01]"
                  style={{
                    background: voiceTone === 'ariana' ? '#CFE8ED' : '#FFFFFF',
                    border: `2px solid ${voiceTone === 'ariana' ? '#F7A64B' : '#E8DDD0'}`,
                  }}
                >
                  <RadioGroupItem value="ariana" id="ariana" className="mt-0.5" />
                  <div className="ml-2 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Sparkles className="size-4" style={{ color: '#F7A64B' }} />
                      <span 
                        style={{ 
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 600,
                          color: '#2D2D2D',
                          fontSize: '0.875rem'
                        }}
                      >
                        Ariana Grande
                      </span>
                    </div>
                    <p 
                      style={{ 
                        fontFamily: 'Lexend Deca, sans-serif',
                        color: '#8B5E3C',
                        fontSize: '0.75rem'
                      }}
                    >
                      Sweet, breathy, and super supportive. "Yuh, you got this babe! ✨"
                    </p>
                  </div>
                </label>

                {/* Gordon Ramsay */}
                <label
                  className="flex items-start p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.01]"
                  style={{
                    background: voiceTone === 'gordon' ? '#CFE8ED' : '#FFFFFF',
                    border: `2px solid ${voiceTone === 'gordon' ? '#F7A64B' : '#E8DDD0'}`,
                  }}
                >
                  <RadioGroupItem value="gordon" id="gordon" className="mt-0.5" />
                  <div className="ml-2 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Flame className="size-4" style={{ color: '#F7A64B' }} />
                      <span 
                        style={{ 
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 600,
                          color: '#2D2D2D',
                          fontSize: '0.875rem'
                        }}
                      >
                        Gordon Ramsay
                      </span>
                    </div>
                    <p 
                      style={{ 
                        fontFamily: 'Lexend Deca, sans-serif',
                        color: '#8B5E3C',
                        fontSize: '0.75rem'
                      }}
                    >
                      Harsh, demanding, and brutally honest. "Come on, get moving!"
                    </p>
                  </div>
                </label>

                {/* Snoop Dogg */}
                <label
                  className="flex items-start p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.01]"
                  style={{
                    background: voiceTone === 'snoop' ? '#CFE8ED' : '#FFFFFF',
                    border: `2px solid ${voiceTone === 'snoop' ? '#F7A64B' : '#E8DDD0'}`,
                  }}
                >
                  <RadioGroupItem value="snoop" id="snoop" className="mt-0.5" />
                  <div className="ml-2 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Zap className="size-4" style={{ color: '#F7A64B' }} />
                      <span 
                        style={{ 
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 600,
                          color: '#2D2D2D',
                          fontSize: '0.875rem'
                        }}
                      >
                        Snoop Dogg
                      </span>
                    </div>
                    <p 
                      style={{ 
                        fontFamily: 'Lexend Deca, sans-serif',
                        color: '#8B5E3C',
                        fontSize: '0.75rem'
                      }}
                    >
                      Laid back, chill, and cool. "Fo shizzle, keep it real, homie."
                    </p>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={onClose}
          className="w-full mt-6 friendly-button"
          style={{ 
            background: 'linear-gradient(135deg, #F7A64B 0%, #FFB86F 100%)', 
            color: '#FFFFFF',
            borderRadius: '12px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: '0.875rem',
            padding: '1.25rem'
          }}
        >
          <Sparkles className="size-4 mr-2" />
          Save Preferences
        </Button>
      </Card>
    </div>
  );
}
