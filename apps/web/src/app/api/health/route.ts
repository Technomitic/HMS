import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  let apiHealthy = false;
  try {
    const response = await fetch(`${apiUrl}/api/v1/health`, {
      signal: AbortSignal.timeout(5000),
    });
    apiHealthy = response.ok;
  } catch {
    apiHealthy = false;
  }

  return NextResponse.json({
    status: apiHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    checks: {
      web: 'healthy',
      api: apiHealthy ? 'healthy' : 'unhealthy',
    },
  });
}