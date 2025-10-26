import { useState } from 'react';
import { Task, Subtask } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { Sparkles, Calendar } from 'lucide-react';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  taskTitle: string;
}

export default function AddTaskDialog({
  open,
  onOpenChange,
  tasks,
  setTasks,
  taskTitle,
}: AddTaskDialogProps) {
  const [deadline, setDeadline] = useState('');

  const generateSubtasks = (title: string): Subtask[] => {
    const keywords = title.toLowerCase();
    const subtasks: Subtask[] = [];

    if (keywords.includes('write') || keywords.includes('essay')) {
      subtasks.push(
        { id: `${Date.now()}-1`, title: 'Research and outline', completed: false },
        { id: `${Date.now()}-2`, title: 'Write first draft', completed: false },
        { id: `${Date.now()}-3`, title: 'Revise and edit', completed: false }
      );
    } else if (keywords.includes('study') || keywords.includes('quiz')) {
      subtasks.push(
        { id: `${Date.now()}-1`, title: 'Review materials', completed: false },
        { id: `${Date.now()}-2`, title: 'Make notes/flashcards', completed: false },
        { id: `${Date.now()}-3`, title: 'Practice problems', completed: false }
      );
    } else if (keywords.includes('read')) {
      subtasks.push(
        { id: `${Date.now()}-1`, title: 'Read the material', completed: false },
        { id: `${Date.now()}-2`, title: 'Take notes', completed: false },
        { id: `${Date.now()}-3`, title: 'Summarize key points', completed: false }
      );
    } else if (keywords.includes('assignment') || keywords.includes('homework')) {
      subtasks.push(
        { id: `${Date.now()}-1`, title: 'Review instructions', completed: false },
        { id: `${Date.now()}-2`, title: 'Complete the work', completed: false },
        { id: `${Date.now()}-3`, title: 'Check and submit', completed: false }
      );
    } else {
      subtasks.push(
        { id: `${Date.now()}-1`, title: 'Start the task', completed: false },
        { id: `${Date.now()}-2`, title: 'Complete the task', completed: false }
      );
    }

    return subtasks;
  };

  const handleAddTask = () => {
    if (!taskTitle.trim()) return;

    const maxOrder = Math.max(
      -1,
      ...tasks
        .filter(t => t.orderInCaterpillar !== undefined)
        .map(t => t.orderInCaterpillar || 0)
    );

    const newTask: Task = {
      id: Date.now().toString(),
      title: taskTitle,
      urgency: 50,
      importance: 50,
      deadline: deadline ? new Date(deadline) : undefined,
      subtasks: generateSubtasks(taskTitle),
      source: 'manual',
      position: { x: 50, y: 50 },
      orderInCaterpillar: maxOrder + 1,
    };

    setTasks([...tasks, newTask]);
    toast.success(`✅ Task added: ${taskTitle}`);
    setDeadline('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="warm-card" style={{ 
        background: '#FFFFFF', 
        borderRadius: '24px',
        border: '1px solid #E8DDD0'
      }}>
        <DialogHeader>
          <DialogTitle style={{ 
            fontFamily: 'Poppins, sans-serif',
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#F7A64B'
          }}>
            <Sparkles className="inline size-6 mr-2 mb-1" />
            Add New Task
          </DialogTitle>
          <DialogDescription style={{ 
            fontFamily: 'Lexend Deca, sans-serif',
            color: '#8B5E3C'
          }}>
            We'll automatically break it down into subtasks for you!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="task-title" style={{ 
              fontFamily: 'Inter, sans-serif',
              color: '#2D2D2D',
              fontWeight: 500
            }}>
              Task Name
            </Label>
            <Input
              id="task-title"
              value={taskTitle}
              readOnly
              className="h-12"
              style={{ 
                background: '#FFF9F4',
                border: '1px solid #E8DDD0',
                borderRadius: '12px',
                fontFamily: 'Lexend Deca, sans-serif'
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline" style={{ 
              fontFamily: 'Inter, sans-serif',
              color: '#2D2D2D',
              fontWeight: 500
            }}>
              <Calendar className="inline size-4 mr-1 mb-1" />
              Deadline (optional)
            </Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="h-12"
              style={{ 
                background: '#FFF9F4',
                border: '1px solid #E8DDD0',
                borderRadius: '12px',
                fontFamily: 'Lexend Deca, sans-serif'
              }}
            />
          </div>

          <div className="p-4 rounded-xl" style={{ 
            background: 'linear-gradient(135deg, #CFE8ED 0%, #B8D4C8 100%)',
            border: '1px solid #CFE8ED'
          }}>
            <p className="text-sm" style={{ 
              fontFamily: 'Lexend Deca, sans-serif',
              color: '#2D2D2D'
            }}>
              💡 <strong>Tip:</strong> We'll suggest subtasks based on your task type. You can edit them later in the All Tasks section!
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12"
              style={{ 
                background: '#FFF9F4',
                border: '1px solid #E8DDD0',
                borderRadius: '12px',
                fontFamily: 'Inter, sans-serif',
                color: '#8B5E3C'
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddTask}
              className="flex-1 h-12 friendly-button"
              style={{ 
                background: 'linear-gradient(135deg, #F7A64B 0%, #FFB86F 100%)',
                color: '#FFFFFF',
                borderRadius: '12px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600
              }}
            >
              <Sparkles className="size-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
