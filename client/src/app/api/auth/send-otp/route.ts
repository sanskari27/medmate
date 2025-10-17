import dbConnect from '@/lib/db';
import { generateOTP } from '@/lib/email';
import User from '@/lib/models/User';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
	try {
		await dbConnect();

		const { email } = await request.json();
		console.log('Request received', email);

		// Validate required fields
		if (!email) {
			return NextResponse.json({ error: 'Email is required' }, { status: 400 });
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
		}

		// Generate OTP
		const otp = generateOTP();
		const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

		// Check if user exists
		let user = await User.findOne({ email });

		if (user) {
			// Update existing user's OTP
			user.otp = otp;
			user.otpExpiry = otpExpiry;
		} else {
			// Create new user
			user = new User({
				email,
				otp,
				otpExpiry,
				isVerified: false,
			});
		}

		await user.save();
		console.log('OTP for user', user.email, 'is:', otp);

		// Send OTP email (disabled for now)
		// const emailResult = await sendOTPEmail(email, otp, user.name || email);

		// if (!emailResult.success) {
		// 	return NextResponse.json({ error: 'Failed to send OTP email' }, { status: 500 });
		// }

		return NextResponse.json(
			{
				message: 'OTP sent successfully',
				email: email, // Return email for frontend reference
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Send OTP error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
