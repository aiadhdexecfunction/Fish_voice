import { useState } from 'react';
import { Task, SessionNote } from '../App';
import TaskInput from './TaskInput';
import TaskInbox from './TaskInbox';
import PizzaTodoList from './PizzaTodoList';
import VirtualStudyRoom from './VirtualStudyRoom';
import ImmersiveWorkSession from './ImmersiveWorkSession';
import { Button } from './ui/button';
import { Sparkles, Lightbulb } from 'lucide-react';

interface DailyTasksTabProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  dailyTasks: string[];
  setDailyTasks: React.Dispatch<React.SetStateAction<string[]>>;
  sessionNotes: SessionNote[];
  setSessionNotes: React.Dispatch<React.SetStateAction<SessionNote[]>>;
  personality: 'gentle' | 'funny' | 'pushy';
  voiceTone: 'ariana' | 'gordon' | 'snoop';
}

export default function DailyTasksTab({
  tasks,
  setTasks,
  dailyTasks,
  setDailyTasks,
  sessionNotes,
  setSessionNotes,
  personality,
  voiceTone,
}: DailyTasksTabProps) {
  const [activeSubtask, setActiveSubtask] = useState<{
    taskId: string;
    subtaskId: string;
  } | null>(null);
  const [showImmersiveSession, setShowImmersiveSession] = useState(false);

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
    );
  };

  return (
    <div className="space-y-6">
      {/* Friendly Instruction Card */}
      <div className="warm-card p-8 animate-fade-in" style={{ 
        background: 'linear-gradient(135deg, #CFE8ED 0%, #B8D4C8 100%)',
        borderRadius: '24px'
      }}>
        <div className="flex items-start gap-4 mb-4">
          <Lightbulb className="size-8 flex-shrink-0 animate-bounce-gentle" style={{ color: '#F7A64B' }} />
          <div>
            <h3 className="mb-3" style={{ 
              fontFamily: 'Poppins, sans-serif',
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#2D2D2D'
            }}>
              ✨ How to make your day awesome:
            </h3>
            <div className="space-y-3" style={{ color: '#2D2D2D' }}>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ 
                  background: '#FFFFFF',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  color: '#F7A64B',
                  boxShadow: '0 2px 8px rgba(247, 166, 75, 0.2)'
                }}>1</span>
                <p style={{ fontFamily: 'Lexend Deca, sans-serif', lineHeight: 1.7 }}>
                  📝 Add tasks and subtasks (from Gmail/Canvas or use AI to generate)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ 
                  background: '#FFFFFF',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  color: '#F7A64B',
                  boxShadow: '0 2px 8px rgba(247, 166, 75, 0.2)'
                }}>2</span>
                <p style={{ fontFamily: 'Lexend Deca, sans-serif', lineHeight: 1.7 }}>
                  🍕 Make a daily pizza by selecting subtasks you want to work on today
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ 
                  background: '#FFFFFF',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  color: '#F7A64B',
                  boxShadow: '0 2px 8px rgba(247, 166, 75, 0.2)'
                }}>3</span>
                <p style={{ fontFamily: 'Lexend Deca, sans-serif', lineHeight: 1.7 }}>
                  🎨 Customize your body double
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ 
                  background: '#FFFFFF',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  color: '#F7A64B',
                  boxShadow: '0 2px 8px rgba(247, 166, 75, 0.2)'
                }}>4</span>
                <p style={{ fontFamily: 'Lexend Deca, sans-serif', lineHeight: 1.7 }}>
                  🎯 Start your focus session
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ 
                  background: '#FFFFFF',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  color: '#F7A64B',
                  boxShadow: '0 2px 8px rgba(247, 166, 75, 0.2)'
                }}>5</span>
                <p style={{ fontFamily: 'Lexend Deca, sans-serif', lineHeight: 1.7 }}>
                  🎉 Work through the pizza and celebrate each slice!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Input */}
      <TaskInput tasks={tasks} setTasks={setTasks} />

      {/* All Tasks (left) and Today's Pizza (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: All Tasks */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <TaskInbox tasks={tasks} onUpdateTask={updateTask} dailyTasks={dailyTasks} setDailyTasks={setDailyTasks} setTasks={setTasks} />
        </div>

        {/* Right: Pizza Tracker */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <PizzaTodoList
            tasks={tasks}
            setTasks={setTasks}
            dailyTasks={dailyTasks}
            setDailyTasks={setDailyTasks}
          />
        </div>
      </div>

      {/* Start Working Button at Bottom */}
      <div className="flex justify-center pt-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <Button
          onClick={() => setShowImmersiveSession(true)}
          size="lg"
          className="friendly-button h-auto py-6 px-12"
          style={{ 
            background: dailyTasks.length === 0 ? '#E8DDD0' : 'linear-gradient(135deg, #F7A64B 0%, #FFB86F 100%)', 
            color: '#FFFFFF',
            borderRadius: '20px',
            fontSize: '1.125rem',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            boxShadow: dailyTasks.length === 0 ? 'none' : '0 4px 20px rgba(247, 166, 75, 0.3)'
          }}
          disabled={dailyTasks.length === 0}
        >
          <Sparkles className="size-6 mr-3" />
          <div className="text-left">
            <div>Start Your Focus Session</div>
            <div className="opacity-90" style={{ fontSize: '0.875rem', fontWeight: 400 }}>
              {dailyTasks.length > 0 
                ? `${dailyTasks.length} task${dailyTasks.length > 1 ? 's' : ''} ready to go!`
                : 'Pick some tasks first'}
            </div>
          </div>
        </Button>
      </div>

      {/* Virtual Study Room Modal (from individual task Start buttons) */}
      {activeSubtask && (
        <VirtualStudyRoom
          tasks={tasks}
          setTasks={setTasks}
          activeSubtask={activeSubtask}
          onClose={() => setActiveSubtask(null)}
        />
      )}

      {/* Immersive Work Session (full screen) */}
      {showImmersiveSession && (
        <ImmersiveWorkSession
          tasks={tasks}
          setTasks={setTasks}
          dailyTasks={dailyTasks}
          setDailyTasks={setDailyTasks}
          sessionNotes={sessionNotes}
          setSessionNotes={setSessionNotes}
          onClose={() => setShowImmersiveSession(false)}
          personality={personality}
          voiceTone={voiceTone}
        />
      )}
    </div>
  );
}