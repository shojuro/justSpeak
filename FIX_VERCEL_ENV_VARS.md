# Fix Vercel Environment Variables

## Issue Found
All environment variables in Vercel have trailing newline characters (`\n`) which are causing the API to fail.

## Steps to Fix

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/shojuros-projects/just-speak/settings/environment-variables

2. **Update Each Environment Variable**
   
   For each of the following variables, click the three dots menu and select "Edit", then:
   - Remove any trailing whitespace or newline characters
   - Make sure there are no quotes around the values
   - Click "Save"

   Variables to update:
   - `OPENAI_API_KEY` - Remove the `\n` at the end
   - `ELEVENLABS_API_KEY` - Remove the `\n` at the end  
   - `JWT_SECRET` - Remove the `\n` at the end
   - `REQUIRE_AUTH` - Should be just `false` (no quotes, no newline)
   - `NODE_ENV` - Should be just `production` (no quotes, no newline)
   - `NEXT_PUBLIC_SUPABASE_URL` - Remove the `\n` at the end
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Remove the `\n` at the end

3. **Redeploy the Application**
   - After updating all variables, trigger a new deployment
   - You can do this by pushing the latest commit: `git push origin main`

4. **Test the API**
   - Run the test script: `node scripts/test-api-endpoint.js production`
   - Or test manually at: https://just-speak-2155muecy-shojuros-projects.vercel.app

## Verification

After redeployment, the chat API should work correctly. The test script will show:
- Health endpoint: 200 OK
- Config status: Shows API keys are configured
- Chat endpoint: 200 OK with AI response

If you still see errors, check the Vercel function logs for more details.