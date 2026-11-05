# Senyara Learning

One Next.js app for the Free Online Clarity Session. The page and the booking API live together, so Vercel imports a single project.

After a booking is saved, the site opens `/thank-you/SY-XXXX`. Bookings are written to `data/bookings.json`.

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
