<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Auth System - Copilot Instructions

This is a full-stack authentication system built with Node.js, Express, TypeScript, React, and MongoDB.

## Project Structure
- `/backend` - Node.js Express TypeScript API server
- `/frontend` - React TypeScript frontend with Vite

## Backend Guidelines
- Use TypeScript for all backend code
- Follow RESTful API conventions
- Use Mongoose for MongoDB interactions
- Implement proper error handling with custom error classes
- Use JWT for authentication with access and refresh tokens
- Validate all inputs using express-validator
- Include proper logging using the custom logger utility
- Follow the established folder structure (controllers, routes, middleware, models, etc.)

## Frontend Guidelines
- Use TypeScript for all React components
- Use React Hook Form with Yup for form validation
- Implement proper error handling and loading states
- Use Tailwind CSS for styling with the established design system
- Follow the component structure (pages, ui components, etc.)
- Use the established API service layer for HTTP requests
- Implement proper TypeScript types for all props and data

## Security Best Practices
- Never expose sensitive environment variables
- Use proper input validation and sanitization
- Implement rate limiting for API endpoints
- Use secure password hashing with bcrypt
- Implement proper CORS configuration
- Use security headers with Helmet.js

## Code Style
- Use meaningful variable and function names
- Write clear, self-documenting code
- Include proper TypeScript types
- Follow established patterns in the codebase
- Use async/await instead of promises where possible
- Include proper error handling for all async operations

## Authentication Flow
- Registration creates user with hashed password
- Login returns access token (15min) and refresh token (7 days)
- Access tokens are used for API authentication
- Refresh tokens are used to generate new access tokens
- Password reset uses secure tokens sent via email
- Social OAuth integration ready for Google and GitHub

When suggesting code changes, ensure they align with these patterns and maintain consistency with the existing codebase.
