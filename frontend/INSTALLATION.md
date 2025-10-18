# CustomBid Frontend - Installation Guide

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.x or higher
- **npm** 9.x or higher (or yarn/pnpm)

### Installation Steps

1. **Navigate to the frontend directory**
```bash
cd frontend
```

2. **Install all dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
# The .env file is already created, but verify the API URL
cat .env
```

Expected content:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

4. **Start the development server**
```bash
npm run dev
```

The application will be available at: `http://localhost:3000`

## 📦 Dependencies to Install

### Production Dependencies (3 packages)
```bash
npm install react@^18.2.0 react-dom@^18.2.0 react-router-dom@^6.22.0 axios@^1.6.7
```

### Development Dependencies (13 packages)
```bash
npm install --save-dev \
  @types/react@^18.2.55 \
  @types/react-dom@^18.2.19 \
  @types/node@^20.11.16 \
  @typescript-eslint/eslint-plugin@^6.21.0 \
  @typescript-eslint/parser@^6.21.0 \
  @vitejs/plugin-react@^4.2.1 \
  autoprefixer@^10.4.17 \
  eslint@^8.56.0 \
  eslint-plugin-react-hooks@^4.6.0 \
  eslint-plugin-react-refresh@^0.4.5 \
  postcss@^8.4.35 \
  tailwindcss@^3.4.1 \
  typescript@^5.3.3 \
  vite@^5.1.0
```

## 🎯 Complete Dependency List

Here's the complete list of what will be installed:

### Core Framework
- ✅ **react** (18.2.0) - React library
- ✅ **react-dom** (18.2.0) - React DOM bindings

### Routing
- ✅ **react-router-dom** (6.22.0) - React Router

### HTTP Client
- ✅ **axios** (1.6.7) - HTTP client with interceptors

### Build & Dev Tools
- ✅ **vite** (5.1.0) - Build tool
- ✅ **@vitejs/plugin-react** (4.2.1) - Vite React plugin

### TypeScript
- ✅ **typescript** (5.3.3) - TypeScript compiler
- ✅ **@types/react** (18.2.55) - React types
- ✅ **@types/react-dom** (18.2.19) - React DOM types
- ✅ **@types/node** (20.11.16) - Node.js types

### Styling
- ✅ **tailwindcss** (3.4.1) - Tailwind CSS framework
- ✅ **postcss** (8.4.35) - CSS processor
- ✅ **autoprefixer** (10.4.17) - CSS autoprefixer

### Linting
- ✅ **eslint** (8.56.0) - JavaScript/TypeScript linter
- ✅ **@typescript-eslint/eslint-plugin** (6.21.0) - TypeScript ESLint plugin
- ✅ **@typescript-eslint/parser** (6.21.0) - TypeScript ESLint parser
- ✅ **eslint-plugin-react-hooks** (4.6.0) - React Hooks linter
- ✅ **eslint-plugin-react-refresh** (0.4.5) - React Refresh linter

## 📋 Available Scripts

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

## 🔧 Configuration Files

All configuration files are already created:

- ✅ `package.json` - Dependencies and scripts
- ✅ `vite.config.ts` - Vite configuration
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `tsconfig.node.json` - TypeScript Node configuration
- ✅ `tailwind.config.js` - Tailwind CSS configuration
- ✅ `postcss.config.js` - PostCSS configuration
- ✅ `.eslintrc.cjs` - ESLint configuration
- ✅ `.gitignore` - Git ignore rules
- ✅ `.env` - Environment variables

## 🎨 What's Included

### Pages (8 pages)
1. ✅ Home - Landing page
2. ✅ About - About page
3. ✅ Contact - Contact form
4. ✅ Login - Authentication
5. ✅ Register - User registration
6. ✅ Customer Dashboard - Customer overview
7. ⏳ Supplier Dashboard - (Placeholder created)
8. ⏳ Additional pages - (Ready for implementation)

### Components (4 components)
1. ✅ Navbar - Responsive navigation
2. ✅ Footer - Footer with links
3. ✅ LoadingSpinner - Loading indicator
4. ✅ ProtectedRoute - Route protection

### Services (4 services)
1. ✅ Auth Service - Authentication API
2. ✅ Request Service - Request management
3. ✅ Bid Service - Bid management
4. ✅ Order Service - Order management

### Utilities (3 utilities)
1. ✅ Axios - Configured HTTP client
2. ✅ Formatters - Date, currency, number formatters
3. ✅ Validators - Form validation helpers

### Context (1 context)
1. ✅ Auth Context - Global authentication state

## 🌈 Features Ready to Use

- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Dark mode ready (can be implemented easily)
- ✅ Form validation
- ✅ Error handling
- ✅ Loading states
- ✅ Protected routes
- ✅ Role-based access
- ✅ Auto token refresh
- ✅ Beautiful UI with Tailwind CSS
- ✅ TypeScript type safety
- ✅ Modern React patterns

## 🐛 Troubleshooting

### Module Not Found Errors
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use
```bash
# The dev server uses port 3000 by default
# To use a different port, modify vite.config.ts
# Or kill the process using port 3000
```

### TypeScript Errors
```bash
# Clear TypeScript cache
rm -rf node_modules/.vite
npm run dev
```

### Tailwind Styles Not Working
```bash
# Ensure PostCSS and Tailwind are installed
npm install -D tailwindcss postcss autoprefixer

# Restart dev server
npm run dev
```

## 📝 Next Steps

After installation, you can:

1. **Start development server**: `npm run dev`
2. **Visit**: `http://localhost:3000`
3. **Test authentication**: Try login/register flows
4. **Explore pages**: Navigate through all pages
5. **Check responsiveness**: Test on different screen sizes

## 🔗 Useful Links

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Router Documentation](https://reactrouter.com)
- [Axios Documentation](https://axios-http.com/docs/intro)

## 💡 Tips

- Use `Ctrl+C` to stop the dev server
- Changes are auto-reloaded in the browser
- Check browser console for errors
- Use React DevTools for debugging
- TypeScript errors show in the terminal and browser

## ✅ Verification

After installation, verify everything works:

1. ✅ Dev server starts without errors
2. ✅ Home page loads
3. ✅ Navigation works
4. ✅ No console errors
5. ✅ Tailwind styles applied
6. ✅ TypeScript compilation successful

## 🎉 You're Ready!

The CustomBid frontend is now fully set up and ready for development!

Start building amazing features! 🚀

