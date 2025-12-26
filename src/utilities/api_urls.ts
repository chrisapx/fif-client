import { getAuthUser } from "./AuthCookieManager";

const FINERACT_API_URL = import.meta.env.VITE_FINERACT_API_URL;
const clientId = getAuthUser()?.userId ?? '';

/**
 * Fineract API endpoints mapping
 * Documentation: https://demo.mifos.io/api-docs/apiLive.htm
 */
const api_urls = {
    // Authentication endpoints
    authentication: {
        login: `${FINERACT_API_URL}/self/authentication`, // Self-service authentication
        self: `${FINERACT_API_URL}/self/user`
    },

    // Client management (Self-service endpoints)
    clients: {
        get_client_accounts: (clientId: string) => `${FINERACT_API_URL}/self/clients/${clientId}/accounts`,
        get_client_by_id: (clientId: string) => `${FINERACT_API_URL}/self/clients/${clientId}`,

        // Staff endpoints (may not be accessible for self-service users)
        create_client: `${FINERACT_API_URL}/clients`,
        get_clients: `${FINERACT_API_URL}/clients`,
        activate_client: (clientId: string) => `${FINERACT_API_URL}/clients/${clientId}?command=activate`,
        template: `${FINERACT_API_URL}/clients/template`
    },

    // Savings accounts management (Self-service endpoints)
    savingsAccounts: {
        create_savings_account: `${FINERACT_API_URL}/self/savingsaccounts`,
        get_savings_account: (accountId: string) => `${FINERACT_API_URL}/self/savingsaccounts/${accountId}`,
        template: `${FINERACT_API_URL}/self/savingsaccounts/template`,

        // Staff endpoints (not accessible for self-service)
        approve_savings_account: (accountId: string) => `${FINERACT_API_URL}/savingsaccounts/${accountId}?command=approve`,
        activate_savings_account: (accountId: string) => `${FINERACT_API_URL}/savingsaccounts/${accountId}?command=activate`,
    },

    // Loan accounts management (Self-service endpoints)
    loans: {
        create_loan: `${FINERACT_API_URL}/self/loans`,
        get_loan: (loanId: string) => `${FINERACT_API_URL}/self/loans/${loanId}`,
        // Use specific associations: repaymentSchedule, transactions, charges
        get_loan_with_details: (loanId: string) => `${FINERACT_API_URL}/self/loans/${loanId}?associations=repaymentSchedule,transactions`,
        get_loan_with_transactions: (loanId: string) => `${FINERACT_API_URL}/self/loans/${loanId}?associations=transactions`,
        get_loan_with_repayment: (loanId: string) => `${FINERACT_API_URL}/self/loans/${loanId}?associations=repaymentSchedule`,
        template: `${FINERACT_API_URL}/self/loans/template`,

        // Staff endpoints (not accessible for self-service)
        approve_loan: (loanId: string) => `${FINERACT_API_URL}/loans/${loanId}?command=approve`,
        disburse_loan: (loanId: string) => `${FINERACT_API_URL}/loans/${loanId}?command=disburse`,
        repay_loan: (loanId: string) => `${FINERACT_API_URL}/loans/${loanId}/transactions?command=repayment`,
    },

    // Share accounts management (Self-service endpoints)
    shareAccounts: {
        get_share_account: (accountId: string) => `${FINERACT_API_URL}/self/shareaccounts/${accountId}`,
        // Note: Share accounts may support different associations, use purchasedShares if available
        get_share_account_with_transactions: (accountId: string) => `${FINERACT_API_URL}/self/shareaccounts/${accountId}`,
    },

    // Transactions (Mixed self-service and staff endpoints)
    transactions: {
        // Staff endpoints required for posting transactions (self-service posting often disabled)
        deposit: (accountId: string) => `${FINERACT_API_URL}/savingsaccounts/${accountId}/transactions?command=deposit`,
        withdrawal: (accountId: string) => `${FINERACT_API_URL}/savingsaccounts/${accountId}/transactions?command=withdrawal`,
        // Self-service endpoints for reading transactions
        get_transactions: (accountId: string) => `${FINERACT_API_URL}/self/savingsaccounts/${accountId}/transactions`,
        get_savings_with_transactions: (accountId: string) => `${FINERACT_API_URL}/self/savingsaccounts/${accountId}?associations=transactions`,
        get_transaction: (accountId: string, transactionId: string) =>
            `${FINERACT_API_URL}/self/savingsaccounts/${accountId}/transactions/${transactionId}`,
        template: (accountId: string) => `${FINERACT_API_URL}/savingsaccounts/${accountId}/transactions/template`
    },

    // Templates and reference data (Self-service endpoints)
    templates: {
        savings_products: `${FINERACT_API_URL}/self/savingsproducts`,
        // Note: self/loanproducts doesn't exist, use loans template instead
        loan_products: `${FINERACT_API_URL}/self/loans/template?clientId=${clientId}`,
        loan_products_template: (clientId: string) => `${FINERACT_API_URL}/self/loans/template?clientId=${clientId}`,

        // Staff endpoints (not accessible for self-service users - will use fallbacks)
        offices: `${FINERACT_API_URL}/offices`,
        staff: `${FINERACT_API_URL}/staff`,
        payment_types: `${FINERACT_API_URL}/paymenttypes`,
        codes: `${FINERACT_API_URL}/codes`
    },

    // Reports
    reports: {
        client_summary: (clientId: string) => `${FINERACT_API_URL}/runreports/Client%20Summary?R_clientId=${clientId}`,
        transaction_report: `${FINERACT_API_URL}/runreports/Transaction%20Report`
    }
}

export {
    api_urls,
    FINERACT_API_URL
}