# User Registration Frontend

Defence Incident Sentinel - Secure Access Portal for Defence Personnel

## Project Structure

```
src/
├── assets/                    # Static assets (images, videos)
│   └── cyber-illustration_sqr.mp4
│
├── components/                # React components
│   ├── auth/                  # Authentication-related components
│   │   ├── AuthLayout.tsx     # Main auth layout with preview panel
│   │   ├── LoginForm.tsx      # Multi-step login form
│   │   ├── RegisterForm.tsx   # Multi-step registration form
│   │   ├── auth-stepper.css   # Stepper component styles
│   │   └── register-preview.css # Registration preview styles
│   │
│   └── ui/                    # Reusable UI components (shadcn/ui)
│       ├── alert.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── collapsible.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── skeleton.tsx
│       ├── sonner.tsx
│       ├── tabs.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       └── tooltip.tsx
│
├── hooks/                     # Custom React hooks
│   └── use-toast.ts           # Toast notification hook
│
├── lib/                       # Core library utilities
│   ├── auth/                  # Authentication utilities
│   │   └── totpService.ts     # TOTP setup and verification
│   ├── constants.ts           # Application-wide constants
│   ├── index.ts               # Library exports
│   ├── roleConfig.ts          # Role-specific configurations
│   └── utils.ts               # General utilities (cn, etc.)
│
├── pages/                     # Page components
│   ├── Dashboard.tsx          # Role-based dashboard
│   ├── Index.tsx              # Main auth page (login/register)
│   ├── NotFound.tsx           # 404 page
│   └── VerifyEmail.tsx        # Email verification page
│
├── services/                  # API services
│   └── authService.ts         # Authentication API calls
│
├── types/                     # TypeScript type definitions
│   └── index.ts               # Consolidated types
│
├── App.tsx                    # Main app component with routing
├── index.css                  # Global styles and CSS variables
├── main.tsx                   # App entry point
└── vite-env.d.ts              # Vite environment types
```

## Key Files

### Configuration

- **`.env.example`** - Environment variable template
- **`src/lib/constants.ts`** - All magic values, API endpoints, validation patterns
- **`src/lib/roleConfig.ts`** - Role-specific validation and security rules

### Types

- **`src/types/index.ts`** - All TypeScript interfaces and types

### Authentication

- **`src/services/authService.ts`** - Backend API integration
- **`src/lib/auth/totpService.ts`** - TOTP/2FA functionality

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Defence Incident Sentinel
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type check
npx tsc --noEmit
```

## Architecture

### Multi-Step Forms

Both Login and Registration use a multi-step wizard pattern:

**Registration Steps:**
1. Identity (Name, Email, Mobile + Email Verification)
2. Service (Role Selection, Service ID)
3. Security (MFA Method, Password, Terms)
4. Activation (TOTP Setup or Email OTP)

**Login Steps:**
1. Unit Credentials (Role, Service ID, Email)
2. Security Check (Password verification)
3. MFA (Authenticator or Email OTP)

### Role-Based Access

Five user roles with specific configurations:
- `personnel` - Defence Personnel
- `family` - Family Member/Dependent
- `veteran` - Veteran/Retired Officer
- `cert` - CERT Analyst
- `admin` - Admin/MoD Authority

Each role has:
- Custom ID validation patterns
- Email requirements
- Password policies
- Enforced MFA methods
- Security notes
