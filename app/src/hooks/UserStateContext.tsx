import React, { createContext, useContext, type PropsWithChildren } from 'react';
import { useUserState, type UseUserStateResult } from './useUserState';

const UserStateContext = createContext<UseUserStateResult | null>(null);

export function UserStateProvider({ children }: PropsWithChildren) {
  const value = useUserState();
  return <UserStateContext.Provider value={value}>{children}</UserStateContext.Provider>;
}

export function useUserStateContext(): UseUserStateResult {
  const ctx = useContext(UserStateContext);
  if (!ctx) throw new Error('UserStateProvider not mounted');
  return ctx;
}
