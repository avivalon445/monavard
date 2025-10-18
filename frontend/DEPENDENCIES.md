# CustomBid Frontend - Dependencies List

This document lists all the dependencies used in the CustomBid frontend application.

## Installation Command

To install all dependencies, run:

```bash
npm install
```

## Production Dependencies

These packages are required for the application to run:

### Core Framework
- **react** (^18.2.0) - A JavaScript library for building user interfaces
- **react-dom** (^18.2.0) - React package for working with the DOM

### Routing
- **react-router-dom** (^6.22.0) - Declarative routing for React applications

### HTTP Client
- **axios** (^1.6.7) - Promise based HTTP client for the browser and node.js

---

## Development Dependencies

These packages are used during development and building:

### TypeScript
- **typescript** (^5.3.3) - TypeScript language
- **@types/react** (^18.2.55) - Type definitions for React
- **@types/react-dom** (^18.2.19) - Type definitions for React DOM
- **@types/node** (^20.11.16) - Type definitions for Node.js

### Build Tool
- **vite** (^5.1.0) - Next generation frontend tooling
- **@vitejs/plugin-react** (^4.2.1) - Official Vite plugin for React

### Styling
- **tailwindcss** (^3.4.1) - A utility-first CSS framework
- **postcss** (^8.4.35) - A tool for transforming CSS with JavaScript
- **autoprefixer** (^10.4.17) - PostCSS plugin to parse CSS and add vendor prefixes

### Linting
- **eslint** (^8.56.0) - JavaScript linter
- **@typescript-eslint/eslint-plugin** (^6.21.0) - ESLint plugin for TypeScript
- **@typescript-eslint/parser** (^6.21.0) - ESLint parser for TypeScript
- **eslint-plugin-react-hooks** (^4.6.0) - ESLint rules for React Hooks
- **eslint-plugin-react-refresh** (^0.4.5) - ESLint plugin for React Refresh

---

## Quick Reference

### Total Dependencies
- Production: 3 packages
- Development: 13 packages
- **Total: 16 packages**

### Key Features Enabled By Dependencies

1. **React 18** - Modern React features including concurrent rendering
2. **TypeScript** - Type safety and better developer experience
3. **Vite** - Lightning-fast dev server and optimized production builds
4. **Tailwind CSS** - Rapid UI development with utility classes
5. **React Router v6** - Modern routing with data loading
6. **Axios** - Advanced HTTP features like interceptors and automatic retries

### Browser Support

The application supports:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Node.js Version Required

- **Node.js 18.x or higher**
- **npm 9.x or higher** (or yarn/pnpm equivalent)

---

## Installation Notes

### First Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Start development server
npm run dev
```

### Common Issues

**Issue: Module not found errors**
- Solution: Delete `node_modules` and `package-lock.json`, then run `npm install` again

**Issue: TypeScript errors**
- Solution: Ensure all `@types/*` packages are installed correctly

**Issue: Tailwind styles not working**
- Solution: Verify `tailwind.config.js` and `postcss.config.js` are in the root directory

---

## Updating Dependencies

To check for outdated packages:
```bash
npm outdated
```

To update all packages to their latest versions:
```bash
npm update
```

To update a specific package:
```bash
npm install <package-name>@latest
```

---

## Security

To check for security vulnerabilities:
```bash
npm audit
```

To automatically fix vulnerabilities:
```bash
npm audit fix
```

---

## License Information

All dependencies are open-source with permissive licenses (MIT, Apache 2.0, etc.).
Please check individual package licenses for specific details.

