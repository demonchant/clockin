import {PublicKey} from '@solana/web3.js';
import {
  Account as AuthorizedAccount,
  AuthorizationResult,
  AuthorizeAPI,
  AuthToken,
  Base64EncodedAddress,
  DeauthorizeAPI,
} from '@solana-mobile/mobile-wallet-adapter-protocol';
import {toUint8Array} from 'js-base64';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useState, useCallback, useMemo, useEffect, ReactNode} from 'react';
import React from 'react';
import {SOLANA_CHAIN} from './ConnectionProvider';

export type Account = Readonly<{
  address: Base64EncodedAddress;
  label?: string;
  publicKey: PublicKey;
}>;

const LEGACY_AUTHORIZATION_KEY = 'openmic.wallet.authorization.v1';

type Authorization = Readonly<{
  accounts: Account[];
  authToken: AuthToken;
  selectedAccount: Account;
}>;

function getAccountFromAuthorizedAccount(account: AuthorizedAccount): Account {
  return {
    ...account,
    publicKey: getPublicKeyFromAddress(account.address),
  };
}

function getAuthorizationFromAuthorizationResult(
  authorizationResult: AuthorizationResult,
  previouslySelectedAccount?: Account,
): Authorization {
  if (authorizationResult.accounts.length === 0) {
    throw new Error('Wallet authorization returned no accounts.');
  }
  let selectedAccount: Account;
  if (
    // We have yet to select an account.
    previouslySelectedAccount == null ||
    // The previously selected account is no longer in the set of authorized addresses.
    !authorizationResult.accounts.some(
      ({address}) => address === previouslySelectedAccount.address,
    )
  ) {
    const firstAccount = authorizationResult.accounts[0];
    selectedAccount = getAccountFromAuthorizedAccount(firstAccount);
  } else {
    selectedAccount = previouslySelectedAccount;
  }
  return {
    accounts: authorizationResult.accounts.map(getAccountFromAuthorizedAccount),
    authToken: authorizationResult.auth_token,
    selectedAccount,
  };
}

function getPublicKeyFromAddress(address: Base64EncodedAddress): PublicKey {
  const publicKeyByteArray = toUint8Array(address);
  return new PublicKey(publicKeyByteArray);
}

export const APP_IDENTITY = {
  name: 'OpenMic Passport',
  uri: 'https://demonchant.github.io',
};

export interface AuthorizationProviderContext {
  accounts: Account[] | null;
  authorizationLoaded: boolean;
  authorizeSession: (wallet: AuthorizeAPI) => Promise<Account>;
  deauthorizeSession: (wallet: DeauthorizeAPI) => void;
  onChangeAccount: (nextSelectedAccount: Account) => void;
  selectedAccount: Account | null;
}

const AuthorizationContext = React.createContext<AuthorizationProviderContext>({
  accounts: null,
  authorizationLoaded: false,
  authorizeSession: (_wallet: AuthorizeAPI) => {
    throw new Error('AuthorizationProvider not initialized');
  },
  deauthorizeSession: (_wallet: DeauthorizeAPI) => {
    throw new Error('AuthorizationProvider not initialized');
  },
  onChangeAccount: (_nextSelectedAccount: Account) => {
    throw new Error('AuthorizationProvider not initialized');
  },
  selectedAccount: null,
});

function AuthorizationProvider(props: {children: ReactNode}) {
  const {children} = props;
  const [authorization, setAuthorization] = useState<Authorization | null>(
    null,
  );
  const [authorizationLoaded, setAuthorizationLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    void AsyncStorage.removeItem(LEGACY_AUTHORIZATION_KEY).catch(() => {}).finally(() => {
      if (active) setAuthorizationLoaded(true);
    });
    return () => { active = false; };
  }, []);
  const handleAuthorizationResult = useCallback(
    async (
      authorizationResult: AuthorizationResult,
    ): Promise<Authorization> => {
      const nextAuthorization = getAuthorizationFromAuthorizationResult(
        authorizationResult,
        authorization?.selectedAccount,
      );
      await setAuthorization(nextAuthorization);
      return nextAuthorization;
    },
    [authorization, setAuthorization],
  );
  const authorizeSession = useCallback(
    async (wallet: AuthorizeAPI) => {
      const authorizationResult = await wallet.authorize({
        chain: SOLANA_CHAIN,
        auth_token: authorization?.authToken,
        identity: APP_IDENTITY,
      });
      return (await handleAuthorizationResult(authorizationResult))
        .selectedAccount;
    },
    [authorization, handleAuthorizationResult],
  );
  const deauthorizeSession = useCallback(
    async (wallet: DeauthorizeAPI) => {
      if (authorization?.authToken == null) {
        return;
      }
      await wallet.deauthorize({auth_token: authorization.authToken});
      await AsyncStorage.removeItem(LEGACY_AUTHORIZATION_KEY);
      setAuthorization(null);
    },
    [authorization, setAuthorization],
  );
  const onChangeAccount = useCallback(
    (nextSelectedAccount: Account) => {
      setAuthorization(currentAuthorization => {
        if (
          !currentAuthorization?.accounts.some(
            ({address}) => address === nextSelectedAccount.address,
          )
        ) {
          throw new Error(
            `${nextSelectedAccount.address} is not one of the available addresses`,
          );
        }
        const nextAuthorization = {
          ...currentAuthorization,
          selectedAccount: nextSelectedAccount,
        };
        return nextAuthorization;
      });
    },
    [setAuthorization],
  );
  const value = useMemo(
    () => ({
      accounts: authorization?.accounts ?? null,
      authorizationLoaded,
      authorizeSession,
      deauthorizeSession,
      onChangeAccount,
      selectedAccount: authorization?.selectedAccount ?? null,
    }),
    [authorization, authorizationLoaded, authorizeSession, deauthorizeSession, onChangeAccount],
  );

  return (
    <AuthorizationContext.Provider value={value}>
      {children}
    </AuthorizationContext.Provider>
  );
}

const useAuthorization = () => React.useContext(AuthorizationContext);

export {AuthorizationProvider, useAuthorization};
