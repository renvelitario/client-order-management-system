import { createContext } from 'react';
import type { AuthContextValue } from '../types/app';

export const AuthContext = createContext<AuthContextValue | null>(null);
