'use client';

import Loading from '@/components/elements/loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { formatPhoneNumber } from '@/lib/utils';
import { Calendar, Edit, Mail, Phone, Save, User, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
	const { user, loading, logout, updateUser } = useAuth();
	const router = useRouter();

	const [isEditing, setIsEditing] = useState(false);
	const [editedName, setEditedName] = useState('');
	const [editedPhone, setEditedPhone] = useState('');
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (!loading && !user) {
			router.push('/');
		}
	}, [user, loading, router]);

	useEffect(() => {
		if (user) {
			setEditedName(user.name);
			setEditedPhone(user.phoneNumber);
		}
	}, [user]);

	const handleEdit = () => {
		setIsEditing(true);
	};

	const handleCancel = () => {
		setIsEditing(false);
		setEditedName(user?.name || '');
		setEditedPhone(user?.phoneNumber || '');
	};

	const handleSave = async () => {
		if (!user) return;

		if (!editedName.trim() || !editedPhone.trim()) {
			toast.error('Name and phone number are required');
			return;
		}

		setIsSaving(true);
		try {
			await updateUser({
				name: editedName.trim(),
				phoneNumber: editedPhone.trim(),
			});
			setIsEditing(false);
			toast.success('Profile updated successfully');
		} catch (error) {
			toast.error('Failed to update profile');
		} finally {
			setIsSaving(false);
		}
	};

	if (loading) {
		return <Loading />;
	}

	if (!user) {
		return null;
	}

	return (
		<div className='min-h-screen py-12 px-4'>
			<div className='max-w-2xl mx-auto'>
				<Card className='shadow-xl'>
					<CardHeader className='text-center'>
						<div className='mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-4'>
							<User className='w-10 h-10 text-white' />
						</div>
						<div className='flex items-center justify-center space-x-2'>
							<CardTitle className='text-2xl'>
								{isEditing ? (
									<Input
										value={editedName}
										onChange={(e) => setEditedName(e.target.value)}
										className='text-2xl font-bold text-center border-none shadow-none focus:ring-0'
										placeholder='Enter name'
									/>
								) : (
									user.name || 'Hello'
								)}
							</CardTitle>
							{!isEditing && (
								<Button variant='ghost' size='sm' onClick={handleEdit} className='ml-2'>
									<Edit className='w-4 h-4' />
								</Button>
							)}
						</div>
						<p className='text-muted-foreground'>Profile Information</p>
					</CardHeader>
					<CardContent className='space-y-6'>
						<div className='space-y-4'>
							<div className='flex items-center space-x-3'>
								<Mail className='w-5 h-5 text-muted-foreground' />
								<div className='flex-1'>
									<p className='text-sm font-medium text-muted-foreground'>Email</p>
									<p className='text-lg'>{user.email}</p>
								</div>
							</div>

							<div className='flex items-center space-x-3'>
								<Phone className='w-5 h-5 text-muted-foreground' />
								<div className='flex-1'>
									<p className='text-sm font-medium text-muted-foreground'>Phone Number</p>
									{isEditing ? (
										<Input
											value={editedPhone}
											onChange={(e) => setEditedPhone(e.target.value)}
											className='text-lg border-none shadow-none focus:ring-0 px-4'
											placeholder='Enter phone number'
										/>
									) : (
										<p className='text-lg'>{formatPhoneNumber(user.phoneNumber)}</p>
									)}
								</div>
							</div>

							<div className='flex items-center space-x-3'>
								<Calendar className='w-5 h-5 text-muted-foreground' />
								<div>
									<p className='text-sm font-medium text-muted-foreground'>Member Since</p>
									<p className='text-lg'>{new Date(user.createdAt).toLocaleDateString()}</p>
								</div>
							</div>

							<div className='flex items-center space-x-3'>
								<div className='w-5 h-5 rounded-full bg-green-500 flex items-center justify-center'>
									<div className='w-2 h-2 bg-white rounded-full'></div>
								</div>
								<div>
									<p className='text-sm font-medium text-muted-foreground'>Status</p>
									<p className='text-lg text-green-600'>Verified</p>
								</div>
							</div>
						</div>

						{isEditing && (
							<div className='flex space-x-2 pt-4 border-t'>
								<Button onClick={handleSave} disabled={isSaving} className='flex-1'>
									<Save className='w-4 h-4 mr-2' />
									{isSaving ? 'Saving...' : 'Save Changes'}
								</Button>
								<Button onClick={handleCancel} variant='outline' className='flex-1'>
									<X className='w-4 h-4 mr-2' />
									Cancel
								</Button>
							</div>
						)}

						<div className='pt-6 border-t'>
							<Button onClick={logout} variant='destructive' className='w-full'>
								Logout
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
