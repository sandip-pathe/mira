import React from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { firebaseAuth } from './firebase';

type AuthState = { user: User | null; ready: boolean };
const AuthContext = React.createContext<AuthState>({ user: null, ready: false });

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = React.useState<AuthState>({ user: null, ready: false });
  React.useEffect(() => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) setState({ user: null, ready: true });
    }, 8000);
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      settled = true;
      clearTimeout(timeout);
      setState({ user, ready: true });
    });
    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return React.useContext(AuthContext);
}
