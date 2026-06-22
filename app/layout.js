import "./globals.css";

export const metadata = {
  title: "Nexsite CRM",
  description: "CRM de prospecção da Nexsite",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
