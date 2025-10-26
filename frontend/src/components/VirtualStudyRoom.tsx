import { useState, useEffect } from 'react';
import { Task } from '../App';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { 
  Coffee, 
  Library, 
  Trees, 
  Home, 
  Play, 
  Pause, 
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  MessageCircle,
  Phone
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';

interface VirtualStudyRoomProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  activeSubtask: { taskId: string; subtaskId: string };
  onClose: () => void;
}

interface Room {
  id: string;
  name: string;
  icon: React.ElementType;
  ambientSound: string;
  backgroundImage: string;
}

const ROOMS: Room[] = [
  {
    id: 'coffee',
    name: 'Coffee Shop',
    icon: Coffee,
    ambientSound: 'Gentle café chatter',
    backgroundImage: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBzaG9wJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYxMzYyNzU0fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 'library',
    name: 'Library',
    icon: Library,
    ambientSound: 'Quiet page turning',
    backgroundImage: 'https://images.unsplash.com/photo-1731816803705-54ab8fbd6a8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaWJyYXJ5JTIwc3R1ZHklMjBzcGFjZXxlbnwxfHx8fDE3NjE0MDg0NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 'park',
    name: 'Park',
    icon: Trees,
    ambientSound: 'Birds chirping',
    backgroundImage: 'https://images.unsplash.com/photo-1663947735960-a753dc0ac98c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJrJTIwbmF0dXJlJTIwb3V0ZG9vcnxlbnwxfHx8fDE3NjE0MjgyMjF8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 'home',
    name: 'Cozy Home',
    icon: Home,
    ambientSound: 'Crackling fireplace',
    backgroundImage: 'https://images.unsplash.com/photo-1554078140-01f553ad4d40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwaG9tZSUyMHdvcmtzcGFjZXxlbnwxfHx8fDE3NjE0MjgxMjl8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

export default function VirtualStudyRoom({
  tasks,
  setTasks,
  activeSubtask,
  onClose,
}: VirtualStudyRoomProps) {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
  const [customMinutes, setCustomMinutes] = useState('25');
  const [isRunning, setIsRunning] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState('');
  const [teachback, setTeachback] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showBodyDouble, setShowBodyDouble] = useState(false);
  const [bodyDoubleMessage, setBodyDoubleMessage] = useState('');

  const task = tasks.find((t) => t.id === activeSubtask.taskId);
  const subtask = task?.subtasks.find((s) => s.id === activeSubtask.subtaskId);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && (pomodoroMinutes > 0 || pomodoroSeconds > 0)) {
      interval = setInterval(() => {
        if (pomodoroSeconds === 0) {
          if (pomodoroMinutes === 0) {
            setIsRunning(false);
            setShowReflection(true);
            toast.success('🎉 Pomodoro complete! Time to reflect.');
          } else {
            setPomodoroMinutes((m) => m - 1);
            setPomodoroSeconds(59);
          }
        } else {
          setPomodoroSeconds((s) => s - 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, pomodoroMinutes, pomodoroSeconds]);

  const resetPomodoro = () => {
    const mins = parseInt(customMinutes) || 25;
    setPomodoroMinutes(mins);
    setPomodoroSeconds(0);
    setIsRunning(false);
  };

  const setCustomTime = () => {
    const mins = parseInt(customMinutes) || 25;
    setPomodoroMinutes(mins);
    setPomodoroSeconds(0);
  };

  const completeSubtask = () => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeSubtask.taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === activeSubtask.subtaskId ? { ...s, completed: true } : s
              ),
            }
          : t
      )
    );
    toast.success('✅ Subtask completed! Great job!');
    onClose();
  };

  const sendBodyDoubleMessage = () => {
    if (!bodyDoubleMessage.trim()) return;
    
    // Simulate body double responses
    const responses = [
      "Great question! Let me help you think through that.",
      "You're making good progress! Keep it up!",
      "That's an interesting point. Have you considered...?",
      "I'm here with you. You've got this!",
      "Nice work! Stay focused on your goal.",
    ];
    
    toast.success(responses[Math.floor(Math.random() * responses.length)]);
    setBodyDoubleMessage('');
  };

  if (!task || !subtask) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0" style={{
        background: !selectedRoom ? 'linear-gradient(135deg, #CFE8ED 0%, #B8D4C8 50%, #FFD4A3 100%)' : undefined
      }}>
        <div className="p-6" style={{
          background: !selectedRoom ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
          backdropFilter: !selectedRoom ? 'blur(10px)' : 'none',
          borderRadius: !selectedRoom ? '24px 24px 0 0' : '0'
        }}>
          <DialogHeader>
            <DialogTitle style={{ 
              fontFamily: 'Poppins, sans-serif',
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#F7A64B'
            }}>
              🎯 Start Your Focus Session
            </DialogTitle>
            <DialogDescription style={{ 
              fontFamily: 'Lexend Deca, sans-serif',
              color: '#8B5E3C'
            }}>
              Choose your virtual study environment
            </DialogDescription>
            <p className="text-sm mt-2" style={{ 
              fontFamily: 'Lexend Deca, sans-serif',
              color: '#2D2D2D'
            }}>
              {task.title} → {subtask.title}
            </p>
          </DialogHeader>
        </div>

        {!selectedRoom ? (
          /* Room Selection with Themed Background */
          <div className="p-6 pt-0">
            <div className="grid grid-cols-2 gap-4">
              {ROOMS.map((room) => (
                <Card
                  key={room.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group warm-card"
                  onClick={() => setSelectedRoom(room)}
                  style={{
                    borderRadius: '20px',
                    border: '2px solid transparent'
                  }}
                >
                  <div className="relative h-48">
                    <img 
                      src={room.backgroundImage} 
                      alt={room.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-full" style={{ background: 'rgba(247, 166, 75, 0.9)' }}>
                          <room.icon className="size-5" />
                        </div>
                        <h3 style={{ 
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: 600,
                          fontSize: '1.125rem'
                        }}>
                          {room.name}
                        </h3>
                      </div>
                      <p className="text-sm opacity-90 ml-11" style={{ fontFamily: 'Lexend Deca, sans-serif' }}>
                        {room.ambientSound}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : !showReflection ? (
          /* Study Room */
          <div 
            className="relative min-h-[600px]"
            style={{
              backgroundImage: `url(${selectedRoom.backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Overlay for readability */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            
            <div className="relative p-8">
              {/* Room Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 text-white">
                  <selectedRoom.icon className="size-8" />
                  <div>
                    <h3>{selectedRoom.name}</h3>
                    <p className="text-sm opacity-90">{selectedRoom.ambientSound}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="bg-white/90"
                  >
                    {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRoom(null)}
                    className="bg-white/90"
                  >
                    Change Room
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pomodoro Timer */}
                <Card className="p-6 bg-white/95 backdrop-blur">
                  <h4 className="mb-4">⏱️ Pomodoro Timer</h4>
                  
                  {/* Time Display */}
                  <motion.div
                    className="text-6xl text-center mb-6 text-purple-600"
                    animate={{ scale: isRunning ? [1, 1.02, 1] : 1 }}
                    transition={{ repeat: isRunning ? Infinity : 0, duration: 1 }}
                  >
                    {String(pomodoroMinutes).padStart(2, '0')}:
                    {String(pomodoroSeconds).padStart(2, '0')}
                  </motion.div>

                  {/* Time Input */}
                  {!isRunning && (
                    <div className="flex items-center gap-2 mb-4 justify-center">
                      <label className="text-sm text-gray-600">Duration:</label>
                      <Input
                        type="number"
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(e.target.value)}
                        onBlur={setCustomTime}
                        className="w-20 text-center"
                        min="1"
                        max="120"
                      />
                      <span className="text-sm text-gray-600">minutes</span>
                    </div>
                  )}

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      onClick={() => setIsRunning(!isRunning)}
                      size="lg"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isRunning ? (
                        <>
                          <Pause className="size-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="size-4 mr-2" />
                          Start
                        </>
                      )}
                    </Button>
                    <Button onClick={resetPomodoro} variant="outline">
                      <RotateCcw className="size-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </Card>

                {/* Body Double Section */}
                <Card className="p-6 bg-white/95 backdrop-blur">
                  <h4 className="mb-3">👥 Body Double</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Your virtual study buddy is here to keep you company and accountable.
                  </p>
                  
                  {!showBodyDouble ? (
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setShowBodyDouble(true)}
                      >
                        <MessageCircle className="size-4 mr-2" />
                        Text Chat
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          toast.success('📞 Voice call feature coming soon!');
                        }}
                      >
                        <Phone className="size-4 mr-2" />
                        Voice Call
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm">
                        <p className="text-purple-900">
                          👋 Hi! I'm here to support you. How's it going?
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Input
                          value={bodyDoubleMessage}
                          onChange={(e) => setBodyDoubleMessage(e.target.value)}
                          placeholder="Type your message..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') sendBodyDoubleMessage();
                          }}
                        />
                        <Button onClick={sendBodyDoubleMessage}>
                          Send
                        </Button>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            toast.success("That's great! Keep up the momentum!");
                          }}
                        >
                          I'm on track
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            toast.success("That's okay! Let's break it down into smaller steps.");
                          }}
                        >
                          I'm stuck
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            toast.success("Take a deep breath. You've got this!");
                          }}
                        >
                          Need motivation
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* Complete Button */}
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setShowReflection(true)}
                  className="bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <CheckCircle2 className="size-4 mr-2" />
                  Complete Session
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Reflection & Teachback */
          <div className="p-6 space-y-6">
            <div>
              <h3 className="mb-2">📝 Session Reflection</h3>
              <p className="text-sm text-gray-600">Take a moment to consolidate your learning.</p>
            </div>

            {/* Teachback Section */}
            <div>
              <label className="block mb-2">
                🎓 Teach it back: What did you learn? Explain it in your own words.
              </label>
              <p className="text-sm text-gray-600 mb-2">
                Teaching back helps solidify your understanding and identify any gaps in your knowledge.
              </p>
              <Textarea
                value={teachback}
                onChange={(e) => setTeachback(e.target.value)}
                placeholder="I learned that... The main concept is... This works because..."
                rows={5}
                className="w-full"
              />
            </div>

            {/* General Reflection */}
            <div>
              <label className="block text-sm mb-2">💭 Additional reflections or notes</label>
              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="What went well? What could be improved? Any questions to follow up on?"
                rows={3}
                className="w-full"
              />
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-purple-900 mb-2">Session Summary</h4>
              <div className="space-y-1 text-sm text-gray-700">
                <p>• Task: {task.title}</p>
                <p>• Subtask: {subtask.title}</p>
                <p>• Environment: {selectedRoom.name}</p>
                <p>• Focus time: {customMinutes} minutes</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowReflection(false)}>
                Back to Session
              </Button>
              <Button 
                onClick={completeSubtask} 
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={!teachback.trim()}
              >
                <CheckCircle2 className="size-4 mr-2" />
                {teachback.trim() ? 'Mark Complete & Close' : 'Please complete teachback first'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
