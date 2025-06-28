const API_URL = import.meta.env.VITE_API_URL;

const api_urls = {
    users: {
        get_users: `${API_URL}users`,
        login: `${API_URL}users/login`,
        get_user_by_id: (userId: string) => `${API_URL}users?userId=${userId}`
    },

    accounts: {
        get_current_user_accounts: (userId: string) => `${API_URL}accounts/user?userId=${userId}`,
        get_account_by_id: (accountId: string) => `${API_URL}accounts?accountId=${accountId}`,
        
    },


}

export {
    api_urls
}