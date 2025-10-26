import { Task } from '../App';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Calendar, AlertCircle, CheckCircle2, Clock, Download } from 'lucide-react';

interface DeadlinesListProps {
  tasks: Task[];
}

export default function DeadlinesList({ tasks }: DeadlinesListProps) {
  // Sort tasks by deadline
  const sortedTasks = [...tasks]
    .filter((t) => t.deadline)
    .sort((a, b) => {
      if (!a.deadline || !b.deadline) return 0;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

  const getDaysUntil = (deadline: Date) => {
    const today = new Date();
    const diff = new Date(deadline).getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil < 0) return { bg: '#FFB5A0', border: '#FF7031', text: '#2D2D2D' };
    if (daysUntil <= 2) return { bg: '#FFD4A3', border: '#F7A64B', text: '#2D2D2D' };
    if (daysUntil <= 7) return { bg: '#FFF4E8', border: '#FFD4A3', text: '#2D2D2D' };
    return { bg: '#E8F7EA', border: '#B8D4C8', text: '#2D2D2D' };
  };

  const getUrgencyLabel = (daysUntil: number) => {
    if (daysUntil < 0) return 'Overdue';
    if (daysUntil === 0) return 'Due Today';
    if (daysUntil === 1) return 'Due Tomorrow';
    if (daysUntil <= 7) return `${daysUntil} days left`;
    return `${daysUntil} days left`;
  };

  const exportToGoogleCalendar = (task: Task) => {
    if (!task.deadline) return;
    
    const deadline = new Date(task.deadline);
    // Format: YYYYMMDDTHHmmss
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    };

    const startDate = formatDate(deadline);
    const endDate = formatDate(deadline);
    
    const title = encodeURIComponent(task.title);
    const details = encodeURIComponent(
      `Task from ADHD BDBD\n\nSubtasks:\n${task.subtasks.map(s => `- ${s.title}`).join('\n')}`
    );
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}`;
    window.open(url, '_blank');
  };

  const exportAllToGoogleCalendar = () => {
    if (sortedTasks.length === 0) return;
    
    // Export each task one by one
    sortedTasks.forEach((task, index) => {
      setTimeout(() => {
        exportToGoogleCalendar(task);
      }, index * 300); // Delay each window by 300ms to prevent popup blocker
    });
  };

  return (
    <Card className="p-8 warm-card" style={{ 
      background: '#FFFFFF', 
      borderRadius: '24px',
      minHeight: '600px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 style={{ 
            fontFamily: 'Poppins, sans-serif',
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#F7A64B'
          }}>
            📅 Upcoming Deadlines
          </h3>
          <p className="text-sm mt-1" style={{ 
            fontFamily: 'Lexend Deca, sans-serif',
            color: '#8B5E3C'
          }}>
            Stay on top of your schedule
          </p>
        </div>
        
        <Button
          onClick={exportAllToGoogleCalendar}
          disabled={sortedTasks.length === 0}
          className="soft-shadow"
          style={{
            background: sortedTasks.length > 0 ? '#F7A64B' : '#E8DDD0',
            color: '#FFFFFF',
            borderRadius: '12px',
            padding: '0.5rem 1rem',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.875rem',
            fontWeight: 500,
            border: 'none',
            cursor: sortedTasks.length > 0 ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            opacity: sortedTasks.length > 0 ? 1 : 0.6
          }}
        >
          <Download className="size-4 mr-2" />
          Export to Google Calendar
        </Button>
      </div>

      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-3">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-16 rounded-xl" style={{ 
              background: '#FFF9F4',
              border: '2px dashed #E8DDD0'
            }}>
              <Calendar className="size-12 mx-auto mb-3" style={{ color: '#CFE8ED' }} />
              <p style={{ 
                fontFamily: 'Lexend Deca, sans-serif',
                color: '#8B5E3C'
              }}>
                No upcoming deadlines
              </p>
            </div>
          ) : (
            sortedTasks.map((task) => {
              const daysUntil = getDaysUntil(task.deadline!);
              const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
              const totalSubtasks = task.subtasks.length;
              const progress = (completedSubtasks / totalSubtasks) * 100;
              const colors = getUrgencyColor(daysUntil);

              return (
                <Card
                  key={task.id}
                  className="p-5 soft-shadow transition-all hover:shadow-md"
                  style={{
                    background: colors.bg,
                    borderLeft: `4px solid ${colors.border}`,
                    borderRadius: '16px'
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h4 className="flex-1" style={{ 
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 600,
                      color: '#2D2D2D'
                    }}>
                      {task.title}
                    </h4>
                    {daysUntil < 3 && <AlertCircle className="size-5 flex-shrink-0" style={{ color: '#FF7031' }} />}
                  </div>

                  <div className="flex items-center gap-2 mb-4 text-sm flex-wrap" style={{ 
                    fontFamily: 'Lexend Deca, sans-serif',
                    color: '#8B5E3C'
                  }}>
                    <Calendar className="size-4" />
                    <span>{new Date(task.deadline!).toLocaleDateString()}</span>
                    <span>•</span>
                    <Badge style={{ 
                      background: colors.border,
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      border: 'none',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '0.75rem',
                      padding: '2px 8px'
                    }}>
                      <Clock className="size-3 mr-1 inline" />
                      {getUrgencyLabel(daysUntil)}
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2" style={{ 
                      fontFamily: 'Inter, sans-serif',
                      color: '#8B5E3C'
                    }}>
                      <span style={{ fontWeight: 500 }}>Progress</span>
                      <span>
                        {completedSubtasks}/{totalSubtasks} subtasks
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ 
                      background: 'rgba(139, 94, 60, 0.15)'
                    }}>
                      <div
                        className="h-full transition-all duration-500"
                        style={{ 
                          width: `${progress}%`,
                          background: 'linear-gradient(90deg, #F7A64B 0%, #FFD4A3 100%)',
                          borderRadius: '999px'
                        }}
                      />
                    </div>
                    {progress === 100 && (
                      <div className="flex items-center gap-2 mt-2 text-xs" style={{ 
                        color: '#B8D4C8',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500
                      }}>
                        <CheckCircle2 className="size-4" />
                        <span>All subtasks complete!</span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
