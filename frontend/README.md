# CustomBid Frontend

Modern, responsive frontend application for the CustomBid platform built with React, TypeScript, and Tailwind CSS.

## Features

- ✨ Modern UI with Tailwind CSS
- 🔐 Complete authentication system
- 📱 Fully responsive design
- 🎨 Beautiful animations and transitions
- 🚀 Fast and optimized with Vite
- 💪 Type-safe with TypeScript
- 🔄 Auto token refresh
- 🎯 Role-based routing

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── common/          # Reusable components
│   ├── pages/
│   │   ├── public/          # Public pages
│   │   ├── customer/        # Customer pages
│   │   └── supplier/        # Supplier pages
│   ├── context/             # React contexts
│   ├── services/            # API services
│   ├── types/               # TypeScript types
│   ├── utils/               # Utility functions
│   ├── config/              # Configuration files
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.ts
```

## Tech Stack

### Core
- **React 18.2** - UI library
- **TypeScript 5.3** - Type safety
- **Vite 5.1** - Build tool & dev server

### Styling
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

### Routing & State
- **React Router DOM 6.22** - Client-side routing
- **React Context** - State management

### HTTP & API
- **Axios 1.6** - HTTP client with interceptors

### Development
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript linting rules

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

Create production build:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Available Routes

### Public Routes
- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/about` - About page
- `/contact` - Contact page

### Customer Routes (Protected)
- `/dashboard/customer` - Customer dashboard
- `/customer/requests` - My requests
- `/customer/request-new` - Create new request
- `/customer/bids` - View bids
- `/customer/orders` - My orders
- `/customer/profile` - Profile settings

### Supplier Routes (Protected)
- `/dashboard/supplier` - Supplier dashboard
- `/supplier/requests` - Available requests
- `/supplier/bids` - My bids
- `/supplier/orders` - My orders
- `/supplier/profile` - Profile settings

## Features Implemented

### Authentication
- ✅ Login with JWT
- ✅ Registration (Customer/Supplier)
- ✅ Auto token refresh
- ✅ Protected routes
- ✅ Role-based access control

### UI Components
- ✅ Responsive Navbar
- ✅ Footer
- ✅ Loading spinner
- ✅ Protected route wrapper
- ✅ Custom buttons and inputs
- ✅ Badge components
- ✅ Card components

### Services
- ✅ Auth service
- ✅ Request service
- ✅ Bid service
- ✅ Order service
- ✅ Axios interceptors

### Styling
- ✅ Custom Tailwind configuration
- ✅ Color palette (Primary/Secondary)
- ✅ Custom utility classes
- ✅ Responsive design
- ✅ Smooth animations
- ✅ Custom scrollbar

## Design System

### Colors
- **Primary**: Blue (#0ea5e9)
- **Secondary**: Purple (#a855f7)
- **Success**: Green
- **Warning**: Yellow
- **Danger**: Red
- **Info**: Blue

### Button Variants
- `btn-primary` - Primary action button
- `btn-secondary` - Secondary action button
- `btn-outline` - Outline button
- Sizes: `btn-sm`, `btn-md`, `btn-lg`

### Badges
- `badge-success` - Green badge
- `badge-warning` - Yellow badge
- `badge-danger` - Red badge
- `badge-info` - Blue badge
- `badge-primary` - Primary color badge

## Contributing

1. Follow TypeScript best practices
2. Use functional components with hooks
3. Keep components small and focused
4. Write semantic HTML
5. Use Tailwind utility classes
6. Follow the existing code structure

## License

Copyright © 2024 CustomBid. All rights reserved.
