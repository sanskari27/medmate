import { z } from 'zod';

export const newsletterSchema = z.object({
	email: z
		.string({ required_error: 'Email is required' })
		.email('Please enter a valid email address')
		.min(1, 'Email is required')
		.max(255, 'Email is too long')
		.toLowerCase()
		.trim(),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
