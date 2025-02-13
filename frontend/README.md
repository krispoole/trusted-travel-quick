# Location Notifier

A Next.js application for tracking locations and receiving notifications for available appointments.

## Prerequisites

- Node.js 14.x or later
- npm or yarn

## Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/location-notifier.git
   cd location-notifier
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

This project is configured for deployment to GitHub Pages.

### Manual Deployment

1. Build and export the static site:
   ```
   npm run build
   ```

2. Deploy to GitHub Pages:
   ```
   npm run deploy
   ```

### Automatic Deployment

The project is configured with GitHub Actions for automatic deployment:

1. Push changes to the main branch
2. GitHub Actions will automatically build and deploy to GitHub Pages
3. Visit your site at https://yourusername.github.io/location-notifier

## Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_BASE_PATH=/location-notifier
```

## File Structure

- \`app/\`: Contains the main application pages and layout
- \`components/\`: Reusable React components
- \`lib/\`: Utility functions and context providers
- \`public/\`: Static assets
- \`styles/\`: Global styles

## Features

- User authentication (placeholder)
- Location search and selection
- Notification settings
- In-app toast notifications

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [GitHub Pages](https://pages.github.com/)

