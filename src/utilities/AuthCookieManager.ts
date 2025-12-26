/**
 * Authentication Manager for Fineract Basic Auth
 *
 * Note: Fineract uses Basic Authentication with base64-encoded credentials,
 * not JWT tokens. The token stored is base64(username:password).
 */

const setUserToken = (accessToken: string) => {
  localStorage.setItem("mc_user_tkn", accessToken);
  localStorage.setItem("authUser", localStorage.getItem("mc_user") || '{}'); // Compatibility
};

const setAuthUser = (userData: any) => {
  localStorage.setItem("mc_user", JSON.stringify(userData));
  localStorage.setItem("authUser", JSON.stringify(userData)); // Compatibility
};

const getUserToken = () => {
  return localStorage.getItem("mc_user_tkn") ?? null;
};

const getAuthUser = () => {
  const user = typeof window !== "undefined" && localStorage.getItem("mc_user");
  if (user) {
    try {
      return JSON.parse(user);
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  }
  return null;
};

const deleteUserToken = () => {
  localStorage.removeItem("mc_user_tkn");
  localStorage.removeItem("authUser");
};

const deleteAuthUser = () => {
  localStorage.removeItem("mc_user");
  localStorage.removeItem("authUser");
};

const logout = () => {
  localStorage.removeItem("mc_user_tkn");
  localStorage.removeItem("mc_user");
  localStorage.removeItem("authUser");
};

/**
 * Check if user is authenticated
 * For Fineract Basic Auth, we simply check if token and user data exist
 * No expiration check needed as Basic Auth credentials don't expire
 */
const isAuthenticated = () => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("mc_user_tkn");
    const user = localStorage.getItem("mc_user");

    // Both token (base64 credentials) and user data must exist
    return !!(token && user);
  }
  return false;
};

/**
 * Validate if the stored credentials are properly formatted
 * Basic validation for base64 credentials
 */
const validateCredentials = (credentials: string): boolean => {
  try {
    // Base64 credentials should be decodable
    const decoded = atob(credentials);
    // Should contain a colon separator (username:password)
    return decoded.includes(':');
  } catch (error) {
    return false;
  }
};

/**
 * Get the currently selected account/client
 */
const getSelectedAccount = () => {
  const user = getAuthUser();
  if (!user || !user.accounts || user.selectedAccountIndex === null) {
    return null;
  }
  return user.accounts[user.selectedAccountIndex];
};

/**
 * Get the client ID for API calls
 * Returns the userId which represents the selected clientId
 */
const getClientId = (): string | null => {
  const user = getAuthUser();
  return user?.userId || null;
};

/**
 * Switch to a different account by index
 */
const switchAccount = (accountIndex: number) => {
  const user = getAuthUser();
  if (!user || !user.accounts || accountIndex >= user.accounts.length) {
    return false;
  }

  const selectedAccount = user.accounts[accountIndex];
  const updatedUserData = {
    ...user,
    selectedAccountIndex: accountIndex,
    userId: selectedAccount.clientId,
    email: selectedAccount.email,
    firstName: selectedAccount.displayName
  };

  setAuthUser(updatedUserData);
  return true;
};

/**
 * Get all available accounts for the user
 */
const getAvailableAccounts = () => {
  const user = getAuthUser();
  return user?.accounts || [];
};

export {
  setUserToken,
  isAuthenticated,
  getUserToken,
  deleteUserToken,
  setAuthUser,
  getAuthUser,
  deleteAuthUser,
  logout,
  validateCredentials,
  getSelectedAccount,
  getClientId,
  switchAccount,
  getAvailableAccounts,
};