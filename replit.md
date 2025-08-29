# Overview

This is a full-stack employee management application called "GeoTracker" built with React, TypeScript, Express.js, and Drizzle ORM. The application provides time tracking, expense management, and location-based attendance features for teams. It includes role-based access control with employee and admin roles, allowing employees to clock in/out, submit expenses, and track their work hours while giving administrators oversight capabilities to manage team attendance and approve expense reports.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for build tooling
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack React Query for server state management
- **Authentication**: Context-based auth provider with protected routes

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with local strategy using email/password
- **Session Management**: Express sessions with in-memory store (MemoryStore)
- **Password Security**: Node.js crypto module with scrypt hashing and salt
- **File Uploads**: Multer for handling expense receipt uploads
- **API Design**: RESTful endpoints with role-based middleware protection

## Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon Database serverless connection
- **Schema**: Four main entities - users, attendance records, expenses, and location tracking
- **Migrations**: Drizzle Kit for database schema management
- **Development Storage**: In-memory storage implementation for development/testing

## Key Features
- **Attendance Management**: GPS-based clock in/out with location tracking
- **Expense Management**: Receipt upload, categorization, and approval workflow
- **Admin Dashboard**: Team oversight, expense approval, and analytics
- **Role-Based Access**: Employee and admin roles with appropriate permissions
- **Real-time Updates**: Live clock display and location-based attendance verification

## External Dependencies

- **Database**: PostgreSQL via @neondatabase/serverless for production database hosting
- **File Storage**: Local filesystem storage for uploaded expense receipts
- **Geolocation**: Browser-based Geolocation API for attendance tracking
- **Charts**: Recharts library for dashboard visualizations
- **Email Strategy**: Currently using local authentication strategy (email/password)
- **Session Storage**: Connect-pg-simple for PostgreSQL session storage in production