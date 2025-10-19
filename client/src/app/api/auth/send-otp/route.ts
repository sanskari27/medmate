import dbConnect from '@/lib/db';
import { emailSchema } from '@/lib/schemas/common';
import { internalServerError, validationErrors } from '@/lib/utils/errorUtils';
import AuthService from '@/services/AuthService';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
	try {
		await dbConnect();

		const { email } = await request.json();
		const validatedData = emailSchema.safeParse(email);
		if (!validatedData.success) {
			return NextResponse.json(validationErrors(validatedData.error), { status: 400 });
		}

		await AuthService.sendEmailOTP(email);
		return NextResponse.json(
			{
				success: true,
				title: 'OTP_SENT',
				message: 'OTP sent successfully',
				email: email,
			},
			{ status: 200 }
		);
	} catch (error) {
		return NextResponse.json(internalServerError(error), { status: 500 });
	}
}
