import { NextRequest, NextResponse } from 'next/server';
import { storeOAuthSession } from '@/lib/calendar/oauth-session';

/**
 * OAuth callback handler
 * This endpoint handles the redirect from Google after OAuth authorization
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Get OAuth parameters from the callback
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const oauthSessionId = searchParams.get('oauth_session_id');

  if (error) {
    // OAuth error occurred
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authorization Failed</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 400px;
            }
            h1 { color: #ef4444; margin: 0 0 1rem; }
            p { color: #666; margin: 0 0 1.5rem; }
            button {
              background: #3b82f6;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 6px;
              cursor: pointer;
              font-size: 1rem;
            }
            button:hover { background: #2563eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Authorization Failed</h1>
            <p>Error: ${error}</p>
            <button onclick="window.close()">Close Window</button>
          </div>
        </body>
      </html>
      `,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }

  // Store the OAuth session ID
  if (oauthSessionId) {
    await storeOAuthSession(oauthSessionId);
  }

  // OAuth success - Send session ID back to parent window
  return new NextResponse(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authorization Successful</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-center;
            min-height: 100vh;
            margin: 0;
            background: #f5f5f5;
          }
          .container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
          }
          h1 { color: #10b981; margin: 0 0 1rem; }
          p { color: #666; margin: 0 0 1.5rem; }
          .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 1rem auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
        <script>
          // Send session ID to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'OAUTH_SUCCESS',
              sessionId: '${oauthSessionId || ''}'
            }, window.location.origin);
          }
          
          // Auto-close window after 1 second
          setTimeout(() => {
            window.close();
          }, 1000);
        </script>
      </head>
      <body>
        <div class="container">
          <h1>✅ Authorization Successful!</h1>
          <p>Google Calendar has been connected successfully.</p>
          <div class="spinner"></div>
          <p style="font-size: 0.875rem; color: #999;">
            This window will close automatically...
          </p>
        </div>
      </body>
    </html>
    `,
    {
      headers: { 'Content-Type': 'text/html' },
    }
  );
}

