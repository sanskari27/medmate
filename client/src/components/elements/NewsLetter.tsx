'use client';

import { apiClient } from '@/lib/apiClient';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function NewsLetter() {
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const handleSubmit = async () => {
		setLoading(true);
		if (!email) {
			toast.error('Please enter your email address');
			return;
		}
		if (!email.includes('@')) {
			toast.error('Please enter a valid email address');
			return;
		}
		try {
			await new Promise((resolve) => setTimeout(resolve, 5000));
			await apiClient.post('/newsletter', { email });
			toast.success('Thank you for subscribing to our newsletter!');
			setEmail('');
		} catch (error) {
			toast.error('Failed to subscribe to newsletter');
		} finally {
			setLoading(false);
		}
	};
	return (
		<div className='w-full bg-slate-900 text-center text-white py-40 px-[5%] flex flex-col items-center justify-center'>
			<p className='text-indigo-500 font-medium'>Get updated</p>
			<h1 className='max-w-lg font-semibold text-4xl/[44px] mt-2'>
				Subscribe to our newsletter & get the latest news
			</h1>
			<div className='flex items-center justify-center mt-10 border border-slate-600 focus-within:outline focus-within:outline-indigo-600 text-sm rounded-full h-14 max-w-md w-full'>
				<input
					type='text'
					className='bg-transparent outline-none rounded-full px-4 h-full flex-1'
					placeholder='Enter your email address'
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>
				<button
					disabled={loading}
					className='bg-indigo-600 text-white rounded-full h-11 mr-1 px-4 flex items-center justify-center'
					onClick={handleSubmit}
				>
					{loading ? <Loader2 className='w-4 h-4 animate-spin' /> : 'Subscribe now'}
				</button>
			</div>
		</div>
	);
}
