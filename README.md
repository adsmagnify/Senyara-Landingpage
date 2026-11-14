# Senyara Learning

One Next.js app for the Free Online Clarity Session. The page and the booking API live together, so Vercel imports a single project.

After a booking is saved, the site opens `/thank-you/SY-XXXX`. Every new lead is added to the OneDrive workbook `SenyaraLearningLeads.xlsx`, on the Leads sheet. The Status and Notes columns are for you to fill in. The booking reference is also kept in `data/bookings.json`, and a notice is sent from `learn@senyaralearning.com` through Microsoft 365.

Copy `.env.example` to `.env.local` and set `SMTP_PASS` to that mailbox’s password. In the Microsoft 365 admin center, open the user, then Mail, then Manage email apps, and turn on Authenticated SMTP. Security defaults block this sign-in, so they need to be off for the mailbox to send.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Production

```bash
npm run build
npm start
```
