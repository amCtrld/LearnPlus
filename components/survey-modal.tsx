'use client';

/**
 * Cognitive Load Survey Modal
 * Appears after problem completion for research data collection
 * Uses 1-7 Likert scale for three dimensions:
 * - Mental Demand: How mentally demanding was this problem?
 * - Confidence: How confident are you in your answer?
 * - System Helpfulness: How helpful was the system? (0 for control mode)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { StudyMode } from '@/lib/types';

interface SurveyModalProps {
  isOpen: boolean;
  problemId: number;
  mode: StudyMode;
  onSubmit: (responses: {
    mentalDemand: number;
    confidence: number;
    systemHelpfulness: number;
  }) => Promise<void>;
}

const LIKERT_OPTIONS = [
  { value: '1', label: 'Very Low', short: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: 'Neutral', short: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
  { value: '7', label: 'Very High', short: '7' },
];

export function SurveyModal({ isOpen, problemId, mode, onSubmit }: SurveyModalProps) {
  const [mentalDemand, setMentalDemand] = useState<string>('');
  const [confidence, setConfidence] = useState<string>('');
  const [systemHelpfulness, setSystemHelpfulness] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const isControlMode = mode === 'control';
    
    if (!mentalDemand || !confidence) return;
    if (!isControlMode && !systemHelpfulness) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        mentalDemand: parseInt(mentalDemand, 10),
        confidence: parseInt(confidence, 10),
        systemHelpfulness: isControlMode ? 0 : parseInt(systemHelpfulness, 10),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isControlMode = mode === 'control';
  const isComplete = mentalDemand && confidence && (isControlMode || systemHelpfulness);

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quick Survey</DialogTitle>
          <DialogDescription>
            Your feedback helps us understand your learning experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mental Demand */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              How mentally demanding was this problem?
            </Label>
            <RadioGroup value={mentalDemand} onValueChange={setMentalDemand}>
              <div className="flex gap-2 flex-wrap">
                {LIKERT_OPTIONS.map((option) => (
                  <Label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-secondary"
                  >
                    <RadioGroupItem value={option.value} id={`demand-${option.value}`} />
                    <span className="text-sm">{option.short || option.label}</span>
                  </Label>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Confidence */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              How confident are you in your solution?
            </Label>
            <RadioGroup value={confidence} onValueChange={setConfidence}>
              <div className="flex gap-2 flex-wrap">
                {LIKERT_OPTIONS.map((option) => (
                  <Label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-secondary"
                  >
                    <RadioGroupItem value={option.value} id={`confidence-${option.value}`} />
                    <span className="text-sm">{option.short || option.label}</span>
                  </Label>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* System Helpfulness (AI-Assisted mode only) */}
          {!isControlMode && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                How helpful was the AI system in your learning?
              </Label>
              <RadioGroup value={systemHelpfulness} onValueChange={setSystemHelpfulness}>
                <div className="flex gap-2 flex-wrap">
                  {LIKERT_OPTIONS.map((option) => (
                    <Label
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-secondary"
                    >
                      <RadioGroupItem value={option.value} id={`helpful-${option.value}`} />
                      <span className="text-sm">{option.short || option.label}</span>
                    </Label>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isControlMode ? !mentalDemand || !confidence : !isComplete || isSubmitting}
            className="w-full"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue to Next Problem
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
