'use client';

import { useProfileData } from '@/components/context/ProfileDataProvider';
import { cn } from '@/lib/utils';
import {
	basicProfileSchema,
	medicalProfileSchema,
	type BasicProfileInput,
	type MedicalProfileInput,
} from '@/schemas/profile';
import { zodResolver } from '@hookform/resolvers/zod';
import { Heart, User } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
	const { userProfile, medicalProfile } = useProfileData();
	const [activeTab, setActiveTab] = useState<'basic' | 'medical'>('basic');
	const [isSubmitting, setIsSubmitting] = useState(false);
	console.log('userProfile', userProfile);
	console.log('medicalProfile', medicalProfile);

	const basicForm = useForm<BasicProfileInput>({
		resolver: zodResolver(basicProfileSchema),
		defaultValues: {
			firstName: userProfile?.firstName || '',
			lastName: userProfile?.lastName || '',
			email: userProfile?.email || '',
			phone: userProfile?.phone || '',
			address: {
				street: userProfile?.address?.street || '',
				city: userProfile?.address?.city || '',
				state: userProfile?.address?.state || '',
				zipCode: userProfile?.address?.zipCode || '',
				country: userProfile?.address?.country || '',
			},
			dateOfBirth: userProfile?.dateOfBirth || '',
			gender:
				(userProfile?.gender as 'male' | 'female' | 'other' | 'prefer-not-to-say') ||
				'prefer-not-to-say',
		},
	});

	const medicalForm = useForm<MedicalProfileInput>({
		resolver: zodResolver(medicalProfileSchema),
		defaultValues: {
			medicalConditions: medicalProfile?.medicalConditions || [],
			allergies: medicalProfile?.allergies || [],
			currentMedications: medicalProfile?.currentMedications || [],
			previousSurgeries: medicalProfile?.previousSurgeries || [],
			emergencyContact: {
				name: medicalProfile?.emergencyContact?.name || '',
				relationship: medicalProfile?.emergencyContact?.relationship || '',
				phone: medicalProfile?.emergencyContact?.phone || '',
			},
			bloodType:
				(medicalProfile?.bloodType as
					| 'A+'
					| 'A-'
					| 'B+'
					| 'B-'
					| 'AB+'
					| 'AB-'
					| 'O+'
					| 'O-'
					| undefined) || undefined,
			height: medicalProfile?.height || undefined,
			weight: medicalProfile?.weight || undefined,
			medicalHistory: medicalProfile?.medicalHistory || '',
		},
	});

	// No need for client-side data fetching or authentication checks
	// as these are handled server-side in the layout

	const onBasicSubmit = async (data: BasicProfileInput) => {
		setIsSubmitting(true);
		try {
			const response = await fetch('/api/profile/basic', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error('Failed to update profile');
			}

			toast.success('Profile updated successfully!');
		} catch (error) {
			console.error('Profile update error:', error);
			toast.error('Failed to update profile. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const onMedicalSubmit = async (data: MedicalProfileInput) => {
		setIsSubmitting(true);
		try {
			const response = await fetch('/api/profile/medical', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error('Failed to update medical profile');
			}

			toast.success('Medical profile updated successfully!');
		} catch (error) {
			console.error('Medical profile update error:', error);
			toast.error('Failed to update medical profile. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const addArrayItem = (field: keyof MedicalProfileInput, value: string) => {
		if (!value.trim()) return;

		const currentValues = medicalForm.getValues(field) as string[];
		medicalForm.setValue(field, [...currentValues, value.trim()]);
	};

	const removeArrayItem = (field: keyof MedicalProfileInput, index: number) => {
		const currentValues = medicalForm.getValues(field) as string[];
		medicalForm.setValue(
			field,
			currentValues.filter((_, i) => i !== index)
		);
	};

	// No loading or authentication checks needed as they're handled server-side

	return (
		<div className='bg-gray-50'>
			<div className='py-14 bg-slate-800 ' />
			<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20'>
				<div className='bg-white rounded-lg shadow-sm'>
					{/* Header */}
					<div className='px-6 py-4 border-b border-gray-200'>
						<h1 className='text-2xl font-bold text-gray-900'>Profile Settings</h1>
						<p className='text-gray-600'>Manage your personal and medical information</p>
					</div>

					{/* Tabs */}
					<div className='border-b border-gray-200'>
						<nav className='-mb-px flex space-x-8 px-6'>
							<button
								onClick={() => setActiveTab('basic')}
								className={cn(
									'py-4 px-1 border-b-2 font-medium text-sm',
									activeTab === 'basic'
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								)}
							>
								<User className='w-5 h-5 inline mr-2' />
								Basic Information
							</button>
							<button
								onClick={() => setActiveTab('medical')}
								className={cn(
									'py-4 px-1 border-b-2 font-medium text-sm',
									activeTab === 'medical'
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								)}
							>
								<Heart className='w-5 h-5 inline mr-2' />
								Medical Profile
							</button>
						</nav>
					</div>

					{/* Content */}
					<div className='p-6'>
						{activeTab === 'basic' && (
							<form onSubmit={basicForm.handleSubmit(onBasicSubmit as any)} className='space-y-6'>
								{/* Personal Information */}
								<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-2'>
											First Name *
										</label>
										<input
											{...basicForm.register('firstName')}
											type='text'
											className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
										/>
										{basicForm.formState.errors.firstName && (
											<p className='text-red-500 text-sm mt-1'>
												{basicForm.formState.errors.firstName.message}
											</p>
										)}
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-700 mb-2'>
											Last Name *
										</label>
										<input
											{...basicForm.register('lastName')}
											type='text'
											className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
										/>
										{basicForm.formState.errors.lastName && (
											<p className='text-red-500 text-sm mt-1'>
												{basicForm.formState.errors.lastName.message}
											</p>
										)}
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-700 mb-2'>Email *</label>
										<input
											{...basicForm.register('email')}
											type='email'
											className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
										/>
										{basicForm.formState.errors.email && (
											<p className='text-red-500 text-sm mt-1'>
												{basicForm.formState.errors.email.message}
											</p>
										)}
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-700 mb-2'>Phone *</label>
										<input
											{...basicForm.register('phone')}
											type='tel'
											className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
										/>
										{basicForm.formState.errors.phone && (
											<p className='text-red-500 text-sm mt-1'>
												{basicForm.formState.errors.phone.message}
											</p>
										)}
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-700 mb-2'>
											Date of Birth *
										</label>
										<input
											{...basicForm.register('dateOfBirth')}
											type='date'
											className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
										/>
										{basicForm.formState.errors.dateOfBirth && (
											<p className='text-red-500 text-sm mt-1'>
												{basicForm.formState.errors.dateOfBirth.message}
											</p>
										)}
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-700 mb-2'>Gender</label>
										<select
											{...basicForm.register('gender')}
											className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
										>
											<option value='prefer-not-to-say'>Prefer not to say</option>
											<option value='male'>Male</option>
											<option value='female'>Female</option>
											<option value='other'>Other</option>
										</select>
									</div>
								</div>

								{/* Address */}
								<div className='space-y-4'>
									<h3 className='text-lg font-medium text-gray-900'>Address</h3>
									<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
										<div className='md:col-span-2'>
											<label className='block text-sm font-medium text-gray-700 mb-2'>
												Street Address *
											</label>
											<input
												{...basicForm.register('address.street')}
												type='text'
												className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
											/>
											{basicForm.formState.errors.address?.street && (
												<p className='text-red-500 text-sm mt-1'>
													{basicForm.formState.errors.address.street.message}
												</p>
											)}
										</div>

										<div>
											<label className='block text-sm font-medium text-gray-700 mb-2'>City *</label>
											<input
												{...basicForm.register('address.city')}
												type='text'
												className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
											/>
											{basicForm.formState.errors.address?.city && (
												<p className='text-red-500 text-sm mt-1'>
													{basicForm.formState.errors.address.city.message}
												</p>
											)}
										</div>

										<div>
											<label className='block text-sm font-medium text-gray-700 mb-2'>
												State *
											</label>
											<input
												{...basicForm.register('address.state')}
												type='text'
												className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
											/>
											{basicForm.formState.errors.address?.state && (
												<p className='text-red-500 text-sm mt-1'>
													{basicForm.formState.errors.address.state.message}
												</p>
											)}
										</div>

										<div>
											<label className='block text-sm font-medium text-gray-700 mb-2'>
												ZIP Code *
											</label>
											<input
												{...basicForm.register('address.zipCode')}
												type='text'
												className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
											/>
											{basicForm.formState.errors.address?.zipCode && (
												<p className='text-red-500 text-sm mt-1'>
													{basicForm.formState.errors.address.zipCode.message}
												</p>
											)}
										</div>

										<div>
											<label className='block text-sm font-medium text-gray-700 mb-2'>
												Country *
											</label>
											<input
												{...basicForm.register('address.country')}
												type='text'
												className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
											/>
											{basicForm.formState.errors.address?.country && (
												<p className='text-red-500 text-sm mt-1'>
													{basicForm.formState.errors.address.country.message}
												</p>
											)}
										</div>
									</div>
								</div>

								<div className='flex justify-end'>
									<button
										type='submit'
										disabled={isSubmitting}
										className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
									>
										{isSubmitting ? 'Saving...' : 'Save Changes'}
									</button>
								</div>
							</form>
						)}

						{activeTab === 'medical' && (
							<div>
								<form
									onSubmit={medicalForm.handleSubmit(onMedicalSubmit as any)}
									className='space-y-6'
								>
									{/* Medical Conditions */}
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-2'>
											Medical Conditions
										</label>
										<div className='space-y-2'>
											{medicalForm.watch('medicalConditions').map((condition, index) => (
												<div key={index} className='flex items-center space-x-2'>
													<span className='px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm'>
														{condition}
													</span>
													<button
														type='button'
														onClick={() => removeArrayItem('medicalConditions', index)}
														className='text-red-500 hover:text-red-700'
													>
														×
													</button>
												</div>
											))}
											<div className='flex space-x-2'>
												<input
													type='text'
													placeholder='Add medical condition'
													className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
													onKeyPress={(e) => {
														if (e.key === 'Enter') {
															e.preventDefault();
															addArrayItem('medicalConditions', e.currentTarget.value);
															e.currentTarget.value = '';
														}
													}}
												/>
												<button
													type='button'
													onClick={(e) => {
														const input = e.currentTarget
															.previousElementSibling as HTMLInputElement;
														addArrayItem('medicalConditions', input.value);
														input.value = '';
													}}
													className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
												>
													Add
												</button>
											</div>
										</div>
									</div>

									{/* Allergies */}
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-2'>
											Allergies
										</label>
										<div className='space-y-2'>
											{medicalForm.watch('allergies').map((allergy, index) => (
												<div key={index} className='flex items-center space-x-2'>
													<span className='px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm'>
														{allergy}
													</span>
													<button
														type='button'
														onClick={() => removeArrayItem('allergies', index)}
														className='text-red-500 hover:text-red-700'
													>
														×
													</button>
												</div>
											))}
											<div className='flex space-x-2'>
												<input
													type='text'
													placeholder='Add allergy'
													className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
													onKeyPress={(e) => {
														if (e.key === 'Enter') {
															e.preventDefault();
															addArrayItem('allergies', e.currentTarget.value);
															e.currentTarget.value = '';
														}
													}}
												/>
												<button
													type='button'
													onClick={(e) => {
														const input = e.currentTarget
															.previousElementSibling as HTMLInputElement;
														addArrayItem('allergies', input.value);
														input.value = '';
													}}
													className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
												>
													Add
												</button>
											</div>
										</div>
									</div>

									{/* Current Medications */}
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-2'>
											Current Medications
										</label>
										<div className='space-y-2'>
											{medicalForm.watch('currentMedications').map((medication, index) => (
												<div key={index} className='flex items-center space-x-2'>
													<span className='px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm'>
														{medication}
													</span>
													<button
														type='button'
														onClick={() => removeArrayItem('currentMedications', index)}
														className='text-red-500 hover:text-red-700'
													>
														×
													</button>
												</div>
											))}
											<div className='flex space-x-2'>
												<input
													type='text'
													placeholder='Add medication'
													className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
													onKeyPress={(e) => {
														if (e.key === 'Enter') {
															e.preventDefault();
															addArrayItem('currentMedications', e.currentTarget.value);
															e.currentTarget.value = '';
														}
													}}
												/>
												<button
													type='button'
													onClick={(e) => {
														const input = e.currentTarget
															.previousElementSibling as HTMLInputElement;
														addArrayItem('currentMedications', input.value);
														input.value = '';
													}}
													className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
												>
													Add
												</button>
											</div>
										</div>
									</div>

									{/* Emergency Contact */}
									<div className='space-y-4'>
										<h3 className='text-lg font-medium text-gray-900'>Emergency Contact</h3>
										<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
											<div>
												<label className='block text-sm font-medium text-gray-700 mb-2'>
													Name *
												</label>
												<input
													{...medicalForm.register('emergencyContact.name')}
													type='text'
													className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
												/>
												{medicalForm.formState.errors.emergencyContact?.name && (
													<p className='text-red-500 text-sm mt-1'>
														{medicalForm.formState.errors.emergencyContact.name.message}
													</p>
												)}
											</div>

											<div>
												<label className='block text-sm font-medium text-gray-700 mb-2'>
													Relationship *
												</label>
												<input
													{...medicalForm.register('emergencyContact.relationship')}
													type='text'
													placeholder='e.g., Spouse, Parent, Sibling'
													className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
												/>
												{medicalForm.formState.errors.emergencyContact?.relationship && (
													<p className='text-red-500 text-sm mt-1'>
														{medicalForm.formState.errors.emergencyContact.relationship.message}
													</p>
												)}
											</div>

											<div>
												<label className='block text-sm font-medium text-gray-700 mb-2'>
													Phone *
												</label>
												<input
													{...medicalForm.register('emergencyContact.phone')}
													type='tel'
													className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
												/>
												{medicalForm.formState.errors.emergencyContact?.phone && (
													<p className='text-red-500 text-sm mt-1'>
														{medicalForm.formState.errors.emergencyContact.phone.message}
													</p>
												)}
											</div>
										</div>
									</div>

									{/* Physical Information */}
									<div className='space-y-4'>
										<h3 className='text-lg font-medium text-gray-900'>Physical Information</h3>
										<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
											<div>
												<label className='block text-sm font-medium text-gray-700 mb-2'>
													Blood Type
												</label>
												<select
													{...medicalForm.register('bloodType')}
													className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
												>
													<option value=''>Select blood type</option>
													<option value='A+'>A+</option>
													<option value='A-'>A-</option>
													<option value='B+'>B+</option>
													<option value='B-'>B-</option>
													<option value='AB+'>AB+</option>
													<option value='AB-'>AB-</option>
													<option value='O+'>O+</option>
													<option value='O-'>O-</option>
												</select>
											</div>

											<div>
												<label className='block text-sm font-medium text-gray-700 mb-2'>
													Height (cm)
												</label>
												<input
													{...medicalForm.register('height', { valueAsNumber: true })}
													type='number'
													className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
												/>
												{medicalForm.formState.errors.height && (
													<p className='text-red-500 text-sm mt-1'>
														{medicalForm.formState.errors.height.message}
													</p>
												)}
											</div>

											<div>
												<label className='block text-sm font-medium text-gray-700 mb-2'>
													Weight (kg)
												</label>
												<input
													{...medicalForm.register('weight', { valueAsNumber: true })}
													type='number'
													className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
												/>
												{medicalForm.formState.errors.weight && (
													<p className='text-red-500 text-sm mt-1'>
														{medicalForm.formState.errors.weight.message}
													</p>
												)}
											</div>
										</div>
									</div>

									{/* Medical History */}
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-2'>
											Medical History
										</label>
										<textarea
											{...medicalForm.register('medicalHistory')}
											rows={4}
											placeholder='Please provide any additional medical history or notes...'
											className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
										/>
										{medicalForm.formState.errors.medicalHistory && (
											<p className='text-red-500 text-sm mt-1'>
												{medicalForm.formState.errors.medicalHistory.message}
											</p>
										)}
									</div>

									<div className='flex justify-end'>
										<button
											type='submit'
											disabled={isSubmitting}
											className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
										>
											{isSubmitting ? 'Saving...' : 'Save Medical Profile'}
										</button>
									</div>
								</form>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
