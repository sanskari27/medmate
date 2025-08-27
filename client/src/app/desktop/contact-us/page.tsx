'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function ContactUs() {
	const router = useRouter();
	const [data, setData] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		// Validate required fields
		if (!data.firstname || !data.lastname || !data.email || !data.subject || !data.message) {
			toast.error('Please fill in all fields');
			return;
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(data.email)) {
			toast.error('Please provide a valid email address');
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await fetch('/api/contact', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			const result = await response.json();

			if (response.ok) {
				toast.success('Message sent successfully!');
				// Reset form
				setData({});
				router.push('/');
			} else {
				toast.error(result.error || 'Failed to send message');
			}
		} catch (error) {
			console.error('Contact form error:', error);
			toast.error('Failed to send message. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<section className='py-32 px-[5%] md:px-[7%]'>
			<form className='container' onSubmit={handleSubmit}>
				<div className='mx-auto flex max-w-7xl flex-col justify-between gap-10 lg:flex-row lg:gap-20'>
					<div className='mx-auto flex max-w-sm flex-col justify-between gap-10'>
						<div className='text-center lg:text-left my-auto'>
							<h1 className='mb-2 text-5xl font-semibold lg:mb-1 lg:text-6xl -mt-12'>Contact Us</h1>
							<p className='text-muted-foreground'>
								We are available for questions, feedback, or collaboration opportunities. Let us
								know how we can help!
							</p>
						</div>
					</div>
					<div className='mx-auto flex max-w-3xl flex-col gap-6 rounded-lg border p-4 md:p-10 w-full'>
						<div className='flex flex-col md:flex-row gap-4'>
							<div className='grid w-full items-center gap-1.5'>
								<Label htmlFor='firstname'>First Name *</Label>
								<Input
									type='text'
									id='firstname'
									placeholder='First Name'
									value={data.firstname || ''}
									onChange={(e) => setData({ ...data, firstname: e.target.value })}
									required
									disabled={isSubmitting}
								/>
							</div>
							<div className='grid w-full items-center gap-1.5'>
								<Label htmlFor='lastname'>Last Name *</Label>
								<Input
									type='text'
									id='lastname'
									placeholder='Last Name'
									value={data.lastname || ''}
									onChange={(e) => setData({ ...data, lastname: e.target.value })}
									required
									disabled={isSubmitting}
								/>
							</div>
						</div>
						<div className='grid w-full items-center gap-1.5'>
							<Label htmlFor='email'>Email *</Label>
							<Input
								type='email'
								id='email'
								placeholder='Email'
								value={data.email || ''}
								onChange={(e) => setData({ ...data, email: e.target.value })}
								required
								disabled={isSubmitting}
							/>
						</div>
						<div className='grid w-full items-center gap-1.5'>
							<Label htmlFor='subject'>Subject *</Label>
							<Input
								type='text'
								id='subject'
								placeholder='Subject'
								value={data.subject || ''}
								onChange={(e) => setData({ ...data, subject: e.target.value })}
								required
								disabled={isSubmitting}
							/>
						</div>
						<div className='grid w-full gap-1.5'>
							<Label htmlFor='message'>Message *</Label>
							<Textarea
								placeholder='Type your message here.'
								id='message'
								value={data.message || ''}
								onChange={(e) => setData({ ...data, message: e.target.value })}
								required
								disabled={isSubmitting}
								rows={6}
							/>
						</div>
						<Button className='w-full' type='submit' disabled={isSubmitting}>
							{isSubmitting ? 'Sending Message...' : 'Send Message'}
						</Button>
					</div>
				</div>
			</form>
		</section>
	);
}
