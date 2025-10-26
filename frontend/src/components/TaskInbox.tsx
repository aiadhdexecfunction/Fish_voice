import { useState } from 'react';
import { Task } from '../App';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Mail, BookOpen, User, ChevronDown, ChevronRight, Edit2, Check, X, Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';

interface TaskInboxProps {
  tasks: Task[];
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  dailyTasks?: string[];
  setDailyTasks?: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function TaskInbox({ tasks, onUpdateTask, dailyTasks, setDailyTasks }: TaskInboxProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [editingSubtask, setEditingSubtask] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [addingSubtaskTo, setAddingSubtaskTo] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const toggleTask = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const startEditing = (subtaskId: string, currentTitle: string) => {
    setEditingSubtask(subtaskId);
    setEditValue(currentTitle);
  };

  const saveEdit = (taskId: string, subtaskId: string) => {
    if (onUpdateTask) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const updatedSubtasks = task.subtasks.map(s =>
          s.id === subtaskId ? { ...s, title: editValue } : s
        );
        onUpdateTask(taskId, { subtasks: updatedSubtasks });
      }
    }
    setEditingSubtask(null);
  };

  const cancelEdit = () => {
    setEditingSubtask(null);
    setEditValue('');
  };

  const addNewSubtask = (taskId: string) => {
    if (!newSubtaskTitle.trim() || !onUpdateTask) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const newSubtask = {
        id: `${taskId}-${Date.now()}`,
        title: newSubtaskTitle,
        completed: false,
      };
      const updatedSubtasks = [...task.subtasks, newSubtask];
      onUpdateTask(taskId, { subtasks: updatedSubtasks });
    }
    setNewSubtaskTitle('');
    setAddingSubtaskTo(null);
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    if (!onUpdateTask) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const updatedSubtasks = task.subtasks.filter(s => s.id !== subtaskId);
      onUpdateTask(taskId, { subtasks: updatedSubtasks });
      
      if (dailyTasks && setDailyTasks && dailyTasks.includes(subtaskId)) {
        setDailyTasks(prev => prev.filter(id => id !== subtaskId));
      }
    }
  };

  const getSourceIcon = (source: Task['source']) => {
    switch (source) {
      case 'gmail':
        return <Mail className="size-4" />;
      case 'canvas':
        return <BookOpen className="size-4" />;
      case 'manual':
        return <User className="size-4" />;
    }
  };

  const getSourceColor = (source: Task['source']) => {
    switch (source) {
      case 'gmail':
        return { background: '#FFB5A0', color: '#2D2D2D' };
      case 'canvas':
        return { background: '#CFE8ED', color: '#2D2D2D' };
      case 'manual':
        return { background: '#FFD4A3', color: '#2D2D2D' };
    }
  };

  return (
    <Card className="p-6 warm-card" style={{ 
      background: '#FFFFFF', 
      borderRadius: '24px'
    }}>
      <div className="mb-6">
        <h3 style={{ 
          fontFamily: 'Poppins, sans-serif',
          fontSize: '1.5rem',
          fontWeight: 600,
          color: '#F7A64B'
        }}>
          📥 All Tasks
        </h3>
        <p className="text-sm mt-1" style={{ 
          fontFamily: 'Lexend Deca, sans-serif',
          color: '#8B5E3C'
        }}>
          Your complete task list
        </p>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={{ 
            background: '#FFF9F4',
            border: '2px dashed #E8DDD0'
          }}>
            <p style={{ 
              fontFamily: 'Lexend Deca, sans-serif',
              color: '#8B5E3C'
            }}>
              No tasks yet
            </p>
            <p className="text-sm mt-1" style={{ 
              fontFamily: 'Lexend Deca, sans-serif',
              color: '#8B5E3C',
              opacity: 0.7
            }}>
              Add tasks above to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Collapsible
                key={task.id}
                open={expandedTasks.has(task.id)}
                onOpenChange={() => toggleTask(task.id)}
              >
                <div
                  className="p-4 rounded-xl soft-shadow transition-all"
                  style={{ 
                    border: '1px solid #E8DDD0',
                    background: '#FFFFFF'
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                        {expandedTasks.has(task.id) ? (
                          <ChevronDown className="size-5 mr-2" style={{ color: '#F7A64B' }} />
                        ) : (
                          <ChevronRight className="size-5 mr-2" style={{ color: '#F7A64B' }} />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <h4 className="flex-1" style={{ 
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 600,
                      color: '#2D2D2D'
                    }}>
                      {task.title}
                    </h4>
                    <Badge variant="outline" className="text-xs" style={{
                      ...getSourceColor(task.source),
                      borderRadius: '8px',
                      border: 'none',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500
                    }}>
                      {getSourceIcon(task.source)}
                    </Badge>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm mb-2 ml-7" style={{ 
                      fontFamily: 'Lexend Deca, sans-serif',
                      color: '#8B5E3C'
                    }}>
                      {task.description}
                    </p>
                  )}

                  <CollapsibleContent className="ml-7 mt-3 space-y-2">
                    {task.subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-2 text-sm group p-2 rounded-lg transition-all hover:bg-[#FFF9F4]">
                        {editingSubtask === subtask.id ? (
                          <>
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-8 text-sm flex-1"
                              style={{
                                borderRadius: '8px',
                                border: '1px solid #E8DDD0',
                                fontFamily: 'Lexend Deca, sans-serif'
                              }}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit(task.id, subtask.id);
                                if (e.key === 'Escape') cancelEdit();
                              }}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => saveEdit(task.id, subtask.id)}
                            >
                              <Check className="size-4" style={{ color: '#B8D4C8' }} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={cancelEdit}
                            >
                              <X className="size-4" style={{ color: '#E07856' }} />
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#F7A64B' }} />
                            <span className="flex-1" style={{ 
                              fontFamily: 'Lexend Deca, sans-serif',
                              color: '#2D2D2D'
                            }}>
                              {subtask.title}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => startEditing(subtask.id, subtask.title)}
                            >
                              <Edit2 className="size-3" style={{ color: '#F7A64B' }} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => deleteSubtask(task.id, subtask.id)}
                            >
                              <Trash2 className="size-3" style={{ color: '#E07856' }} />
                            </Button>
                          </>
                        )}
                      </div>
                    ))}
                    {addingSubtaskTo === task.id && (
                      <div className="flex items-center gap-2 text-sm p-2">
                        <Input
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          className="h-8 text-sm flex-1"
                          placeholder="New subtask..."
                          style={{
                            borderRadius: '8px',
                            border: '1px solid #E8DDD0',
                            fontFamily: 'Lexend Deca, sans-serif'
                          }}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') addNewSubtask(task.id);
                            if (e.key === 'Escape') setAddingSubtaskTo(null);
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => addNewSubtask(task.id)}
                        >
                          <Check className="size-4" style={{ color: '#B8D4C8' }} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => setAddingSubtaskTo(null)}
                        >
                          <X className="size-4" style={{ color: '#E07856' }} />
                        </Button>
                      </div>
                    )}
                    {addingSubtaskTo !== task.id && (
                      <div className="flex items-center gap-2 text-sm pt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs hover:bg-transparent"
                          style={{ 
                            color: '#F7A64B',
                            fontFamily: 'Inter, sans-serif'
                          }}
                          onClick={() => setAddingSubtaskTo(task.id)}
                        >
                          <Plus className="size-3 mr-1" />
                          Add subtask
                        </Button>
                      </div>
                    )}
                  </CollapsibleContent>

                  <div className="flex items-center gap-2 text-xs ml-7 mt-3" style={{ 
                    fontFamily: 'Inter, sans-serif',
                    color: '#8B5E3C',
                    opacity: 0.8
                  }}>
                    <span>{task.subtasks.length} subtasks</span>
                    {task.deadline && (
                      <>
                        <span>•</span>
                        <span>Due {new Date(task.deadline).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </Collapsible>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
