/**
 * Environment configuration
 * 
 * Create a .env.local file with:
 * NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
 */

export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
} as const;

// Validate environment variables (call this explicitly when needed)
export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing = required.filter((key) => !process.env[key] || process.env[key]?.trim() === '');

  if (missing.length > 0) {
    const isBrowser = typeof window !== 'undefined';
    const envHint = isBrowser 
      ? 'This variable should be set in Vercel environment variables and redeployed.'
      : 'Make sure it is set in your environment or .env.local file.';
    
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `${envHint}`
    );
  }
}

