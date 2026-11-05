# Senyara Learning

Landing page for the Free Online Clarity Session. The React app is the site. A small Node API stores bookings and serves open times in Gulf Standard Time.

`Main.dc.html` is the original design mockup. The colours, type, and copy in the React page follow it.

## Run it

```bash
npm install
npm run dev
```

- Site: http://localhost:5173
- API: http://localhost:3001

Bookings are written to `server/data/bookings.json`. After a booking is saved, the site opens `/thank-you/SY-XXXX`.

## Production

```bash
npm start
```

Builds the React app and serves it, with the API, on port 3001.
