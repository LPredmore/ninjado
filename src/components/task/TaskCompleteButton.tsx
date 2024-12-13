import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaskCompleteButtonProps {
  onComplete: () => void;
}

const TaskCompleteButton = ({ onComplete }: TaskCompleteButtonProps) => {
  return (
    <Button
      onClick={onComplete}
      className="flex items-center space-x-2 bg-ninja-primary text-white hover:bg-ninja-primary/90"
    >
      <CheckCircle className="w-5 h-5" />
      <span>Complete</span>
    </Button>
  );
};

export default TaskCompleteButton;