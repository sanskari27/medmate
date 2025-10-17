import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { basicProfileSchema } from '@/schemas/profile';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
	try {
		const token = request.cookies.get('auth-token')?.value;

		if (!token) {
			return NextResponse.json({ error: 'No token provided' }, { status: 401 });
		}

		// Verify JWT token
		const decoded = jwt.verify(token, JWT_SECRET) as any;

		if (!decoded.userId) {
			return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
		}

		await dbConnect();

		// Get user with all profile data
		const user = await User.findById(decoded.userId).select('-otp -otpExpiry');

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			user: {
				id: user._id,
				email: user.email,
				name: user.name,
				firstName: user.firstName,
				lastName: user.lastName,
				phone: user.phone,
				phoneNumber: user.phoneNumber,
				address: user.address,
				dateOfBirth: user.dateOfBirth,
				gender: user.gender,
				isVerified: user.isVerified,
				provider: user.provider,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			},
		});
	} catch (error) {
		console.error('Get profile error:', error);

		if (error instanceof jwt.JsonWebTokenError) {
			return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
		}

		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function PATCH(request: NextRequest) {
	try {
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
		const validatedData = basicProfileSchema.parse(body);

		await dbConnect();

		// Update user
		const updatedUser = await User.findByIdAndUpdate(
			decoded.userId,
			{
				firstName: validatedData.firstName,
				lastName: validatedData.lastName,
				email: validatedData.email,
				phone: validatedData.phone,
				address: validatedData.address,
				dateOfBirth: validatedData.dateOfBirth,
				gender: validatedData.gender,
				updatedAt: new Date(),
			},
			{ new: true }
		).select('-otp -otpExpiry');

		if (!updatedUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			message: 'Profile updated successfully',
			user: {
				id: updatedUser._id,
				email: updatedUser.email,
				name: updatedUser.name,
				firstName: updatedUser.firstName,
				lastName: updatedUser.lastName,
				phone: updatedUser.phone,
				phoneNumber: updatedUser.phoneNumber,
				address: updatedUser.address,
				dateOfBirth: updatedUser.dateOfBirth,
				gender: updatedUser.gender,
				isVerified: updatedUser.isVerified,
				provider: updatedUser.provider,
				createdAt: updatedUser.createdAt,
				updatedAt: updatedUser.updatedAt,
			},
		});
	} catch (error) {
		console.error('Update profile error:', error);

		if (error instanceof jwt.JsonWebTokenError) {
			return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
		}

		if (error instanceof Error && error.name === 'ZodError') {
			return NextResponse.json(
				{ error: 'Validation error', details: error.message },
				{ status: 400 }
			);
		}

		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

// Keep the old PUT method for backward compatibility
export async function PUT(request: NextRequest) {
	try {
		const token = request.cookies.get('auth-token')?.value;

		if (!token) {
			return NextResponse.json({ error: 'No token provided' }, { status: 401 });
		}

		// Verify JWT token
		const decoded = jwt.verify(token, JWT_SECRET) as any;

		if (!decoded.userId) {
			return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
		}

		const { name, phoneNumber } = await request.json();

		// Validate input
		if (!name || !phoneNumber) {
			return NextResponse.json({ error: 'Name and phone number are required' }, { status: 400 });
		}

		await dbConnect();

		// Update user
		const updatedUser = await User.findByIdAndUpdate(
			decoded.userId,
			{
				name: name.trim(),
				phoneNumber: phoneNumber.trim(),
				updatedAt: new Date(),
			},
			{ new: true }
		).select('-otp -otpExpiry');

		if (!updatedUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		return NextResponse.json({
			user: {
				id: updatedUser._id,
				email: updatedUser.email,
				name: updatedUser.name,
				phoneNumber: updatedUser.phoneNumber,
				isVerified: updatedUser.isVerified,
				createdAt: updatedUser.createdAt,
				updatedAt: updatedUser.updatedAt,
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
