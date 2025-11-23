import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// @ts-ignore - allow importing image asset
import favicon from './src/assets/Logo.png';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Dynamically set favicon using imported asset so it resolves in production
const setFavicon = (href: string) => {
  if (!href) return;
  let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.getElementsByTagName('head')[0].appendChild(link);
  }
  link.href = href;
};

setFavicon(favicon as unknown as string);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);