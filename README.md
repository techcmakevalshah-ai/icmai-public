# ICMAI Public Student Registration Finder

Next.js + Supabase application for students to find registration numbers by name, registered mobile number, or registration number.

## Privacy and security
- The public UI returns only student name, course and registration number.
- Raw student tables are protected by Supabase Row Level Security.
- Public lookup runs only through a restricted database RPC.
- Admin write access requires Supabase Auth and an allow-listed admin email.
- No service-role/secret key is needed on Vercel.

## Environment variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- ADMIN_EMAILS

## Admin
Open /admin for manual student entry or Excel upload. The blank upload template can be downloaded from the admin page.
