import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VouchersClient } from '../src/client';

describe('VouchersClient', () => {
    let mockFetch: any;
    let client: VouchersClient;

    beforeEach(() => {
        mockFetch = vi.fn();
        client = new VouchersClient({
            apiKeyId: 'test_key',
            apiSecret: 'test_secret',
            baseUrl: 'https://api.test.ly',
            fetch: mockFetch,
        });
    });

    it('should switch mode successfully', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            text: async () => JSON.stringify({ message: "Partner app mode switched to test", mode: "test" }),
        });

        const response = await client.switchMode('test');
        expect(response.mode).toBe('test');

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toBe('https://api.test.ly/api/partner/v1/mode');
        expect(options.method).toBe('POST');
        expect(JSON.parse(options.body).mode).toBe('test');
    });

    it('should issue a voucher successfully', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            text: async () => JSON.stringify({ message: "Voucher issued successfully", voucher: { id: "123", code: "CODE" } }),
        });

        const response = await client.issueVoucher(100);
        expect(response.voucher.id).toBe('123');

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toBe('https://api.test.ly/api/partner/v1/vouchers/issue');
        expect(options.method).toBe('POST');
        expect(JSON.parse(options.body).amount).toBe(100);
        expect(JSON.parse(options.body).currency).toBe('LYD');
        expect(options.headers['X-Api-Key-Id']).toBe('test_key');
    });

    it('should bulk issue vouchers successfully', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            text: async () => JSON.stringify({ vouchers: [{ id: "1" }, { id: "2" }] }),
        });

        const response = await client.bulkIssueVouchers(50, 5);
        expect(response.vouchers.length).toBe(2);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toBe('https://api.test.ly/api/partner/v1/vouchers/bulk-issue');
        expect(JSON.parse(options.body).count).toBe(5);
    });
});
