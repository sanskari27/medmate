import { z } from 'zod';

export const basicProfileSchema = z.object({
	firstName: z
		.string()
		.min(2, 'First name must be at least 2 characters')
		.max(50, 'First name must be less than 50 characters'),
	lastName: z
		.string()
		.min(2, 'Last name must be at least 2 characters')
		.max(50, 'Last name must be less than 50 characters'),
	email: z.string().email('Please enter a valid email address'),
	phone: z
		.string()
		.min(10, 'Phone number must be at least 10 digits')
		.max(15, 'Phone number must be less than 15 digits'),
	address: z.object({
		street: z
			.string()
			.min(5, 'Street address must be at least 5 characters')
			.max(100, 'Street address must be less than 100 characters'),
		city: z
			.string()
			.min(2, 'City must be at least 2 characters')
			.max(50, 'City must be less than 50 characters'),
		state: z
			.string()
			.min(2, 'State must be at least 2 characters')
			.max(50, 'State must be less than 50 characters'),
		zipCode: z
			.string()
			.min(5, 'ZIP code must be at least 5 characters')
			.max(10, 'ZIP code must be less than 10 characters'),
		country: z
			.string()
			.min(2, 'Country must be at least 2 characters')
			.max(50, 'Country must be less than 50 characters'),
	}),
	dateOfBirth: z.string().min(1, 'Date of birth is required'),
	gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']),
});

export const medicalProfileSchema = z.object({
	medicalConditions: z.array(z.string()).default([]),
	allergies: z.array(z.string()).default([]),
	currentMedications: z.array(z.string()).default([]),
	previousSurgeries: z.array(z.string()).default([]),
	emergencyContact: z.object({
		name: z
			.string()
			.min(2, 'Emergency contact name must be at least 2 characters')
			.max(50, 'Emergency contact name must be less than 50 characters'),
		relationship: z
			.string()
			.min(2, 'Relationship must be at least 2 characters')
			.max(30, 'Relationship must be less than 30 characters'),
		phone: z
			.string()
			.min(10, 'Emergency contact phone must be at least 10 digits')
			.max(15, 'Emergency contact phone must be less than 15 digits'),
	}),
	bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
	height: z
		.number()
		.min(50, 'Height must be at least 50 cm')
		.max(300, 'Height must be less than 300 cm')
		.optional(),
	weight: z
		.number()
		.min(10, 'Weight must be at least 10 kg')
		.max(500, 'Weight must be less than 500 kg')
		.optional(),
	medicalHistory: z
		.string()
		.max(2000, 'Medical history must be less than 2000 characters')
		.optional(),
});

export type BasicProfileInput = z.infer<typeof basicProfileSchema>;
export type MedicalProfileInput = z.infer<typeof medicalProfileSchema>;
