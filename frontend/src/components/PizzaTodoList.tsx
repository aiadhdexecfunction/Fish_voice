import { useState } from 'react';
import { Task } from '../App';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Plus, Edit2, Check, X, PartyPopper } from 'lucide-react';
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
import { Input } from './ui/input';

interface PizzaTodoListProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  dailyTasks: string[];
  setDailyTasks: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function PizzaTodoList({
  tasks,
  setTasks,
  dailyTasks,
  setDailyTasks,
}: PizzaTodoListProps) {
  const [editingSubtask, setEditingSubtask] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const allSubtasks = tasks.flatMap((task) =>
    task.subtasks.map((subtask) => ({
      ...subtask,
      taskId: task.id,
      taskTitle: task.title,
    }))
  );

  const dailySubtasks = allSubtasks.filter((s) => dailyTasks.includes(s.id));
  const totalSlices = dailySubtasks.length;
  const eatenSlices = dailySubtasks.filter((s) => s.completed).length;

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

  const startEditing = (subtaskId: string, currentTitle: string) => {
    setEditingSubtask(subtaskId);
    setEditValue(currentTitle);
  };

  const saveEdit = (taskId: string, subtaskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map(subtask =>
                subtask.id === subtaskId
                  ? { ...subtask, title: editValue }
                  : subtask
              ),
            }
          : task
      )
    );
    setEditingSubtask(null);
  };

  const cancelEdit = () => {
    setEditingSubtask(null);
    setEditValue('');
  };

  // Generate pizza SVG with warm colors
  const generatePizza = () => {
    const centerX = 100;
    const centerY = 100;
    const radius = 80;
    
    if (totalSlices === 0) return null;

    const sliceAngle = 360 / totalSlices;
    
    return (
      <svg width="220" height="220" viewBox="0 0 220 220" className="mx-auto">
        {/* Warm pizza base */}
        <circle
          cx={centerX + 10}
          cy={centerY + 10}
          r={radius}
          fill="#FFD4A3"
          stroke="#F7A64B"
          strokeWidth="3"
        />

        {/* Crust outline */}
        <circle
          cx={centerX + 10}
          cy={centerY + 10}
          r={radius - 3}
          fill="none"
          stroke="#F7A64B"
          strokeWidth="5"
        />

        {/* Toppings on remaining slices */}
        {[
          { angle: 30, distance: 40, shape: 'circle', color: '#F7A64B' },
          { angle: 80, distance: 50, shape: 'square', color: '#CFE8ED' },
          { angle: 120, distance: 35, shape: 'circle', color: '#FFB5A0' },
          { angle: 170, distance: 55, shape: 'triangle', color: '#B8D4C8' },
          { angle: 210, distance: 45, shape: 'circle', color: '#F7A64B' },
          { angle: 260, distance: 38, shape: 'square', color: '#E8D9F0' },
          { angle: 300, distance: 52, shape: 'circle', color: '#CFE8ED' },
          { angle: 340, distance: 42, shape: 'triangle', color: '#FFB5A0' },
        ].map((topping, i) => {
          const toppingSliceIndex = Math.floor(topping.angle / sliceAngle);
          const isEaten = toppingSliceIndex < eatenSlices;
          
          if (!isEaten) {
            const rad = (topping.angle * Math.PI) / 180;
            const x = centerX + 10 + topping.distance * Math.cos(rad);
            const y = centerY + 10 + topping.distance * Math.sin(rad);
            
            if (topping.shape === 'circle') {
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={6}
                  fill={topping.color}
                  opacity={0.8}
                />
              );
            } else if (topping.shape === 'square') {
              return (
                <rect
                  key={i}
                  x={x - 5}
                  y={y - 5}
                  width={10}
                  height={10}
                  rx={2}
                  fill={topping.color}
                  opacity={0.8}
                />
              );
            } else {
              return (
                <polygon
                  key={i}
                  points={`${x},${y - 6} ${x - 5},${y + 4} ${x + 5},${y + 4}`}
                  fill={topping.color}
                  opacity={0.8}
                />
              );
            }
          }
          return null;
        })}

        {/* Slice dividers and eaten slices */}
        {Array.from({ length: totalSlices }).map((_, i) => {
          const startAngle = i * sliceAngle - 90;
          const endAngle = (i + 1) * sliceAngle - 90;
          const isEaten = i < eatenSlices;

          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;

          const x1 = centerX + 10 + radius * Math.cos(startRad);
          const y1 = centerY + 10 + radius * Math.sin(startRad);

          if (isEaten) {
            const outerStartX = centerX + 10 + radius * Math.cos(startRad);
            const outerStartY = centerY + 10 + radius * Math.sin(startRad);
            const outerEndX = centerX + 10 + radius * Math.cos(endRad);
            const outerEndY = centerY + 10 + radius * Math.sin(endRad);

            const largeArcFlag = sliceAngle > 180 ? 1 : 0;

            return (
              <g key={i}>
                <path
                  d={`
                    M ${centerX + 10} ${centerY + 10}
                    L ${outerStartX} ${outerStartY}
                    A ${radius} ${radius} 0 ${largeArcFlag} 1 ${outerEndX} ${outerEndY}
                    Z
                  `}
                  fill="#FFF9F4"
                  stroke="#F7A64B"
                  strokeWidth="2"
                  strokeDasharray="4,3"
                  opacity={0.5}
                />
              </g>
            );
          } else {
            return (
              <line
                key={i}
                x1={centerX + 10}
                y1={centerY + 10}
                x2={x1}
                y2={y1}
                stroke="#F7A64B"
                strokeWidth="2"
                opacity={0.5}
              />
            );
          }
        })}

        {/* Center circle */}
        <circle
          cx={centerX + 10}
          cy={centerY + 10}
          r={8}
          fill="#F7A64B"
        />
      </svg>
    );
  };

  return (
    <div className="warm-card p-8" style={{ background: '#FFFFFF', borderRadius: '24px' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 style={{ 
            fontFamily: 'Poppins, sans-serif',
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#F7A64B'
          }}>
            🍕 Today's Pizza
          </h3>
          <p style={{ 
            fontFamily: 'Lexend Deca, sans-serif',
            color: '#8B5E3C',
            marginTop: '0.25rem'
          }}>
            {totalSlices > 0 && eatenSlices === totalSlices 
              ? 'All done! Amazing work! 🎉' 
              : 'Complete tasks to eat a slice!'}
          </p>
        </div>
        
        {totalSlices > 0 && eatenSlices === totalSlices ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{
            background: 'linear-gradient(135deg, #B8D4C8 0%, #CFE8ED 100%)',
            border: '2px solid #F7A64B'
          }}>
            <PartyPopper className="size-6 animate-bounce" style={{ color: '#F7A64B' }} />
            <span style={{
              fontFamily: 'Poppins, sans-serif',
              color: '#2D2D2D',
              fontWeight: 600
            }}>
              Completed!
            </span>
          </div>
        ) : (
          <Dialog>
          <DialogTrigger asChild>
            <Button className="friendly-button" style={{ 
              background: '#CFE8ED', 
              color: '#2D2D2D',
              borderRadius: '12px'
            }} size="sm">
              <Plus className="size-4 mr-2" />
              Add Slices
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl warm-card" style={{ 
            background: '#FFFFFF', 
            borderRadius: '24px',
            border: '1px solid #E8DDD0'
          }}>
            <DialogHeader>
              <DialogTitle style={{ 
                fontFamily: 'Poppins, sans-serif',
                color: '#F7A64B',
                fontSize: '1.5rem'
              }}>
                Select Subtasks for Today
              </DialogTitle>
              <DialogDescription style={{ 
                fontFamily: 'Lexend Deca, sans-serif',
                color: '#8B5E3C'
              }}>
                Choose the subtasks you want to work on today. Each subtask = one pizza slice! 🍕
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="space-y-2">
                    <h4 style={{ 
                      fontFamily: 'Poppins, sans-serif',
                      color: '#F7A64B',
                      fontWeight: 600
                    }}>
                      {task.title}
                    </h4>
                    {task.subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-3 pl-4 p-3 rounded-xl transition-all" style={{ 
                        background: subtask.completed ? '#E8F7EA' : dailyTasks.includes(subtask.id) ? '#FFF4E8' : 'transparent',
                        border: dailyTasks.includes(subtask.id) ? '1px solid #FFD4A3' : '1px solid transparent'
                      }}>
                        <Checkbox
                          checked={dailyTasks.includes(subtask.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              addSubtaskToDaily(subtask.id);
                            } else {
                              removeSubtaskFromDaily(subtask.id);
                            }
                          }}
                          style={{
                            borderColor: '#F7A64B'
                          }}
                        />
                        <span className="text-sm flex-1" style={{ 
                          fontFamily: 'Lexend Deca, sans-serif',
                          color: '#2D2D2D'
                        }}>
                          {subtask.title}
                        </span>
                        {subtask.completed && (
                          <Badge className="ml-auto" style={{ 
                            background: '#B8D4C8', 
                            color: '#2D2D2D',
                            borderRadius: '8px',
                            fontFamily: 'Inter, sans-serif'
                          }}>
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
        )}
      </div>

      {/* Pizza Visualization and Task List */}
      <div className="space-y-6">
        {/* Pizza */}
        <div className="relative">
          {totalSlices > 0 ? (
            <div>
              {eatenSlices === totalSlices ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-12 rounded-2xl"
                  style={{ background: 'linear-gradient(135deg, #B8D4C8 0%, #CFE8ED 100%)' }}
                >
                  <PartyPopper className="size-16 mx-auto mb-4 animate-bounce-gentle" style={{ color: '#F7A64B' }} />
                  <h4 className="mb-2" style={{ 
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    color: '#2D2D2D'
                  }}>
                    Amazing work!
                  </h4>
                  <p style={{ 
                    fontFamily: 'Lexend Deca, sans-serif',
                    color: '#8B5E3C'
                  }}>
                    You've completed all your tasks for today!
                  </p>
                  <p className="mt-2" style={{ 
                    fontFamily: 'Lexend Deca, sans-serif',
                    color: '#8B5E3C'
                  }}>
                    Pizza all gone! 🍕✨
                  </p>
                </motion.div>
              ) : (
                <div>
                  {generatePizza()}
                  <div className="text-center mt-4 p-3 rounded-xl" style={{ 
                    background: 'linear-gradient(135deg, #FFD4A3 0%, #F7A64B 100%)'
                  }}>
                    <p style={{ 
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      color: '#FFFFFF'
                    }}>
                      {eatenSlices} of {totalSlices} slices eaten ({Math.round((eatenSlices / totalSlices) * 100)}%)
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 rounded-2xl" style={{ 
              background: '#FFF9F4',
              border: '2px dashed #E8DDD0'
            }}>
              <p className="text-4xl mb-3">🍕</p>
              <p style={{ 
                fontFamily: 'Lexend Deca, sans-serif',
                color: '#8B5E3C'
              }}>
                Add subtasks to build your pizza!
              </p>
            </div>
          )}
        </div>

        {/* Daily Task List */}
        <div>
          {dailySubtasks.length > 0 ? (
            <div className="space-y-3">
              <h4 className="mb-3" style={{ 
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                color: '#2D2D2D'
              }}>
                Today's Subtasks:
              </h4>
              {dailySubtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-3 p-4 group rounded-xl transition-all soft-shadow"
                  style={{
                    background: subtask.completed ? 'linear-gradient(135deg, #B8D4C8 0%, #CFE8ED 100%)' : '#FFFFFF',
                    border: '1px solid #E8DDD0'
                  }}
                >
                  {editingSubtask === subtask.id ? (
                    <>
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1"
                        style={{ 
                          borderRadius: '12px',
                          border: '1px solid #E8DDD0',
                          fontFamily: 'Lexend Deca, sans-serif'
                        }}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(subtask.taskId, subtask.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-transparent"
                        onClick={() => saveEdit(subtask.taskId, subtask.id)}
                      >
                        <Check className="size-4" style={{ color: '#B8D4C8' }} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-transparent"
                        onClick={cancelEdit}
                      >
                        <X className="size-4" style={{ color: '#E07856' }} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Checkbox 
                        checked={subtask.completed} 
                        onCheckedChange={() => toggleSubtaskCompletion(subtask.taskId, subtask.id)}
                        style={{ borderColor: '#F7A64B' }}
                      />
                      <div className="flex-1">
                        <p className={`${subtask.completed ? 'line-through opacity-70' : ''}`} style={{ 
                          fontFamily: 'Lexend Deca, sans-serif',
                          color: '#2D2D2D'
                        }}>
                          {subtask.title}
                        </p>
                        <p className="text-xs mt-1" style={{ 
                          fontFamily: 'Inter, sans-serif',
                          color: '#8B5E3C',
                          opacity: 0.8
                        }}>
                          {subtask.taskTitle}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-transparent transition-opacity"
                        onClick={() => startEditing(subtask.id, subtask.title)}
                      >
                        <Edit2 className="size-3" style={{ color: '#F7A64B' }} />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 rounded-2xl" style={{ 
              background: '#FFF9F4',
              border: '2px dashed #E8DDD0'
            }}>
              <p style={{ 
                fontFamily: 'Lexend Deca, sans-serif',
                color: '#8B5E3C'
              }}>
                No tasks selected for today
              </p>
              <p className="mt-1 text-sm" style={{ 
                fontFamily: 'Lexend Deca, sans-serif',
                color: '#8B5E3C',
                opacity: 0.7
              }}>
                Click "Add Slices" to get started!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
