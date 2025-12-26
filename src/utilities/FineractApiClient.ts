import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { FINERACT_API_URL } from './api_urls';
import { getUserToken } from './AuthCookieManager';

/**
 * Fineract API Client
 * Handles authentication and headers for Fineract API calls
 */
class FineractApiClient {
    private axiosInstance: AxiosInstance;
    private tenant: string;

    constructor() {
        this.tenant = import.meta.env.VITE_FINERACT_TENANT || 'default';

        this.axiosInstance = axios.create({
            baseURL: FINERACT_API_URL,
            headers: {
                'Content-Type': 'application/json',
                'Fineract-Platform-TenantId': this.tenant,
            },
        });

        // Add request interceptor to include authentication
        this.axiosInstance.interceptors.request.use(
            (config) => {
                const token = getUserToken();
                if (token) {
                    // Use the stored token (Fineract base64 encoded credentials)
                    config.headers.Authorization = `Basic ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Add response interceptor for error handling
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Handle unauthorized access
                    console.error('Unauthorized access - redirecting to login');
                    // You can trigger a logout or redirect here
                }
                return Promise.reject(error);
            }
        );
    }

    /**
     * Authenticate with Fineract and get base64 encoded credentials
     */
    async authenticate(username: string, password: string): Promise<{ token: string; user: any }> {
        const credentials = btoa(`${username}:${password}`);
        const tenant = this.tenant;

        try {
            const response = await axios.post(
                `${FINERACT_API_URL}/authentication`,
                { username, password },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Fineract-Platform-TenantId': tenant,
                        'Authorization': `Basic ${credentials}`
                    }
                }
            );

            return {
                token: credentials, // Store the base64 credentials
                user: {
                    userId: response.data.userId,
                    username: response.data.username,
                    email: response.data.email,
                    officeId: response.data.officeId,
                    officeName: response.data.officeName,
                    roles: response.data.roles,
                    permissions: response.data.permissions
                }
            };
        } catch (error: any) {
            throw new Error(error.response?.data?.defaultUserMessage || 'Authentication failed');
        }
    }

    /**
     * GET request
     */
    async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.axiosInstance.get<T>(url, config);
    }

    /**
     * POST request
     */
    async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.axiosInstance.post<T>(url, data, config);
    }

    /**
     * PUT request
     */
    async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.axiosInstance.put<T>(url, data, config);
    }

    /**
     * DELETE request
     */
    async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.axiosInstance.delete<T>(url, config);
    }

    /**
     * Create Fineract headers for direct fetch calls
     */
    getHeaders(): HeadersInit {
        const token = getUserToken();
        return {
            'Content-Type': 'application/json',
            'Fineract-Platform-TenantId': this.tenant,
            ...(token ? { 'Authorization': `Basic ${token}` } : {})
        };
    }

    /**
     * Create Fineract headers object for axios
     */
    getAxiosHeaders(): Record<string, string> {
        const token = getUserToken();
        return {
            'Content-Type': 'application/json',
            'Fineract-Platform-TenantId': this.tenant,
            ...(token ? { 'Authorization': `Basic ${token}` } : {})
        };
    }
}

// Export singleton instance
export const fineractClient = new FineractApiClient();
export default FineractApiClient;
