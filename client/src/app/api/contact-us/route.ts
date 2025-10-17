import { sendContactEmail } from '@/lib/email';
import { contactUsSchema } from '@/schemas/contact-us';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const json = await request.json();
		const parseResult = contactUsSchema.safeParse(json);
		if (!parseResult.success) {
			const errors = parseResult.error.flatten();
			return NextResponse.json(
				{ error: 'Validation failed', details: errors.fieldErrors },
				{ status: 400 }
			);
		}

		const { fullname, email, phone, subject, message } = parseResult.data;

		const [firstname, ...rest] = fullname.trim().split(/\s+/);
		const lastname = rest.join(' ');

		const contactEmail = process.env.CONTACT_US_EMAIL;
		if (!contactEmail) {
			console.error('CONTACT_US_EMAIL environment variable not set');
			return NextResponse.json({ error: 'Contact email not configured' }, { status: 500 });
		}

		const result = await sendContactEmail(contactEmail, {
			firstname,
			lastname,
			email,
			phone,
			subject,
			message,
		});

		if (!result.success) {
			return NextResponse.json({ error: result.error || 'Failed to send email' }, { status: 500 });
		}

		return NextResponse.json({ success: true, message: 'Message sent successfully' });
	} catch (error) {
		console.error('Contact-us API error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
