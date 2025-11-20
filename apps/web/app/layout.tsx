import PlasmicRoot from "./plasmic-root";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PlasmicRoot>
          {children}
        </PlasmicRoot>
      </body>
    </html>
  );
}
