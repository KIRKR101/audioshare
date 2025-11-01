import Document, { Html, Head, Main, NextScript } from "next/document";

const parseCookies = (cookieHeader = "") => {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.match(/(.*?)=(.*)$/);
    if (parts) {
      const name = parts[1].trim();
      const value = decodeURIComponent(parts[2].trim());
      cookies[name] = value;
    }
  });
  return cookies;
};

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    let initialTheme = "light"; // Default theme

    // This code runs ON THE SERVER during SSR
    if (ctx.req) {
      let themeCookieValue;

      // Manual parsing
      const cookies = parseCookies(ctx.req.headers.cookie);
      themeCookieValue = cookies.theme;


      // Check the value read from the cookie
      if (themeCookieValue === "dark") {
        initialTheme = "dark";
      }
    }

    return {
      ...initialProps,
      initialTheme, // Pass theme ('light' or 'dark') to the render method
    };
  }

  render() {
    // Theme determined server-side is received here
    const { initialTheme } = this.props;

    return (
      // Apply the theme class directly to <html> on the server based on the cookie
      <Html lang="en" className={initialTheme === "dark" ? "dark" : ""}>
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
          <link
            href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function () {
                  // Use a variable to track the theme determined client-side
                  var clientTheme = 'light'; // Default assumption
                  try {
                    // 1. Check cookie first (using plain JS, not js-cookie library)
                    var savedTheme = document.cookie.match(/(?:^|; )theme=([^;]*)/)?.[1];
                    if (savedTheme) {
                      clientTheme = savedTheme; // Use cookie value if present
                    } else {
                      // 2. Fallback to system preference if no cookie
                      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        clientTheme = 'dark';
                      }
                    }

                    // 3. Apply the 'dark' class if needed based on client-side check
                    // This ensures consistency even if server rendering missed something,
                    // or if the cookie was set purely client-side after initial load.
                    if (clientTheme === 'dark') {
                      document.documentElement.classList.add('dark');
                    } else {
                      // Explicitly remove 'dark' if theme is light
                      document.documentElement.classList.remove('dark');
                    }

                  } catch (e) {
                    console.error('Inline theme script failed:', e);
                  }

                  // 4. Prevent transition flash during initial load/theme application
                  document.documentElement.classList.add('no-transition');
                  // Use rAF to remove the class after the browser has painted,
                  // re-enabling transitions for user interactions.
                  window.requestAnimationFrame(function() {
                     window.setTimeout(function() { // Add tiny delay for more robustness
                       document.documentElement.classList.remove('no-transition');
                     }, 1); // 1ms delay often enough
                  });
                })();
              `,
            }}
          />
        </Head>
        <body className="antialiased">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
