# Windows Setup Guide - Completing npm Installation

Due to WSL file system issues, please use Windows directly:

## Step 1: Open Windows Command Prompt or PowerShell

1. Press `Windows + R`
2. Type `cmd` or `powershell` and press Enter
3. Or search for "Command Prompt" in Start Menu

## Step 2: Navigate to Project Directory

```cmd
cd "C:\Users\JM505 Computers\Desktop\JustSpeak"
```

## Step 3: Clean Install Dependencies

```cmd
# Remove old files (if they exist)
rmdir /s /q node_modules
del package-lock.json

# Install fresh dependencies
npm install
```

## Step 4: Verify Installation

```cmd
# Check if TypeScript is installed
npm run typecheck

# This will show TypeScript errors - that's expected!
```

## Alternative: Use Node.js Command Prompt

1. Search for "Node.js command prompt" in Start Menu
2. This ensures npm is in PATH
3. Navigate to project and run npm install

## If npm install still fails:

Try with legacy peer deps:
```cmd
npm install --legacy-peer-deps
```

Or try with npm cache clean:
```cmd
npm cache clean --force
npm install
```

## Expected Output

When successful, you should see:
- "added XXX packages"
- No critical errors
- A new `node_modules` folder
- A new `package-lock.json` file

## Next Steps After Installation

1. Run `npm run typecheck` to see TypeScript errors
2. Fix errors using the TYPESCRIPT_FIXES_NEEDED.md guide
3. Run `npm test` to verify tests
4. Push to GitHub

---

*Note: Using Windows directly avoids WSL file system permission issues*