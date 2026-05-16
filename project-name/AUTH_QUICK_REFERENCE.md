# Authentication System - Quick Reference

## 🚀 Quick Start

### 1. Setup
```bash
# Copy environment template
cp .env.example .env

# Update .env with your values
JWT_SECRET=your-strong-secret-key
mongoURL=mongodb://localhost:27017/nestjs-auth

# Install dependencies
npm install

# Run development server
npm run start:dev
```

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `src/auth/auth.controller.ts` | Signup/Login endpoints |
| `src/auth/auth.service.ts` | Authentication logic |
| `src/auth/auth.module.ts` | JWT configuration |
| `src/auth/guards/jwt-auth.guard.ts` | Route protection |
| `src/auth/decorators/current-user.decorator.ts` | Extract user from token |
| `src/auth/strategies/jwt.strategy.ts` | JWT validation |
| `src/schema/userSchema.ts` | User model |
| `src/user/user.service.ts` | User operations |
| `src/user/user.controller.ts` | Protected profile route |
| `src/dto/allDTO.ts` | Input validation |

## 📡 API Examples

### Signup
```bash
POST /auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### Protected Route (Get Profile)
```bash
GET /user/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🛡️ How to Protect Routes

```typescript
import { UseGuards, Get } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Get('protected-endpoint')
@UseGuards(JwtAuthGuard)
async protectedMethod(@CurrentUser() user: any) {
  // user has: { userId, email, role }
  console.log('User ID:', user.userId);
  return { data: 'Protected data' };
}
```

## 🔐 Response Format

### Success Response
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

### Error Response
```json
{
  "success": false,
  "message": "Error message here"
}
```

## ✅ Validation Rules

| Field | Rules |
|-------|-------|
| name | Required, min 3 chars |
| email | Required, valid format, unique, lowercase |
| password | Required, min 6 chars |
| role | Optional, defaults to "User" |

## 🔒 Security Checklist

- [x] Passwords hashed with bcrypt (10 salt rounds)
- [x] Email validation with regex
- [x] Unique email constraint
- [x] JWT token expiry (7 days)
- [x] Password never returned
- [x] Protected routes with JWT guard
- [ ] HTTPS enabled (configure in production)
- [ ] CORS configured (if needed)
- [ ] Rate limiting added (optional)
- [ ] Strong JWT_SECRET in production

## 🧪 Testing the API

### Using cURL
```bash
# Signup
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"Pass123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"Pass123"}'

# Protected route (replace TOKEN with actual JWT)
curl http://localhost:3000/user/profile \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman
1. Create collection "Auth System"
2. POST request to `http://localhost:3000/auth/signup`
3. POST request to `http://localhost:3000/auth/login`
4. GET request to `http://localhost:3000/user/profile`
   - Add header: `Authorization: Bearer <token>`

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "MongoDB connection error" | Check mongoURL in .env |
| "Invalid token" | Ensure token is valid and not expired |
| "Email already registered" | Use different email or login |
| "Password hashing timeout" | Increase timeout, reduce genSalt rounds |
| "CORS error" | Configure CORS in main.ts |

## 📝 Token Payload Example

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "iat": 1704067200,
  "exp": 1704672000
}
```

## 🚢 Production Deployment

1. **Environment Variables**
   ```env
   NODE_ENV=production
   JWT_SECRET=use-a-strong-random-key-min-32-chars
   mongoURL=mongodb+srv://user:pass@cluster.mongodb.net/dbname
   ```

2. **Security Headers**
   - Add helmet middleware
   - Configure CORS properly
   - Enable rate limiting
   - Use HTTPS only

3. **Database**
   - Enable MongoDB authentication
   - Create indexes
   - Set up backups

4. **Monitoring**
   - Add logging
   - Monitor authentication failures
   - Track token usage

## 📚 Additional Resources

- [NestJS Security Docs](https://docs.nestjs.com/security/authentication)
- [Passport.js Documentation](http://www.passportjs.org/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
