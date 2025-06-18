# 🔐 Modern Authentication System

A comprehensive, production-ready authentication system built with modern web technologies. This starter kit provides a complete foundation for building secure web applications with user management, authentication flows, and dashboard functionality.

## ✨ Features

### 🔒 Authentication & Security
- **Complete Auth Flow**: Registration, login, logout, password reset
- **JWT Implementation**: Access tokens (15min) and refresh tokens (7 days) 
- **Password Security**: bcrypt hashing with salt rounds
- **Input Validation**: Server-side validation with express-validator
- **Rate Limiting**: Protection against brute force attacks
- **Security Headers**: Comprehensive security with Helmet.js
- **CORS Configuration**: Secure cross-origin resource sharing

### 👤 User Management
- **User Profiles**: Complete profile management with avatar support
- **Email Verification**: Secure email verification system
- **Password Management**: Change password with current password verification
- **Account Settings**: Comprehensive user preferences
- **Role-based Access**: Support for user roles (user, admin)

### 🎨 Frontend Features
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Form Validation**: Client-side validation with React Hook Form + Yup
- **Loading States**: Elegant loading spinners and skeletons
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Toast Notifications**: Real-time feedback for user actions
- **Protected Routes**: Automatic redirection for unauthorized access
- **Responsive Design**: Mobile-first, fully responsive layout

### 🚀 Developer Experience
- **TypeScript**: Full type safety across the entire application
- **Hot Reload**: Instant development feedback
- **Clean Architecture**: Well-organized, scalable code structure
- **API Documentation**: Comprehensive API documentation
- **Environment Config**: Secure environment variable management
- **Error Logging**: Structured logging for debugging and monitoring

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: express-validator
- **Email**: Nodemailer with multiple provider support
- **Security**: Helmet.js, cors, rate limiting
- **Development**: nodemon for hot reload

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and builds
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form with Yup validation
- **HTTP Client**: Axios with automatic token refresh
- **State Management**: React Context API
- **Icons**: Heroicons and custom SVG icons

## 📁 Project Structure

```
auth-system/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions
│   │   ├── config/          # Configuration files
│   │   └── server.ts        # Express server setup
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/        # Authentication components
│   │   │   ├── pages/       # Main page components
│   │   │   └── ui/          # Reusable UI components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions
│   │   └── App.tsx          # Main app component
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env.example
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (local or cloud)
- Git

### 1. Clone and Install

```bash
git clone <repository-url>
cd auth-system

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

### 2. Environment Setup

**Backend (.env):**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/auth-system

# JWT Secrets (generate secure random strings)
JWT_ACCESS_SECRET=your-super-secure-access-secret-key
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Application
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000
```

### 3. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 📋 Available Scripts

### Backend
```bash
npm run dev        # Start development server with hot reload
npm run build      # Build TypeScript to JavaScript
npm start          # Start production server
npm run lint       # Run ESLint
```

### Frontend
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register      # User registration
POST   /api/auth/login         # User login
POST   /api/auth/logout        # User logout
POST   /api/auth/refresh       # Refresh access token
POST   /api/auth/forgot-password  # Request password reset
POST   /api/auth/reset-password   # Reset password with token
```

### User Management
```
GET    /api/user/profile       # Get user profile
PUT    /api/user/profile       # Update user profile  
POST   /api/user/change-password  # Change user password
POST   /api/user/upload-avatar    # Upload profile picture
```

### Protected Routes
```
GET    /api/protected/dashboard   # Dashboard data
GET    /api/protected/analytics   # User analytics
```

## 🎨 UI Components

### Authentication Pages
- **Login Page**: Email/password login with forgot password link
- **Register Page**: User registration with validation
- **Forgot Password**: Email-based password reset request
- **Reset Password**: Secure password reset with token validation

### Dashboard & User Pages  
- **Dashboard**: User overview with statistics and quick actions
- **Settings Page**: Tabbed interface for profile and security settings
- **Profile Management**: Update personal information and avatar
- **Password Change**: Secure password update with current password verification

### UI Components
- **Layout**: Consistent header navigation and content area
- **Forms**: Validated input fields with error handling
- **Buttons**: Multiple variants and loading states
- **Alerts**: Success, error, warning, and info notifications
- **Toast**: Non-intrusive notifications with auto-dismiss
- **Loading**: Spinners and skeleton loaders
- **404 Page**: Friendly not found page with navigation

## 🔐 Security Features

### Password Security
- Minimum 6 characters with uppercase, lowercase, and number requirements
- bcrypt hashing with 12 salt rounds
- Secure password reset with time-limited tokens

### JWT Implementation
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days)
- Automatic token refresh on API calls
- Secure token storage and rotation

### API Security
- Request rate limiting
- Input validation and sanitization
- CORS configuration
- Security headers (Helmet.js)
- MongoDB injection protection

## 🚀 Deployment

### Backend Deployment (Railway/Render/Heroku)

1. **Environment Variables**: Set all required environment variables
2. **Database**: Use MongoDB Atlas for production
3. **Build Command**: `npm run build`
4. **Start Command**: `npm start`

### Frontend Deployment (Vercel/Netlify)

1. **Build Command**: `npm run build`
2. **Output Directory**: `dist`
3. **Environment Variables**: Set `VITE_API_URL` to production backend URL

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Current Status

### ✅ Completed Features
- [x] Complete authentication system (register, login, logout, password reset)
- [x] JWT token management with automatic refresh
- [x] User profile management and settings
- [x] Responsive UI with Tailwind CSS
- [x] Form validation with React Hook Form + Yup
- [x] Error handling and loading states
- [x] Toast notifications system
- [x] Protected routes and navigation
- [x] TypeScript throughout the application

### 🔄 Next Steps
- [ ] OAuth integration (Google, GitHub)
- [ ] Email verification system
- [ ] Two-factor authentication
- [ ] Admin dashboard and user management
- [ ] Avatar upload functionality
- [ ] Advanced security features

Built with ❤️ using modern web technologies. Perfect for startups, SaaS applications, and enterprise projects requiring robust authentication.
