/**
 * Skeleton Loading Components
 * 
 * Reusable loading states for better perceived performance
 * Improves UX during data fetching and prevents layout shift
 */

import { Card, CardContent, CardHeader } from './ui/card';
import { Skeleton } from './ui/skeleton';

/**
 * Skeleton for problem card in dashboard
 */
export function ProblemCardSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for dashboard with multiple problem cards
 */
export function DashboardSkeleton() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <Skeleton className="h-10 w-64 mb-6" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProblemCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for problem step interface
 */
export function ProblemStepSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Problem title */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-6 w-1/2" />
      </div>

      {/* Problem expression */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full max-w-md" />
      </div>

      {/* Step question */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-12 w-full" />
      </div>

      {/* Input area */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full max-w-lg" />
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

/**
 * Skeleton for chat panel
 */
export function ChatPanelSkeleton() {
  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      {/* Header */}
      <Skeleton className="h-6 w-32" />

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
            <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-3/4' : 'w-2/3'}`} />
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="space-y-2">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

/**
 * Skeleton for survey modal
 */
export function SurveySkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-5 w-full" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-8 w-full" />
            ))}
          </div>
        </div>
      ))}
      
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

/**
 * Skeleton for access code input
 */
export function AccessCodeSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md space-y-6">
        <Skeleton className="h-10 w-64 mx-auto" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-32 mx-auto" />
      </div>
    </div>
  );
}

/**
 * Skeleton for statistics/admin panel
 */
export function StatsSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Generic content skeleton
 */
export function ContentSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className="h-4 w-full" 
          style={{ width: `${100 - (i * 10)}%` }}
        />
      ))}
    </div>
  );
}

/**
 * Loading spinner with message
 */
export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
