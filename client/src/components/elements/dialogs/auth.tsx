'use client';

import GoogleLoginButton from '@/components/elements/GoogleLoginButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/apiClient';
import RequestError from '@/lib/RequestError';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Mail, RotateCcw, X } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

const loginSchema = z.object({
	email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
});

const otpSchema = z.object({
	otp: z
		.string()
		.min(6, 'OTP must be 6 digits')
		.max(6, 'OTP must be 6 digits')
		.regex(/^\d{6}$/, 'OTP must contain only numbers'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

interface AuthDialogProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function AuthDialog({ isOpen, onClose }: AuthDialogProps) {
	const [step, setStep] = useState<'email' | 'otp'>('email');
	const [email, setEmail] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [timeLeft, setTimeLeft] = useState(60);

	const {
		register: registerEmail,
		handleSubmit: handleEmailSubmit,
		formState: { errors: emailErrors },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	});

	const {
		handleSubmit: handleOTPSubmit,
		setValue: setOTPValue,
		watch: watchOTP,
		formState: { errors: otpErrors },
	} = useForm<OTPFormData>({
		resolver: zodResolver(otpSchema),
	});

	const otpValue = watchOTP('otp');

	// Countdown timer
	useEffect(() => {
		if (timeLeft > 0 && step === 'otp') {
			const timer = setTimeout(() => setTimeLeft((timeLeft) => timeLeft - 1), 1000);
			return () => clearTimeout(timer);
		}
	}, [timeLeft, step]);

	// Reset state when dialog opens/closes
	useEffect(() => {
		if (!isOpen) {
			setStep('email');
			setEmail('');
			setTimeLeft(60);
			setIsLoading(false);
		}
	}, [isOpen]);

	const onEmailSubmit = async (data: LoginFormData) => {
		setIsLoading(true);
		try {
			await apiClient.post<{ success: boolean }>('/auth/send-otp', {
				email: data.email,
			});
			toast.success('OTP sent!');
			setEmail(data.email);
			setStep('otp');
			setTimeLeft(60);
		} catch (error) {
			if (error instanceof RequestError) {
				toast.error(error.message);
			} else {
				toast.error('Something went wrong. Please try again.');
			}
		} finally {
			setIsLoading(false);
		}
	};

	const onOTPSubmit = async (data: OTPFormData) => {
		setIsLoading(true);
		const res = await signIn('email-otp', {
			email,
			otp: data.otp,
			redirect: true,
			callbackUrl: '/',
		});
		if (res?.error) {
			toast.error(res.error);
			setIsLoading(false);
		} else {
			toast.success('Login successful!');
			onClose();
		}
	};

	const handleResendOTP = async () => {
		await onEmailSubmit({ email });
	};

	const handleOTPChange = (value: string) => {
		setOTPValue('otp', value);
		// Auto-submit when OTP is complete
		if (value.length === 6) {
			setTimeout(() => {
				handleOTPSubmit(onOTPSubmit)();
			}, 500);
		}
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
			<motion.div
				initial={{ opacity: 0, scale: 0.9, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.9, y: 20 }}
				transition={{ duration: 0.3, ease: 'easeOut' }}
				className='relative w-full max-w-md mx-4'
			>
				<div className='bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden'>
					{/* Close button */}
					<Button
						variant='ghost'
						size='sm'
						onClick={onClose}
						className='absolute top-4 right-4 z-10 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800'
					>
						<X className='h-4 w-4' />
					</Button>

					{/* Content */}
					<div className='p-8'>
						<AnimatePresence mode='wait'>
							{step === 'email' ? (
								<motion.div
									key='email'
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -20 }}
									transition={{ duration: 0.3 }}
								>
									<Card className='border-0 shadow-none'>
										<CardHeader className='text-center pb-6'>
											<motion.div
												initial={{ scale: 0 }}
												animate={{ scale: 1 }}
												transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
												className='mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'
											>
												<Mail className='h-8 w-8 text-white' />
											</motion.div>
											<CardTitle className='text-2xl font-bold text-gray-900 dark:text-white'>
												Welcome Back
											</CardTitle>
											<CardDescription className='text-gray-600 dark:text-gray-400'>
												Enter your email to receive a verification code
											</CardDescription>
										</CardHeader>

										<CardContent>
											<form onSubmit={handleEmailSubmit(onEmailSubmit)} className='space-y-6'>
												<div className='space-y-2'>
													<Label
														htmlFor='email'
														className='text-sm font-medium text-gray-700 dark:text-gray-300'
													>
														Email Address
													</Label>
													<div className='relative'>
														<Input
															id='email'
															type='email'
															placeholder='Enter your email'
															className={`pl-10 h-12 rounded-xl border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 ${
																emailErrors.email
																	? 'border-red-500 focus:border-red-500 focus:ring-red-500'
																	: ''
															}`}
															{...registerEmail('email')}
														/>
														<Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
													</div>
													{emailErrors.email && (
														<motion.p
															initial={{ opacity: 0, y: -10 }}
															animate={{ opacity: 1, y: 0 }}
															className='text-sm text-red-500'
														>
															{emailErrors.email.message}
														</motion.p>
													)}
												</div>

												<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
													<Button
														type='submit'
														disabled={isLoading}
														className='w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl'
													>
														{isLoading ? (
															<>
																<Loader2 className='mr-2 h-4 w-4 animate-spin' />
																Sending OTP...
															</>
														) : (
															<>
																Send OTP
																<ArrowRight className='ml-2 h-4 w-4' />
															</>
														)}
													</Button>
												</motion.div>
											</form>

											<div className='mt-6 space-y-4'>
												<div className='relative'>
													<div className='absolute inset-0 flex items-center'>
														<span className='w-full border-t border-gray-200 dark:border-gray-700' />
													</div>
													<div className='relative flex justify-center text-xs uppercase'>
														<span className='bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400'>
															Or continue with
														</span>
													</div>
												</div>

												<GoogleLoginButton />
											</div>

											<div className='mt-6 text-center'>
												<p className='text-sm text-gray-500 dark:text-gray-400'>
													We&apos;ll send you a verification code to sign in
												</p>
											</div>
										</CardContent>
									</Card>
								</motion.div>
							) : (
								<motion.div
									key='otp'
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -20 }}
									transition={{ duration: 0.3 }}
								>
									<Card className='border-0 shadow-none'>
										<CardHeader className='text-center pb-6'>
											<motion.div
												initial={{ scale: 0 }}
												animate={{ scale: 1 }}
												transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
												className='mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center'
											>
												<CheckCircle className='h-8 w-8 text-white' />
											</motion.div>
											<CardTitle className='text-2xl font-bold text-gray-900 dark:text-white'>
												Verify Your Email
											</CardTitle>
											<CardDescription className='text-gray-600 dark:text-gray-400'>
												We&apos;ve sent a 6-digit code to
												<br />
												<span className='font-medium text-gray-900 dark:text-white'>{email}</span>
											</CardDescription>
										</CardHeader>

										<CardContent>
											<form onSubmit={handleOTPSubmit(onOTPSubmit)} className='space-y-6'>
												<div className='space-y-4'>
													<div className='flex justify-center'>
														<InputOTP
															maxLength={6}
															value={otpValue}
															onChange={handleOTPChange}
															className='gap-2'
														>
															<InputOTPGroup>
																<InputOTPSlot
																	index={0}
																	className='h-12 w-12 text-lg font-semibold'
																/>
																<InputOTPSlot
																	index={1}
																	className='h-12 w-12 text-lg font-semibold'
																/>
																<InputOTPSlot
																	index={2}
																	className='h-12 w-12 text-lg font-semibold'
																/>
																<InputOTPSlot
																	index={3}
																	className='h-12 w-12 text-lg font-semibold'
																/>
																<InputOTPSlot
																	index={4}
																	className='h-12 w-12 text-lg font-semibold'
																/>
																<InputOTPSlot
																	index={5}
																	className='h-12 w-12 text-lg font-semibold'
																/>
															</InputOTPGroup>
														</InputOTP>
													</div>

													{otpErrors.otp && (
														<motion.p
															initial={{ opacity: 0, y: -10 }}
															animate={{ opacity: 1, y: 0 }}
															className='text-sm text-red-500 text-center'
														>
															{otpErrors.otp.message}
														</motion.p>
													)}
												</div>

												<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
													<Button
														type='submit'
														disabled={isLoading || !otpValue || otpValue.length !== 6}
														className='w-full h-12 rounded-xl bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl'
													>
														{isLoading ? (
															<>
																<Loader2 className='mr-2 h-4 w-4 animate-spin' />
																Verifying...
															</>
														) : (
															'Verify OTP'
														)}
													</Button>
												</motion.div>
											</form>

											<div className='mt-6 space-y-4'>
												<div className='text-center'>
													{timeLeft > 0 ? (
														<p className='text-sm text-gray-500 dark:text-gray-400'>
															Resend code in{' '}
															<span className='font-medium text-blue-600'>{timeLeft}s</span>
														</p>
													) : (
														<Button
															variant='ghost'
															onClick={handleResendOTP}
															disabled={isLoading}
															className='text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950'
														>
															{isLoading ? (
																<>
																	<Loader2 className='mr-2 h-4 w-4 animate-spin' />
																	Resending...
																</>
															) : (
																<>
																	<RotateCcw className='mr-2 h-4 w-4' />
																	Resend OTP
																</>
															)}
														</Button>
													)}
												</div>

												<div className='text-center'>
													<Button
														variant='ghost'
														onClick={() => setStep('email')}
														className='text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
													>
														<ArrowLeft className='mr-2 h-4 w-4' />
														Back to email
													</Button>
												</div>
											</div>
										</CardContent>
									</Card>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
