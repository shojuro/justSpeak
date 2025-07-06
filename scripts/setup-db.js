// Database setup script
console.log(`
Database Setup Instructions
===========================

1. Install PostgreSQL if not already installed:
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Mac: brew install postgresql
   - Linux: sudo apt-get install postgresql

2. Create a database for TalkTime:
   
   Open PostgreSQL command line:
   psql -U postgres
   
   Then run:
   CREATE DATABASE talktime;
   
3. Update your .env file with the correct DATABASE_URL:
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/talktime"
   
4. Run Prisma migrations:
   npx prisma migrate dev --name init
   
5. Generate Prisma Client:
   npx prisma generate
   
6. (Optional) View your database:
   npx prisma studio

Note: For production, use a managed database service like:
- Neon (https://neon.tech)
- Supabase (https://supabase.com)
- PlanetScale (https://planetscale.com)
- Railway (https://railway.app)
`)