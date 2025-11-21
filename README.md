# WatchPod Web Authentication

Mobile-first web authentication flows designed for Android WebView integration.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Project Structure

This project is organized for scalability with multiple authentication flows:

```
src/
├── app/                    # Next.js routes
│   └── auth/              # Authentication pages
├── components/auth/        # Auth flow components
├── utils/                 # Utilities (API, Android bridge)
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript definitions
```

For detailed documentation, see [STRUCTURE.md](./STRUCTURE.md).

## Current Features

### ✅ Email Signup Flow
- Email entry screen
- OTP verification
- Password creation
- Android bridge integration
- Form validation & error handling
- Mobile viewport fixes

## Upcoming Features

- [ ] Email Login
- [ ] Google OAuth Signup
- [ ] Apple Sign In
- [ ] Password Reset
- [ ] Social Login (Facebook, Twitter)

## Android Integration

### WebView Setup
```kotlin
webView.settings.javaScriptEnabled = true
webView.addJavascriptInterface(WebAppBridge(this), "AndroidBridge")
```

### Bridge Methods Required
```kotlin
class WebAppBridge(private val context: Context) {
    @JavascriptInterface
    fun onSignupSuccess(token: String) { /* ... */ }
    
    @JavascriptInterface
    fun onLoginSuccess(token: String) { /* ... */ }
    
    @JavascriptInterface
    fun showToast(message: String) { /* ... */ }
}
```

## API Integration

Set your backend URL in `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://your-api.com
```

Then uncomment API calls in components (search for `// API call commented out`).

## Development

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Target**: Android WebView

## Testing

### In Browser
```bash
npm run dev
```
Navigate to http://localhost:3000 - you'll see alerts/console logs for Android bridge calls.

### In Android Studio
1. Build the web app: `npm run build`
2. Serve: `npm run start`
3. Point your WebView to the server URL
4. Bridge calls will execute native Android methods

## Documentation

- [STRUCTURE.md](./STRUCTURE.md) - Detailed project structure and patterns
- [Backend README](./backend/README.md) - Example FastAPI backend

## License

MIT
