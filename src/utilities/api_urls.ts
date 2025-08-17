import { getAuthUser } from "./AuthCookieManager";

const API_URL = import.meta.env.VITE_API_URL;
const userId = getAuthUser()?.userId ?? '';

const api_urls = {
    users: {
        create_user_account: `${API_URL}users`,
        verify_otp: `${API_URL}users/verify`,
        get_users: `${API_URL}users`,
        login: `${API_URL}users/login`,
        get_user_by_id: (userId: string) => `${API_URL}users?userId=${userId}`
    },

    accounts: {
        create_bank_account: `${API_URL}accounts`,
        get_current_user_accounts: `${API_URL}accounts/user?userId=${userId}`,
        get_account_by_id: (accountId: string) => `${API_URL}accounts?accountId=${accountId}`,
        get_current_user_loans: `${API_URL}accounts/user/loans?userId=${userId}`,
        
    },

    transactions: {
        create_transaction: `${API_URL}transactions`,
        create_admin_transaction: `${API_URL}transactions/approved`,
        get_all_transactions: `${API_URL}transactions`,
        approve_transaction: (trxId: string) => `${API_URL}transactions/${trxId}`,
        get_current_user_transactions: (userId: string) => `${API_URL}transactions/user?userId=${userId}`
    },

    templates: {
        get_account_types: `${API_URL}templates/account-types`,
        get_account_branches: `${API_URL}templates/account-branches`,
        get_accoount_statuses: `${API_URL}templates/acount-statuses`,
        get_transaction_gateways: `${API_URL}templates/transaction-gateways`,
        get_transaction_types: `${API_URL}templates/transaction-types`
    }

}

export {
    api_urls
}