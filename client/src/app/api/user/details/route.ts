import dbConnect from '@/config/db';
import { CustomError } from '@/lib/errors';
import { extractAuthenticatedUserInfo } from '@/lib/utils/authUtils';
import { internalServerError, serializeError } from '@/lib/utils/errorUtils';
import UserService from '@/services/UserService';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	try {
		const userInfo = await extractAuthenticatedUserInfo();

		await dbConnect();
		const user = await UserService.getUserById(userInfo.id);

		return NextResponse.json({
			user: {
				id: userInfo.id,
				email: user.email,
				name: user.name,
				profilePicture: user.profilePicture,
			},
		});
	} catch (error) {
		if (error instanceof CustomError) {
			return NextResponse.json(serializeError(error), { status: error.status });
		}
		return NextResponse.json(internalServerError(error), { status: 500 });
	}
}
