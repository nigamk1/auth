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

### 📈 Trading Alert System
- **Real-time Market Data**: Integration with market data APIs
- **Trading Signals**: Algorithm-based trading signal generation
- **Strategy Management**: Customizable trading strategies
- **Alert Configuration**: Personalized alert settings via email, Telegram, and WhatsApp
- **Performance Metrics**: Track and analyze strategy performance
- **Dashboard**: Real-time visualization of market data and signals
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
POST   /api/auth/refresh-token # Refresh access token
POST   /api/auth/forgot-password  # Request password reset
POST   /api/auth/reset-password   # Reset password with token
GET    /api/auth/profile       # Get user profile

### User Management
```
PUT    /api/user/profile       # Update user profile
PUT    /api/user/change-password  # Change user password
DELETE /api/user/account       # Delete user account
GET    /api/user/stats         # Get user statistics

### Trading System
```
GET    /api/trading/signals    # Get trading signals with filtering
GET    /api/trading/signals/:id # Get specific signal details
GET    /api/trading/nifty      # Get Nifty index data
GET    /api/trading/options    # Get option chain data
GET    /api/trading/alerts/config # Get alert configuration
PUT    /api/trading/alerts/config # Update alert configuration
GET    /api/trading/strategies # Get available strategies
PUT    /api/trading/strategies/:name # Update strategy settings
GET    /api/trading/performance # Get performance metrics
GET    /api/trading/dashboard  # Get trading dashboard summary
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

### Quick Deployment to Vercel

This project is optimized for Vercel deployment. See our detailed [Deployment Guide](DEPLOYMENT.md) for complete instructions.

**Frontend (Vercel):**
```bash
cd frontend
vercel --prod
```

**Backend (Vercel Serverless):**
```bash
cd backend  
vercel --prod
```

### Alternative Deployment Options

**Backend:** Railway, Render, Heroku, or any Node.js hosting service
**Frontend:** Vercel, Netlify, or any static hosting service

### Environment Variables

Set the following environment variables in your deployment platform:

**Backend:**
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret  
- `JWT_REFRESH_SECRET` - Refresh token secret
- `EMAIL_*` - Email service configuration
- `ALLOWED_ORIGINS` - Frontend domain for CORS

**Frontend:**
- `VITE_API_URL` - Backend API URL

📖 **For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)**

## 🔧 Troubleshooting

### Email Configuration Issues

If you're experiencing email-related errors (like password reset emails not sending), it's likely due to Gmail authentication requirements.

#### Common Error: "Application-specific password required"

**Solution**: Set up Gmail App Password

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password for the application
3. Update your `.env` file with the App Password

**Quick Setup:**
```bash
# In backend/.env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-16-character-app-password
EMAIL_FROM=your-email@gmail.com
```

**Test Email Configuration:**
```bash
cd backend
npm run test:email
# Or test with a specific email
npm run test:email your-test-email@example.com
```

📖 **Detailed Instructions**: See [GMAIL_SETUP.md](GMAIL_SETUP.md) for complete setup guide.

### Other Common Issues

#### Database Connection
- Ensure MongoDB is running locally or check your MongoDB Atlas connection string
- Verify `MONGODB_URI` in your `.env` file

#### JWT Errors
- Make sure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set
- Use strong, unique secrets (32+ characters recommended)

#### CORS Issues
- Check `ALLOWED_ORIGINS` in your backend `.env`
- Ensure frontend URL is included in allowed origins

Need help? Check the logs for detailed error messages or create an issue on GitHub.

Built with ❤️ using modern web technologies. Perfect for startups, SaaS applications, and enterprise projects requiring robust authentication.

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
