import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";

const inter = localFont({
  src: [
    { path: "../fonts/inter-latin-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/inter-latin-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/inter-latin-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/inter-latin-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

const playfair = localFont({
  src: [
    { path: "../fonts/playfair-display-latin-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/playfair-display-latin-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/playfair-display-latin-600-italic.woff2", weight: "600", style: "italic" },
    { path: "../fonts/playfair-display-latin-700-italic.woff2", weight: "700", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
});

export const metadata = {
  title: "Free Online Clarity Session | Senyara Learning",
  description:
    "Book a free online Clarity Session with Senyara Learning. A specialist looks at how your child learns, then you leave with a profile, study-habit strategies, and a home routine.",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        {children}
        <Script id="meta-pixel" strategy="beforeInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1124515266835520');fbq('track','PageView');`}
        </Script>
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","zei02rsw49");`}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src="https://www.facebook.com/tr?id=1124515266835520&ev=PageView&noscript=1"
          />
        </noscript>
      </body>
    </html>
  );
}
