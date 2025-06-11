import { NextResponse } from 'next/server';
import { isIP } from 'net';

export const maxDuration = 300; // 5 minutes for large batches
export const dynamic = 'force-dynamic'; // Ensure this route is dynamically evaluated

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // Validate required fields
    const requiredFields = ['serviceId', 'aclId', 'file'];
    for (const field of requiredFields) {
      if (!formData.get(field)) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Get and type check inputs
    const serviceId = formData.get('serviceId') as string;
    const aclId = formData.get('aclId') as string;
    const file = formData.get('file') as File;
    const comment = formData.get('comment')?.toString() || 'Bulk upload';

    // Process the file
    const content = await file.text();
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line !== '' && !line.startsWith('#')); // Skip empty lines and comments

    // Check for Fastly limits
    if (lines.length > 1000) {
      return NextResponse.json(
        { 
          error: 'Too many IPs',
          detail: 'Fastly ACLs have a maximum limit of 1,000 entries per ACL.'
        },
        { status: 400 }
        );
    }

    const ENV_FASTLY_API_KEY = process.env.FASTLY_API_KEY;
    if (!ENV_FASTLY_API_KEY) {
      throw new Error("Fastly API key is not configured");
    }

    // Process each IP with improved CIDR handling
    const results = [];
    const BATCH_SIZE = 50; // Process in batches to avoid rate limiting
    
    for (let i = 0; i < lines.length; i += BATCH_SIZE) {
      const batch = lines.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (line) => {
          const ip = line.trim();
          if (!ip) return null;

          // Handle negated IPs (starting with !)
          const negated = ip.startsWith('!') ? 1 : 0;
          const cleanIp = negated ? ip.slice(1) : ip;

          // Extract base IP for validation (before / for CIDR)
          const baseIp = cleanIp.split('/')[0];

          // Validate IP
          if (!isIP(baseIp)) {
            return {
              ip,
              status: 'invalid',
              error: 'Invalid IP format'
            };
          }

          try {
            const ipData = new URLSearchParams();
            ipData.append('ip', cleanIp.includes('/') ? baseIp : cleanIp);
            ipData.append('negated', negated.toString());
            ipData.append('comment', comment);

            // Handle CIDR notation if present
            if (cleanIp.includes('/')) {
              const [address, prefix] = cleanIp.split('/');
              const prefixNum = parseInt(prefix);
              
              // Validate CIDR prefix
              const maxPrefix = address.includes(':') ? 128 : 32; // IPv6 vs IPv4
              if (isNaN(prefixNum) || prefixNum < 0 || prefixNum > maxPrefix) {
                return {
                  ip,
                  status: 'invalid',
                  error: `Invalid CIDR prefix (must be 0-${maxPrefix})`
                };
              }
              
              ipData.append('subnet', prefix);
            }

            const response = await fetch(
              `https://api.fastly.com/service/${serviceId}/acl/${aclId}/entry`,
              {
                method: 'POST',
                headers: {
                  'Fastly-Key': ENV_FASTLY_API_KEY,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: ipData,
              }
            );

            const result = await response.json();
            return {
              ip,
              status: response.status,
              ok: response.ok,
              response: result
            };
          } catch (error) {
            return {
              ip,
              status: 'error',
              error: error instanceof Error ? error.message : 'Failed to process IP'
            };
          }
        })
      );

      results.push(...batchResults.filter(Boolean));
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
    }

    return NextResponse.json({ 
      success: true,
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}