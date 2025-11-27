/**
 * Utility functions for communicating with Android Kotlin WebView bridge
 * 
 * Your Android app injects a JavaScript interface named "AndroidBridge" with these methods:
 * - onSignupSuccess(token: String)
 * - onLoginSuccess(token: String)
 * - showToast(message: String)
 */

interface AndroidBridge {
  // onSignupSuccess removed from newer Android builds; keep optional for compatibility
  onSignupSuccess?: (token: string) => void;
  onLoginSuccess: (token: string) => void;
  // New optional method that accepts token and email separately for login
  onLoginSuccessWithEmail?: (token: string, email: string) => void;
  showToast: (message: string) => void;
  // New optional method that accepts token and email separately
  onSignupSuccessWithEmail?: (token: string, email: string) => void;
  // Method to get Google ID token for social signup flow
  getIdToken?: () => string;
  // Method to navigate back to the Android app
  navigateBack?: () => void;
}

declare global {
  interface Window {
    AndroidBridge?: AndroidBridge;
  }
}

/**
 * Wait for Android bridge to be available
 * The bridge is injected by Android as: webView.addJavascriptInterface(WebAppBridge(this), "AndroidBridge")
 * Sometimes it takes a moment to initialize after page load
 */
const waitForBridge = (timeout = 5000): Promise<AndroidBridge | null> => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkBridge = () => {
      console.log('Checking for window.AndroidBridge...');
      
      // Debug: List all window properties that might be the bridge
      const androidProps = Object.keys(window).filter(k => 
        k.toLowerCase().includes('android') || k.toLowerCase().includes('bridge')
      );
      if (androidProps.length > 0) {
        console.log('Found window properties:', androidProps);
      }
      
      // Check for the AndroidBridge interface
      if (window.AndroidBridge) {
        console.log('✓ window.AndroidBridge is available');
        console.log('✓ Available methods:', Object.keys(window.AndroidBridge));
        resolve(window.AndroidBridge);
        return;
      }
      
      // Check if we've exceeded timeout
      if (Date.now() - startTime > timeout) {
        console.error('✗ window.AndroidBridge not found after ' + timeout + 'ms');
        console.error('Make sure your Android code includes: webView.addJavascriptInterface(WebAppBridge(activity), "AndroidBridge")');
        resolve(null);
        return;
      }
      
      // Try again in 100ms
      setTimeout(checkBridge, 100);
    };
    
    checkBridge();
  });
};

// Short-lived guard to avoid duplicate bridge calls when both
// `notifySignupSuccessWithEmail` and `notifySignupSuccess` are
// invoked in quick succession by the web app. This prevents the
// Android side receiving two back-to-back notifications for the
// same signup (one with email, one without) which was observed in
// logs as duplicated navigation.
let lastSignupCall: {
  type: 'withEmail' | 'single';
  time: number;
  email?: string;
} | null = null;

/**
 * Call Android bridge method for successful signup
 * @param token - Authentication token to pass to Android app
 */
export const notifySignupSuccess = async (token: string): Promise<void> => {
  if (typeof window === 'undefined') return;

  console.log('=== notifySignupSuccess called ===');
  console.log('Token:', token);
  console.log('Token length:', token.length);
  console.log('Token preview:', token.substring(0, 50) + '...');
  
  const bridge = await waitForBridge();

  if (bridge) {
    // If a with-email notification happened very recently, and the
    // current token appears to match that email (or its JSON payload),
    // skip calling the single-arg bridge to avoid duplicate behavior.
    try {
      const now = Date.now();
      if (lastSignupCall && lastSignupCall.type === 'withEmail' && now - lastSignupCall.time < 1000) {
        // token might be JSON payload or plain string; check for email match
        let tokenEmail: string | null = null;
        try {
          const parsed = JSON.parse(token);
          tokenEmail = parsed?.email ?? null;
        } catch {
          // not JSON — treat token as raw
          tokenEmail = token;
        }

        if (tokenEmail && lastSignupCall.email && tokenEmail === lastSignupCall.email) {
          console.log('Skipping duplicate notifySignupSuccess call because notifySignupSuccessWithEmail was just sent for the same email');
          return;
        }
      }
    } catch {
      // if our defensive logic fails, continue to call the bridge as before
      console.warn('Error in duplicate-guard logic for notifySignupSuccess');
    }
    // If a separate method for token+email exists, and the token string is a JSON payload
    // containing access_token and email, call that method with separate args.
    let parsed: { access_token?: string; email?: string } | null = null;
    try {
      parsed = JSON.parse(token);
    } catch {
      // not JSON - ignore
    }

    if (
      bridge.onSignupSuccessWithEmail &&
      parsed &&
      parsed.access_token &&
      parsed.email
    ) {
      console.log('✓ Calling bridge.onSignupSuccessWithEmail with token and email');
      try {
        bridge.onSignupSuccessWithEmail(parsed.access_token, parsed.email);
        console.log('✓ bridge.onSignupSuccessWithEmail called successfully');
      } catch (err) {
        console.error('✗ Error calling bridge.onSignupSuccessWithEmail:', err);
      }
      return;
    }
    // The native single-arg `onSignupSuccess` method has been removed from the
    // Android bridge. If we couldn't call the with-email method, fall back to
    // browser-mode handling (log + alert). Do not attempt to call the removed
    // native method.
    console.warn('✗ onSignupSuccessWithEmail not available or token not JSON - no native signup method to call');
    console.log('Signup successful (no native bridge method available). Token/payload:', token);
    alert('Password set successfully! (Browser mode)\nToken/Info: ' + (token?.toString?.() ?? ''));
    return;
  }
  
  // Fallback for browser testing
  console.warn('✗ No Android bridge found - running in browser mode');
  console.log('Signup successful! Token:', token);
  alert('Password set successfully! (Browser mode)\nToken/Info: ' + (token?.toString?.() ?? ''));
};

/**
 * Call Android bridge method for successful login
 * @param token - Authentication token to pass to Android app
 */
export const notifyLoginSuccess = async (token: string, email?: string): Promise<void> => {
  if (typeof window === 'undefined') return;

  console.log('=== notifyLoginSuccess called ===');
  console.log('Token:', token);
  console.log('Token length:', token.length);
  console.log('Token preview:', token.substring(0, 50) + '...');
  
  const bridge = await waitForBridge();
  if (bridge) {
    // Prefer the new two-arg method if available and email was provided
    if (email && typeof bridge.onLoginSuccessWithEmail === 'function') {
      console.log('✓ Calling bridge.onLoginSuccessWithEmail with token and email');
      try {
        bridge.onLoginSuccessWithEmail(token, email);
        console.log('✓ bridge.onLoginSuccessWithEmail called successfully');
      } catch (err) {
        console.error('✗ Error calling bridge.onLoginSuccessWithEmail:', err);
      }
      return;
    }

    
  }

  // Fallback for browser testing
  console.warn('✗ No Android bridge found - running in browser mode');
  console.log('Login successful! Token:', token);
  alert('Login successful! (Browser mode)\nToken: ' + token.substring(0, 50) + '...' + (email ? '\nEmail: ' + email : ''));
};

/**
 * Call Android bridge method for successful signup with separate token + email args
 * @param token - Authentication token
 * @param email - User email
 */
export const notifySignupSuccessWithEmail = async (token: string, email: string): Promise<void> => {
  if (typeof window === 'undefined') return;

  console.log('=== notifySignupSuccessWithEmail called ===');
  console.log('Token:', token);
  console.log('Email:', email);

  const bridge = await waitForBridge();

  if (bridge && typeof bridge.onSignupSuccessWithEmail === 'function') {
    console.log('✓ Calling bridge.onSignupSuccessWithEmail with token and email');
    try {
      bridge.onSignupSuccessWithEmail(token, email);
      // record that a with-email signup notification was sent (used to suppress
      // an immediate single-arg duplicate that we sometimes observe)
      lastSignupCall = { type: 'withEmail', time: Date.now(), email };
      console.log('✓ bridge.onSignupSuccessWithEmail called successfully');
    } catch (err) {
      console.error('✗ Error calling bridge.onSignupSuccessWithEmail:', err);
    }
    return;
  }

  // Fallback: try to call the single-arg method with a JSON payload
  console.warn('✗ onSignupSuccessWithEmail not available - no native method to notify. Falling back to browser behavior.');
  console.log('Signup successful (no native bridge method). Token:', token, 'Email:', email);
  alert('Signup successful! (Browser mode)\nEmail: ' + email + '\nToken (truncated): ' + (token?.toString?.().substring(0, 50) ?? ''));
};

/**
 * Show toast message via Android bridge
 * @param message - Message to display in toast
 */
export const showToast = (message: string): void => {
  if (typeof window === 'undefined') return;

  if (window.AndroidBridge && typeof window.AndroidBridge.showToast === 'function') {
    window.AndroidBridge.showToast(message);
  } else {
    // Fallback for browser testing
    console.log('Toast:', message);
  }
};

/**
 * Navigate back to native Android app
 * Calls the Android bridge navigateBack method to close the WebView and return to the app
 */
export const navigateBackToApp = async (): Promise<void> => {
  if (typeof window === 'undefined') return;

  console.log('navigateBackToApp: Back button pressed in web view');
  console.log('navigateBackToApp: Checking for AndroidBridge...');
  console.log('navigateBackToApp: typeof window.AndroidBridge:', typeof window.AndroidBridge);
  
  // First try immediate check
  if (typeof window.AndroidBridge !== 'undefined' && 
      typeof window.AndroidBridge.navigateBack === 'function') {
      
    console.log('✓ AndroidBridge.navigateBack available immediately');
    try {
      window.AndroidBridge.navigateBack();
      console.log('✓ AndroidBridge.navigateBack() called successfully');
      return;
    } catch (err) {
      console.error('✗ Error calling AndroidBridge.navigateBack():', err);
    }
  }
  
  // If not available immediately, wait for it
  console.log('navigateBackToApp: Waiting for AndroidBridge...');
  const bridge = await waitForBridge(2000);
  
  if (bridge && typeof bridge.navigateBack === 'function') {
    console.log('✓ AndroidBridge.navigateBack available after waiting');
    try {
      bridge.navigateBack();
      console.log('✓ AndroidBridge.navigateBack() called successfully after waiting');
      return;
    } catch (err) {
      console.error('✗ Error calling AndroidBridge.navigateBack():', err);
    }
  }
  
  // Fallback for browser/iOS
  console.log('✗ AndroidBridge.navigateBack not available - using fallback');
  console.log('Fallback: Using window.history.back() for browser testing');
  window.history.back();
};
