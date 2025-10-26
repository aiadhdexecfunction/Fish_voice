import { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Toaster } from './components/ui/sonner';
import DailyTasksTab from './components/DailyTasksTab';
import AllTasksTab from './components/AllTasksTab';
import Register from './components/Register';
import IntroTutorial from './components/IntroTutorial';
import PersonalityCustomization from './components/PersonalityCustomization';
import { Button } from './components/ui/button';
import { User, Settings } from 'lucide-react';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  urgency: number; // 0-100
  importance: number; // 0-100
  deadline?: Date;
  subtasks: Subtask[];
  source: 'manual' | 'gmail' | 'canvas';
  position?: { x: number; y: number }; // Position in graph
  orderInCaterpillar?: number;
}

export interface SessionNote {
  id: string;
  timestamp: Date;
  duration: number; // in minutes
  subtaskId: string;
  taskTitle: string;
  subtaskTitle: string;
  teachback: string;
  reflection: string;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Complete Math Assignment',
      description: 'Chapter 5 problems',
      urgency: 80,
      importance: 90,
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      source: 'canvas',
      subtasks: [
        { id: '1-1', title: 'Read Chapter 5', completed: false },
        { id: '1-2', title: 'Solve problems 1-10', completed: false },
        { id: '1-3', title: 'Review answers', completed: false },
      ],
      position: { x: 75, y: 85 },
      orderInCaterpillar: 0,
    },
    {
      id: '2',
      title: 'Study for Biology Quiz',
      description: 'Cell division and genetics',
      urgency: 60,
      importance: 70,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      source: 'gmail',
      subtasks: [
        { id: '2-1', title: 'Review lecture notes', completed: false },
        { id: '2-2', title: 'Make flashcards', completed: false },
        { id: '2-3', title: 'Practice quiz questions', completed: false },
        { id: '2-4', title: 'Study with group', completed: false },
      ],
      position: { x: 55, y: 65 },
      orderInCaterpillar: 1,
    },
    {
      id: '3',
      title: 'Write English Essay',
      description: 'Analysis of Shakespeare',
      urgency: 40,
      importance: 85,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      source: 'manual',
      subtasks: [
        { id: '3-1', title: 'Research and outline', completed: false },
        { id: '3-2', title: 'Write first draft', completed: false },
        { id: '3-3', title: 'Revise and edit', completed: false },
        { id: '3-4', title: 'Final proofread', completed: false },
        { id: '3-5', title: 'Submit', completed: false },
      ],
      position: { x: 35, y: 80 },
      orderInCaterpillar: 2,
    },
  ]);

  const [dailyTasks, setDailyTasks] = useState<string[]>([]); // Subtask IDs for today
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([]);
  const [showRegister, setShowRegister] = useState(false);
  const [showIntro, setShowIntro] = useState(true); // Show tutorial on first visit
  const [userName] = useState('Alex'); // In real app, this would come from auth
  const [showPersonalityCustomization, setShowPersonalityCustomization] = useState(false);
  const [personality, setPersonality] = useState<'gentle' | 'funny' | 'pushy'>('gentle');
  const [voiceTone, setVoiceTone] = useState<'ariana' | 'gordon' | 'snoop'>('ariana');

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Show register page
  if (showRegister) {
    return (
      <>
        <Register />
        <Button
          onClick={() => setShowRegister(false)}
          className="fixed top-4 right-4 z-50 friendly-button"
          style={{ background: '#F7A64B', color: '#FFFFFF' }}
        >
          Back to App
        </Button>
        <Toaster />
      </>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen" style={{ background: '#FFF9F4' }}>
        {/* Top Navbar */}
        <nav className="sticky top-0 z-40 w-full warm-card" style={{ 
          background: '#FFFFFF', 
          borderRadius: '0',
          borderBottom: '1px solid #E8DDD0',
          padding: '1rem 0'
        }}>
          <div className="container mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl animate-bounce-gentle">🍕</div>
              <div>
                <h1 className="text-xl" style={{ 
                  fontFamily: 'Poppins, sans-serif', 
                  fontWeight: 700,
                  color: '#F7A64B'
                }}>
                  ADHD BDBD
                </h1>
                <p className="text-sm" style={{ color: '#8B5E3C' }}>Your focus companion, ADHD's Body Buddy!</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => setShowPersonalityCustomization(true)}
                className="friendly-button"
                style={{ background: '#FFE4C4', color: '#2D2D2D' }}
                size="sm"
              >
                <Settings className="size-4 mr-2" />
                Personality
              </Button>
              <Button
                onClick={() => setShowRegister(true)}
                className="friendly-button"
                style={{ background: '#CFE8ED', color: '#2D2D2D' }}
                size="sm"
              >
                <User className="size-4 mr-2" />
                Account
              </Button>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-6 py-8 max-w-7xl">
          {/* Friendly Greeting */}
          <div className="mb-8 animate-fade-in">
            <h1 className="mb-3" style={{ 
              fontFamily: 'Poppins, sans-serif',
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#2D2D2D',
              letterSpacing: '-0.02em'
            }}>
              {getGreeting()}, {userName}! <span className="animate-bounce-gentle inline-block">👋</span>
            </h1>
            <p style={{ 
              fontSize: '1.125rem',
              color: '#8B5E3C',
              fontFamily: 'Lexend Deca, sans-serif'
            }}>
              Ready to make today productive and fun?
            </p>
          </div>

          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 warm-card" style={{ 
              background: '#FFFFFF',
              padding: '6px',
              borderRadius: '16px',
              border: '1px solid #E8DDD0'
            }}>
              <TabsTrigger 
                value="daily" 
                style={{ 
                  borderRadius: '12px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  transition: 'all 0.3s ease'
                }}
                className="data-[state=active]:bg-[#F7A64B] data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                📋 Today's Focus
              </TabsTrigger>
              <TabsTrigger 
                value="overview"
                style={{ 
                  borderRadius: '12px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  transition: 'all 0.3s ease'
                }}
                className="data-[state=active]:bg-[#CFE8ED] data-[state=active]:text-[#2D2D2D] data-[state=active]:shadow-md"
              >
                📊 All Tasks
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daily">
              <DailyTasksTab
                tasks={tasks}
                setTasks={setTasks}
                dailyTasks={dailyTasks}
                setDailyTasks={setDailyTasks}
                sessionNotes={sessionNotes}
                setSessionNotes={setSessionNotes}
                personality={personality}
                voiceTone={voiceTone}
              />
            </TabsContent>

            <TabsContent value="overview">
              <AllTasksTab tasks={tasks} setTasks={setTasks} sessionNotes={sessionNotes} dailyTasks={dailyTasks} />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Intro Tutorial */}
        {showIntro && <IntroTutorial onClose={() => setShowIntro(false)} />}
        
        {/* Personality Customization */}
        {showPersonalityCustomization && (
          <PersonalityCustomization
            personality={personality}
            setPersonality={setPersonality}
            voiceTone={voiceTone}
            setVoiceTone={setVoiceTone}
            onClose={() => setShowPersonalityCustomization(false)}
          />
        )}
        
        <Toaster />
      </div>
    </DndProvider>
  );
}

export default App;
