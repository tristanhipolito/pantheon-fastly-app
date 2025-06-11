// app/api/fastly/route.ts

import { NextResponse } from 'next/server';

const FASTLY_API_TOKEN = process.env.FASTLY_API_TOKEN;
const FASTLY_API_BASE_URL = 'https://api.fastly.com';

export async function GET() {
  if (!FASTLY_API_TOKEN) {
    return NextResponse.json({ error: 'Fastly API token not configured' }, { status: 500 });
  }

  try {
    // Fetch all services for the account
    const response = await fetch(`${FASTLY_API_BASE_URL}/service`, {
      headers: {
        'Fastly-Key': FASTLY_API_TOKEN,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.msg || 'Failed to fetch services' }, { status: response.status });
    }

    const data = await response.json();

    // Optionally, you can modify the data to display or structure it in a certain way
    return NextResponse.json({ services: data });
  } catch (error) {
    console.error('Fastly API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
