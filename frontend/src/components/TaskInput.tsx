import { useState } from 'react';
import { Plus, Mail, BookOpen } from 'lucide-react';
import { Task } from '../App';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
import AddTaskDialog from './AddTaskDialog';
import GmailDialog from './GmailDialog';
import CanvasDialog from './CanvasDialog';

interface TaskInputProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export default function TaskInput({ tasks, setTasks }: TaskInputProps) {
  const [taskTitle, setTaskTitle] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [pendingTaskTitle, setPendingTaskTitle] = useState('');
  const [showGmailDialog, setShowGmailDialog] = useState(false);
  const [showCanvasDialog, setShowCanvasDialog] = useState(false);

  const addTask = () => {
    if (!taskTitle.trim()) return;
    
    setPendingTaskTitle(taskTitle);
    setShowAddDialog(true);
    setTaskTitle('');
  };

  const importFromGmail = () => {
    setShowGmailDialog(true);
  };

  const importFromCanvas = () => {
    setShowCanvasDialog(true);
  };

  return (
    <>
      <Card className="p-6 warm-card" style={{ 
        background: '#FFFFFF', 
        borderRadius: '20px'
      }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex gap-3">
            <Input
              placeholder="Add a new task..."
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              className="flex-1"
              style={{ 
                background: '#FFF9F4',
                border: '1px solid #E8DDD0',
                borderRadius: '12px',
                padding: '1.25rem 1rem',
                fontFamily: 'Lexend Deca, sans-serif',
                fontSize: '1rem'
              }}
            />
            <Button onClick={addTask} className="friendly-button" style={{ 
              background: '#F7A64B', 
              color: '#FFFFFF',
              borderRadius: '12px',
              padding: '1.25rem 1.5rem'
            }}>
              <Plus className="size-4 mr-2" />
              Add
            </Button>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={importFromGmail} className="friendly-button" style={{ 
              background: '#FFF9F4', 
              color: '#8B5E3C',
              border: '1px solid #E8DDD0',
              borderRadius: '12px'
            }}>
              <Mail className="size-4 mr-2" />
              Gmail
            </Button>
            <Button variant="outline" onClick={importFromCanvas} className="friendly-button" style={{ 
              background: '#FFF9F4', 
              color: '#8B5E3C',
              border: '1px solid #E8DDD0',
              borderRadius: '12px'
            }}>
              <BookOpen className="size-4 mr-2" />
              Canvas
            </Button>
          </div>
        </div>
      </Card>

      <AddTaskDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        tasks={tasks}
        setTasks={setTasks}
        taskTitle={pendingTaskTitle}
      />

      <GmailDialog
        open={showGmailDialog}
        onOpenChange={setShowGmailDialog}
      />

      <CanvasDialog
        open={showCanvasDialog}
        onOpenChange={setShowCanvasDialog}
      />
    </>
  );
}
