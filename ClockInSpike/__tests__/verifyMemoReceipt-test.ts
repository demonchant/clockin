import {
  ParsedTransactionWithMeta,
  PublicKey,
} from '@solana/web3.js';
import {
  hasVerifiedMemoReceipt,
  MEMO_PROGRAM_ID,
} from '../util/verifyMemoReceipt';

const wallet = new PublicKey('11111111111111111111111111111111');
const signature = 'test-signature';
const memo = 'CLOCKIN_SPIKE|event-123';

function proof(
  overrides: Partial<ParsedTransactionWithMeta> = {},
): ParsedTransactionWithMeta {
  return {
    blockTime: 1,
    meta: {
      err: null,
      fee: 5000,
      innerInstructions: null,
      logMessages: [],
      postBalances: [],
      preBalances: [],
      preTokenBalances: null,
      postTokenBalances: null,
      rewards: null,
      status: {Ok: null},
      loadedAddresses: {readonly: [], writable: []},
      ...overrides.meta,
    },
    slot: 1,
    transaction: {
      message: {
        accountKeys: [
          {pubkey: wallet, signer: true, writable: true},
        ],
        instructions: [
          {
            programId: MEMO_PROGRAM_ID,
            program: 'spl-memo',
            parsed: memo,
            space: memo.length,
          },
        ],
        recentBlockhash: 'blockhash',
      },
      signatures: [signature],
    },
    ...overrides,
  } as ParsedTransactionWithMeta;
}

describe('hasVerifiedMemoReceipt', () => {
  it('accepts only a matching wallet-signed memo receipt with no transaction error', () => {
    expect(hasVerifiedMemoReceipt(proof(), signature, wallet, memo)).toBe(true);
  });

  it('rejects a missing transaction or mismatched signature', () => {
    expect(hasVerifiedMemoReceipt(null, signature, wallet, memo)).toBe(false);
    expect(hasVerifiedMemoReceipt(proof(), 'other-signature', wallet, memo)).toBe(false);
  });

  it('rejects a failed transaction', () => {
    expect(
      hasVerifiedMemoReceipt(proof({meta: {...proof().meta!, err: {InstructionError: [0, 'failed']}}}), signature, wallet, memo),
    ).toBe(false);
  });

  it('rejects a memo signed by a different wallet', () => {
    const otherWallet = new PublicKey('Vote111111111111111111111111111111111111111');
    const tx = proof();
    tx.transaction.message.accountKeys[0].pubkey = otherWallet;
    expect(hasVerifiedMemoReceipt(tx, signature, wallet, memo)).toBe(false);
  });

  it('rejects a different memo or program', () => {
    expect(hasVerifiedMemoReceipt(proof(), signature, wallet, 'other')).toBe(false);
    const tx = proof();
    tx.transaction.message.instructions[0].programId = wallet;
    expect(hasVerifiedMemoReceipt(tx, signature, wallet, memo)).toBe(false);
  });
});
