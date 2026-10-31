import React from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { firebaseAuth } from './firebase';

type AuthState = { user: User | null; ready: boolean };
const AuthContext = React.createContext<AuthState>({ user: null, ready: false });

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = React.useState<AuthState>({ user: null, ready: false });
  React.useEffect(
    () => onAuthStateChanged(firebaseAuth, (user) => setState({ user, ready: true })),
    [],
  );
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return React.useContext(AuthContext);
}
