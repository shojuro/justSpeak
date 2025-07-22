# GitHub Secrets Setup Guide

This guide will help you set up the required GitHub secrets for CI/CD pipelines.

## Required Secrets

### 1. TEST_SUPABASE_URL
**Purpose**: Supabase URL for running tests in CI/CD
**How to get it**: 
- Go to your Supabase project dashboard
- Navigate to Settings > API
- Copy the "Project URL"

### 2. TEST_SUPABASE_ANON_KEY
**Purpose**: Supabase anonymous key for tests
**How to get it**: 
- Go to your Supabase project dashboard
- Navigate to Settings > API
- Copy the "anon public" key

### 3. SNYK_TOKEN (Optional but Recommended)
**Purpose**: Enables Snyk security scanning for vulnerabilities
**How to get it**: 
1. Sign up for a free Snyk account at https://snyk.io
2. Go to Account Settings
3. Generate an API token
4. Copy the token

## How to Add Secrets to GitHub

1. **Navigate to your repository on GitHub**
   ```
   https://github.com/JM505/JustSpeak
   ```

2. **Go to Settings**
   - Click on "Settings" tab in your repository

3. **Navigate to Secrets**
   - In the left sidebar, click on "Secrets and variables"
   - Click on "Actions"

4. **Add each secret**
   - Click "New repository secret"
   - Add each secret one by one:

   **TEST_SUPABASE_URL**
   - Name: `TEST_SUPABASE_URL`
   - Value: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)

   **TEST_SUPABASE_ANON_KEY**
   - Name: `TEST_SUPABASE_ANON_KEY`
   - Value: Your Supabase anon key

   **SNYK_TOKEN** (Optional)
   - Name: `SNYK_TOKEN`
   - Value: Your Snyk API token

## Verifying Secrets

After adding the secrets, you can verify they're working by:

1. Making a commit to trigger the CI pipeline
2. Checking the Actions tab in your GitHub repository
3. Looking for green checkmarks on the workflow runs

## Security Notes

- Never commit these values to your repository
- GitHub secrets are encrypted and only exposed to workflows
- Use separate test credentials from production
- Rotate secrets periodically for better security

## Troubleshooting

### If CI fails with authentication errors:
1. Double-check the secret names match exactly (case-sensitive)
2. Ensure there are no extra spaces in the values
3. Verify the Supabase credentials are correct

### If Snyk scanning fails:
1. Ensure your Snyk token is valid
2. Check if your Snyk account has access to scan the repository
3. The workflow will continue even if Snyk fails (continue-on-error is set)

---

*Last updated: 2025-07-22*