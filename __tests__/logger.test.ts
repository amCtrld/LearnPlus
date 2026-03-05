/**
 * Enhanced Logger Test Suite
 * 
 * Tests for Phase 4 logging improvements:
 * - Attempt counting
 * - Step-specific AI interaction tracking
 * - Timer management
 * - Session storage management
 */

import {
  getStepAttemptCount,
  incrementStepAttemptCount,
  resetStepAttemptCount,
  trackAiInteraction,
  getAiInteractionCount,
  resetAiInteractionCount,
  startStepTimer,
  getStepElapsedTime,
  clearStepTimer,
  clearStepData,
  clearProblemData,
} from '../lib/logger';

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: { [key: string]: string } = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

Object.defineProperty(global, 'sessionStorage', {
  value: sessionStorageMock,
});

describe('Logger - Attempt Counting', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test('should start at 0 attempts', () => {
    expect(getStepAttemptCount('1-1')).toBe(0);
  });

  test('should increment attempt count', () => {
    const count1 = incrementStepAttemptCount('1-1');
    expect(count1).toBe(1);
    
    const count2 = incrementStepAttemptCount('1-1');
    expect(count2).toBe(2);
    
    expect(getStepAttemptCount('1-1')).toBe(2);
  });

  test('should track attempts independently per step', () => {
    incrementStepAttemptCount('1-1');
    incrementStepAttemptCount('1-1');
    incrementStepAttemptCount('1-2');
    
    expect(getStepAttemptCount('1-1')).toBe(2);
    expect(getStepAttemptCount('1-2')).toBe(1);
  });

  test('should reset attempt count', () => {
    incrementStepAttemptCount('1-1');
    incrementStepAttemptCount('1-1');
    expect(getStepAttemptCount('1-1')).toBe(2);
    
    resetStepAttemptCount('1-1');
    expect(getStepAttemptCount('1-1')).toBe(0);
  });
});

describe('Logger - AI Interaction Tracking (Per Step)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test('should start at 0 AI interactions', () => {
    expect(getAiInteractionCount(1, '1-1')).toBe(0);
  });

  test('should track AI interactions per step', () => {
    trackAiInteraction(1, '1-1');
    expect(getAiInteractionCount(1, '1-1')).toBe(1);
    
    trackAiInteraction(1, '1-1');
    expect(getAiInteractionCount(1, '1-1')).toBe(2);
  });

  test('should track AI interactions independently per step', () => {
    trackAiInteraction(1, '1-1');
    trackAiInteraction(1, '1-1');
    trackAiInteraction(1, '1-2');
    
    expect(getAiInteractionCount(1, '1-1')).toBe(2);
    expect(getAiInteractionCount(1, '1-2')).toBe(1);
  });

  test('should track AI interactions independently per problem', () => {
    trackAiInteraction(1, '1-1');
    trackAiInteraction(2, '2-1');
    
    expect(getAiInteractionCount(1, '1-1')).toBe(1);
    expect(getAiInteractionCount(2, '2-1')).toBe(1);
  });

  test('should reset AI interaction count for a step', () => {
    trackAiInteraction(1, '1-1');
    trackAiInteraction(1, '1-1');
    expect(getAiInteractionCount(1, '1-1')).toBe(2);
    
    resetAiInteractionCount(1, '1-1');
    expect(getAiInteractionCount(1, '1-1')).toBe(0);
  });
});

describe('Logger - Timer Management', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should start timer only once', () => {
    startStepTimer('1-1');
    const time1 = Date.now();
    
    jest.advanceTimersByTime(5000); // 5 seconds
    
    startStepTimer('1-1'); // Should not restart
    const elapsed = getStepElapsedTime('1-1');
    
    expect(elapsed).toBeGreaterThanOrEqual(5);
  });

  test('should measure elapsed time in seconds', () => {
    startStepTimer('1-1');
    
    jest.advanceTimersByTime(10000); // 10 seconds
    
    const elapsed = getStepElapsedTime('1-1');
    expect(elapsed).toBe(10);
  });

  test('should return 0 for non-started timer', () => {
    expect(getStepElapsedTime('nonexistent')).toBe(0);
  });

  test('should clear timer', () => {
    startStepTimer('1-1');
    jest.advanceTimersByTime(5000);
    
    clearStepTimer('1-1');
    expect(getStepElapsedTime('1-1')).toBe(0);
  });

  test('should track timers independently per step', () => {
    startStepTimer('1-1');
    jest.advanceTimersByTime(5000);
    
    startStepTimer('1-2');
    jest.advanceTimersByTime(3000);
    
    expect(getStepElapsedTime('1-1')).toBe(8);
    expect(getStepElapsedTime('1-2')).toBe(3);
  });
});

describe('Logger - Session Storage Management', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test('should clear all step data', () => {
    const stepId = '1-1';
    startStepTimer(stepId);
    incrementStepAttemptCount(stepId);
    trackAiInteraction(1, stepId);
    
    // Verify data exists
    expect(getStepElapsedTime(stepId)).toBeGreaterThanOrEqual(0);
    expect(getStepAttemptCount(stepId)).toBe(1);
    
    clearStepData(stepId);
    
    // Verify data cleared
    expect(getStepElapsedTime(stepId)).toBe(0);
    expect(getStepAttemptCount(stepId)).toBe(0);
  });

  test('should clear all problem data', () => {
    const problemId = 1;
    
    // Set up data for multiple steps
    trackAiInteraction(problemId, '1-1');
    trackAiInteraction(problemId, '1-2');
    trackAiInteraction(problemId, '1-3');
    
    expect(getAiInteractionCount(problemId, '1-1')).toBe(1);
    expect(getAiInteractionCount(problemId, '1-2')).toBe(1);
    
    clearProblemData(problemId);
    
    // Verify all data cleared
    expect(getAiInteractionCount(problemId, '1-1')).toBe(0);
    expect(getAiInteractionCount(problemId, '1-2')).toBe(0);
    expect(getAiInteractionCount(problemId, '1-3')).toBe(0);
  });

  test('should not affect other problems when clearing', () => {
    trackAiInteraction(1, '1-1');
    trackAiInteraction(2, '2-1');
    
    clearProblemData(1);
    
    expect(getAiInteractionCount(1, '1-1')).toBe(0);
    expect(getAiInteractionCount(2, '2-1')).toBe(1); // Unchanged
  });
});

describe('Logger - Integration Scenarios', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should track complete step lifecycle', () => {
    const stepId = '1-1';
    
    // Step starts
    startStepTimer(stepId);
    
    // Student tries answer (incorrect)
    jest.advanceTimersByTime(30000); // 30 seconds
    const attempt1 = incrementStepAttemptCount(stepId);
    expect(attempt1).toBe(1);
    
    // Student asks AI for help
    trackAiInteraction(1, stepId);
    trackAiInteraction(1, stepId);
    
    // Student tries again (correct)
    jest.advanceTimersByTime(45000); // 45 more seconds
    const attempt2 = incrementStepAttemptCount(stepId);
    
    // Verify metrics
    expect(attempt2).toBe(2);
    expect(getStepElapsedTime(stepId)).toBe(75);
    expect(getAiInteractionCount(1, stepId)).toBe(2);
    
    // Clear after step completion
    clearStepData(stepId);
  });

  test('should handle multiple steps in sequence', () => {
    // Step 1
    startStepTimer('1-1');
    jest.advanceTimersByTime(20000);
    incrementStepAttemptCount('1-1');
    clearStepData('1-1');
    
    // Step 2
    startStepTimer('1-2');
    jest.advanceTimersByTime(30000);
    incrementStepAttemptCount('1-2');
    trackAiInteraction(1, '1-2');
    
    // Step 1 should be cleared, Step 2 should have data
    expect(getStepElapsedTime('1-1')).toBe(0);
    expect(getStepElapsedTime('1-2')).toBe(30);
    expect(getStepAttemptCount('1-1')).toBe(0);
    expect(getStepAttemptCount('1-2')).toBe(1);
  });

  test('should track problem completion metrics', () => {
    const problemId = 1;
    let totalTime = 0;
    let totalAttempts = 0;
    let totalAiInteractions = 0;
    
    // Simulate 3 steps
    for (let i = 1; i <= 3; i++) {
      const stepId = `${problemId}-${i}`;
      startStepTimer(stepId);
      jest.advanceTimersByTime(25000); // 25 seconds per step
      
      incrementStepAttemptCount(stepId);
      if (i === 2) {
        // Second step has 2 attempts and AI help
        incrementStepAttemptCount(stepId);
        trackAiInteraction(problemId, stepId);
        trackAiInteraction(problemId, stepId);
      }
      
      totalTime += getStepElapsedTime(stepId);
      totalAttempts += getStepAttemptCount(stepId);
      totalAiInteractions += getAiInteractionCount(problemId, stepId);
      
      clearStepData(stepId);
    }
    
    expect(totalTime).toBe(75); // 25 * 3
    expect(totalAttempts).toBe(4); // 1 + 2 + 1
    expect(totalAiInteractions).toBe(2); // 0 + 2 + 0
  });
});
