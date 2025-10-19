import dbConnect from '@/config/db';
import { CustomError } from '@/lib/errors';
import { basicProfileSchema } from '@/lib/schemas/profile';
import { extractAuthenticatedUserInfo } from '@/lib/utils/authUtils';
import { internalServerError, serializeError, validationErrors } from '@/lib/utils/errorUtils';
import ProfileService from '@/services/ProfileService';
import UserService from '@/services/UserService';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	try {
		await dbConnect();
		const userInfo = await extractAuthenticatedUserInfo();
		// Get user with all profile data
		const basicProfile = await ProfileService.getBasicProfile(userInfo);
		return NextResponse.json({
			success: true,
			user: {
				email: userInfo.email,
				name: userInfo.name,
				firstName: basicProfile.firstName,
				lastName: basicProfile.lastName,
				phone: basicProfile.phone,
				address: basicProfile.address,
				dateOfBirth: basicProfile.dateOfBirth,
				gender: basicProfile.gender,
			},
		});
	} catch (error) {
		if (error instanceof CustomError) {
			return NextResponse.json(serializeError(error), { status: error.status });
		}
		return NextResponse.json(internalServerError(error), { status: 500 });
	}
}

export async function PATCH(request: NextRequest) {
	try {
		await dbConnect();
		const body = await request.json();
		const validatedData = basicProfileSchema.safeParse(body);

		if (!validatedData.success) {
			return NextResponse.json(validationErrors(validatedData.error), { status: 400 });
		}

		const userInfo = await extractAuthenticatedUserInfo();
		const updatedBasicProfile = await ProfileService.updateBasicProfile(
			userInfo,
			validatedData.data
		);

		if (validatedData.data.firstName || validatedData.data.lastName) {
			await UserService.updateUser(userInfo.id, {
				name: [validatedData.data.firstName, validatedData.data.lastName].filter(Boolean).join(' '),
			});
		}

		return NextResponse.json({
			success: true,
			message: 'Profile updated successfully',
			user: {
				email: updatedBasicProfile.email,
				name: userInfo.name,
				firstName: updatedBasicProfile.firstName,
				lastName: updatedBasicProfile.lastName,
				phone: updatedBasicProfile.phone,
				address: updatedBasicProfile.address,
				dateOfBirth: updatedBasicProfile.dateOfBirth,
				gender: updatedBasicProfile.gender,
			},
		});
	} catch (error) {
		if (error instanceof CustomError) {
			return NextResponse.json(serializeError(error), { status: error.status });
		}
		return NextResponse.json(internalServerError(error), { status: 500 });
	}
}

// Keep the old PUT method for backward compatibility
export async function PUT(request: NextRequest) {
	try {
		await dbConnect();
		const userInfo = await extractAuthenticatedUserInfo();
		const body = await request.json();
		const validatedData = basicProfileSchema.safeParse(body);

		if (!validatedData.success) {
			return NextResponse.json(validationErrors(validatedData.error), { status: 400 });
		}

		const updatedBasicProfile = await ProfileService.updateBasicProfile(
			userInfo,
			validatedData.data
		);
		return NextResponse.json({
			success: true,
			message: 'Profile updated successfully',
			user: {
				email: updatedBasicProfile.email,
				name: userInfo.name,
				firstName: updatedBasicProfile.firstName,
				lastName: updatedBasicProfile.lastName,
				phone: updatedBasicProfile.phone,
				address: updatedBasicProfile.address,
				dateOfBirth: updatedBasicProfile.dateOfBirth,
				gender: updatedBasicProfile.gender,
			},
		});
	} catch (error) {
		console.error('Update profile error:', error);

		if (error instanceof jwt.JsonWebTokenError) {
			return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
		}

		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
