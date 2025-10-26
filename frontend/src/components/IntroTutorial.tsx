import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IntroTutorialProps {
  onClose: () => void;
}

const TUTORIAL_STEPS = [
  {
    title: 'Welcome to ADHD BDBD! 🍕',
    description: 'Your friendly focus companion that makes productivity fun and achievable.',
    icon: '👋',
    content: 'ADHD BDBD helps students with ADHD stay focused using virtual body doubles, visual task organization, and fun completion mechanics. Let\'s get started!',
  },
  {
    title: 'Add Tasks & Subtasks',
    description: 'Build your task list from multiple sources',
    icon: '📝',
    content: 'Add tasks and subtasks of your own, import from Gmail/Canvas, or use our smart AI to generate subtasks. Break big projects into bite-sized pieces!',
  },
  {
    title: 'Make Your Daily Pizza',
    description: 'Select what you want to tackle today',
    icon: '🍕',
    content: 'Pick the subtasks you want to work on today and watch your pizza grow! Each subtask becomes a delicious slice. As you complete tasks, you\'ll see your pizza fill up!',
  },
  {
    title: 'Customize Your Body Double',
    description: 'Your friendly pizza companion keeps you focused',
    icon: '🎨',
    content: 'Body doubling is proven to help people with ADHD stay focused. Customize your pizza body double to work alongside you, send encouragement, and chat during focus sessions!',
  },
  {
    title: 'Start Your Focus Session',
    description: 'Choose immersive work environments',
    icon: '🎯',
    content: 'Pick from different virtual study rooms like coffee shops, libraries, parks, or cozy homes. Set a timer, work with your body double, and track your progress!',
  },
  {
    title: 'Work Through The Pizza',
    description: 'Complete tasks and celebrate wins!',
    icon: '🎉',
    content: 'Complete each slice of your pizza to build your streak. Review your session notes and reflections to see how far you\'ve come. Every small win counts!',
  },
];

export default function IntroTutorial({ onClose }: IntroTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = TUTORIAL_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.6)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <Card
          className="max-w-2xl w-full"
          style={{
            background: '#FFF9F4',
            borderRadius: '24px',
            border: '3px solid #F7A64B',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div className="relative p-8">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-4 right-4"
              style={{
                color: '#8B5E3C',
                borderRadius: '12px',
              }}
            >
              <X className="size-5" />
            </Button>

            {/* Progress Indicator */}
            <div className="mb-6">
              <div className="flex gap-2 mb-4">
                {TUTORIAL_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className="h-2 flex-1 rounded-full transition-all"
                    style={{
                      background: index <= currentStep ? '#F7A64B' : '#E8DDD0',
                    }}
                  />
                ))}
              </div>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.875rem',
                  color: '#8B5E3C',
                  textAlign: 'center',
                }}
              >
                Step {currentStep + 1} of {TUTORIAL_STEPS.length}
              </p>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                {/* Icon */}
                <div className="text-7xl mb-6 animate-bounce-gentle">{step.icon}</div>

                {/* Title */}
                <h2
                  className="mb-3"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: '#F7A64B',
                  }}
                >
                  {step.title}
                </h2>

                {/* Description */}
                <p
                  className="mb-4"
                  style={{
                    fontFamily: 'Lexend Deca, sans-serif',
                    fontSize: '1.125rem',
                    color: '#8B5E3C',
                    fontWeight: 600,
                  }}
                >
                  {step.description}
                </p>

                {/* Content */}
                <p
                  className="mb-8"
                  style={{
                    fontFamily: 'Lexend Deca, sans-serif',
                    fontSize: '1rem',
                    color: '#2D2D2D',
                    lineHeight: 1.7,
                  }}
                >
                  {step.content}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex gap-3 justify-between">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 0}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  borderRadius: '16px',
                  borderWidth: '2px',
                  borderColor: currentStep === 0 ? '#E8DDD0' : '#8B5E3C',
                  color: currentStep === 0 ? '#E8DDD0' : '#8B5E3C',
                  minWidth: '120px',
                }}
              >
                <ChevronLeft className="size-5 mr-1" />
                Previous
              </Button>

              <Button
                onClick={handleNext}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  borderRadius: '16px',
                  background: '#F7A64B',
                  color: '#FFF9F4',
                  minWidth: '120px',
                  borderWidth: '2px',
                  borderColor: '#8B5E3C',
                }}
              >
                {currentStep === TUTORIAL_STEPS.length - 1 ? (
                  "Let's Go!"
                ) : (
                  <>
                    Next
                    <ChevronRight className="size-5 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}