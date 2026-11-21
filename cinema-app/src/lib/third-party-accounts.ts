export type GatewayProvider = 'zalopay' | 'vnpay';

export interface ThirdPartyAccount {
  id: string;
  provider: GatewayProvider;
  accountHolder: string;
  accountNumber: string;
  bankOrWalletName: string;
  badge: string;
  initialBalance: number;
  balance: number;
}

interface GlobalWalletStore {
  __lumiThirdPartyWallets?: Map<string, ThirdPartyAccount>;
}

const globalForWallets = globalThis as unknown as GlobalWalletStore;

function getWalletMap(): Map<string, ThirdPartyAccount> {
  if (!globalForWallets.__lumiThirdPartyWallets) {
    globalForWallets.__lumiThirdPartyWallets = new Map<string, ThirdPartyAccount>();
  }
  return globalForWallets.__lumiThirdPartyWallets;
}

function buildStorageKey(provider: GatewayProvider, userKey: string, accountId: string): string {
  return `${provider}:${userKey}:${accountId}`;
}

function buildPresetAccounts(
  provider: GatewayProvider,
  userInfo: { id?: number | string; name?: string | null; phone?: string | null; email?: string | null }
): ThirdPartyAccount[] {
  const holderName = (userInfo.name && userInfo.name.trim()) || 'Khách Hàng LumiCinema';
  const rawPhone = (userInfo.phone && userInfo.phone.trim()) || '0901234567';

  if (provider === 'zalopay') {
    return [
      {
        id: 'zp-linked',
        provider: 'zalopay',
        accountHolder: holderName,
        accountNumber: rawPhone,
        bankOrWalletName: 'Ví ZaloPay Liên Kết',
        badge: 'Tài khoản liên kết',
        initialBalance: 500000,
        balance: 500000,
      },
      {
        id: 'zp-starter',
        provider: 'zalopay',
        accountHolder: `${holderName} (Ví Phụ)`,
        accountNumber: '0909000111',
        bankOrWalletName: 'Ví ZaloPay Starter',
        badge: 'Số dư thấp (Test thiếu tiền)',
        initialBalance: 50000,
        balance: 50000,
      },
      {
        id: 'zp-vip',
        provider: 'zalopay',
        accountHolder: `${holderName} (Priority)`,
        accountNumber: '0988888999',
        bankOrWalletName: 'Ví ZaloPay Priority',
        badge: 'Hạn mức cao',
        initialBalance: 5000000,
        balance: 5000000,
      },
    ];
  }

  return [
    {
      id: 'vnp-linked',
      provider: 'vnpay',
      accountHolder: holderName.toUpperCase(),
      accountNumber: `9704 3668 ${rawPhone.slice(-4).padStart(4, '0')}`,
      bankOrWalletName: 'Vietcombank • VNPAY',
      badge: 'Tài khoản liên kết',
      initialBalance: 500000,
      balance: 500000,
    },
    {
      id: 'vnp-starter',
      provider: 'vnpay',
      accountHolder: `${holderName.toUpperCase()} (ATM)`,
      accountNumber: '9704 2200 1122',
      bankOrWalletName: 'MB Bank • VNPAY-QR',
      badge: 'Số dư thấp (Test thiếu tiền)',
      initialBalance: 50000,
      balance: 50000,
    },
    {
      id: 'vnp-vip',
      provider: 'vnpay',
      accountHolder: `${holderName.toUpperCase()} (VIP)`,
      accountNumber: '9704 0788 9999',
      bankOrWalletName: 'Techcombank Priority',
      badge: 'Hạn mức cao',
      initialBalance: 5000000,
      balance: 5000000,
    },
  ];
}

export function getThirdPartyAccounts(
  provider: GatewayProvider,
  userInfo: { id?: number | string; name?: string | null; phone?: string | null; email?: string | null }
): ThirdPartyAccount[] {
  const walletMap = getWalletMap();
  const userKey = String(userInfo.id || userInfo.email || 'guest');
  const presets = buildPresetAccounts(provider, userInfo);

  return presets.map((preset) => {
    const key = buildStorageKey(provider, userKey, preset.id);
    const existing = walletMap.get(key);
    if (existing) {
      // Keep synced display name/phone in case user info updated
      existing.accountHolder = preset.accountHolder;
      return { ...existing };
    }
    const created = { ...preset };
    walletMap.set(key, created);
    return { ...created };
  });
}

export function topupThirdPartyAccount(
  provider: GatewayProvider,
  userInfo: { id?: number | string; name?: string | null; phone?: string | null; email?: string | null },
  accountId: string,
  addAmount: number
): ThirdPartyAccount | null {
  const accounts = getThirdPartyAccounts(provider, userInfo);
  const target = accounts.find((a) => a.id === accountId);
  if (!target) return null;

  const userKey = String(userInfo.id || userInfo.email || 'guest');
  const key = buildStorageKey(provider, userKey, accountId);
  const walletMap = getWalletMap();
  const stored = walletMap.get(key)!;
  stored.balance = Math.max(0, stored.balance + Math.round(addAmount));
  return { ...stored };
}

export function resetThirdPartyAccount(
  provider: GatewayProvider,
  userInfo: { id?: number | string; name?: string | null; phone?: string | null; email?: string | null },
  accountId: string
): ThirdPartyAccount | null {
  const accounts = getThirdPartyAccounts(provider, userInfo);
  const target = accounts.find((a) => a.id === accountId);
  if (!target) return null;

  const userKey = String(userInfo.id || userInfo.email || 'guest');
  const key = buildStorageKey(provider, userKey, accountId);
  const walletMap = getWalletMap();
  const stored = walletMap.get(key)!;
  stored.balance = stored.initialBalance;
  return { ...stored };
}

export function debitThirdPartyAccountIfSufficient(
  provider: GatewayProvider,
  userInfo: { id?: number | string; name?: string | null; phone?: string | null; email?: string | null },
  accountId: string,
  requiredAmount: number
):
  | { ok: true; account: ThirdPartyAccount; newBalance: number }
  | { ok: false; reason: 'ACCOUNT_NOT_FOUND' | 'INSUFFICIENT_BALANCE'; balance: number; missing: number } {
  const accounts = getThirdPartyAccounts(provider, userInfo);
  const target = accounts.find((a) => a.id === accountId);
  if (!target) {
    return { ok: false, reason: 'ACCOUNT_NOT_FOUND', balance: 0, missing: requiredAmount };
  }

  const userKey = String(userInfo.id || userInfo.email || 'guest');
  const key = buildStorageKey(provider, userKey, accountId);
  const walletMap = getWalletMap();
  const stored = walletMap.get(key)!;

  if (stored.balance < requiredAmount) {
    return {
      ok: false,
      reason: 'INSUFFICIENT_BALANCE',
      balance: stored.balance,
      missing: requiredAmount - stored.balance,
    };
  }

  stored.balance -= requiredAmount;
  return { ok: true, account: { ...stored }, newBalance: stored.balance };
}

export function refundThirdPartyAccount(
  provider: GatewayProvider,
  userInfo: { id?: number | string; name?: string | null; phone?: string | null; email?: string | null },
  accountId: string,
  amount: number
): void {
  const userKey = String(userInfo.id || userInfo.email || 'guest');
  const key = buildStorageKey(provider, userKey, accountId);
  const stored = getWalletMap().get(key);
  if (stored) {
    stored.balance += Math.round(amount);
  }
}
