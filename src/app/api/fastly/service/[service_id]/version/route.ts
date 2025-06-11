// src/app/api/fastly/service/[service_id]/version/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { service_id: string } }
) {
  const { service_id } = params;
  const apiToken = process.env.FASTLY_API_TOKEN;

  if (!apiToken) {
    return NextResponse.json(
      { error: 'FASTLY_API_TOKEN not set in environment' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`https://api.fastly.com/service/${service_id}/version`, {
      method: 'GET',
      headers: {
        'Fastly-Key': apiToken,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.msg || 'Failed to fetch versions from Fastly' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      service_id,
      versions: data,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Unexpected error while contacting Fastly', details: String(err) },
      { status: 500 }
    );
  }
}
