import { Task, SessionNote } from '../App';
import PrioritizationGraph from './PrioritizationGraph';
import DeadlinesList from './DeadlinesList';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { FileText, Clock, Sparkles } from 'lucide-react';

interface AllTasksTabProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  sessionNotes: SessionNote[];
  dailyTasks: string[];
}

export default function AllTasksTab({ tasks, setTasks, sessionNotes, dailyTasks }: AllTasksTabProps) {
  const graphTasks = tasks.filter((t) => t.position);

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
    );
  };

  // Calculate focus improvement (mock data based on completed daily tasks)
  const calculateStreak = () => {
    const completedToday = dailyTasks.filter(id => {
      const subtask = tasks.flatMap(t => t.subtasks).find(s => s.id === id);
      return subtask?.completed;
    }).length;
    
    return Math.min(completedToday * 4, 100); // Mock calculation
  };

  // Sort session notes by timestamp (most recent first)
  const sortedNotes = [...sessionNotes].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Pizza Streak at top */}
      <div className="warm-card p-6 animate-fade-in" style={{
        background: 'linear-gradient(135deg, #FFD4A3 0%, #F7A64B 100%)',
        borderRadius: '20px',
        textAlign: 'center'
      }}>
        <div className="flex items-center justify-center gap-3 mb-2">
          <Sparkles className="size-6 text-white animate-sparkle" />
          <h3 style={{ 
            fontFamily: 'Poppins, sans-serif',
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#FFFFFF'
          }}>
            Pizza Streak
          </h3>
          <Sparkles className="size-6 text-white animate-sparkle" style={{ animationDelay: '0.3s' }} />
        </div>
        <p style={{ 
          fontSize: '1.125rem',
          color: '#FFFFFF',
          fontFamily: 'Lexend Deca, sans-serif'
        }}>
          +{calculateStreak()}% focus improvement this week! 🎉
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Priority Matrix */}
        <div className="animate-fade-in">
          <Card className="p-8 warm-card" style={{ 
            background: '#FFFFFF', 
            borderRadius: '24px'
          }}>
            <h2 className="mb-6" style={{ 
              fontFamily: 'Poppins, sans-serif',
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#F7A64B'
            }}>
              📊 Priority Matrix
            </h2>
            <PrioritizationGraph tasks={tasks} setTasks={setTasks} readonly={false} />
          </Card>
        </div>

        {/* Right: Deadlines */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <DeadlinesList tasks={graphTasks} />
        </div>
      </div>

      {/* Session Notes Section */}
      <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <Card className="p-8 warm-card" style={{ 
          background: '#FFFFFF', 
          borderRadius: '24px'
        }}>
          <div className="flex items-center gap-3 mb-6">
            <FileText className="size-6" style={{ color: '#F7A64B' }} />
            <h2 style={{ 
              fontFamily: 'Poppins, sans-serif',
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#F7A64B'
            }}>
              📝 Session Notes & Reflections
            </h2>
          </div>

          {sortedNotes.length === 0 ? (
            <div 
              className="text-center py-12 rounded-2xl"
              style={{
                background: 'rgba(207, 232, 237, 0.3)',
                border: '2px dashed #CFE8ED'
              }}
            >
              <p style={{ 
                fontFamily: 'Lexend Deca, sans-serif',
                color: '#8B5E3C',
                fontSize: '1.125rem'
              }}>
                No session notes yet. Complete a focus session to add your first note! 🍕
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {sortedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-6 rounded-2xl"
                    style={{
                      background: 'rgba(207, 232, 237, 0.2)',
                      border: '2px solid #CFE8ED'
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 style={{ 
                          fontFamily: 'Poppins, sans-serif',
                          fontSize: '1.125rem',
                          fontWeight: 600,
                          color: '#F7A64B',
                          marginBottom: '4px'
                        }}>
                          {note.taskTitle}
                        </h4>
                        <p style={{ 
                          fontFamily: 'Lexend Deca, sans-serif',
                          color: '#8B5E3C',
                          fontSize: '0.875rem'
                        }}>
                          → {note.subtaskTitle}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{
                        background: '#F7A64B',
                        color: '#FFF9F4'
                      }}>
                        <Clock className="size-3" />
                        <span style={{ 
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {note.duration} min
                        </span>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <p style={{ 
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '0.75rem',
                      color: '#8B5E3C',
                      marginBottom: '12px',
                      opacity: 0.7
                    }}>
                      {new Date(note.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>

                    {/* Teachback */}
                    {note.teachback && (
                      <div className="mb-3">
                        <h5 style={{ 
                          fontFamily: 'Poppins, sans-serif',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#8B5E3C',
                          marginBottom: '8px'
                        }}>
                          🎓 What I learned:
                        </h5>
                        <p style={{ 
                          fontFamily: 'Lexend Deca, sans-serif',
                          color: '#2D2D2D',
                          fontSize: '0.9375rem',
                          lineHeight: '1.6'
                        }}>
                          {note.teachback}
                        </p>
                      </div>
                    )}

                    {/* Reflection */}
                    {note.reflection && (
                      <div>
                        <h5 style={{ 
                          fontFamily: 'Poppins, sans-serif',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#8B5E3C',
                          marginBottom: '8px'
                        }}>
                          💭 Additional thoughts:
                        </h5>
                        <p style={{ 
                          fontFamily: 'Lexend Deca, sans-serif',
                          color: '#2D2D2D',
                          fontSize: '0.9375rem',
                          lineHeight: '1.6'
                        }}>
                          {note.reflection}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </Card>
      </div>
    </div>
  );
}
