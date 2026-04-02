import { useContext } from 'react';
import { AuthContext } from '../context/authContextObject';
import type { AuthContextValue } from '../types/app';

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
