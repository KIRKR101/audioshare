import "@/styles/globals.css";
import { ThemeProvider } from "../components/ThemeContext";
import Head from "next/head";

export default function App({ Component, pageProps }) {

  return (
    <ThemeProvider>
      <Head>
        <title>AudioShare</title>
        <meta
          name="description"
          content="Share large audio files easily"
        ></meta>
      </Head>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
