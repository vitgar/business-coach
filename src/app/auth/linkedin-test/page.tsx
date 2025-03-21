/**
 * LinkedIn OAuth Test Page
 * 
 * Simple page with direct link to test LinkedIn OAuth
 */

'use client';

export default function LinkedInTest() {
  // Hardcoded LinkedIn OAuth URL with debug callback
  const linkedInOAuthUrl = 'https://www.linkedin.com/oauth/v2/authorization?' +
    'response_type=code' +
    '&client_id=86phkvueohp0ql' +
    '&redirect_uri=' + encodeURIComponent('http://localhost:3000/api/auth/linkedin-callback') +
    '&state=debug123' +
    '&scope=r_liteprofile%20r_emailaddress';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold">LinkedIn OAuth Test</h1>
        
        <div className="mb-8 space-y-4">
          <a 
            href={linkedInOAuthUrl}
            className="inline-block w-full rounded-md bg-[#0077B5] px-4 py-2 text-center font-semibold text-white hover:bg-[#006699]"
          >
            Test LinkedIn OAuth with Debug
          </a>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h2 className="font-semibold mb-2">Debug Information</h2>
            <p className="text-sm mb-2">This will start the LinkedIn OAuth flow and redirect to our custom debug endpoint.</p>
            <p className="text-sm">Callback URL: <code className="bg-gray-100 px-1">/api/auth/linkedin-callback</code></p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <a href="/auth/test-oauth" className="text-blue-500 hover:underline mr-4">
            Back to Test Page
          </a>
          <a href="/auth/signin" className="text-blue-500 hover:underline">
            Go to Sign In
          </a>
        </div>
      </div>
    </div>
  );
} 