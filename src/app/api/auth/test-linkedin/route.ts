/**
 * LinkedIn OAuth Test Endpoint
 * 
 * Simple test endpoint to verify LinkedIn API connectivity
 * without going through the full NextAuth flow
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Extract code from query params if present
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    
    // If code is present, exchange it for token
    if (code) {
      console.log('Received LinkedIn code:', code);
      
      // Exchange code for token
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: process.env.LINKEDIN_CLIENT_ID || '',
          client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
          redirect_uri: 'http://localhost:3000/api/auth/test-linkedin'
        })
      });
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('LinkedIn token exchange error:', errorData);
        return NextResponse.json(
          { error: 'Failed to exchange code for token', details: errorData },
          { status: 400 }
        );
      }
      
      const tokenData = await tokenResponse.json();
      console.log('LinkedIn token data (access_token hidden):', {
        ...tokenData,
        access_token: tokenData.access_token ? '[REDACTED]' : undefined
      });
      
      // Get user profile with token
      try {
        const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`
          }
        });
        
        const profileData = await profileResponse.json();
        console.log('LinkedIn profile data:', profileData);
        
        // Try to get email address
        const emailResponse = await fetch(
          'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', 
          {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`
            }
          }
        );
        
        const emailData = await emailResponse.json();
        console.log('LinkedIn email data:', emailData);
        
        return NextResponse.json({
          success: true,
          profile: profileData,
          email: emailData
        });
      } catch (error) {
        console.error('Error fetching LinkedIn profile:', error);
        return NextResponse.json(
          { error: 'Failed to fetch profile data', details: error },
          { status: 500 }
        );
      }
    }
    
    // If no code is present, redirect to LinkedIn authorization
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code` +
      `&client_id=${process.env.LINKEDIN_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent('http://localhost:3000/api/auth/test-linkedin')}` +
      `&state=test123` +
      `&scope=r_liteprofile%20r_emailaddress`;
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('LinkedIn test error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error },
      { status: 500 }
    );
  }
} 