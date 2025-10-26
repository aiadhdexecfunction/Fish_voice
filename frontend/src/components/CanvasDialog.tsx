import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { BookOpen, Save, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface CanvasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CanvasDialog({ open, onOpenChange }: CanvasDialogProps) {
  const [token, setToken] = useState('');

  const handleSave = () => {
    if (!token.trim()) {
      toast.error('Please enter your Canvas token');
      return;
    }

    // Mock save
    toast.success('Token saved! Canvas integration coming soon.');
    
    // Reset form
    setToken('');
    onOpenChange(false);
  };

  const instructionsList = [
    'Go to Canvas → Account → Settings',
    'Scroll to "Approved Integrations"',
    'Click "+ New Access Token"',
    'Copy the generated token and paste below',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-lg"
        style={{
          background: '#FFF9F4',
          borderRadius: '24px',
          border: '2px solid #F7A64B',
        }}
      >
        <DialogHeader>
          <DialogTitle 
            className="flex items-center gap-2 justify-center"
            style={{
              fontFamily: 'Poppins, sans-serif',
              color: '#F7A64B',
              fontSize: '1.5rem',
            }}
          >
            <BookOpen className="size-6" />
            Import from Canvas
          </DialogTitle>
          <DialogDescription 
            className="text-center"
            style={{
              fontFamily: 'Lexend Deca, sans-serif',
              color: '#8B5E3C',
            }}
          >
            Connect your Canvas account using an access token
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Instructions List */}
          <div 
            className="p-4 rounded-xl space-y-2"
            style={{
              background: '#CFE8ED',
              border: '1px solid #B8D4C8',
            }}
          >
            <p 
              style={{
                fontFamily: 'Inter, sans-serif',
                color: '#2D2D2D',
                fontSize: '0.875rem',
              }}
            >
              📋 How to get your Canvas token:
            </p>
            {instructionsList.map((instruction, index) => (
              <div key={index} className="flex items-start gap-2">
                <Check 
                  className="size-4 flex-shrink-0 mt-0.5" 
                  style={{ color: '#F7A64B' }} 
                />
                <p 
                  style={{
                    fontFamily: 'Lexend Deca, sans-serif',
                    color: '#2D2D2D',
                    fontSize: '0.875rem',
                  }}
                >
                  {instruction}
                </p>
              </div>
            ))}
          </div>

          {/* Token Input */}
          <div className="space-y-2">
            <Label 
              htmlFor="canvas-token"
              style={{
                fontFamily: 'Inter, sans-serif',
                color: '#2D2D2D',
              }}
            >
              Canvas Access Token
            </Label>
            <Input
              id="canvas-token"
              type="password"
              placeholder="Paste your Canvas access token here..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E8DDD0',
                borderRadius: '12px',
                fontFamily: 'Lexend Deca, sans-serif',
              }}
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            className="w-full friendly-button"
            style={{
              background: 'linear-gradient(135deg, #F7A64B 0%, #FFB86F 100%)',
              color: '#FFFFFF',
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif',
              padding: '1.25rem',
            }}
          >
            <Save className="size-4 mr-2" />
            Save & Connect
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
