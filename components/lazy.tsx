/**
 * Lazy-loaded Components for Code Splitting
 * 
 * Dynamically imports heavy components to reduce initial bundle size
 * Components are loaded only when needed, improving initial page load
 */

import dynamic from 'next/dynamic';
import { ChatPanelSkeleton, SurveySkeleton } from './skeletons';

/**
 * Lazy-loaded Chat Panel (AI integration, heavy dependency)
 * Loading: ~30KB chunk
 */
export const ChatPanel = dynamic(
  () => import('./chat-panel').then(mod => ({ default: mod.ChatPanel })),
  {
    loading: () => <ChatPanelSkeleton />,
    ssr: false, // Client-side only (uses hooks, browser APIs)
  }
);

/**
 * Lazy-loaded Survey Modal (form components, validation)
 * Loading: ~15KB chunk
 */
export const SurveyModal = dynamic(
  () => import('./survey-modal').then(mod => ({ default: mod.SurveyModal })),
  {
    loading: () => <SurveySkeleton />,
    ssr: false, // Client-side only (modal, form state)
  }
);

/**
 * Pre-load chat panel when user might need it
 * Call this on hover or focus of chat trigger button
 */
export function preloadChatPanel() {
  const chatPanelModule = import('./chat-panel');
  return chatPanelModule;
}

/**
 * Pre-load survey modal when approaching end of problems
 * Call this on last problem or when survey button appears
 */
export function preloadSurveyModal() {
  const surveyModule = import('./survey-modal');
  return surveyModule;
}
