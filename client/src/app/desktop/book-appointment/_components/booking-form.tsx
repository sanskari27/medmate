'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function BookingForm() {
	const [data, setData] = useState<Record<string, string>>({});

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		console.log('Form submitted', data);
		// await sendEmail(data);
		toast.success('Message sent successfully');
	};

	return (
		<form
			onSubmit={handleSubmit}
			className='flex max-w-3xl flex-col gap-6 rounded-lg border p-4 md:p-10 w-full h-min'
		>
			<div className='flex flex-col md:flex-row gap-4'>
				<div className='grid w-full items-center gap-1.5'>
					<Label htmlFor='firstname'>First Name</Label>
					<Input
						type='text'
						id='firstname'
						placeholder='First Name'
						value={data.firstname}
						onChange={(e) => setData({ ...data, firstname: e.target.value })}
					/>
				</div>
				<div className='grid w-full items-center gap-1.5'>
					<Label htmlFor='lastname'>Last Name</Label>
					<Input
						type='text'
						id='lastname'
						placeholder='Last Name'
						value={data.lastname}
						onChange={(e) => setData({ ...data, lastname: e.target.value })}
					/>
				</div>
			</div>
			<div className='grid w-full items-center gap-1.5'>
				<Label htmlFor='email'>Mobile Number</Label>
				<Input
					type='tel'
					id='tel'
					placeholder='Mobile number'
					value={data.phone}
					onChange={(e) => setData({ ...data, phone: e.target.value })}
				/>
			</div>
			<div className='grid w-full items-center gap-1.5'>
				<Label htmlFor='subject'>Address</Label>
				<Input
					type='text'
					id='Address'
					placeholder='address'
					value={data.subject}
					onChange={(e) => setData({ ...data, address: e.target.value })}
				/>
			</div>
			<div className='grid w-full gap-1.5'>
				<Label htmlFor='message'>Enter Disease Name</Label>
				<Input
					placeholder='Type your message here.'
					type='text'
					id='disease name'
					value={data.message}
					onChange={(e) => setData({ ...data, message: e.target.value })}
				/>
			</div>
			<Button className='w-full' type='submit'>
				Book Appointment
			</Button>
		</form>
	);
}
