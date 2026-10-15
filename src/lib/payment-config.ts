export const bankTransferInfo = {
  bankName: process.env.NEXT_PUBLIC_BANK_TRANSFER_BANK_NAME ?? "",
  bankBin:
    process.env.NEXT_PUBLIC_BANK_TRANSFER_BANK_BIN ??
    (process.env.NEXT_PUBLIC_BANK_TRANSFER_BANK_NAME?.toLowerCase() ===
    "tpbank"
      ? "970423"
      : ""),
  accountNumber: process.env.NEXT_PUBLIC_BANK_TRANSFER_ACCOUNT_NUMBER ?? "",
  accountName: process.env.NEXT_PUBLIC_BANK_TRANSFER_ACCOUNT_NAME ?? "",
  branch: process.env.NEXT_PUBLIC_BANK_TRANSFER_BRANCH ?? "",
};

export const hasBankTransferInfo =
  Boolean(bankTransferInfo.bankName) &&
  Boolean(bankTransferInfo.accountNumber) &&
  Boolean(bankTransferInfo.accountName);

export function buildBankTransferQrUrl(orderCode: string, amount: number) {
  if (!hasBankTransferInfo || !bankTransferInfo.bankBin) return null;

  const params = new URLSearchParams({
    amount: String(Math.round(amount)),
    addInfo: `BlueWear ${orderCode}`,
    accountName: bankTransferInfo.accountName,
  });

  return `https://img.vietqr.io/image/${encodeURIComponent(
    bankTransferInfo.bankBin,
  )}-${encodeURIComponent(bankTransferInfo.accountNumber)}-compact2.png?${params.toString()}`;
}
