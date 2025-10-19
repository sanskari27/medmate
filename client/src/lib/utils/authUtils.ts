import authOptions from '@/config/authOptions';
import { Types } from 'mongoose';
import { getServerSession } from 'next-auth';
import { UnauthorizedError } from '../errors';

export interface IAuthenticatedUserInfo {
	id: Types.ObjectId;
	email: string;
	name?: string;
}

export const extractAuthenticatedUserInfo = async (): Promise<IAuthenticatedUserInfo> => {
	try {
		const session = await getServerSession(authOptions);
		const userId = session?.user;
		if (!userId) {
			throw new UnauthorizedError();
		}
		return {
			id: new Types.ObjectId(userId.id),
			email: userId.email,
			name: userId.name ?? undefined,
		};
	} catch (error) {
		console.error('Error extracting authenticated user info:', error);
		throw new UnauthorizedError();
	}
};
