import { APIError } from './error';

export interface VouchersClientOptions {
    apiKeyId: string;
    apiSecret: string;
    baseUrl: string;
    /**
     * Optional custom fetch implementation. Defaults to global fetch.
     * Useful in environments where fetch needs polyfilling or when bypassing self-signed certs in local dev (e.g. Node 18+ custom dispatcher).
     */
    fetch?: typeof fetch;
}

export interface IssueVoucherOptions {
    campaignId?: string;
    expiresAt?: string;
    idempotencyKey?: string;
}

export interface BulkIssueVouchersOptions {
    campaignId?: string;
    expiresAt?: string;
    idempotencyKey?: string;
}

export class VouchersClient {
    private apiKeyId: string;
    private apiSecret: string;
    private baseUrl: string;
    private fetchFn: typeof fetch;

    constructor(options: VouchersClientOptions) {
        if (!options.apiKeyId) throw new Error('apiKeyId is required');
        if (!options.apiSecret) throw new Error('apiSecret is required');
        if (!options.baseUrl) throw new Error('baseUrl is required');

        this.apiKeyId = options.apiKeyId;
        this.apiSecret = options.apiSecret;
        this.baseUrl = options.baseUrl.replace(/\/+$/, '');
        this.fetchFn = options.fetch || (typeof fetch !== 'undefined' ? fetch : undefined as any);

        if (!this.fetchFn) {
            throw new Error('A global fetch function was not found. Please provide one via options.fetch.');
        }
    }

    private generateIdempotencyKey(): string {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    private async request<T>(
        method: string,
        endpoint: string,
        payload?: any,
        idempotencyKey?: string
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
        const idemKey = idempotencyKey || this.generateIdempotencyKey();

        const headers: Record<string, string> = {
            'X-Api-Key-Id': this.apiKeyId,
            'X-Api-Secret': this.apiSecret,
            'X-Idempotency-Key': idemKey,
            'Accept': 'application/json',
        };

        let body: string | undefined;
        if (payload !== undefined) {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(payload);
        }

        let response: Response;
        try {
            response = await this.fetchFn(url, {
                method,
                headers,
                body,
            });
        } catch (err: any) {
            throw new APIError(`Network error: ${err.message}`, 0, null);
        }

        const responseText = await response.text();
        let responseData: any = null;

        if (responseText) {
            try {
                responseData = JSON.parse(responseText);
            } catch {
                responseData = responseText;
            }
        }

        if (!response.ok) {
            let errorMessage = response.statusText || 'Unknown Error';
            if (responseData && typeof responseData === 'object' && responseData.error) {
                errorMessage = responseData.error;
            }
            throw new APIError(`API Request failed: ${errorMessage}`, response.status, responseData);
        }

        return responseData as T;
    }

    /**
     * Issue a single voucher.
     *
     * @param amount The voucher value (e.g., 100 for 100 LYD).
     * @param options Additional options (campaignId, expiresAt, idempotencyKey).
     */
    public issueVoucher(amount: number, options: IssueVoucherOptions = {}): Promise<any> {
        const payload: any = {
            amount,
            currency: 'LYD',
        };

        if (options.campaignId) payload.campaignId = options.campaignId;
        if (options.expiresAt) payload.expiresAt = options.expiresAt;

        return this.request('POST', '/api/partner/v1/vouchers/issue', payload, options.idempotencyKey);
    }

    /**
     * Issue multiple vouchers at once (maximum 1000).
     *
     * @param amount The voucher value (e.g., 100 for 100 LYD).
     * @param count Total number of vouchers to generate instantly. Max 1000.
     * @param options Additional options (campaignId, expiresAt, idempotencyKey).
     */
    public bulkIssueVouchers(amount: number, count: number, options: BulkIssueVouchersOptions = {}): Promise<any> {
        const payload: any = {
            amount,
            currency: 'LYD',
            count,
        };

        if (options.campaignId) payload.campaignId = options.campaignId;
        if (options.expiresAt) payload.expiresAt = options.expiresAt;

        return this.request('POST', '/api/partner/v1/vouchers/bulk-issue', payload, options.idempotencyKey);
    }

    /**
     * Void an existing active voucher. Once voided, it becomes completely unredeemable.
     *
     * @param voucherId UUID of the voucher returned during issuance.
     * @param idempotencyKey Optional idempotency key.
     */
    public voidVoucher(voucherId: string, idempotencyKey?: string): Promise<any> {
        const payload = { voucherId };
        return this.request('POST', '/api/partner/v1/vouchers/void', payload, idempotencyKey);
    }

    /**
     * Get the current life-cycle status of a voucher.
     *
     * @param voucherId UUID of the voucher returned during issuance.
     */
    public getVoucherStatus(voucherId: string): Promise<any> {
        return this.request('GET', `/api/partner/v1/vouchers/${encodeURIComponent(voucherId)}/status`);
    }

    /**
     * Switch the behavior mode of your Partner App between 'test' and 'live'.
     * Vouchers generated in 'test' mode cannot manipulate real financial ledgers.
     *
     * @param mode 'test' or 'live'
     * @param idempotencyKey Optional idempotency key.
     */
    public switchMode(mode: 'test' | 'live', idempotencyKey?: string): Promise<any> {
        if (mode !== 'test' && mode !== 'live') {
            throw new Error("Mode must be strictly 'test' or 'live'");
        }

        const payload = { mode };
        return this.request('POST', '/api/partner/v1/mode', payload, idempotencyKey);
    }
}
