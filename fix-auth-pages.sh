#!/bin/bash

# Fix remaining auth pages
files=(
  "app/auth/forgot-password/page.tsx"
  "app/auth/verify-email/page.tsx"
  "app/auth/reset-password/page.tsx"
  "app/settings/page.tsx"
  "app/settings/api/page.tsx"
  "app/onboarding/page.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    # Add export const dynamic after 'use client'
    sed -i "/'use client'/a\\\\nexport const dynamic = 'force-dynamic'" "$file"
  fi
done

echo "✅ Auth pages fixed!"