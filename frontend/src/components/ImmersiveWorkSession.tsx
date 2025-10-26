import { useState, useEffect, useRef } from 'react';
import { Task, SessionNote } from '../App';
import PizzaBodyDouble from './PizzaBodyDouble';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import {
  getEncouragementMessage,
  getChatResponse,
  getTimerCompleteMessage,
  getSessionFeedback,
} from '../utils/messageGenerator';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import { 
  Coffee, 
  Library, 
  Trees, 
  Home, 
  Volume2,
  VolumeX,
  X,
  PartyPopper,
  Music,
  Wind,
  Headphones,
  MessageCircle,
  Play,
  Pause,
  RotateCcw,
  Pizza
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Slider } from './ui/slider';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

// Import the study room images
import parkImage from 'figma:asset/7e76872b256e7fd723a4239d420a6a89e017e370.png';
import coffeeShopImage from 'figma:asset/73d6908a0ba007a1939489b125a82c1a62bdc60c.png';
import dormImage from 'figma:asset/7404a217abf5de3ad2bf846b59b6f4a6a24632cf.png';
import cozyHomeImage from 'figma:asset/7e76872b256e7fd723a4239d420a6a89e017e370.png';
import driveImage from 'figma:asset/8ff4d03f0a880e673612d58f453e6f41a680463e.png';
import parkCampfireImage from 'figma:asset/afcfaf4ea252676f139a076b5bcd8d085401b191.png';

interface ImmersiveWorkSessionProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  dailyTasks: string[];
  setDailyTasks: React.Dispatch<React.SetStateAction<string[]>>;
  sessionNotes: SessionNote[];
  setSessionNotes: React.Dispatch<React.SetStateAction<SessionNote[]>>;
  onClose: () => void;
  personality: 'gentle' | 'funny' | 'pushy';
  voiceTone: 'ariana' | 'gordon' | 'snoop';
}

interface Room {
  id: string;
  name: string;
  icon: React.ElementType;
  ambientSound: string;
  videoId: string; // YouTube embed ID for POV video
}

interface AudioOption {
  id: string;
  name: string;
  icon: React.ElementType;
  videoId: string; // YouTube embed ID for audio
}

const ROOMS: Room[] = [
  {
    id: 'coffee',
    name: 'Coffee Shop',
    icon: Coffee,
    ambientSound: 'Gentle café ambience',
    videoId: 'uiMXGIG_DQo', // Coffee shop POV
  },
  {
    id: 'library',
    name: 'Library',
    icon: Library,
    ambientSound: 'Quiet study atmosphere',
    videoId: '757G_El3ABI', // Library POV
  },
  {
    id: 'park',
    name: 'Park',
    icon: Trees,
    ambientSound: 'Nature sounds',
    videoId: '8KrLtLr-Gy8', // Park POV
  },
  {
    id: 'home',
    name: 'Cozy Home',
    icon: Home,
    ambientSound: 'Peaceful home vibes',
    videoId: 'uQ-TWK1kW3c', // Cozy home POV
  },
  {
    id: 'dorm',
    name: 'Dorm Room',
    icon: Home,
    ambientSound: 'Quiet dorm atmosphere',
    videoId: 'p3ynjjRbU9A', // Dorm room POV
  },
  {
    id: 'car',
    name: 'Drive/Car',
    icon: Coffee,
    ambientSound: 'Road ambience',
    videoId: 'eR5vsN1Lq4E', // Car drive POV
  },
];

const AUDIO_OPTIONS: AudioOption[] = [
  {
    id: 'white-noise',
    name: 'White Noise',
    icon: Wind,
    videoId: 'nMfPqeZjc2c', // White noise
  },
  {
    id: 'nature',
    name: 'Nature Ambience',
    icon: Trees,
    videoId: 'eKFTSSKCzWA', // Forest sounds
  },
  {
    id: 'library',
    name: 'Library Ambience',
    icon: Library,
    videoId: 'jfKfPfyJRdk', // Library sounds
  },
  {
    id: 'coffee',
    name: 'Coffee Shop Sounds',
    icon: Coffee,
    videoId: 'lTRiuFIWV54', // Coffee shop sounds
  },
  {
    id: 'instrumental',
    name: 'Instrumental Focus',
    icon: Music,
    videoId: '4oStw0r33so', // Lo-fi study music
  },
];

type ViewState = 'room-selection' | 'pre-immersive' | 'immersive';

export default function ImmersiveWorkSession({
  tasks,
  setTasks,
  dailyTasks,
  setDailyTasks,
  sessionNotes,
  setSessionNotes,
  onClose,
  personality,
  voiceTone,
}: ImmersiveWorkSessionProps) {
  const { user } = useAuth();
  const [viewState, setViewState] = useState<ViewState>('room-selection');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState(new Date());
  const [showFeedback, setShowFeedback] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [showTaskCompletionPrompt, setShowTaskCompletionPrompt] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false); // TTS playback
  
  // Pre-immersive setup
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string>('');
  const [intendedDuration, setIntendedDuration] = useState('25');
  
  // Audio/Video Controls
  const [selectedAudio, setSelectedAudio] = useState<string>('none');
  const [audioVolume, setAudioVolume] = useState([70]);
  
  // Pomodoro Timer
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isBreakTime, setIsBreakTime] = useState(false);
  const [studyDuration, setStudyDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  
  // Chat - initial message based on personality
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
  const [chatMessages, setChatMessages] = useState<{ from: string; text: string }[]>([
    { from: 'body-double', text: getInitialChatMessage() }
  ]);
  const [messageInput, setMessageInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  
  // Pizza Body Double - initial message based on personality
  const getInitialMessage = () => {
    if (personality === 'gentle') {
      if (voiceTone === 'ariana') return "Hey babe! Ready to shine today? Let's do this! ✨💕";
      if (voiceTone === 'gordon') return "Right, let's get to work. Focus and deliver!";
      return "Yo, let's vibe and get this done, homie! 😎";
    } else if (personality === 'funny') {
      if (voiceTone === 'ariana') return "Oh, you're actually here? Werk! Let's see what you got! 💅";
      if (voiceTone === 'gordon') return "Finally decided to show up? Let's go!";
      return "Aight, you ready or you just gonna stare at the screen? 😂";
    } else {
      if (voiceTone === 'ariana') return "Get MOVING! No time to waste! Let's GO! 💪";
      if (voiceTone === 'gordon') return "STOP wasting time! We're starting NOW! MOVE IT!";
      return "Yo, quit slackin'! Time to hustle, dawg! ⏰";
    }
  };
  const [pizzaMessage, setPizzaMessage] = useState<string>(getInitialMessage());
  const [isPizzaTalking, setIsPizzaTalking] = useState(false);
  
  // Reflection
  const [reflection, setReflection] = useState('');
  const [teachback, setTeachback] = useState('');
  const [sessionFeedback, setSessionFeedback] = useState<{ icon: string; title: string; message: string; advice: string; completedCount?: number } | null>(null);
  const [staticFeedback, setStaticFeedback] = useState<{ icon: string; title: string; message: string; advice: string; completedCount?: number } | null>(null);

  // Filter tasks to only those selected for today
  const selectedDailySubtasks = tasks.flatMap(task =>
    task.subtasks
      .filter(subtask => dailyTasks.includes(subtask.id))
      .map(subtask => ({
        ...subtask,
        taskId: task.id,
        taskTitle: task.title,
        taskSubtasks: task.subtasks,
      }))
  );

  const selectedSubtask = selectedDailySubtasks.find(s => s.id === selectedSubtaskId);

  // Calculate progress for selected subtask
  const calculateSubtaskProgress = () => {
    if (!selectedSubtask) return 0;
    
    const task = tasks.find(t => t.id === selectedSubtask.taskId);
    if (!task) return 0;
    
    const totalSlices = task.subtasks.length;
    const completedSlices = task.subtasks.filter(s => s.completed).length;
    
    return (completedSlices / totalSlices) * 100;
  };

  // Pomodoro timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && (pomodoroMinutes > 0 || pomodoroSeconds > 0)) {
      interval = setInterval(() => {
        if (pomodoroSeconds === 0) {
          if (pomodoroMinutes === 0) {
            setIsTimerRunning(false);
            
            // Toggle between study and break
            if (isBreakTime) {
              // Break is over, back to study
              toast.success('⏰ Break time is over! Ready to focus again?');
              const backToWorkMsg = getTimerCompleteMessage({ personality, voiceTone }, false);
              setPizzaMessage(backToWorkMsg);
              setIsBreakTime(false);
              setPomodoroMinutes(studyDuration);
            } else {
              // Study session complete, time for break
              toast.success('🎉 Study session complete! Time for a break!');
              const breakMsg = getTimerCompleteMessage({ personality, voiceTone }, true);
              setPizzaMessage(breakMsg);
              setIsBreakTime(true);
              setPomodoroMinutes(breakDuration);
            }
            
            setPomodoroSeconds(0);
            setIsPizzaTalking(true);
            setTimeout(() => setIsPizzaTalking(false), 4000);
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
  }, [isTimerRunning, pomodoroMinutes, pomodoroSeconds, isBreakTime, studyDuration, breakDuration]);

  // Pizza body double periodic encouragement
  useEffect(() => {
    if (viewState !== 'immersive') return;
    
    const encourageInterval = setInterval(() => {
      const message = getEncouragementMessage({ personality, voiceTone });
      setPizzaMessage(message);
      setIsPizzaTalking(true);
      setTimeout(() => setIsPizzaTalking(false), 3000);
    }, 120000); // Every 2 minutes

    return () => clearInterval(encourageInterval);
  }, [viewState, personality, voiceTone]);

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
              // Convert backend message format to frontend format
              const formattedMessages = data.messages.slice(-10).reverse().map((msg: any) => ({
                from: msg.role === 'user' ? 'user' : 'body-double',
                text: msg.content
              }));
              
              // Set messages (oldest first for display)
              setChatMessages(formattedMessages);
            }
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
        }
      };
      
      loadHistory();
    }
  }, [showChat, user?.username]);

  const resetPomodoro = () => {
    const mins = isBreakTime ? breakDuration : studyDuration;
    setPomodoroMinutes(mins);
    setPomodoroSeconds(0);
    setIsTimerRunning(false);
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (!voiceEnabled) {
      toast.success('🔊 Voice playback enabled');
    } else {
      toast.success('🔊 Voice playback disabled');
    }
  };

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
        // Create and play audio from response
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
        
        // Clean up URL after playing
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
      // Call the backend chat API to get agent response
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
        
        // Update pizza message and animate
        setPizzaMessage(responseText);
        setIsPizzaTalking(true);
        setTimeout(() => setIsPizzaTalking(false), 3000);
        
        // Play voice if enabled
        if (voiceEnabled && data.text && data.voice_model) {
          playVoice(responseText, data.voice_model);
        }
      } else {
        // Fallback to mock response on error
        console.error('Chat API error:', response.status);
        const fallbackResponse = getChatResponse({ personality, voiceTone });
        const responseMsg = {
          from: 'body-double',
          text: fallbackResponse
        };
        setChatMessages(prev => [...prev, responseMsg]);
        setPizzaMessage(fallbackResponse);
        setIsPizzaTalking(true);
        setTimeout(() => setIsPizzaTalking(false), 3000);
      }
    } catch (error) {
      console.error('Error sending message to chat API:', error);
      // Fallback to mock response on error
      const fallbackResponse = getChatResponse({ personality, voiceTone });
      const responseMsg = {
        from: 'body-double',
        text: fallbackResponse
      };
      setChatMessages(prev => [...prev, responseMsg]);
      setPizzaMessage(fallbackResponse);
      setIsPizzaTalking(true);
      setTimeout(() => setIsPizzaTalking(false), 3000);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const calculateSessionDuration = () => {
    const now = new Date();
    const durationMs = now.getTime() - sessionStartTime.getTime();
    const minutes = Math.floor(durationMs / 60000);
    return minutes;
  };

  const totalDailySubtasks = selectedDailySubtasks.length;
  const completedDailySubtasks = selectedDailySubtasks.filter(s => s.completed).length;

  const handleEndSessionClick = () => {
    setShowTaskCompletionPrompt(true);
  };

  const handleTaskCompletion = (taskCompleted: boolean) => {
    setShowTaskCompletionPrompt(false);
    
    // Calculate completed tasks count before state updates
    let adjustedCompletedCount = completedDailySubtasks;
    
    // If user completed their task, mark the current subtask as complete
    if (taskCompleted && selectedSubtask) {
      setTasks((prev) =>
        prev.map((task) => ({
          ...task,
          subtasks: task.subtasks.map((subtask) =>
            subtask.id === selectedSubtask.id
              ? { ...subtask, completed: true }
              : subtask
          ),
        }))
      );
      
      // Remove from daily tasks if completed
      setDailyTasks((prev) => prev.filter((id) => id !== selectedSubtask.id));
      
      // Increment the count since we just completed a task
      // (state updates are async, so we need to manually adjust)
      adjustedCompletedCount = completedDailySubtasks + 1;
    }
    
    // Now show the regular session feedback with the adjusted count
    handleEndSession(taskCompleted, adjustedCompletedCount);
  };

  const handleEndSession = (taskCompleted: boolean, adjustedCompletedCount?: number) => {
    setSessionCompleted(taskCompleted);
    setViewState('room-selection'); // Exit immersive mode
    
    // Generate personalized feedback based on personality and voice tone
    const duration = calculateSessionDuration();
    const actualCompletedCount = adjustedCompletedCount ?? completedDailySubtasks;
    const feedbackData = getSessionFeedback(
      { personality, voiceTone },
      actualCompletedCount,
      totalDailySubtasks,
      duration,
      taskCompleted
    );
    
    // Add fun advice to the feedback
    const restRecommendations = [
      "🌟 Do 10 jumping jacks to get your blood flowing!",
      "🧘 Try the 4-7-8 breathing technique: Breathe in for 4, hold for 7, out for 8.",
      "💃 Put on your favorite song and dance like nobody's watching!",
      "🚶 Take a quick walk around your space - even 2 minutes helps!",
      "💧 Hydrate! Your brain is 73% water. Grab a glass!",
      "👀 Look at something 20 feet away for 20 seconds to rest your eyes.",
      "🤸 Do some gentle stretches - touch your toes, roll your shoulders!",
      "🌳 Look out a window at nature for a quick mental reset.",
    ];
    
    const efficiencyTips = [
      "💡 Try the Pomodoro Technique: 25 minutes focused work, 5 minute break.",
      "🎯 Break down big tasks into smaller, specific subtasks you can finish in one session.",
      "📱 Put your phone in another room during focus time.",
      "🎧 Experiment with different types of background music or white noise.",
      "✅ Set a clear, specific goal before starting each session.",
      "🧠 Work on your hardest tasks when your energy is highest.",
      "🚫 Close unnecessary browser tabs and apps before you start.",
      "⏰ Schedule your study sessions at the same time each day to build a habit.",
    ];
    let advice: string;
    if (taskCompleted) {
      // If they completed the task, give rest recommendations
      advice = restRecommendations[Math.floor(Math.random() * restRecommendations.length)];
    } else {
      // If they didn't complete the task, give efficiency tips
      advice = efficiencyTips[Math.floor(Math.random() * efficiencyTips.length)];
    }
    
    setStaticFeedback({
      icon: taskCompleted ? '🎉' : '💪',
      title: taskCompleted ? feedbackData.title : "Keep Going! 💪",
      message: taskCompleted 
        ? feedbackData.message 
        : "That's okay! Every study session is progress, even if you didn't finish. The key is to keep trying and adjust your approach.",
      advice: advice,
      completedCount: actualCompletedCount
    });
    setShowFeedback(true);
  };

  const handleCompleteReflection = () => {
    // Save session note if teachback is provided
    if (teachback.trim() && selectedSubtask) {
      const newNote: SessionNote = {
        id: `note-${Date.now()}`,
        timestamp: sessionStartTime,
        duration: calculateSessionDuration(),
        subtaskId: selectedSubtask.id,
        taskTitle: selectedSubtask.taskTitle,
        subtaskTitle: selectedSubtask.title,
        teachback: teachback.trim(),
        reflection: reflection.trim(),
      };
      
      setSessionNotes(prev => [...prev, newNote]);
      toast.success('✅ Great work! Your reflections help solidify your learning.');
    } else {
      toast('Session ended without reflection notes.');
    }
    
    setShowFeedback(false);
    
    // Reset for next session
    setSelectedRoom(null);
    setSelectedSubtaskId('');
    setIntendedDuration('25');
    setViewState('room-selection');
    setChatMessages([
      { from: 'body-double', text: "👋 Hi! I'm your body double. I'm here to keep you focused and on track!" }
    ]);
    setReflection('');
    setTeachback('');
    setStaticFeedback(null); // Reset static feedback for next session
    setSessionStartTime(new Date());
  };

  const handleStartPreImmersive = (room: Room) => {
    setSelectedRoom(room);
    setViewState('pre-immersive');
  };

  const handleStartImmersive = () => {
    if (!selectedSubtaskId) {
      toast.error('Please select a subtask to work on');
      return;
    }
    
    setStudyDuration(parseInt(intendedDuration) || 25);
    setPomodoroMinutes(parseInt(intendedDuration) || 25);
    setPomodoroSeconds(0);
    setIsBreakTime(false);
    setSessionStartTime(new Date());
    setViewState('immersive');
  };

  // Scene Selection View
  if (viewState === 'room-selection') {
    return (
      <>
        <div 
          className="fixed inset-0 z-50 overflow-auto" 
          style={{ background: 'linear-gradient(135deg, #CFE8ED 0%, #FFE4C4 50%, #F7A64B 100%)' }}
        >
          <div className="container mx-auto p-8 max-w-6xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 
                  className="mb-2" 
                  style={{ 
                    fontFamily: 'Poppins, sans-serif',
                    color: '#F7A64B'
                  }}
                >
                  🎯 Start Your Focus Session
                </h2>
                <p 
                  style={{ 
                    fontFamily: 'Lexend Deca, sans-serif',
                    color: '#8B5E3C'
                  }}
                >
                  Choose your virtual study environment
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={onClose}
                style={{ 
                  borderColor: '#8B5E3C',
                  color: '#8B5E3C',
                  fontFamily: 'Inter, sans-serif',
                  borderRadius: '16px',
                  borderWidth: '2px'
                }}
              >
                <X className="size-4 mr-2" />
                Exit
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ROOMS.map((room) => (
                <motion.div
                  key={room.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className="overflow-hidden cursor-pointer hover:shadow-xl transition-all group"
                    onClick={() => handleStartPreImmersive(room)}
                    style={{
                      borderRadius: '24px',
                      border: '3px solid #FFF9F4',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div className="relative h-64">
                      <img 
                        src={
                          room.id === 'park' 
                            ? parkCampfireImage
                            : room.id === 'coffee'
                            ? coffeeShopImage
                            : room.id === 'dorm'
                            ? dormImage
                            : room.id === 'home'
                            ? cozyHomeImage
                            : room.id === 'car'
                            ? driveImage
                            : room.id === 'library'
                            ? 'https://images.unsplash.com/photo-1546953304-5d96f43c2e94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaWJyYXJ5JTIwc3R1ZHl8ZW58MXx8fHwxNzYxNDQ4MzMwfDA&ixlib=rb-4.1.0&q=80&w=1080'
                            : 'https://images.unsplash.com/photo-1554078140-01f553ad4d40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwaG9tZSUyMHdvcmtzcGFjZXxlbnwxfHx8fDE3NjE0MjgxMjl8MA&ixlib=rb-4.1.0&q=80&w=1080'
                        }
                        alt={room.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <div className="flex items-center gap-3 mb-2">
                          <div 
                            className="p-3 rounded-full" 
                            style={{ background: 'rgba(247, 166, 75, 0.9)' }}
                          >
                            <room.icon className="size-6" />
                          </div>
                          <h3 
                            style={{ 
                              fontFamily: 'Poppins, sans-serif',
                              fontSize: '1.5rem'
                            }}
                          >
                            {room.name}
                          </h3>
                        </div>
                        <p 
                          className="opacity-90 ml-16" 
                          style={{ fontFamily: 'Lexend Deca, sans-serif' }}
                        >
                          🎵 {room.ambientSound}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Feedback Dialog */}
        {showFeedback && staticFeedback && (
          <FeedbackDialog 
            feedback={staticFeedback}
            onClose={handleCompleteReflection}
            reflection={reflection}
            setReflection={setReflection}
            teachback={teachback}
            setTeachback={setTeachback}
            sessionDuration={calculateSessionDuration()}
            completedTasks={completedDailySubtasks}
            totalTasks={totalDailySubtasks}
          />
        )}
      </>
    );
  }

  // Pre-Immersive Setup Page
  if (viewState === 'pre-immersive' && selectedRoom) {
    const task = selectedSubtask ? tasks.find(t => t.id === selectedSubtask.taskId) : null;
    const totalSlices = task?.subtasks.length || 0;
    const completedSlices = task?.subtasks.filter(s => s.completed).length || 0;
    const progress = calculateSubtaskProgress();

    return (
      <div 
        className="fixed inset-0 z-50 overflow-auto" 
        style={{ background: 'linear-gradient(135deg, #FFF9F4 0%, #CFE8ED 50%, #FFE4C4 100%)' }}
      >
        <div className="container mx-auto p-8 max-w-3xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div 
                className="p-4 rounded-2xl" 
                style={{ background: '#F7A64B', border: '2px solid #8B5E3C' }}
              >
                <selectedRoom.icon className="size-8 text-white" />
              </div>
              <div>
                <h2 
                  style={{ 
                    fontFamily: 'Poppins, sans-serif',
                    color: '#F7A64B'
                  }}
                >
                  {selectedRoom.name}
                </h2>
                <p 
                  style={{ 
                    fontFamily: 'Lexend Deca, sans-serif',
                    color: '#8B5E3C'
                  }}
                >
                  Set up your focus session
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setViewState('room-selection')}
              style={{ 
                borderColor: '#8B5E3C',
                color: '#8B5E3C',
                fontFamily: 'Inter, sans-serif',
                borderRadius: '16px',
                borderWidth: '2px'
              }}
            >
              <X className="size-4 mr-2" />
              Back
            </Button>
          </div>

          <Card 
            className="p-8"
            style={{
              background: '#FFF9F4',
              borderRadius: '24px',
              border: '3px solid #CFE8ED',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="space-y-6">
              {/* Subtask Selection */}
              <div>
                <label 
                  className="block mb-3"
                  style={{ 
                    fontFamily: 'Poppins, sans-serif',
                    color: '#8B5E3C',
                    fontSize: '1.125rem'
                  }}
                >
                  📝 Select a subtask to focus on
                </label>
                <Select value={selectedSubtaskId} onValueChange={setSelectedSubtaskId}>
                  <SelectTrigger 
                    style={{ 
                      fontFamily: 'Lexend Deca, sans-serif',
                      borderRadius: '12px',
                      borderWidth: '2px',
                      borderColor: '#CFE8ED',
                      padding: '24px',
                      fontSize: '1rem'
                    }}
                  >
                    <SelectValue placeholder="Choose a subtask to work on..." />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedDailySubtasks
                      .filter(s => !s.completed)
                      .map(subtask => (
                        <SelectItem key={subtask.id} value={subtask.id}>
                          {subtask.taskTitle} → {subtask.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duration Input */}
              <div>
                <label 
                  className="block mb-3"
                  style={{ 
                    fontFamily: 'Poppins, sans-serif',
                    color: '#8B5E3C',
                    fontSize: '1.125rem'
                  }}
                >
                  ⏱️ Study duration (minutes)
                </label>
                <Input
                  type="number"
                  value={intendedDuration}
                  onChange={(e) => setIntendedDuration(e.target.value)}
                  min="1"
                  max="120"
                  placeholder="25"
                  style={{
                    fontFamily: 'Lexend Deca, sans-serif',
                    borderRadius: '12px',
                    borderWidth: '2px',
                    borderColor: '#CFE8ED',
                    padding: '24px',
                    fontSize: '1.25rem',
                    textAlign: 'center'
                  }}
                />
              </div>

              {/* Break Duration Input */}
              <div>
                <label 
                  className="block mb-3"
                  style={{ 
                    fontFamily: 'Poppins, sans-serif',
                    color: '#8B5E3C',
                    fontSize: '1.125rem'
                  }}
                >
                  ☕ Break duration (minutes)
                </label>
                <Input
                  type="number"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(parseInt(e.target.value) || 5)}
                  min="1"
                  max="30"
                  placeholder="5"
                  style={{
                    fontFamily: 'Lexend Deca, sans-serif',
                    borderRadius: '12px',
                    borderWidth: '2px',
                    borderColor: '#CFE8ED',
                    padding: '24px',
                    fontSize: '1.25rem',
                    textAlign: 'center'
                  }}
                />
              </div>

              {/* Progress Display */}
              {selectedSubtask && (
                <div 
                  className="p-6 rounded-2xl"
                  style={{
                    background: 'rgba(207, 232, 237, 0.3)',
                    border: '2px solid #CFE8ED'
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span 
                      style={{ 
                        fontFamily: 'Poppins, sans-serif',
                        color: '#8B5E3C',
                        fontSize: '1rem'
                      }}
                    >
                      🍕 Subtask Progress
                    </span>
                    <span 
                      style={{ 
                        fontFamily: 'Inter, sans-serif',
                        color: '#F7A64B',
                        fontWeight: 600,
                        fontSize: '1rem'
                      }}
                    >
                      {completedSlices}/{totalSlices} slices
                    </span>
                  </div>
                  <Progress 
                    value={progress} 
                    className="h-3"
                    style={{
                      background: 'rgba(255, 255, 255, 0.5)'
                    }}
                  />
                  <p 
                    className="text-center mt-3"
                    style={{ 
                      fontFamily: 'Lexend Deca, sans-serif',
                      color: '#8B5E3C',
                      fontSize: '0.875rem'
                    }}
                  >
                    {Math.round(progress)}% complete
                  </p>
                </div>
              )}

              {/* Start Button */}
              <Button
                onClick={handleStartImmersive}
                disabled={!selectedSubtaskId}
                className="w-full"
                size="lg"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  borderRadius: '16px',
                  background: selectedSubtaskId ? '#F7A64B' : '#CCC',
                  color: '#FFF9F4',
                  padding: '24px',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  border: '2px solid #8B5E3C'
                }}
              >
                <PartyPopper className="size-5 mr-2" />
                {selectedSubtaskId ? 'Start Focus Session' : 'Please select a subtask'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Immersive Mode View
  if (viewState === 'immersive' && selectedRoom) {
    const selectedAudioOption = AUDIO_OPTIONS.find(a => a.id === selectedAudio);
    
    return (
      <div className="fixed inset-0 z-50 bg-black">
        {/* Prominent Background Video */}
        <div className="absolute inset-0">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${selectedRoom.videoId}?autoplay=1&mute=1&loop=1&playlist=${selectedRoom.videoId}&controls=0&showinfo=0&rel=0&modestbranding=1`}
            title={`${selectedRoom.name} POV`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full object-cover pointer-events-none"
            style={{ opacity: 0.65 }}
          />
        </div>

        {/* Background Audio (separate, controllable volume) */}
        {selectedAudio !== 'none' && selectedAudioOption && (
          <div className="absolute opacity-0 pointer-events-none">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${selectedAudioOption.videoId}?autoplay=1&mute=0&loop=1&playlist=${selectedAudioOption.videoId}&controls=0&showinfo=0&rel=0&volume=${audioVolume[0]}`}
              title={selectedAudioOption.name}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* Top Control Bar */}
        <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent z-20">
          <div className="flex items-center justify-between">
            {/* Room Info */}
            <div className="flex items-center gap-4">
              <div 
                className="flex items-center gap-3 px-5 py-3 rounded-full"
                style={{
                  background: 'rgba(247, 166, 75, 0.95)',
                  border: '2px solid #FFF9F4'
                }}
              >
                <selectedRoom.icon className="size-6 text-white" />
                <span 
                  style={{ 
                    fontFamily: 'Poppins, sans-serif',
                    color: '#FFF9F4',
                    fontSize: '1.125rem',
                    fontWeight: 600
                  }}
                >
                  {selectedRoom.name}
                </span>
              </div>
            </div>

            {/* Audio Selection */}
            <div className="flex items-center gap-3">
              <div 
                className="px-4 py-2 rounded-full"
                style={{
                  background: 'rgba(255, 249, 244, 0.95)',
                  border: '2px solid #CFE8ED'
                }}
              >
                <Select value={selectedAudio} onValueChange={setSelectedAudio}>
                  <SelectTrigger 
                    className="border-0 bg-transparent"
                    style={{ 
                      fontFamily: 'Inter, sans-serif',
                      width: '180px'
                    }}
                  >
                    <Headphones className="size-4 mr-2" style={{ color: '#F7A64B' }} />
                    <SelectValue placeholder="Background Audio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Audio</SelectItem>
                    {AUDIO_OPTIONS.map((audio) => (
                      <SelectItem key={audio.id} value={audio.id}>
                        <div className="flex items-center gap-2">
                          <audio.icon className="size-4" />
                          {audio.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Background Audio Volume Control */}
          {selectedAudio !== 'none' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <div 
                className="max-w-md mx-auto px-6 py-4 rounded-2xl"
                style={{
                  background: 'rgba(207, 232, 237, 0.95)',
                  border: '2px solid #F7A64B'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span 
                    style={{ 
                      fontFamily: 'Inter, sans-serif',
                      color: '#8B5E3C',
                      fontWeight: 600
                    }}
                  >
                    🎵 Background Audio Volume
                  </span>
                  <span 
                    style={{ 
                      fontFamily: 'Inter, sans-serif',
                      color: '#F7A64B',
                      fontWeight: 600
                    }}
                  >
                    {audioVolume[0]}%
                  </span>
                </div>
                <Slider
                  value={audioVolume}
                  onValueChange={setAudioVolume}
                  max={100}
                  step={1}
                  className="cursor-pointer"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Pizza Body Double - Top Right Corner (Video Call Style) 
            Note: Personality is customized via Settings > Personality button in main navigation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: 100 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          className="absolute top-6 right-6 z-30"
        >
          <div 
            className="relative rounded-2xl overflow-hidden"
            style={{
              width: '280px',
              height: '240px',
              background: 'linear-gradient(135deg, #FFF9F4 0%, #FFE4C4 100%)',
              border: '3px solid #F7A64B',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="scale-75">
                <PizzaBodyDouble isTalking={isPizzaTalking} message={pizzaMessage} />
              </div>
            </div>
            
            {/* Pizza Label */}
            <div 
              className="absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-lg text-center"
              style={{
                background: 'rgba(247, 166, 75, 0.9)',
                border: '1px solid #FFF9F4'
              }}
            >
              <span 
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  color: '#FFF9F4',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                🍕 Your Body Double
              </span>
            </div>
          </div>
        </motion.div>

        {/* Timer - Bottom Left Corner */}
        <div 
          className="absolute bottom-6 left-6 z-30"
        >
          <div 
            className="px-6 py-4 rounded-2xl"
            style={{
              background: isBreakTime ? 'rgba(207, 232, 237, 0.95)' : 'rgba(247, 166, 75, 0.95)',
              border: '3px solid #FFF9F4',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Timer Label */}
            <div 
              className="text-center mb-2"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: isBreakTime ? '#8B5E3C' : '#FFF9F4'
              }}
            >
              {isBreakTime ? '☕ Break Time' : '📚 Study Time'}
            </div>
            
            <motion.div
              className="text-4xl text-center mb-3"
              style={{ 
                color: isBreakTime ? '#8B5E3C' : '#FFF9F4',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600
              }}
              animate={{ scale: isTimerRunning ? [1, 1.05, 1] : 1 }}
              transition={{ repeat: isTimerRunning ? Infinity : 0, duration: 1 }}
            >
              {String(pomodoroMinutes).padStart(2, '0')}:{String(pomodoroSeconds).padStart(2, '0')}
            </motion.div>
            
            {/* Timer Controls */}
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                size="sm"
                style={{
                  background: '#FFF9F4',
                  color: isBreakTime ? '#8B5E3C' : '#F7A64B',
                  fontFamily: 'Inter, sans-serif',
                  borderRadius: '12px',
                  border: '2px solid #FFF9F4',
                  fontWeight: 600
                }}
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="size-4 mr-1" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="size-4 mr-1" />
                    Start
                  </>
                )}
              </Button>
              <Button 
                onClick={resetPomodoro} 
                size="sm"
                style={{
                  background: 'rgba(139, 94, 60, 0.95)',
                  color: '#FFF9F4',
                  fontFamily: 'Inter, sans-serif',
                  borderRadius: '12px',
                  border: '2px solid #FFF9F4'
                }}
              >
                <RotateCcw className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Collapsible Chat - Floating Window */}
        <AnimatePresence>
          {showChat ? (
            <motion.div
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              className="absolute right-6 top-1/2 transform -translate-y-1/2 z-30"
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
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-6 bottom-32 z-30"
            >
              <Button
                onClick={() => setShowChat(true)}
                size="lg"
                style={{
                  background: '#F7A64B',
                  color: '#FFF9F4',
                  fontFamily: 'Inter, sans-serif',
                  borderRadius: '50%',
                  width: '60px',
                  height: '60px',
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

        {/* Bottom Control Panel */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent z-20">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
            {/* Voice Toggle */}
            <Button
              size="lg"
              onClick={toggleVoice}
              style={{
                background: voiceEnabled ? '#CFE8ED' : 'rgba(207, 232, 237, 0.4)',
                color: voiceEnabled ? '#8B5E3C' : '#FFF9F4',
                fontFamily: 'Inter, sans-serif',
                borderRadius: '16px',
                padding: '12px 24px',
                border: '2px solid #FFF9F4',
                minWidth: '180px'
              }}
            >
              {voiceEnabled ? (
                <>
                  <Volume2 className="size-5 mr-2" />
                  Voice Active
                </>
              ) : (
                <>
                  <VolumeX className="size-5 mr-2" />
                  Enable Voice
                </>
              )}
            </Button>

            {/* Chat Toggle - Alternative to mic */}
            <Button
              size="lg"
              onClick={() => setShowChat(true)}
              style={{
                background: 'rgba(247, 166, 75, 0.8)',
                color: '#FFF9F4',
                fontFamily: 'Inter, sans-serif',
                borderRadius: '16px',
                padding: '12px 24px',
                border: '2px solid #FFF9F4',
                minWidth: '140px'
              }}
            >
              <MessageCircle className="size-5 mr-2" />
              Chat
            </Button>

            {/* End Session */}
            <Button
              size="lg"
              onClick={handleEndSessionClick}
              style={{
                background: 'rgba(139, 94, 60, 0.95)',
                color: '#FFF9F4',
                fontFamily: 'Inter, sans-serif',
                borderRadius: '16px',
                padding: '12px 32px',
                border: '2px solid #F7A64B',
                fontWeight: 600,
                minWidth: '180px'
              }}
            >
              <PartyPopper className="size-5 mr-2" />
              End Session
            </Button>
          </div>
        </div>
        
        {/* Task Completion Prompt Dialog */}
        {showTaskCompletionPrompt && (
          <Dialog open={true} onOpenChange={() => setShowTaskCompletionPrompt(false)}>
            <DialogContent 
              className="max-w-md"
              style={{
                background: '#FFF9F4',
                borderRadius: '24px',
                border: '3px solid #F7A64B'
              }}
            >
              <DialogHeader>
                <DialogTitle 
                  className="text-center"
                  style={{ 
                    fontFamily: 'Poppins, sans-serif',
                    color: '#F7A64B',
                    fontSize: '1.5rem'
                  }}
                >
                  🎯 Did you complete your task?
                </DialogTitle>
                <DialogDescription 
                  className="text-center"
                  style={{
                    fontFamily: 'Lexend Deca, sans-serif',
                    color: '#8B5E3C',
                  }}
                >
                  {selectedSubtask?.title}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <p 
                  className="text-center"
                  style={{ 
                    fontFamily: 'Lexend Deca, sans-serif',
                    color: '#2D2D2D',
                    fontSize: '0.875rem'
                  }}
                >
                  Let us know how your session went!
                </p>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleTaskCompletion(true)}
                    className="flex-1 friendly-button"
                    style={{
                      background: 'linear-gradient(135deg, #F7A64B 0%, #FFB86F 100%)',
                      color: '#FFF9F4',
                      borderRadius: '12px',
                      fontFamily: 'Inter, sans-serif',
                      padding: '1.5rem',
                      fontSize: '1rem',
                      fontWeight: 600
                    }}
                  >
                    <PartyPopper className="size-5 mr-2" />
                    Yes, I finished!
                  </Button>
                  
                  <Button
                    onClick={() => handleTaskCompletion(false)}
                    variant="outline"
                    className="flex-1"
                    style={{
                      background: '#FFFFFF',
                      color: '#8B5E3C',
                      borderRadius: '12px',
                      border: '2px solid #E8DDD0',
                      fontFamily: 'Inter, sans-serif',
                      padding: '1.5rem',
                      fontSize: '1rem'
                    }}
                  >
                    Not quite yet
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  return null;
}

// Feedback Dialog Component
function FeedbackDialog({ 
  feedback, 
  onClose, 
  reflection,
  setReflection,
  teachback,
  setTeachback,
  sessionDuration,
  completedTasks,
  totalTasks
}: {
  feedback: { icon: string; title: string; message: string; advice: string; completedCount?: number };
  onClose: () => void;
  reflection: string;
  setReflection: (value: string) => void;
  teachback: string;
  setTeachback: (value: string) => void;
  sessionDuration: number;
  completedTasks: number;
  totalTasks: number;
}) {
  // Use the adjusted count from feedback if available
  const displayCompletedCount = feedback.completedCount ?? completedTasks;
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          background: '#FFF9F4',
          borderRadius: '24px',
          border: '3px solid #F7A64B'
        }}
      >
        <DialogHeader>
          <DialogTitle 
            className="text-center text-5xl mb-4"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {feedback.icon}
          </DialogTitle>
          <DialogTitle 
            className="text-center"
            style={{ 
              fontFamily: 'Poppins, sans-serif',
              color: '#F7A64B',
              fontSize: '1.75rem'
            }}
          >
            {feedback.title}
          </DialogTitle>
          <DialogDescription className="sr-only">Session feedback</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <p 
            className="text-center"
            style={{ 
              fontFamily: 'Lexend Deca, sans-serif',
              fontSize: '1.125rem',
              color: '#2D2D2D'
            }}
          >
            {feedback.message}
          </p>
          
          <div 
            className="rounded-xl p-6" 
            style={{ 
              background: '#CFE8ED',
              border: '2px solid #8B5E3C'
            }}
          >
            <h4 
              className="mb-3" 
              style={{ 
                fontFamily: 'Poppins, sans-serif',
                color: '#8B5E3C',
                fontSize: '1.125rem'
              }}
            >
              💡 Recommendation
            </h4>
            <p 
              style={{ 
                fontFamily: 'Lexend Deca, sans-serif',
                color: '#2D2D2D'
              }}
            >
              {feedback.advice}
            </p>
          </div>
          
          <div 
            className="rounded-xl p-5" 
            style={{ 
              background: 'rgba(247, 166, 75, 0.1)',
              border: '2px solid #F7A64B'
            }}
          >
            <p 
              style={{ 
                fontFamily: 'Lexend Deca, sans-serif',
                color: '#8B5E3C',
                marginBottom: '8px'
              }}
            >
              Session duration: <span style={{ color: '#F7A64B', fontWeight: 600 }}>{sessionDuration} minutes</span>
            </p>
            <p 
              style={{ 
                fontFamily: 'Lexend Deca, sans-serif',
                color: '#8B5E3C'
              }}
            >
              Tasks completed: <span style={{ color: '#F7A64B', fontWeight: 600 }}>{displayCompletedCount}/{totalTasks}</span>
            </p>
          </div>

          {/* Reflection Section */}
          <div className="space-y-4">
            <div>
              <label 
                className="block mb-2"
                style={{ 
                  fontFamily: 'Poppins, sans-serif',
                  color: '#8B5E3C',
                  fontSize: '1.125rem'
                }}
              >
                🎓 Teach it back: What did you learn?
              </label>
              <p 
                className="text-sm mb-3"
                style={{ 
                  fontFamily: 'Lexend Deca, sans-serif',
                  color: '#8B5E3C'
                }}
              >
                Explain in your own words to solidify your understanding.
              </p>
              <Textarea
                value={teachback}
                onChange={(e) => setTeachback(e.target.value)}
                placeholder="I learned that... The main concept is... This works because..."
                rows={4}
                className="w-full"
                style={{
                  fontFamily: 'Lexend Deca, sans-serif',
                  borderRadius: '12px',
                  borderWidth: '2px',
                  borderColor: '#CFE8ED'
                }}
              />
            </div>

            <div>
              <label 
                className="block mb-2"
                style={{ 
                  fontFamily: 'Poppins, sans-serif',
                  color: '#8B5E3C'
                }}
              >
                💭 Additional reflections
              </label>
              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="What went well? What could be improved? Any follow-up questions?"
                rows={3}
                className="w-full"
                style={{
                  fontFamily: 'Lexend Deca, sans-serif',
                  borderRadius: '12px',
                  borderWidth: '2px',
                  borderColor: '#CFE8ED'
                }}
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={onClose}
            style={{
              fontFamily: 'Inter, sans-serif',
              borderRadius: '16px',
              borderWidth: '2px',
              borderColor: '#8B5E3C',
              color: '#8B5E3C',
              flex: 1
            }}
          >
            Skip Reflection
          </Button>
          <Button 
            onClick={onClose}
            disabled={!teachback.trim()}
            style={{
              fontFamily: 'Inter, sans-serif',
              borderRadius: '16px',
              background: teachback.trim() ? '#F7A64B' : '#CCC',
              color: '#FFF9F4',
              flex: 2,
              borderWidth: '2px',
              borderColor: teachback.trim() ? '#8B5E3C' : '#999'
            }}
          >
            {teachback.trim() ? 'Complete & Save Reflection' : 'Please complete teachback first'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}