import './globals.css'

export const metadata = {
  title: 'Tikoz - Order Momos Online',
  description: 'From Freezer to Flavours in Minutes',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#C62828" />
      </head>
      <body>{children}</body>
    </html>
  )
}
