'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface User {
	id: string;
	email: string;
	name: string;
	phoneNumber?: string;
	isVerified: boolean;
	provider?: 'email' | 'google';
	createdAt: string;
	updatedAt: string;
}

interface AuthContextType {
	user: User | null;
	loading: boolean;
	login: (userData: User) => void;
	logout: () => Promise<void>;
	checkAuth: () => Promise<void>;
	updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	const login = (userData: User) => {
		setUser(userData);
	};

	const logout = async () => {
		try {
			await fetch('/api/auth/logout', {
				method: 'POST',
			});
			setUser(null);
		} catch (error) {
			console.error('Logout error:', error);
		}
	};

	const checkAuth = async () => {
		try {
			const response = await fetch('/api/auth/me');
			if (response.ok) {
				const data = await response.json();
				setUser(data.user);
			} else {
				setUser(null);
			}
		} catch (error) {
			console.error('Auth check error:', error);
			setUser(null);
		} finally {
			setLoading(false);
		}
	};

	const updateUser = async (userData: Partial<User>) => {
		try {
			const response = await fetch('/api/auth/update-profile', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(userData),
			});

			if (response.ok) {
				const data = await response.json();
				setUser(data.user);
			} else {
				throw new Error('Failed to update profile');
			}
		} catch (error) {
			console.error('Update profile error:', error);
			throw error;
		}
	};

	useEffect(() => {
		checkAuth();
	}, []);

	return (
		<AuthContext.Provider value={{ user, loading, login, logout, checkAuth, updateUser }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}
