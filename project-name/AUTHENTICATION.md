# NestJS Authentication System - Production Ready

## 📋 Overview
This is a complete, production-ready authentication system built with NestJS, MongoDB (Mongoose), JWT, and Bcrypt. It includes user registration, login, JWT token generation, and protected routes.

## 🏗️ Architecture

### Directory Structure
```
src/
├── auth/
│   ├── auth.controller.ts       # API endpoints (signup, login)
│   ├── auth.service.ts          # Business logic
│   ├── auth.module.ts           # Module configuration
│   ├── decorators/
│   │   └── current-user.decorator.ts  # @CurrentUser decorator
│   ├── guards/
│   │   └── jwt-auth.guard.ts    # JWT authentication guard
│   └── strategies/
│       └── jwt.strategy.ts      # Passport JWT strategy
├── user/
│   ├── user.controller.ts       # User routes (protected)
│   ├── user.service.ts          # User business logic
│   ├── user.module.ts           # User module
├── schema/
│   └── userSchema.ts            # Mongoose User schema
├── dto/
│   └── allDTO.ts                # DTOs with validation
└── types/
    └── user.types.ts            # TypeScript types
```

## 🔐 Security Features

1. **Password Hashing**: Bcrypt with salt rounds of 10
2. **JWT Authentication**: 7-day token expiry
3. **Email Validation**: Format validation and lowercase storage
4. **Unique Email**: Database-level unique constraint
5. **Protected Routes**: JWT guard on sensitive endpoints
6. **Error Handling**: Proper HTTP exceptions and security messages
7. **Password Never Returned**: All responses exclude password field

## 📚 API Endpoints

### 1. POST /auth/signup
Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "User"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
```json
// Email already exists
{
  "success": false,
  "message": "Email already registered"
}

// Validation error
{
  "success": false,
  "message": "Name must be at least 3 characters long"
}
```

### 2. POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "User"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### 3. GET /user/profile (Protected)
Get authenticated user's profile.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "User"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Unauthorized - Invalid or missing JWT token"
}
```

## ✅ DTO Validations

### CreateSignupDto
- **name**: String, required, min 3 characters
- **email**: Valid email format, required, unique
- **password**: String, required, min 6 characters

### CreateLoginDto
- **email**: Valid email format, required
- **password**: String, required, min 6 characters

## 🗄️ User Schema

```typescript
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, minlength: 3 })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  })
  email: string;

  @Prop({ required: true, minlength: 6 })
  password: string;

  @Prop({ default: UserRole.User })
  role: UserRole;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}
```

## 🚀 Getting Started

### 1. Setup Environment Variables
```bash
# Create .env file
cp .env.example .env

# Edit .env with your values
mongoURL=mongodb://localhost:27017/nestjs-auth
JWT_SECRET=your-super-secret-key-min-32-chars
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Application
```bash
# Development
npm run start:dev

# Production
npm run build && npm run start:prod
```

### 4. Test the APIs

#### Signup
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

#### Get Profile (Protected)
```bash
curl -X GET http://localhost:3000/user/profile \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

## 🔑 Using the JWT Token

The JWT token is returned in the login/signup response. Use it in the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

### Token Payload
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "john@example.com"
}
```

### Token Expiry
Tokens expire in 7 days. Users must login again to get a new token.

## 🛡️ Protecting Routes

To protect a route, use the `@UseGuards(JwtAuthGuard)` decorator:

```typescript
import { UseGuards, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Get('protected-route')
@UseGuards(JwtAuthGuard)
async protectedRoute(@CurrentUser() user: any) {
  // user contains: { userId, email, role }
  return { message: 'This is protected', user };
}
```

## 🧩 Creating Custom Guards

You can create role-based guards:

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from 'src/types/user.types';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private requiredRole: UserRole) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user.role !== this.requiredRole) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}

// Usage:
@UseGuards(JwtAuthGuard, new RoleGuard(UserRole.Admin))
@Get('admin-only')
async adminRoute() {
  return { message: 'Admin only route' };
}
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

## ⚠️ Important Security Notes

1. **Change JWT_SECRET in Production**: Use a strong, random secret key (min 32 characters)
2. **Use HTTPS**: Always use HTTPS in production
3. **CORS Configuration**: Configure CORS properly in main.ts if needed
4. **Rate Limiting**: Consider adding rate limiting to prevent brute force attacks
5. **Input Validation**: DTOs with class-validator ensure all inputs are validated
6. **Error Messages**: Never reveal if email exists during login to prevent user enumeration

## 🔧 Advanced Features

### Refresh Token Flow (Optional Enhancement)
For better security, implement refresh tokens:
- Access token: Short expiry (15 minutes)
- Refresh token: Long expiry (7 days)
- Users refresh access tokens using refresh token

### 2FA (Two-Factor Authentication)
Add TOTP or SMS-based 2FA for additional security.

### OAuth Integration
Add Google, GitHub, or other OAuth providers.

## 📦 Dependencies Used

- `@nestjs/common` - Core NestJS package
- `@nestjs/jwt` - JWT token generation and verification
- `@nestjs/mongoose` - MongoDB integration
- `@nestjs/passport` - Passport authentication
- `passport-jwt` - JWT strategy for Passport
- `bcrypt` - Password hashing
- `class-validator` - DTO validation
- `mongoose` - MongoDB ODM

## 📝 License
UNLICENSED

## 🤝 Support
For issues or questions, check the NestJS documentation:
- [NestJS Docs](https://docs.nestjs.com)
- [JWT Module](https://docs.nestjs.com/security/authentication)
- [Passport Integration](https://docs.nestjs.com/recipes/passport)
