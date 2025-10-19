import dbConnect from '@/lib/db';
import Newsletter from '@/lib/models/Newsletter';
import { newsletterSchema } from '@/lib/schemas/newsletter';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		// Connect to database
		await dbConnect();

		// Parse and validate request body
		const body = await request.json();
		const validatedData = newsletterSchema.parse(body);

		// Check if email already exists
		const existingSubscription = await Newsletter.findOne({
			email: validatedData.email,
		});

		if (existingSubscription) {
			if (existingSubscription.isActive) {
				return NextResponse.json(
					{
						success: false,
						message: 'This email is already subscribed to our newsletter',
					},
					{ status: 409 }
				);
			} else {
				// Reactivate subscription
				existingSubscription.isActive = true;
				existingSubscription.subscribedAt = new Date();
				existingSubscription.unsubscribedAt = undefined;
				await existingSubscription.save();

				return NextResponse.json({
					success: true,
					message: 'Welcome back! You have been resubscribed to our newsletter',
				});
			}
		}

		// Create new subscription
		const newsletter = new Newsletter({
			email: validatedData.email,
			isActive: true,
			subscribedAt: new Date(),
		});

		await newsletter.save();

		return NextResponse.json({
			success: true,
			message: 'Thank you for subscribing to our newsletter!',
		});
	} catch (error) {
		console.error('Newsletter subscription error:', error);

		// Handle validation errors
		if (error instanceof Error && error.name === 'ZodError') {
			return NextResponse.json(
				{
					success: false,
					message: 'Invalid email address',
					errors: error.message,
				},
				{ status: 400 }
			);
		}

		// Handle MongoDB duplicate key error
		if (
			error instanceof Error &&
			error.name === 'MongoServerError' &&
			(error as any).code === 11000
		) {
			return NextResponse.json(
				{
					success: false,
					message: 'This email is already subscribed to our newsletter',
				},
				{ status: 409 }
			);
		}

		return NextResponse.json(
			{
				success: false,
				message: 'Failed to subscribe to newsletter. Please try again later.',
			},
			{ status: 500 }
		);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		// Connect to database
		await dbConnect();

		// Parse and validate request body
		const body = await request.json();
		const validatedData = newsletterSchema.parse(body);

		// Find and deactivate subscription
		const subscription = await Newsletter.findOne({
			email: validatedData.email,
			isActive: true,
		});

		if (!subscription) {
			return NextResponse.json(
				{
					success: false,
					message: 'Email not found in our newsletter subscription list',
				},
				{ status: 404 }
			);
		}

		subscription.isActive = false;
		subscription.unsubscribedAt = new Date();
		await subscription.save();

		return NextResponse.json({
			success: true,
			message: 'You have been unsubscribed from our newsletter',
		});
	} catch (error) {
		console.error('Newsletter unsubscription error:', error);

		// Handle validation errors
		if (error instanceof Error && error.name === 'ZodError') {
			return NextResponse.json(
				{
					success: false,
					message: 'Invalid email address',
					errors: error.message,
				},
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{
				success: false,
				message: 'Failed to unsubscribe from newsletter. Please try again later.',
			},
			{ status: 500 }
		);
	}
}
