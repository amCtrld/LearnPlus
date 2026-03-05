/**
 * Environment Variable Validation
 * Ensures all required configuration is present before app starts
 * Prevents runtime errors from missing environment variables
 */

interface EnvConfig {
  // Firebase Client (public)
  NEXT_PUBLIC_FIREBASE_API_KEY: string;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
  NEXT_PUBLIC_FIREBASE_APP_ID: string;
  
  // Firebase Admin (secret - server only)
  FIREBASE_PRIVATE_KEY?: string;
  FIREBASE_CLIENT_EMAIL?: string;
  
  // OpenAI (optional - only needed for AI mode)
  OPENAI_API_KEY?: string;
}

/**
 * Validates that all required environment variables are set
 * Throws an error if any required variables are missing
 */
export function validateEnvironment(): void {
  const requiredClientVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];

  const missing: string[] = [];

  // Check required client variables
  for (const varName of requiredClientVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\nPlease check your .env.local file.`
    );
  }

  console.log('✅ Environment variables validated successfully');
}

/**
 * Validates server-side environment variables (Firebase Admin)
 * Only called in API routes and server components
 */
export function validateServerEnvironment(): void {
  const requiredServerVars = [
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
  ];

  const missing: string[] = [];

  for (const varName of requiredServerVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    console.warn(
      `⚠️  Missing server environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\nFirebase Admin SDK will not work properly.`
    );
  }
}

/**
 * Validates OpenAI configuration
 * Only required if using AI-assisted mode
 */
export function validateOpenAIEnvironment(): boolean {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  OPENAI_API_KEY not set. AI-assisted mode will not work.');
    return false;
  }

  if (!apiKey.startsWith('sk-')) {
    console.error('❌ OPENAI_API_KEY appears to be invalid (should start with sk-)');
    return false;
  }

  console.log('✅ OpenAI configuration validated');
  return true;
}

/**
 * Gets environment configuration with type safety
 */
export function getEnvConfig(): EnvConfig {
  return {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };
}
