'use client';

import { apiClient } from '@/lib/apiClient';
import RequestError from '@/lib/RequestError';
import { newsletterSchema, type NewsletterInput } from '@/lib/schemas/newsletter';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

interface NewsletterResponse {
	success: boolean;
	message: string;
}

export default function NewsLetter() {
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
	} = useForm<NewsletterInput>({
		resolver: zodResolver(newsletterSchema),
		mode: 'onBlur',
	});

	const onSubmit = async (data: NewsletterInput) => {
		try {
			const response = await apiClient.post<NewsletterResponse>('/newsletter', data);

			if (response.success) {
				toast.success(response.message);
				reset();
			} else {
				toast.error(response.message || 'Failed to subscribe to newsletter');
			}
		} catch (error: any) {
			if (error instanceof RequestError) {
				toast.error(error.getMessage());
				return;
			}
			toast.error(error?.message || 'Failed to subscribe to newsletter. Please try again later.');
		}
	};
	return (
		<div className='w-full bg-image before:bg-newsletter text-center text-white py-[7.5rem] px-[5%] flex flex-col items-center justify-center'>
			{/* <p className='text-slate-300 font-medium underline underline-offset-1'>Get updated</p> */}
			<h1 className='max-w-lg font-semibold text-4xl/[44px] mt-2'>
				Subscribe to our newsletter & get the latest news
			</h1>
			<form onSubmit={handleSubmit(onSubmit)} className='w-full max-w-md mt-10'>
				<div className='flex bg-slate-50/30 items-center justify-center border border-slate-600 focus-within:outline focus-within:outline-indigo-800 text-sm rounded-full h-14 w-full'>
					<input
						type='email'
						{...register('email')}
						className='bg-transparent outline-none rounded-full px-4 h-full flex-1 placeholder:text-slate-200'
						placeholder='Enter your email address'
					/>
					<button
						type='submit'
						disabled={isSubmitting}
						className='bg-indigo-600 text-white rounded-full h-11 mr-1 px-4 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed'
					>
						{isSubmitting ? <Loader2 className='w-4 h-4 animate-spin' /> : 'Subscribe now'}
					</button>
				</div>
				{errors.email && (
					<p className='text-red-400 text-sm mt-2 text-center px-4'>{errors.email.message}</p>
				)}
			</form>
		</div>
	);
}
