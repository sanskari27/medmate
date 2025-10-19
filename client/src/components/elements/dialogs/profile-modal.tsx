'use client';

import { apiClient } from '@/lib/apiClient';
import {
	basicProfileSchema,
	medicalProfileSchema,
	type BasicProfileInput,
	type MedicalProfileInput,
} from '@/lib/schemas/profile';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, User, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

interface ProfileModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
	const [userProfile, setUserProfile] = useState<any>(null);
	const [medicalProfile, setMedicalProfile] = useState<any>(null);
	const [activeTab, setActiveTab] = useState<'basic' | 'medical'>('basic');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const { update } = useSession();

	// Fetch profile data when modal opens
	useEffect(() => {
		if (isOpen) {
			fetchProfileData();
		}
	}, [isOpen]);

	// Lock body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			// Prevent body scroll
			document.body.style.overflow = 'hidden';
			// Prevent scroll on mobile devices
			document.body.style.position = 'fixed';
			document.body.style.width = '100%';
		} else {
			// Restore body scroll
			document.body.style.overflow = 'unset';
			document.body.style.position = 'unset';
			document.body.style.width = 'unset';
		}

		// Cleanup on unmount
		return () => {
			document.body.style.overflow = 'unset';
			document.body.style.position = 'unset';
			document.body.style.width = 'unset';
		};
	}, [isOpen]);

	const fetchProfileData = async () => {
		setIsLoading(true);
		try {
			const [basicResponse, medicalResponse] = await Promise.all([
				apiClient.get('/profile/basic').catch(() => ({ user: null })),
				apiClient.get('/profile/medical').catch(() => ({ data: null })),
			]);
			setUserProfile((basicResponse as any).user);
			setMedicalProfile((medicalResponse as any).data);
		} catch (error) {
			console.error('Failed to fetch profile data:', error);
			toast.error('Failed to load profile data');
		} finally {
			setIsLoading(false);
		}
	};

	const basicForm = useForm<BasicProfileInput>({
		resolver: zodResolver(basicProfileSchema),
		defaultValues: {
			firstName: '',
			lastName: '',
			email: '',
			phone: '',
			address: {
				street: '',
				city: '',
				state: '',
				zipCode: '',
				country: '',
			},
			dateOfBirth: '',
			gender: 'prefer-not-to-say',
		},
	});

	const medicalForm = useForm<MedicalProfileInput>({
		resolver: zodResolver(medicalProfileSchema),
		defaultValues: {
			medicalConditions: [],
			allergies: [],
			currentMedications: [],
			previousSurgeries: [],
			emergencyContact: {
				name: '',
				relationship: '',
				phone: '',
			},
			bloodType: undefined,
			height: undefined,
			weight: undefined,
			medicalHistory: '',
		},
	});

	// Update forms when data is loaded
	useEffect(() => {
		if (userProfile) {
			basicForm.reset(userProfile);
		}
	}, [userProfile, basicForm]);

	useEffect(() => {
		if (medicalProfile) {
			medicalForm.reset(medicalProfile);
		}
	}, [medicalProfile, medicalForm]);

	const onBasicSubmit = async (data: BasicProfileInput) => {
		setIsSubmitting(true);
		try {
			await apiClient.patch('/profile/basic', data);
			toast.success('Profile updated successfully!');

			// Check if name was updated and refresh session
			if (data.firstName || data.lastName) {
				// Small delay to ensure the update is processed
				setTimeout(async () => {
					try {
						await update();
					} catch (error) {}
				}, 1000);
			}
		} catch (error) {
			toast.error('Failed to update profile. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const onMedicalSubmit = async (data: MedicalProfileInput) => {
		setIsSubmitting(true);
		try {
			await apiClient.patch('/profile/medical', data);
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

	if (!isOpen) return null;

	// Show loading state if data is being fetched
	if (isLoading) {
		return (
			<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
				<motion.div
					initial={{ opacity: 0, scale: 0.9, y: 20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.9, y: 20 }}
					transition={{ duration: 0.3, ease: 'easeOut' }}
					className='relative w-full max-w-4xl mx-4 h-[75vh]'
				>
					<div className='bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden h-full flex items-center justify-center'>
						<div className='text-center'>
							<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
							<p className='text-gray-600 dark:text-gray-400'>Loading profile data...</p>
						</div>
					</div>
				</motion.div>
			</div>
		);
	}

	const tabs = [
		{
			id: 'basic' as const,
			label: 'Profile',
			icon: User,
		},
		{
			id: 'medical' as const,
			label: 'Medical',
			icon: Heart,
		},
	];

	return (
		<div className='fixed inset-0 z-50 flex justify-center bg-black/50 backdrop-blur-sm items-center'>
			<motion.div
				initial={{ opacity: 0, scale: 0.9, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.9, y: 20 }}
				transition={{ duration: 0.3, ease: 'easeOut' }}
				className='relative w-full max-w-4xl mx-4 md:mx-4 h-[75vh] md:h-[80vh]'
			>
				<div className='bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden h-full flex flex-col'>
					{/* Header */}
					<div className='px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between'>
						<div>
							<h1 className='text-xl md:text-2xl font-bold text-gray-900 dark:text-white'>
								Account
							</h1>
							<p className='text-sm md:text-base text-gray-600 dark:text-gray-400'>
								Manage your account info.
							</p>
						</div>
						<button
							onClick={onClose}
							className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors'
						>
							<X className='h-5 w-5 text-gray-500 dark:text-gray-400' />
						</button>
					</div>

					{/* Mobile Tabs - Top */}
					<div className='md:hidden border-b border-gray-200 dark:border-gray-700'>
						<nav className='flex'>
							{tabs.map((tab) => {
								const Icon = tab.icon;
								return (
									<button
										key={tab.id}
										onClick={() => setActiveTab(tab.id)}
										className={cn(
											'flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-xs md:text-sm font-medium transition-all duration-200',
											activeTab === tab.id
												? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
												: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
										)}
									>
										<Icon className='h-4 w-4' />
										<span>{tab.label}</span>
									</button>
								);
							})}
						</nav>
					</div>

					{/* Main Content */}
					<div className='flex-1 flex overflow-hidden'>
						{/* Desktop Left Sidebar - Tabs */}
						<div className='hidden md:flex w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-col'>
							<div className='p-4'>
								<nav className='space-y-1'>
									{tabs.map((tab) => {
										const Icon = tab.icon;
										return (
											<button
												key={tab.id}
												onClick={() => setActiveTab(tab.id)}
												className={cn(
													'w-full text-left px-3 py-2 rounded-md transition-all duration-200 group flex items-center space-x-3 text-sm',
													activeTab === tab.id
														? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
														: 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
												)}
											>
												<Icon className='h-4 w-4' />
												<span className='font-medium'>{tab.label}</span>
											</button>
										);
									})}
								</nav>
							</div>
						</div>

						{/* Content Area */}
						<div className='flex-1 overflow-y-auto'>
							<div className='p-3 md:p-4'>
								<AnimatePresence mode='wait'>
									{activeTab === 'basic' && (
										<motion.div
											key='basic'
											initial={{ opacity: 0, x: 20 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0, x: -20 }}
											transition={{ duration: 0.3 }}
										>
											<form
												onSubmit={basicForm.handleSubmit(onBasicSubmit as any)}
												className='space-y-4'
											>
												{/* Personal Information */}
												<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
													<div>
														<label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
															First Name *
														</label>
														<input
															{...basicForm.register('firstName')}
															type='text'
															className='w-full px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white'
														/>
														{basicForm.formState.errors.firstName && (
															<p className='text-red-500 text-xs md:text-sm mt-1'>
																{basicForm.formState.errors.firstName.message}
															</p>
														)}
													</div>

													<div>
														<label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
															Last Name *
														</label>
														<input
															{...basicForm.register('lastName')}
															type='text'
															className='w-full px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white'
														/>
														{basicForm.formState.errors.lastName && (
															<p className='text-red-500 text-xs md:text-sm mt-1'>
																{basicForm.formState.errors.lastName.message}
															</p>
														)}
													</div>

													<div>
														<label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
															Email *
														</label>
														<input
															{...basicForm.register('email')}
															type='email'
															className='w-full px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white'
														/>
														{basicForm.formState.errors.email && (
															<p className='text-red-500 text-xs md:text-sm mt-1'>
																{basicForm.formState.errors.email.message}
															</p>
														)}
													</div>

													<div>
														<label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
															Phone *
														</label>
														<input
															{...basicForm.register('phone')}
															type='tel'
															className='w-full px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white'
														/>
														{basicForm.formState.errors.phone && (
															<p className='text-red-500 text-xs md:text-sm mt-1'>
																{basicForm.formState.errors.phone.message}
															</p>
														)}
													</div>

													<div>
														<label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
															Date of Birth *
														</label>
														<input
															{...basicForm.register('dateOfBirth')}
															type='date'
															className='w-full px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white'
														/>
														{basicForm.formState.errors.dateOfBirth && (
															<p className='text-red-500 text-xs md:text-sm mt-1'>
																{basicForm.formState.errors.dateOfBirth.message}
															</p>
														)}
													</div>

													<div>
														<label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
															Gender
														</label>
														<select
															{...basicForm.register('gender')}
															className='w-full px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white'
														>
															<option value='prefer-not-to-say'>Prefer not to say</option>
															<option value='male'>Male</option>
															<option value='female'>Female</option>
															<option value='other'>Other</option>
														</select>
													</div>
												</div>

												{/* Address */}
												<div className='space-y-3'>
													<h3 className='text-base font-medium text-gray-900 dark:text-white'>
														Address
													</h3>
													<div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
														<div className='md:col-span-2'>
															<label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
																Street Address *
															</label>
															<input
																{...basicForm.register('address.street')}
																type='text'
																className='w-full px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white'
															/>
															{basicForm.formState.errors.address?.street && (
																<p className='text-red-500 text-xs md:text-sm mt-1'>
																	{basicForm.formState.errors.address.street.message}
																</p>
															)}
														</div>

														<div>
															<label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
																City *
															</label>
															<input
																{...basicForm.register('address.city')}
																type='text'
																className='w-full px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white'
															/>
															{basicForm.formState.errors.address?.city && (
																<p className='text-red-500 text-xs md:text-sm mt-1'>
																	{basicForm.formState.errors.address.city.message}
																</p>
															)}
														</div>

														<div>
															<label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
																State *
															</label>
															<input
																{...basicForm.register('address.state')}
																type='text'
																className='w-full px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white'
															/>
															{basicForm.formState.errors.address?.state && (
																<p className='text-red-500 text-xs md:text-sm mt-1'>
																	{basicForm.formState.errors.address.state.message}
																</p>
															)}
														</div>

														<div>
															<label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
																ZIP Code *
															</label>
															<input
																{...basicForm.register('address.zipCode')}
																type='text'
																className='w-full px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white'
															/>
															{basicForm.formState.errors.address?.zipCode && (
																<p className='text-red-500 text-xs md:text-sm mt-1'>
																	{basicForm.formState.errors.address.zipCode.message}
																</p>
															)}
														</div>

														<div>
															<label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
																Country *
															</label>
															<input
																{...basicForm.register('address.country')}
																type='text'
																className='w-full px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white'
															/>
															{basicForm.formState.errors.address?.country && (
																<p className='text-red-500 text-xs md:text-sm mt-1'>
																	{basicForm.formState.errors.address.country.message}
																</p>
															)}
														</div>
													</div>
												</div>

												<div className='flex justify-end pt-6'>
													<motion.button
														whileHover={{ scale: 1.02 }}
														whileTap={{ scale: 0.98 }}
														type='submit'
														disabled={isSubmitting}
														className='px-6 py-2 text-sm md:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors'
													>
														{isSubmitting ? 'Saving...' : 'Save Changes'}
													</motion.button>
												</div>
											</form>
										</motion.div>
									)}

									{activeTab === 'medical' && (
										<motion.div
											key='medical'
											initial={{ opacity: 0, x: 20 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0, x: -20 }}
											transition={{ duration: 0.3 }}
										>
											{/* Medical Header */}
											<div className='mb-4'>
												<h2 className='text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3'>
													Medical Profile
												</h2>
												<p className='text-sm md:text-base text-gray-600 dark:text-gray-400'>
													Manage your medical information and health details
												</p>
											</div>

											<form
												onSubmit={medicalForm.handleSubmit(onMedicalSubmit as any)}
												className='space-y-4'
											>
												{/* Medical Conditions */}
												<div>
													<label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
														Medical Conditions
													</label>
													<div className='space-y-2'>
														{medicalForm.watch('medicalConditions').map((condition, index) => (
															<div key={index} className='flex items-center space-x-2'>
																<span className='px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm'>
																	{condition}
																</span>
																<button
																	type='button'
																	onClick={() => removeArrayItem('medicalConditions', index)}
																	className='text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
																>
																	×
																</button>
															</div>
														))}
														<div className='flex space-x-2'>
															<input
																type='text'
																placeholder='Add medical condition'
																className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white'
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
																className='px-4 py-2 text-xs md:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
															>
																Add
															</button>
														</div>
													</div>
												</div>

												{/* Allergies */}
												<div>
													<label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
														Allergies
													</label>
													<div className='space-y-2'>
														{medicalForm.watch('allergies').map((allergy, index) => (
															<div key={index} className='flex items-center space-x-2'>
																<span className='px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-sm'>
																	{allergy}
																</span>
																<button
																	type='button'
																	onClick={() => removeArrayItem('allergies', index)}
																	className='text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
																>
																	×
																</button>
															</div>
														))}
														<div className='flex space-x-2'>
															<input
																type='text'
																placeholder='Add allergy'
																className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white'
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
																className='px-4 py-2 text-xs md:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
															>
																Add
															</button>
														</div>
													</div>
												</div>

												{/* Current Medications */}
												<div>
													<label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
														Current Medications
													</label>
													<div className='space-y-2'>
														{medicalForm.watch('currentMedications').map((medication, index) => (
															<div key={index} className='flex items-center space-x-2'>
																<span className='px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm'>
																	{medication}
																</span>
																<button
																	type='button'
																	onClick={() => removeArrayItem('currentMedications', index)}
																	className='text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
																>
																	×
																</button>
															</div>
														))}
														<div className='flex space-x-2'>
															<input
																type='text'
																placeholder='Add medication'
																className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white'
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
																className='px-4 py-2 text-xs md:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
															>
																Add
															</button>
														</div>
													</div>
												</div>

												{/* Emergency Contact */}
												<div className='space-y-3'>
													<h3 className='text-base font-medium text-gray-900 dark:text-white'>
														Emergency Contact
													</h3>
													<div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
														<div>
															<label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
																Name *
															</label>
															<input
																{...medicalForm.register('emergencyContact.name')}
																type='text'
																className='w-full px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white'
															/>
															{medicalForm.formState.errors.emergencyContact?.name && (
																<p className='text-red-500 text-xs md:text-sm mt-1'>
																	{medicalForm.formState.errors.emergencyContact.name.message}
																</p>
															)}
														</div>

														<div>
															<label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
																Relationship *
															</label>
															<input
																{...medicalForm.register('emergencyContact.relationship')}
																type='text'
																placeholder='e.g., Spouse, Parent, Sibling'
																className='w-full px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white'
															/>
															{medicalForm.formState.errors.emergencyContact?.relationship && (
																<p className='text-red-500 text-xs md:text-sm mt-1'>
																	{
																		medicalForm.formState.errors.emergencyContact.relationship
																			.message
																	}
																</p>
															)}
														</div>

														<div>
															<label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
																Phone *
															</label>
															<input
																{...medicalForm.register('emergencyContact.phone')}
																type='tel'
																className='w-full px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white'
															/>
															{medicalForm.formState.errors.emergencyContact?.phone && (
																<p className='text-red-500 text-xs md:text-sm mt-1'>
																	{medicalForm.formState.errors.emergencyContact.phone.message}
																</p>
															)}
														</div>
													</div>
												</div>

												{/* Physical Information */}
												<div className='space-y-3'>
													<h3 className='text-base font-medium text-gray-900 dark:text-white'>
														Physical Information
													</h3>
													<div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
														<div>
															<label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
																Blood Type
															</label>
															<select
																{...medicalForm.register('bloodType')}
																className='w-full px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white'
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
															<label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
																Height (cm)
															</label>
															<input
																{...medicalForm.register('height', { valueAsNumber: true })}
																type='number'
																className='w-full px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white'
															/>
															{medicalForm.formState.errors.height && (
																<p className='text-red-500 text-xs md:text-sm mt-1'>
																	{medicalForm.formState.errors.height.message}
																</p>
															)}
														</div>

														<div>
															<label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
																Weight (kg)
															</label>
															<input
																{...medicalForm.register('weight', { valueAsNumber: true })}
																type='number'
																className='w-full px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white'
															/>
															{medicalForm.formState.errors.weight && (
																<p className='text-red-500 text-xs md:text-sm mt-1'>
																	{medicalForm.formState.errors.weight.message}
																</p>
															)}
														</div>
													</div>
												</div>

												{/* Medical History */}
												<div>
													<label className='block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
														Medical History
													</label>
													<textarea
														{...medicalForm.register('medicalHistory')}
														rows={4}
														placeholder='Please provide any additional medical history or notes...'
														className='w-full px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white'
													/>
													{medicalForm.formState.errors.medicalHistory && (
														<p className='text-red-500 text-xs md:text-sm mt-1'>
															{medicalForm.formState.errors.medicalHistory.message}
														</p>
													)}
												</div>

												<div className='flex justify-end pt-6'>
													<motion.button
														whileHover={{ scale: 1.02 }}
														whileTap={{ scale: 0.98 }}
														type='submit'
														disabled={isSubmitting}
														className='px-6 py-2 text-sm md:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors'
													>
														{isSubmitting ? 'Saving...' : 'Save Medical Profile'}
													</motion.button>
												</div>
											</form>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						</div>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
