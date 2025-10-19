import { z } from 'zod';

export const contactUsSchema = z.object({
	fullname: z
		.string({ required_error: 'Full name is required' })
		.min(2, 'Full name must be at least 2 characters')
		.max(120, 'Full name must be at most 120 characters'),
	phone: z
		.string({ required_error: 'Phone number is required' })
		.trim()
		.min(7, 'Phone number seems too short')
		.max(20, 'Phone number seems too long')
		.regex(/^[+\d][\d\s().-]*$/, 'Enter a valid phone number'),
	email: z.string({ required_error: 'Email is required' }).email('Enter a valid email address'),
	subject: z
		.string({ required_error: 'Subject is required' })
		.min(3, 'Subject must be at least 3 characters')
		.max(150, 'Subject must be at most 150 characters'),
	message: z
		.string({ required_error: 'Message is required' })
		.min(10, 'Message must be at least 10 characters')
		.max(2000, 'Message must be at most 2000 characters'),
});

export type ContactUsInput = z.infer<typeof contactUsSchema>;
