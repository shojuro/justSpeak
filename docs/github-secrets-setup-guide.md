# GitHub Secrets Setup Guide for JustSpeak

This guide will walk you through adding the required GitHub secrets for your JustSpeak repository. These secrets are essential for running automated tests and security scans in your CI/CD pipeline.

## Required Secrets

1. **TEST_SUPABASE_URL** - Your Supabase project URL
2. **TEST_SUPABASE_ANON_KEY** - Your Supabase anonymous/public key
3. **SNYK_TOKEN** (Optional) - For security vulnerability scanning

---

## Part 1: Getting Your Supabase Credentials

### Step 1: Log into Supabase
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Sign In" in the top right
3. Log in with your account (GitHub, email, etc.)

### Step 2: Access Your Project
1. Once logged in, you'll see your Supabase dashboard
2. Click on your project (or create one if you haven't already)
3. You should see your project dashboard

### Step 3: Find Your API Credentials
1. In the left sidebar, look for **"Settings"** (gear icon) near the bottom
2. Click on **"Settings"**
3. Under the Settings menu, click on **"API"**

### Step 4: Copy Your Credentials
You'll see a page with your API settings. Look for these two items:

1. **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - This will be your `TEST_SUPABASE_URL`
   - Click the copy button next to it

2. **anon public** key (a long string starting with `eyJ...`)
   - This will be your `TEST_SUPABASE_ANON_KEY`
   - Click the copy button next to it

**⚠️ Important:** 
- The `anon` key is safe to use in frontend code as it's meant to be public
- Never use the `service_role` key in GitHub secrets for testing - it has admin privileges

---

## Part 2: Adding Secrets to GitHub

### Step 1: Navigate to Your Repository
1. Go to GitHub.com
2. Navigate to your repository: `https://github.com/[your-username]/JustSpeak`

### Step 2: Access Repository Settings
1. Click on the **"Settings"** tab (it's in the repository navigation bar)
   - If you don't see Settings, you might not have admin access to the repository

### Step 3: Navigate to Secrets
1. In the left sidebar under "Security", find and click **"Secrets and variables"**
2. Click on **"Actions"** in the dropdown that appears

### Step 4: Add New Repository Secret
You'll see a page titled "Actions secrets and variables". 

1. Click the green **"New repository secret"** button

### Step 5: Add TEST_SUPABASE_URL
1. In the "Name" field, type exactly: `TEST_SUPABASE_URL`
   - ⚠️ Must be in ALL CAPS
   - ⚠️ No spaces, use underscores
   
2. In the "Secret" field, paste your Supabase URL (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   
3. Click **"Add secret"**

### Step 6: Add TEST_SUPABASE_ANON_KEY
1. Click **"New repository secret"** again
2. In the "Name" field, type exactly: `TEST_SUPABASE_ANON_KEY`
3. In the "Secret" field, paste your Supabase anon key
4. Click **"Add secret"**

### Step 7: (Optional) Add SNYK_TOKEN
If you want to enable security scanning with Snyk:

1. First, get your Snyk token:
   - Go to [https://app.snyk.io](https://app.snyk.io)
   - Sign up/Log in
   - Click on your account (bottom left)
   - Click "Account settings"
   - Find "Auth Token" and click to show/copy it

2. Back in GitHub:
   - Click **"New repository secret"**
   - Name: `SNYK_TOKEN`
   - Secret: paste your Snyk token
   - Click **"Add secret"**

---

## Part 3: Verifying Your Secrets

### Step 1: Check Secrets List
After adding all secrets, you should see them listed on the "Actions secrets and variables" page:

- ✅ TEST_SUPABASE_URL - Updated just now
- ✅ TEST_SUPABASE_ANON_KEY - Updated just now
- ✅ SNYK_TOKEN - Updated just now (if added)

**Note:** You cannot view the actual values after saving (they're encrypted)

### Step 2: Test with a Workflow Run
1. Go to the **"Actions"** tab in your repository
2. If you have workflows, manually trigger one or push a commit
3. Check the workflow logs to ensure secrets are being accessed properly

---

## Common Mistakes to Avoid

### ❌ DON'T:
1. **Include quotes** around secret values
   - Wrong: `"https://xxxxx.supabase.co"`
   - Right: `https://xxxxx.supabase.co`

2. **Add extra spaces** before or after values
   - GitHub doesn't trim whitespace automatically

3. **Use lowercase** for secret names
   - Wrong: `test_supabase_url`
   - Right: `TEST_SUPABASE_URL`

4. **Share service_role keys** 
   - Only use the `anon` key for testing

5. **Commit secrets** to your repository
   - Always use GitHub Secrets for sensitive data

### ✅ DO:
1. **Double-check spelling** of secret names
2. **Copy values directly** from Supabase to avoid typos
3. **Update secrets** if you regenerate Supabase keys
4. **Use separate projects** for testing vs. production

---

## Troubleshooting

### If workflows fail with "secret not found":
1. Check exact spelling and capitalization of secret names
2. Ensure secrets are saved at repository level (not organization level)
3. Verify you clicked "Add secret" after entering each one

### If authentication fails:
1. Make sure you copied the `anon` key, not `service_role`
2. Verify your Supabase project is active (not paused)
3. Check that URLs don't have trailing slashes

### If you can't see the Settings tab:
1. You need admin access to the repository
2. If it's your repo, you should have access
3. If it's a fork, secrets need to be added to your fork

---

## Security Best Practices

1. **Rotate keys periodically** - Update both Supabase and GitHub when you do
2. **Use different keys** for development, testing, and production
3. **Monitor usage** in Supabase dashboard for unusual activity
4. **Never commit** .env files with real credentials
5. **Limit permissions** - Use anon keys for testing, not service keys

---

## Next Steps

Once your secrets are set up:

1. Your GitHub Actions workflows can now access Supabase for testing
2. Security scans (if using Snyk) will run automatically on PRs
3. You can use these same secrets in multiple workflows

Remember to keep your secrets updated if you change your Supabase project or regenerate keys!