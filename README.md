# vouchers-js

A robust, lightweight JavaScript/TypeScript SDK for the Commerce Partner Vouchers API.

## Features

- **Isomorphic**: Runs identically on **Node.js (18+)**, **Deno**, and **Bun**.
- Zero external dependencies (uses native `fetch`).
- Fast and fully TypeScript-typed so development is seamless.
- Handles idempotency autonomously for safe financial requests.

## Installation

```bash
npm install vouchers-js
```
or 
```bash
yarn add vouchers-js
```
or 
```bash
bun add vouchers-js
```

## Quick Start

```typescript
import { VouchersClient, APIError } from 'vouchers-js';

// 1. Initialize client using backend credentials
const client = new VouchersClient({
  apiKeyId: "your_api_key_id",
  apiSecret: "your_api_secret",
  baseUrl: "https://api.wavecommerce.ly",
});

async function run() {
  try {
    // 2. Switch to Test Mode safely
    const modeRes = await client.switchMode('test');
    console.log(`Mode switched: ${modeRes.mode}`);

    // 3. Issue a Voucher (Defaults to LYD)
    const issueRes = await client.issueVoucher(100.0);
    const voucherId = issueRes.voucher.id;
    console.log(`Test Voucher Created! Code: ${issueRes.voucher.code}`);

    // 4. Check Status
    const statusRes = await client.getVoucherStatus(voucherId);
    console.log(`Voucher IsTest: ${statusRes.isTest}`);

    // 5. Bulk Issue Vouchers (up to 1000 instantly)
    const bulkRes = await client.bulkIssueVouchers(25.0, 10);
    console.log(`Bulk created ${bulkRes.vouchers.length} vouchers.`);

    // 6. Void it when done
    await client.voidVoucher(voucherId);
    console.log("Voucher voided successfully.");

  } catch (error) {
    if (error instanceof APIError) {
      console.error(`API Failed (${error.statusCode}): ${error.message}`);
      console.error(error.responseBody);
    } else {
      console.error(error);
    }
  }
}

run();
```

## Local Development (Node.js < 18 or custom fetching)

If your environment doesn't support the global `fetch` API, or if you need to bypass strict SSL routing locally, you can pass a custom fetch handler directly into the configuration.

```typescript
import fetch from 'node-fetch'; // Polyfill

const client = new VouchersClient({
  apiKeyId: "your_api_key_id",
  apiSecret: "your_api_secret",
  baseUrl: "https://localhost:3000",
  fetch: customFetchMethodHere
});
```
