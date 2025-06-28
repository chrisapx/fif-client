import { getAuthUser } from "./AuthCookieManager";

const API_URL = import.meta.env.VITE_API_URL;
const userId = getAuthUser()?.userId ?? '';

const api_urls = {
    users: {
        get_users: `${API_URL}users`,
        login: `${API_URL}users/login`,
        get_user_by_id: (userId: string) => `${API_URL}users?userId=${userId}`
    },

    accounts: {
        get_current_user_accounts: `${API_URL}accounts/user?userId=${userId}`,
        get_account_by_id: (accountId: string) => `${API_URL}accounts?accountId=${accountId}`,
        get_current_user_loans: `${API_URL}accounts/user/loans?userId=${userId}`,
        
    },


}

export {
    api_urls
}