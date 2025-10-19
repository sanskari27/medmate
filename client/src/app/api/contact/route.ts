import { sendContactEmail } from '@/lib/utils/emailUtils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const { firstname, lastname, email, subject, message } = await request.json();

		// Validate required fields
		if (!firstname || !lastname || !email || !subject || !message) {
			return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 });
		}

		const contactEmail = process.env.CONTACT_US_EMAIL;
		if (!contactEmail) {
			console.error('CONTACT_US_EMAIL environment variable not set');
			return NextResponse.json({ error: 'Contact email not configured' }, { status: 500 });
		}

		// Send email using utility function
		const result = await sendContactEmail(contactEmail, {
			firstname,
			lastname,
			email,
			subject,
			message,
		});

		if (!result.success) {
			return NextResponse.json({ error: result.error || 'Failed to send email' }, { status: 500 });
		}

		return NextResponse.json({ success: true, message: 'Message sent successfully' });
	} catch (error) {
		console.error('Contact form error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
