/**
 * LinkedIn Callback Debug Endpoint
 * 
 * A special endpoint to capture and display LinkedIn callback data
 * for troubleshooting OAuth authentication issues
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Capture all URL parameters
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  
  // Capture all headers
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });
  
  // Log everything for debugging
  console.log('LinkedIn callback received:', {
    params,
    headers,
    url: req.url
  });
  
  // If we have a code, try to exchange it
  if (params.code) {
    try {
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: params.code,
          client_id: process.env.LINKEDIN_CLIENT_ID || '',
          client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
          redirect_uri: 'http://localhost:3000/api/auth/linkedin-callback'
        })
      });
      
      // Log response status
      console.log('Token exchange status:', tokenResponse.status);
      
      // Try to get response body
      let responseBody;
      try {
        responseBody = await tokenResponse.text();
        console.log('Token exchange response:', responseBody);
      } catch (e) {
        console.error('Error reading token response:', e);
      }
      
      // Return a friendly HTML page with debugging info
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>LinkedIn Callback Debug</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
            pre { background: #f1f1f1; padding: 1rem; overflow: auto; }
            .card { border: 1px solid #ddd; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; }
            h2 { color: #333; }
            .success { color: green; }
            .error { color: red; }
          </style>
        </head>
        <body>
          <h1>LinkedIn OAuth Debug</h1>
          
          <div class="card">
            <h2>Callback Parameters</h2>
            <pre>${JSON.stringify(params, null, 2)}</pre>
          </div>
          
          <div class="card">
            <h2>Token Exchange</h2>
            <p>Status: <span class="${tokenResponse.ok ? 'success' : 'error'}">${tokenResponse.status} ${tokenResponse.statusText}</span></p>
            <pre>${responseBody}</pre>
          </div>
          
          <div>
            <a href="/auth/test-oauth">Back to Test Page</a>
          </div>
        </body>
        </html>
        `,
        {
          headers: {
            'Content-Type': 'text/html',
          },
        }
      );
    } catch (error) {
      console.error('Error in LinkedIn callback debug:', error);
      
      return NextResponse.json(
        { error: 'Failed to process callback', details: String(error) },
        { status: 500 }
      );
    }
  }
  
  // No code parameter, just show what we received
  return new NextResponse(
    `
    <!DOCTYPE html>
    <html>
    <head>
      <title>LinkedIn Callback Debug</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
        pre { background: #f1f1f1; padding: 1rem; overflow: auto; }
        .card { border: 1px solid #ddd; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; }
        h2 { color: #333; }
        .error { color: red; }
      </style>
    </head>
    <body>
      <h1>LinkedIn OAuth Debug</h1>
      
      <div class="card">
        <h2>Callback Parameters</h2>
        <pre>${JSON.stringify(params, null, 2)}</pre>
      </div>
      
      <div class="card">
        <h2>Headers</h2>
        <pre>${JSON.stringify(headers, null, 2)}</pre>
      </div>
      
      <p class="error">No 'code' parameter found in the callback URL.</p>
      
      <div>
        <a href="/auth/test-oauth">Back to Test Page</a>
      </div>
    </body>
    </html>
    `,
    {
      headers: {
        'Content-Type': 'text/html',
      },
    }
  );
} 