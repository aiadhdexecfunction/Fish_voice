import { useState, useRef, useEffect } from 'react';
import { Task } from '../App';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Move, Calendar, ListTodo } from 'lucide-react';

interface PrioritizationGraphProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  readonly?: boolean;
}

export default function PrioritizationGraph({
  tasks,
  setTasks,
  readonly = false,
}: PrioritizationGraphProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const graphRef = useRef<HTMLDivElement>(null);

  // Calculate urgency based on deadline (closer = more urgent)
  const calculateUrgency = (deadline?: Date): number => {
    if (!deadline) return 25; // No deadline = low urgency
    
    const now = new Date();
    const daysUntilDue = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysUntilDue < 0) return 100; // Overdue = highest urgency
    if (daysUntilDue < 1) return 95; // Due today
    if (daysUntilDue < 3) return 85; // Due within 3 days
    if (daysUntilDue < 7) return 70; // Due within a week
    if (daysUntilDue < 14) return 50; // Due within 2 weeks
    if (daysUntilDue < 30) return 30; // Due within a month
    return 15; // More than a month away
  };

  // Calculate importance based on number of subtasks
  const calculateImportance = (subtasks: { id: string; title: string; completed: boolean }[]): number => {
    const subtaskCount = subtasks.length;
    
    if (subtaskCount >= 8) return 90; // Very complex task
    if (subtaskCount >= 6) return 75; // Complex task
    if (subtaskCount >= 4) return 60; // Medium complexity
    if (subtaskCount >= 2) return 45; // Some complexity
    return 30; // Simple task
  };

  // Update task positions based on calculated urgency and importance
  useEffect(() => {
    setTasks((prev) =>
      prev.map((task) => {
        const urgency = calculateUrgency(task.deadline);
        const importance = calculateImportance(task.subtasks);
        
        // If position doesn't exist or if urgency/importance values have changed, recalculate
        const shouldRecalculate = !task.position || 
          task.urgency !== urgency || 
          task.importance !== importance;
        
        return {
          ...task,
          urgency,
          importance,
          position: shouldRecalculate ? { x: urgency, y: importance } : task.position
        };
      })
    );
  }, [tasks.length]); // Recalculate when tasks are added/removed

  const graphTasks = tasks.filter((t) => t.position);

  const handleMouseDown = (e: React.MouseEvent, task: Task) => {
    if (readonly) return;
    e.preventDefault();
    setDraggedTask(task);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedTask || !graphRef.current) return;

    const rect = graphRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((rect.bottom - e.clientY) / rect.height) * 100; // Invert Y

    setTasks((prev) =>
      prev.map((task) =>
        task.id === draggedTask.id
          ? {
              ...task,
              position: { 
                x: Math.max(0, Math.min(100, x)), 
                y: Math.max(0, Math.min(100, y)) 
              },
              urgency: Math.max(0, Math.min(100, x)),
              importance: Math.max(0, Math.min(100, y)),
            }
          : task
      )
    );
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedTask(null);
  };

  const getQuadrantLabel = (x: number, y: number): string => {
    if (x >= 50 && y >= 50) return 'Do First';
    if (x < 50 && y >= 50) return 'Schedule';
    if (x >= 50 && y < 50) return 'Delegate';
    return 'Eliminate';
  };

  const getQuadrantColor = (x: number, y: number): string => {
    if (x >= 50 && y >= 50) return '#FFB5A0'; // Warm coral - Do First
    if (x < 50 && y >= 50) return '#FFD4A3'; // Warm peach - Schedule
    if (x >= 50 && y < 50) return '#CFE8ED'; // Light blue - Delegate
    return '#E8DDD0'; // Border color - Eliminate
  };

  // Group tasks by quadrant
  const tasksByQuadrant = {
    doFirst: graphTasks.filter(t => (t.position?.x || 0) >= 50 && (t.position?.y || 0) >= 50),
    schedule: graphTasks.filter(t => (t.position?.x || 0) < 50 && (t.position?.y || 0) >= 50),
    delegate: graphTasks.filter(t => (t.position?.x || 0) >= 50 && (t.position?.y || 0) < 50),
    eliminate: graphTasks.filter(t => (t.position?.x || 0) < 50 && (t.position?.y || 0) < 50),
  };

  return (
    <div className="relative space-y-6">
      <p className="text-sm" style={{ 
        fontFamily: 'Lexend Deca, sans-serif',
        color: '#8B5E3C'
      }}>
        <Move className="inline size-4 mr-1" style={{ color: '#F7A64B' }} />
        Tasks are automatically positioned based on due dates (urgency) and subtask count (importance). You can reorganize by dragging the dots.
      </p>

      {/* Graph Container */}
      <div
        ref={graphRef}
        className="relative rounded-2xl soft-shadow"
        style={{ 
          width: '100%', 
          paddingBottom: '100%',
          background: 'linear-gradient(135deg, #FFF9F4 0%, #FFFFFF 100%)',
          border: '2px solid #E8DDD0',
          cursor: isDragging ? 'grabbing' : 'default'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Quadrant Background Colors */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-1/2 h-1/2" style={{ background: 'linear-gradient(135deg, #FFD4A3 0%, rgba(255, 212, 163, 0.3) 100%)' }} />
          <div className="absolute top-0 right-0 w-1/2 h-1/2" style={{ background: 'linear-gradient(135deg, #FFB5A0 0%, rgba(255, 181, 160, 0.3) 100%)' }} />
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2" style={{ background: 'linear-gradient(135deg, rgba(232, 221, 208, 0.3) 0%, #E8DDD0 100%)' }} />
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2" style={{ background: 'linear-gradient(135deg, #CFE8ED 0%, rgba(207, 232, 237, 0.3) 100%)' }} />
        </div>

        {/* Quadrant Labels */}
        <div className="absolute top-4 left-4 px-4 py-3 rounded-xl soft-shadow pointer-events-none" style={{ 
          background: 'rgba(255, 212, 163, 0.95)',
          border: '1px solid #FFD4A3'
        }}>
          <p style={{ 
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            fontSize: '0.875rem',
            color: '#2D2D2D'
          }}>
            Schedule
          </p>
          <p style={{ 
            fontFamily: 'Lexend Deca, sans-serif',
            fontSize: '0.75rem',
            color: '#8B5E3C'
          }}>
            Important, Not Urgent
          </p>
        </div>
        <div className="absolute top-4 right-4 px-4 py-3 rounded-xl soft-shadow pointer-events-none" style={{ 
          background: 'rgba(255, 181, 160, 0.95)',
          border: '1px solid #FFB5A0'
        }}>
          <p style={{ 
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            fontSize: '0.875rem',
            color: '#2D2D2D'
          }}>
            Do First
          </p>
          <p style={{ 
            fontFamily: 'Lexend Deca, sans-serif',
            fontSize: '0.75rem',
            color: '#8B5E3C'
          }}>
            Important & Urgent
          </p>
        </div>
        <div className="absolute bottom-4 left-4 px-4 py-3 rounded-xl soft-shadow pointer-events-none" style={{ 
          background: 'rgba(232, 221, 208, 0.95)',
          border: '1px solid #E8DDD0'
        }}>
          <p style={{ 
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            fontSize: '0.875rem',
            color: '#2D2D2D'
          }}>
            Eliminate
          </p>
          <p style={{ 
            fontFamily: 'Lexend Deca, sans-serif',
            fontSize: '0.75rem',
            color: '#8B5E3C'
          }}>
            Not Important/Urgent
          </p>
        </div>
        <div className="absolute bottom-4 right-4 px-4 py-3 rounded-xl soft-shadow pointer-events-none" style={{ 
          background: 'rgba(207, 232, 237, 0.95)',
          border: '1px solid #CFE8ED'
        }}>
          <p style={{ 
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            fontSize: '0.875rem',
            color: '#2D2D2D'
          }}>
            Delegate
          </p>
          <p style={{ 
            fontFamily: 'Lexend Deca, sans-serif',
            fontSize: '0.75rem',
            color: '#8B5E3C'
          }}>
            Urgent, Not Important
          </p>
        </div>

        {/* Axis Lines */}
        <div className="absolute top-0 left-1/2 w-0.5 h-full pointer-events-none" style={{ background: '#8B5E3C', opacity: 0.3 }} />
        <div className="absolute top-1/2 left-0 w-full h-0.5 pointer-events-none" style={{ background: '#8B5E3C', opacity: 0.3 }} />
        
        {/* Axis Labels on the graph edges */}
        {/* Top - More Important */}
        <div 
          className="absolute top-2 left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded-lg pointer-events-none"
          style={{
            background: 'rgba(255, 249, 244, 0.95)',
            border: '1px solid #F7A64B',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#F7A64B'
          }}
        >
          ↑ More Important
        </div>
        
        {/* Right - More Urgent */}
        <div 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 rounded-lg pointer-events-none"
          style={{
            background: 'rgba(255, 249, 244, 0.95)',
            border: '1px solid #F7A64B',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#F7A64B',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed'
          }}
        >
          More Urgent →
        </div>

        {/* Tasks */}
        {graphTasks.map((task) => (
          <div
            key={task.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{
              left: `${task.position?.x}%`,
              bottom: `${task.position?.y}%`,
              cursor: readonly ? 'default' : isDragging && draggedTask?.id === task.id ? 'grabbing' : 'grab',
              zIndex: draggedTask?.id === task.id ? 50 : 10
            }}
            onMouseDown={(e) => handleMouseDown(e, task)}
          >
            <div
              className="rounded-full border-3 shadow-lg transition-all"
              style={{
                width: '24px',
                height: '24px',
                background: getQuadrantColor(
                  task.position?.x || 50,
                  task.position?.y || 50
                ),
                border: `3px solid ${draggedTask?.id === task.id ? '#F7A64B' : '#FFFFFF'}`,
                transform: draggedTask?.id === task.id ? 'scale(1.4)' : 'scale(1)',
                boxShadow: draggedTask?.id === task.id 
                  ? '0 8px 24px rgba(247, 166, 75, 0.5)' 
                  : '0 4px 12px rgba(139, 94, 60, 0.3)'
              }}
            />
            
            {/* Tooltip on hover */}
            <div className="absolute left-6 top-0 hidden group-hover:block z-50 pointer-events-none">
              <div className="warm-card p-3 whitespace-nowrap max-w-xs soft-shadow-lg animate-fade-in" style={{ 
                background: '#FFFFFF',
                border: '1px solid #E8DDD0',
                borderRadius: '12px'
              }}>
                <h4 className="mb-1" style={{ 
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  color: '#F7A64B'
                }}>
                  {task.title}
                </h4>
                <p className="text-xs" style={{ 
                  fontFamily: 'Lexend Deca, sans-serif',
                  color: '#8B5E3C'
                }}>
                  <ListTodo className="inline size-3 mr-1" />
                  {task.subtasks.length} subtask{task.subtasks.length !== 1 ? 's' : ''}
                </p>
                {task.deadline && (
                  <p className="text-xs mt-1" style={{ 
                    fontFamily: 'Inter, sans-serif',
                    color: '#8B5E3C',
                    opacity: 0.8
                  }}>
                    <Calendar className="inline size-3 mr-1" />
                    Due {new Date(task.deadline).toLocaleDateString()}
                  </p>
                )}
                <Badge 
                  className="mt-2 text-xs"
                  style={{ 
                    background: getQuadrantColor(task.position?.x || 50, task.position?.y || 50),
                    color: '#2D2D2D',
                    border: 'none',
                    borderRadius: '6px',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  {getQuadrantLabel(task.position?.x || 50, task.position?.y || 50)}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Axis Labels */}
      <div className="flex justify-between mt-3 text-sm" style={{ 
        fontFamily: 'Lexend Deca, sans-serif',
        color: '#8B5E3C'
      }}>
        <span>← Less Urgent (Deadline further away)</span>
        <span>More Urgent (Deadline approaching) →</span>
      </div>
      <div className="flex justify-center mt-2 text-sm" style={{ 
        fontFamily: 'Lexend Deca, sans-serif',
        color: '#8B5E3C',
        fontStyle: 'italic'
      }}>
        <span>Vertical axis: Fewer subtasks (bottom) → More subtasks / More important (top)</span>
      </div>

      {/* Task Lists by Quadrant */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        {/* Do First */}
        <Card className="p-4" style={{
          background: 'rgba(255, 181, 160, 0.2)',
          borderRadius: '16px',
          border: '2px solid #FFB5A0'
        }}>
          <h4 className="mb-3" style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            color: '#F7A64B',
            fontSize: '0.875rem'
          }}>
            🔥 Do First ({tasksByQuadrant.doFirst.length})
          </h4>
          <div className="space-y-2">
            {tasksByQuadrant.doFirst.length === 0 ? (
              <p style={{
                fontFamily: 'Lexend Deca, sans-serif',
                fontSize: '0.75rem',
                color: '#8B5E3C',
                opacity: 0.7
              }}>
                No tasks
              </p>
            ) : (
              tasksByQuadrant.doFirst.map(task => (
                <div key={task.id} className="text-xs p-2 rounded-lg" style={{
                  background: '#FFFFFF',
                  fontFamily: 'Lexend Deca, sans-serif',
                  color: '#2D2D2D'
                }}>
                  • {task.title}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Schedule */}
        <Card className="p-4" style={{
          background: 'rgba(255, 212, 163, 0.2)',
          borderRadius: '16px',
          border: '2px solid #FFD4A3'
        }}>
          <h4 className="mb-3" style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            color: '#F7A64B',
            fontSize: '0.875rem'
          }}>
            📅 Schedule ({tasksByQuadrant.schedule.length})
          </h4>
          <div className="space-y-2">
            {tasksByQuadrant.schedule.length === 0 ? (
              <p style={{
                fontFamily: 'Lexend Deca, sans-serif',
                fontSize: '0.75rem',
                color: '#8B5E3C',
                opacity: 0.7
              }}>
                No tasks
              </p>
            ) : (
              tasksByQuadrant.schedule.map(task => (
                <div key={task.id} className="text-xs p-2 rounded-lg" style={{
                  background: '#FFFFFF',
                  fontFamily: 'Lexend Deca, sans-serif',
                  color: '#2D2D2D'
                }}>
                  • {task.title}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Delegate */}
        <Card className="p-4" style={{
          background: 'rgba(207, 232, 237, 0.2)',
          borderRadius: '16px',
          border: '2px solid #CFE8ED'
        }}>
          <h4 className="mb-3" style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            color: '#F7A64B',
            fontSize: '0.875rem'
          }}>
            👥 Delegate ({tasksByQuadrant.delegate.length})
          </h4>
          <div className="space-y-2">
            {tasksByQuadrant.delegate.length === 0 ? (
              <p style={{
                fontFamily: 'Lexend Deca, sans-serif',
                fontSize: '0.75rem',
                color: '#8B5E3C',
                opacity: 0.7
              }}>
                No tasks
              </p>
            ) : (
              tasksByQuadrant.delegate.map(task => (
                <div key={task.id} className="text-xs p-2 rounded-lg" style={{
                  background: '#FFFFFF',
                  fontFamily: 'Lexend Deca, sans-serif',
                  color: '#2D2D2D'
                }}>
                  • {task.title}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Eliminate */}
        <Card className="p-4" style={{
          background: 'rgba(232, 221, 208, 0.2)',
          borderRadius: '16px',
          border: '2px solid #E8DDD0'
        }}>
          <h4 className="mb-3" style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            color: '#F7A64B',
            fontSize: '0.875rem'
          }}>
            🗑️ Eliminate ({tasksByQuadrant.eliminate.length})
          </h4>
          <div className="space-y-2">
            {tasksByQuadrant.eliminate.length === 0 ? (
              <p style={{
                fontFamily: 'Lexend Deca, sans-serif',
                fontSize: '0.75rem',
                color: '#8B5E3C',
                opacity: 0.7
              }}>
                No tasks
              </p>
            ) : (
              tasksByQuadrant.eliminate.map(task => (
                <div key={task.id} className="text-xs p-2 rounded-lg" style={{
                  background: '#FFFFFF',
                  fontFamily: 'Lexend Deca, sans-serif',
                  color: '#2D2D2D'
                }}>
                  • {task.title}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
