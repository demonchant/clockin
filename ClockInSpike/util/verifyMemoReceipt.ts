import {
  ParsedTransactionWithMeta,
  PublicKey,
} from '@solana/web3.js';

export const MEMO_PROGRAM_ID = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
);

/**
 * Verifies the expected wallet signature and memo in an RPC-parsed transaction.
 * Finalized commitment must be checked separately via getSignatureStatuses.
 */
export function hasVerifiedMemoReceipt(
  transaction: ParsedTransactionWithMeta | null,
  signature: string,
  wallet: PublicKey,
  expectedMemo: string,
): boolean {
  if (
    !transaction ||
    !transaction.meta ||
    transaction.meta.err !== null ||
    !transaction.transaction.signatures.includes(signature)
  ) {
    return false;
  }

  const walletSigned = transaction.transaction.message.accountKeys.some(
    account => account.signer && account.pubkey.equals(wallet),
  );
  if (!walletSigned) {
    return false;
  }

  return transaction.transaction.message.instructions.some(
    instruction =>
      instruction.programId.equals(MEMO_PROGRAM_ID) &&
      'parsed' in instruction &&
      typeof instruction.parsed === 'string' &&
      instruction.parsed === expectedMemo,
  );
}
