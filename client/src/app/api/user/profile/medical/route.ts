import dbConnect from '@/config/db';
import { CustomError } from '@/lib/errors';
import { medicalProfileSchema } from '@/lib/schemas/profile';
import { extractAuthenticatedUserInfo } from '@/lib/utils/authUtils';
import { internalServerError, serializeError, validationErrors } from '@/lib/utils/errorUtils';
import ProfileService from '@/services/ProfileService';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	try {
		await dbConnect();

		const userInfo = await extractAuthenticatedUserInfo();

		const medicalProfile = await ProfileService.getMedicalProfile(userInfo);
		return NextResponse.json({
			success: true,
			data: medicalProfile,
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

		const userInfo = await extractAuthenticatedUserInfo();

		const body = await request.json();
		const validatedData = medicalProfileSchema.safeParse(body);

		if (!validatedData.success) {
			return NextResponse.json(validationErrors(validatedData.error), { status: 400 });
		}

		const updatedMedicalProfile = await ProfileService.updateMedicalProfile(
			userInfo,
			validatedData.data
		);

		return NextResponse.json({
			success: true,
			message: 'Medical profile updated successfully',
			data: updatedMedicalProfile,
		});
	} catch (error) {
		if (error instanceof CustomError) {
			return NextResponse.json(serializeError(error), { status: error.status });
		}
		return NextResponse.json(internalServerError(error), { status: 500 });
	}
}
