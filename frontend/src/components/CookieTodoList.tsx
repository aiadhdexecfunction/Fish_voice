import { Task } from '../App';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';

interface CookieTodoListProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  dailyTasks: string[];
  setDailyTasks: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function CookieTodoList({
  tasks,
  setTasks,
  dailyTasks,
  setDailyTasks,
}: CookieTodoListProps) {
  const allSubtasks = tasks.flatMap((task) =>
    task.subtasks.map((subtask) => ({
      ...subtask,
      taskId: task.id,
      taskTitle: task.title,
    }))
  );

  const dailySubtasks = allSubtasks.filter((s) => dailyTasks.includes(s.id));
  const totalBites = dailySubtasks.length;
  const completedBites = dailySubtasks.filter((s) => s.completed).length;
  const cookieProgress = totalBites > 0 ? (completedBites / totalBites) * 100 : 0;

  const addSubtaskToDaily = (subtaskId: string) => {
    if (!dailyTasks.includes(subtaskId)) {
      setDailyTasks([...dailyTasks, subtaskId]);
    }
  };

  const removeSubtaskFromDaily = (subtaskId: string) => {
    setDailyTasks(dailyTasks.filter((id) => id !== subtaskId));
  };

  const toggleSubtaskCompletion = (taskId: string, subtaskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map(subtask =>
                subtask.id === subtaskId
                  ? { ...subtask, completed: !subtask.completed }
                  : subtask
              ),
            }
          : task
      )
    );
  };

  // Generate cookie SVG with bites taken
  const generateCookie = () => {
    const radius = 80;
    const centerX = 100;
    const centerY = 100;
    
    // Calculate number of bites (more subtle, fewer bites)
    const maxBites = 8;
    const bites = Math.min(maxBites, Math.floor((completedBites / totalBites) * maxBites));
    
    // Create path for cookie with bite marks
    let cookiePath = '';
    const segments = 360;
    
    for (let angle = 0; angle < 360; angle += 360 / segments) {
      const rad = (angle * Math.PI) / 180;
      let r = radius;
      
      // Add bite indentations at specific angles
      for (let i = 0; i < bites; i++) {
        const biteAngle = (i * 360) / maxBites;
        const biteDiff = Math.abs(angle - biteAngle);
        
        if (biteDiff < 20 || biteDiff > 340) {
          // Create irregular bite shape
          const biteDepth = 15 + Math.sin((biteDiff * Math.PI) / 20) * 10;
          r = radius - biteDepth * (1 - biteDiff / 20);
        }
      }
      
      const x = centerX + r * Math.cos(rad);
      const y = centerY + r * Math.sin(rad);
      
      if (angle === 0) {
        cookiePath = `M ${x} ${y}`;
      } else {
        cookiePath += ` L ${x} ${y}`;
      }
    }
    
    cookiePath += ' Z';
    
    return (
      <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto">
        <defs>
          <radialGradient id="cookieGradient">
            <stop offset="0%" stopColor="#D4A574" />
            <stop offset="100%" stopColor="#B8860B" />
          </radialGradient>
          <filter id="cookieShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
        </defs>
        
        {/* Cookie base with bites */}
        <path
          d={cookiePath}
          fill="url(#cookieGradient)"
          stroke="#8B6914"
          strokeWidth="2"
          filter="url(#cookieShadow)"
        />

        {/* Chocolate chips - only on remaining cookie */}
        {[
          { x: 80, y: 80, r: 6 },
          { x: 120, y: 90, r: 7 },
          { x: 95, y: 110, r: 5 },
          { x: 110, y: 70, r: 6 },
          { x: 75, y: 115, r: 5 },
          { x: 125, y: 115, r: 6 },
          { x: 90, y: 95, r: 4 },
        ].map((chip, i) => {
          // Only show chips that aren't in bitten areas
          const chipAngle = Math.atan2(chip.y - centerY, chip.x - centerX) * (180 / Math.PI);
          const normalizedAngle = chipAngle < 0 ? chipAngle + 360 : chipAngle;
          
          let showChip = true;
          for (let j = 0; j < bites; j++) {
            const biteAngle = (j * 360) / maxBites;
            const diff = Math.abs(normalizedAngle - biteAngle);
            if (diff < 25 || diff > 335) {
              showChip = false;
              break;
            }
          }
          
          if (showChip) {
            return (
              <motion.circle
                key={i}
                cx={chip.x}
                cy={chip.y}
                r={chip.r}
                fill="#3E2723"
                initial={{ scale: 1 }}
                animate={{ scale: 1 }}
              />
            );
          }
          return null;
        })}
      </svg>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-purple-600">🍪 Today's Cookie</h3>
          <p className="text-sm text-gray-600">Complete subtasks to take a bite!</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="size-4 mr-2" />
              Add Tasks
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select Subtasks for Today</DialogTitle>
              <DialogDescription>
                Choose the subtasks you want to work on today and add them to your cookie.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="space-y-2">
                    <h4 className="text-purple-600">{task.title}</h4>
                    {task.subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-2 pl-4">
                        <Checkbox
                          checked={dailyTasks.includes(subtask.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              addSubtaskToDaily(subtask.id);
                            } else {
                              removeSubtaskFromDaily(subtask.id);
                            }
                          }}
                        />
                        <span className="text-sm">{subtask.title}</span>
                        {subtask.completed && (
                          <Badge variant="outline" className="ml-auto">
                            ✓ Done
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cookie Visualization */}
      <div className="mb-6">
        {totalBites > 0 ? (
          <div>
            {cookieProgress === 100 ? (
              // All done - show congratulations
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8"
              >
                <p className="text-6xl mb-4">🎉</p>
                <h4 className="text-purple-600 mb-2">Congratulations!</h4>
                <p className="text-gray-600">You've completed all your tasks for today!</p>
                <p className="text-sm text-gray-500 mt-2">Cookie fully eaten! 🍪✨</p>
              </motion.div>
            ) : (
              // In progress - show cookie with bites
              <div>
                {generateCookie()}
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    {completedBites} of {totalBites} bites taken ({Math.round(cookieProgress)}%)
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p className="text-4xl mb-2">🍪</p>
            <p>Add subtasks to build your cookie!</p>
          </div>
        )}
      </div>

      {/* Daily Task List */}
      {dailySubtasks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm text-gray-600">Today's Subtasks:</h4>
          {dailySubtasks.map((subtask) => (
            <div
              key={subtask.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                subtask.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
              }`}
            >
              <Checkbox 
                checked={subtask.completed} 
                onCheckedChange={() => toggleSubtaskCompletion(subtask.taskId, subtask.id)}
              />
              <div className="flex-1">
                <p className={`text-sm ${subtask.completed ? 'line-through text-gray-500' : ''}`}>
                  {subtask.title}
                </p>
                <p className="text-xs text-gray-500">{subtask.taskTitle}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}