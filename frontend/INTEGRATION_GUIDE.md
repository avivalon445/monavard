# Frontend-Backend Integration Guide

## ✅ Integration Complete!

The CustomBid frontend is now fully integrated with the backend authentication API. Mock authentication has been disabled and all auth flows use real API calls.

---

## 🔧 Setup Instructions

### 1. Create Environment File

Create a `.env` file in the `frontend` directory:

```bash
# Frontend .env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_APP_NAME=CustomBid
VITE_APP_ENV=development
```

### 2. Ensure Backend is Running

Make sure your backend server is running on `http://localhost:5000`:

```bash
cd backend
npm run dev
```

You should see:
```
✓ Database connection established successfully
✓ Email service is ready
✓ Server running in development mode on port 5000
✓ API available at http://localhost:5000/api/v1
```

### 3. Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:3000` and connect to the backend API.

---

## 🔐 Authentication Flow

### How It Works

1. **User visits the app**
   - Frontend checks for existing JWT token in `localStorage`
   - If token exists, fetches user data from `/api/v1/auth/me`
   - User is automatically logged in if token is valid

2. **User logs in**
   ```
   Frontend → POST /api/v1/auth/login
   Backend → Returns { success, data: { user, accessToken, refreshToken } }
   Frontend → Stores tokens in localStorage
   Frontend → Navigates to appropriate dashboard
   ```

3. **Token Management**
   - Access token stored as `token` in localStorage
   - Refresh token stored as `refreshToken` in localStorage
   - Axios automatically adds `Authorization: Bearer <token>` header to all requests

4. **Token Refresh (Automatic)**
   - When API returns 401 Unauthorized
   - Axios interceptor automatically calls `/api/v1/auth/refresh-token`
   - Gets new tokens and retries the original request
   - If refresh fails, redirects to login page

5. **User logs out**
   ```
   Frontend → POST /api/v1/auth/logout (with token)
   Backend → Revokes refresh token
   Frontend → Clears localStorage
   Frontend → Redirects to login page
   ```

---

## 📁 Updated Files

### Core Integration Files

#### ✅ `frontend/src/config/api.ts`
- **Change:** Updated `API_BASE_URL` to include `/v1` version
- **Change:** Added `CHANGE_PASSWORD` endpoint
- **Change:** Renamed `REFRESH` to `REFRESH_TOKEN`

#### ✅ `frontend/src/config/dev.ts`
- **Change:** Set `MOCK_AUTH = false` (disabled mock authentication)
- **Note:** Can still be enabled for testing by setting to `true`

#### ✅ `frontend/src/services/authService.ts`
- **Major Rewrite:** Updated all methods to match backend response format
- **Backend Format:** `{ success, message, data: { ... } }`
- **Features:**
  - Proper token storage (accessToken + refreshToken)
  - Enhanced error handling
  - JSDoc comments for all methods
  - Added `changePassword()` method
  - Added `getRefreshToken()` method

#### ✅ `frontend/src/utils/axios.ts`
- **Updated:** Response interceptor to match backend refresh token endpoint
- **Backend Format:** `/auth/refresh-token` with proper response handling
- **Features:**
  - Automatic token refresh on 401 errors
  - Better error message extraction
  - Prevents redirect loop on login page

#### ✅ `frontend/src/context/AuthContext.tsx`
- **Updated:** Login, register, and logout with proper error handling
- **Features:**
  - Console logging for debugging (can be removed in production)
  - Try-catch blocks for all auth operations
  - Graceful error handling

---

## 🧪 Testing the Integration

### Test 1: Registration

```bash
# Register a new customer
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"SecurePass123",
    "first_name":"Test",
    "last_name":"User",
    "user_type":"customer"
  }'
```

**Expected Result:** 
- User registered successfully
- Email verification sent
- Can see user in database

### Test 2: Login via UI

1. Open http://localhost:3000/login
2. Enter credentials
3. Click "Login"
4. Should redirect to `/dashboard/customer` or `/dashboard/supplier`
5. Check browser console for logs:
   ```
   🔐 Attempting login...
   ✅ Login successful: test@example.com
   ```

### Test 3: Token Persistence

1. Login successfully
2. Refresh the page
3. Should still be logged in
4. Check console:
   ```
   🔐 Token found, fetching user data...
   ✅ User authenticated: test@example.com
   ```

### Test 4: Logout

1. Click logout button
2. Should redirect to `/login`
3. Check console:
   ```
   👋 Logging out...
   ✅ Logout successful
   ```

### Test 5: Token Expiration & Refresh

1. Login successfully
2. Wait for token to expire (or manually delete `token` from localStorage)
3. Make an API call (navigate to a protected page)
4. Should automatically refresh token and continue
5. Check Network tab in DevTools for `/auth/refresh-token` call

---

## 🔍 Debugging

### Common Issues & Solutions

#### Issue 1: "Network Error" or "CORS Error"

**Symptoms:**
```
Network Error
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
```bash
# 1. Check backend is running
curl http://localhost:5000/api/v1/health

# 2. Check CORS configuration in backend/.env
FRONTEND_URL=http://localhost:3000

# 3. Restart backend after .env changes
cd backend
npm run dev
```

#### Issue 2: "401 Unauthorized" on all requests

**Symptoms:**
```
❌ Failed to fetch user: Unauthorized
```

**Solution:**
```bash
# 1. Clear browser localStorage
# Open DevTools → Application → Local Storage → Clear All

# 2. Try logging in again
# If still fails, check backend logs for errors

# 3. Verify JWT secrets are set in backend/.env
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
```

#### Issue 3: Login successful but user not authenticated

**Symptoms:**
- Login appears to work
- Immediately logged out or redirected back to login

**Solution:**
```javascript
// Check browser console for errors
// Common causes:
// 1. Backend not returning correct response format
// 2. Token not being stored properly
// 3. getCurrentUser() failing

// Debug in browser console:
localStorage.getItem('token')  // Should have a token
localStorage.getItem('refreshToken')  // Should have a refresh token
```

#### Issue 4: "Token expired" error

**Symptoms:**
```
TokenExpiredError: jwt expired
```

**Solution:**
- This is normal behavior
- Refresh token should automatically handle this
- If refresh token also expired, user needs to login again
- Check token expiration times in backend/.env:
  ```
  JWT_EXPIRE=1h          # Access token (short lived)
  JWT_REFRESH_EXPIRE=7d  # Refresh token (longer lived)
  ```

---

## 🎯 Backend Response Format Reference

All backend endpoints follow this format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  },
  "timestamp": "2025-10-13T10:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "statusCode": 400,
  "timestamp": "2025-10-13T10:00:00.000Z"
}
```

### Login Response
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "user_type": "customer",
      ...
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 🔐 Security Features

### Implemented

✅ **JWT Authentication**
- Secure token-based authentication
- Access token (short-lived: 1 hour)
- Refresh token (longer-lived: 7 days)

✅ **Automatic Token Refresh**
- Transparent to the user
- Retries failed requests after refresh
- Falls back to login if refresh fails

✅ **Secure Token Storage**
- Tokens stored in localStorage
- Automatically included in API requests
- Cleared on logout

✅ **Protected Routes**
- Authentication check before rendering
- Redirects to login if not authenticated
- Role-based access control

### Best Practices Applied

1. **Never send passwords in GET requests**
2. **Always use HTTPS in production**
3. **Tokens automatically expire**
4. **Refresh tokens can be revoked**
5. **Password hashing on backend (bcrypt)**
6. **Rate limiting on auth endpoints**
7. **CORS protection**

---

## 🚀 Next Steps

### Implement More Features

Now that authentication is working, you can implement:

1. **Request Management**
   - Create, read, update, delete requests
   - File uploads for requests
   - Request categorization

2. **Bid Management**
   - Submit bids (suppliers)
   - View and accept bids (customers)
   - Anonymous bidding system

3. **Order Management**
   - Order creation from accepted bids
   - Order tracking
   - Status updates

4. **Dashboard**
   - Customer dashboard with metrics
   - Supplier dashboard with analytics
   - Real-time data

### Follow the Pattern

For each new feature, follow the same pattern:

1. **Create Service**
   ```typescript
   // src/services/request.service.ts
   export const requestService = {
     async getAll() {
       const response = await axiosInstance.get('/requests');
       return response.data.data;
     }
   }
   ```

2. **Create Component**
   ```typescript
   // Use the service in your components
   import { requestService } from '@/services/request.service';
   
   const requests = await requestService.getAll();
   ```

3. **Handle Errors**
   ```typescript
   try {
     const data = await requestService.getAll();
   } catch (error: any) {
     console.error('Error:', error.message);
   }
   ```

---

## 📊 Integration Status

| Feature | Status | Notes |
|---------|--------|-------|
| Login | ✅ Complete | Fully integrated with backend |
| Register | ✅ Complete | Includes email verification |
| Logout | ✅ Complete | Revokes tokens on backend |
| Token Refresh | ✅ Complete | Automatic refresh on 401 |
| Get Current User | ✅ Complete | Fetches user data |
| Verify Email | ✅ Complete | Token-based verification |
| Forgot Password | ✅ Complete | Email reset link |
| Reset Password | ✅ Complete | Token-based reset |
| Change Password | ✅ Complete | Authenticated endpoint |
| Protected Routes | ✅ Complete | Role-based access |

---

## 🎉 Success!

Your frontend is now successfully integrated with the backend authentication system!

**What you can do now:**
- ✅ Register new users
- ✅ Login/logout
- ✅ Automatic token management
- ✅ Protected routes
- ✅ Role-based access (customer/supplier)
- ✅ Password reset flow
- ✅ Email verification

**Ready for production?**
- Set `NODE_ENV=production` in backend
- Use HTTPS
- Update CORS settings
- Use strong JWT secrets
- Enable rate limiting
- Set up proper logging

---

*Integration completed on: October 2025*  
*Frontend Version: React + TypeScript + Vite*  
*Backend Version: Node.js + Express + MySQL*  
*Status: ✅ Fully Operational*

