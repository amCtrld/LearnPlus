/**
 * 404 Not Found page
 * Displays when a route doesn't exist
 */

import { Home, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100">
      <Card className="max-w-2xl w-full text-center">
        <CardHeader>
          <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <span className="text-5xl font-bold text-gray-400">404</span>
          </div>
          <CardTitle>Page Not Found</CardTitle>
          <CardDescription>
            The page you are looking for doesn't exist or has been moved
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This could be because:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>You typed the URL incorrectly</li>
            <li>The page has been removed or renamed</li>
            <li>You followed an outdated link</li>
            <li>You don't have permission to access this page</li>
          </ul>
        </CardContent>

        <CardFooter className="flex justify-center gap-2">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <Search className="mr-2 h-4 w-4" />
              View Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
