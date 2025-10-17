import connectDB from '@/lib/db';
import MedicalProfile from '@/lib/models/MedicalProfile';
import { medicalProfileSchema } from '@/schemas/profile';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
	try {
		await connectDB();

		const token = request.cookies.get('auth-token')?.value;
		if (!token) {
			return NextResponse.json({ error: 'No token provided' }, { status: 401 });
		}

		// Verify JWT token
		const decoded = jwt.verify(token, JWT_SECRET) as any;
		if (!decoded.userId) {
			return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
		}

		// Get medical profile
		const medicalProfile = await MedicalProfile.findOne({ userId: decoded.userId });

		if (!medicalProfile) {
			return NextResponse.json({
				success: true,
				data: null,
				message: 'No medical profile found',
			});
		}

		return NextResponse.json({
			success: true,
			data: medicalProfile,
		});
	} catch (error) {
		console.error('Medical profile fetch error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function PATCH(request: NextRequest) {
	try {
		await connectDB();

		const token = request.cookies.get('auth-token')?.value;
		if (!token) {
			return NextResponse.json({ error: 'No token provided' }, { status: 401 });
		}

		// Verify JWT token
		const decoded = jwt.verify(token, JWT_SECRET) as any;
		if (!decoded.userId) {
			return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
		}

		const body = await request.json();
		const validatedData = medicalProfileSchema.parse(body);

		// Update or create medical profile
		const medicalProfile = await MedicalProfile.findOneAndUpdate(
			{ userId: decoded.userId },
			{
				...validatedData,
				userId: decoded.userId,
			},
			{ upsert: true, new: true }
		);

		return NextResponse.json({
			success: true,
			message: 'Medical profile updated successfully',
			data: medicalProfile,
		});
	} catch (error) {
		console.error('Medical profile update error:', error);

		if (error instanceof Error && error.name === 'ZodError') {
			return NextResponse.json(
				{ error: 'Validation error', details: error.message },
				{ status: 400 }
			);
		}

		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
