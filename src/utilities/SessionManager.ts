/**
 * Session Manager
 *
 * Manages client-side session with automatic renewal and inactivity timeout.
 * - Session duration: 5 minutes (renews on user activity)
 * - Inactivity timeout: 30 seconds (destroys session if no activity)
 * - On session destruction: Follows logout flow (preserves biometric credentials)
 */

import { logout } from "./AuthCookieManager";

type SessionEventCallback = () => void;

class SessionManager {
  private sessionDuration: number = 5 * 60 * 1000; // 5 minutes
  private inactivityTimeout: number = 30 * 1000; // 30 seconds
  private sessionTimer: number | null = null;
  private inactivityTimer: number | null = null;
  private isActive: boolean = false;
  private onSessionExpired: SessionEventCallback | null = null;
  private onSessionRenewed: SessionEventCallback | null = null;
  private activityEvents: string[] = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click'
  ];

  /**
   * Initialize session manager
   */
  public init(
    onExpired?: SessionEventCallback,
    onRenewed?: SessionEventCallback
  ): void {
    if (this.isActive) {
      console.warn('SessionManager is already active');
      return;
    }

    this.onSessionExpired = onExpired || null;
    this.onSessionRenewed = onRenewed || null;
    this.isActive = true;

    this.startSession();
    this.attachActivityListeners();

    console.log('SessionManager initialized: 5min session, 30sec inactivity timeout');
  }

  /**
   * Start the session timers
   */
  private startSession(): void {
    this.resetSessionTimer();
    this.resetInactivityTimer();
  }

  /**
   * Reset the main session timer (5 minutes)
   */
  private resetSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    this.sessionTimer = window.setTimeout(() => {
      this.destroySession('Session expired after 5 minutes');
    }, this.sessionDuration);
  }

  /**
   * Reset the inactivity timer (30 seconds)
   */
  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    this.inactivityTimer = window.setTimeout(() => {
      this.destroySession('Session expired due to 30 seconds of inactivity');
    }, this.inactivityTimeout);
  }

  /**
   * Handle user activity - renews session
   */
  private handleActivity = (): void => {
    if (!this.isActive) return;

    // Reset both timers on activity
    this.resetInactivityTimer();

    // Only reset session timer and trigger callback if session is still valid
    this.resetSessionTimer();

    if (this.onSessionRenewed) {
      this.onSessionRenewed();
    }
  };

  /**
   * Attach event listeners for user activity
   */
  private attachActivityListeners(): void {
    this.activityEvents.forEach(event => {
      window.addEventListener(event, this.handleActivity, { passive: true });
    });
  }

  /**
   * Remove event listeners for user activity
   */
  private detachActivityListeners(): void {
    this.activityEvents.forEach(event => {
      window.removeEventListener(event, this.handleActivity);
    });
  }

  /**
   * Destroy the session - clears all data and tokens
   */
  private destroySession(reason: string): void {
    console.log(`SessionManager: ${reason}`);

    // Clear all timers
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }

    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }

    // Detach activity listeners
    this.detachActivityListeners();

    // Clear all localStorage data
    this.clearAllStorageData();

    // Mark as inactive
    this.isActive = false;

    // Trigger callback
    if (this.onSessionExpired) {
      this.onSessionExpired();
    }
  }

  /**
   * Clear auth data while preserving biometric credentials
   * Uses the same logout flow as manual logout
   */
  private clearAllStorageData(): void {
    // Use logout function which only removes:
    // - mc_user_tkn
    // - mc_user
    // - authUser
    // This preserves biometric credentials:
    // - biometric_credentialId
    // - biometric_username
    // - biometric_password
    logout();

    console.log('SessionManager: Cleared auth data (preserved biometric credentials)');
  }

  /**
   * Manually destroy the session (for logout)
   */
  public destroy(): void {
    if (!this.isActive) return;
    this.destroySession('Session manually destroyed');
  }

  /**
   * Check if session is active
   */
  public isSessionActive(): boolean {
    return this.isActive;
  }

  /**
   * Manually renew the session
   */
  public renewSession(): void {
    if (!this.isActive) return;
    this.resetSessionTimer();
    this.resetInactivityTimer();
  }

  /**
   * Get remaining session time in milliseconds
   */
  public getRemainingTime(): number {
    // This is approximate since we can't directly query setTimeout
    return this.isActive ? this.sessionDuration : 0;
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
