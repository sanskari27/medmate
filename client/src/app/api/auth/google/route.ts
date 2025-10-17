import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export async function POST(request: NextRequest) {
	try {
		await dbConnect();

		const { credential } = await request.json();

		if (!credential) {
			return NextResponse.json({ error: 'No credential provided' }, { status: 400 });
		}

		// Verify the Google ID token
		const ticket = await client.verifyIdToken({
			idToken: credential,
			audience: GOOGLE_CLIENT_ID,
		});

		const payload = ticket.getPayload();
		if (!payload) {
			return NextResponse.json({ error: 'Invalid Google token' }, { status: 400 });
		}

		const { sub: googleId, email, name } = payload;
		console.log('payload', payload);

		if (!email || !name) {
			return NextResponse.json({ error: 'Missing required user information' }, { status: 400 });
		}

		// Check if user exists by email or googleId
		let user = await User.findOne({
			$or: [{ email }, { googleId }],
		});

		console.log('user', user);

		if (user) {
			// Update existing user with Google info if they don't have it
			if (!user.googleId) {
				user.googleId = googleId;
				user.provider = 'google';
				user.name = name;
				user.email = email;
				user.isVerified = true; // Google users are automatically verified
				await user.save();
			}
		} else {
			// Create new user
			user = new User({
				email,
				name,
				googleId,
				provider: 'google',
				isVerified: true, // Google users are automatically verified
			});
			await user.save();
		}

		// Generate JWT token
		const token = jwt.sign(
			{
				userId: user._id,
				email: user.email,
				name: user.name,
			},
			JWT_SECRET,
			{ expiresIn: '7d' }
		);

		// Set HTTP-only cookie
		const response = NextResponse.json(
			{
				message: 'Google login successful',
				user: {
					id: user._id,
					email: user.email,
					name: user.name,
					phoneNumber: user.phoneNumber,
					isVerified: user.isVerified,
					provider: user.provider,
				},
			},
			{ status: 200 }
		);

		// Set secure cookie
		response.cookies.set('auth-token', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 7 * 24 * 60 * 60, // 7 days
			path: '/',
		});

		return response;
	} catch (error) {
		console.error('Google auth error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
