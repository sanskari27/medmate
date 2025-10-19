import dbConnect from '@/config/db';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '@/lib/consts';
import AuthService from '@/services/AuthService';
import UserService from '@/services/UserService';
import { Types } from 'mongoose';
import type { Session } from 'next-auth';
import { type AuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

const authOptions: AuthOptions = {
	providers: [
		GoogleProvider({
			clientId: GOOGLE_CLIENT_ID,
			clientSecret: GOOGLE_CLIENT_SECRET,
		}),

		CredentialsProvider({
			id: 'email-otp',
			name: 'Email OTP',
			credentials: {
				email: { label: 'Email', type: 'text' },
				otp: { label: 'OTP', type: 'text' },
			},
			async authorize(credentials) {
				const { email, otp } = credentials as { email: string; otp: string };
				await dbConnect();
				const user = await AuthService.loginWithEmailOTP(email, otp);
				return {
					id: user._id.toString(),
					email: user.email,
					name: user.name,
					profilePicture: user.profilePicture,
				};
			},
		}),
	],
	session: { strategy: 'jwt' as const },
	pages: {
		signIn: '/login',
		error: '/',
	},
	callbacks: {
		async jwt({ token, user, trigger }: { token: JWT; user?: any; trigger?: string }) {
			// If it's the first time the JWT callback is being run, the user object will be available
			if (user) {
				token.id = user.id;
				token.name = user.name;
				token.email = user.email;
				token.profilePicture = user.profilePicture;
			}

			// If the session is being updated (trigger === 'update'), fetch fresh user data
			if (trigger === 'update' && token.id && typeof token.id === 'string') {
				try {
					await dbConnect();
					const freshUser = await UserService.getUserById(new Types.ObjectId(token.id));
					if (freshUser) {
						token.name = freshUser.name;
						token.email = freshUser.email;
						token.profilePicture = freshUser.profilePicture;
					}
				} catch (error) {
					console.error('Error fetching fresh user data in JWT callback:', error);
				}
			}

			return token;
		},
		async session({ session, token }: { session: Session; token: JWT }) {
			if (session.user) {
				session.user.id = token.id as string;
				session.user.email = token.email as string;
				session.user.name = token.name as string;
				session.user.profilePicture = token.profilePicture as string;
			}
			return session;
		},
		async signIn({ user, account, profile }: { user: any; account: any; profile?: any }) {
			// Create user if first login
			if (account?.provider === 'google') {
				await dbConnect();
				const dbUser = await UserService.createUserByGoogle(user.email, {
					googleId: (account?.providerAccountId ?? '') as string,
					profilePicture: (profile?.picture as string) || undefined,
					name: user.name,
				});
				// Update the user object with database ID and info
				user.id = dbUser._id.toString();
				user.name = dbUser.name || user.name;
				user.profilePicture = dbUser.profilePicture || user.image;
			}
			return true;
		},
	},
};

export default authOptions;
