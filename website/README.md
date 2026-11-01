This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## VehicleMarket setup

The website uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `website/.env.local`. Never put a Supabase service-role key in browser configuration.

The vehicle submission API also requires `SUPABASE_SERVICE_ROLE_KEY` in the server-only environment. Do not prefix it with `NEXT_PUBLIC_` or expose it to client components.

The public marketplace reads approved listings from `public_vehicles`; the admin console uses the existing Supabase Auth session and `admin_users` membership. Legacy photos remain in the existing `vehicle-photos` bucket; new uploads use the private `vehicle-photos-private` bucket.

Before using the buyer inquiry form, review and run [`supabase/vehicle-inquiries.sql`](./supabase/vehicle-inquiries.sql) manually in the Supabase SQL editor. It creates a private, RLS-protected inquiry table and a narrowly scoped admin Storage delete policy for vehicle photos. This project has not run that SQL.

The workspace does not contain the database schema, view definition, RLS policies, or Storage policies. Verify those in Supabase before running the migration; in particular, confirm that `public_vehicles` exposes only public listing fields and that existing admin policies are limited to `admin_users` members.
