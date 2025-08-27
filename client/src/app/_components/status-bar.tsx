'use client';
import { Button } from '@/components/ui/button';
import { BellIcon, SettingIcon } from '@/lib/consts';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export default function StatusBar({
	title,
	description,
	backURL = false,
}: {
	title: string;
	description?: string;
	backURL?: boolean;
}) {
	return (
		<div className='py-2 px-4 w-full  flex justify-between'>
			<div className='flex items-center'>
				<div>
					{backURL && (
						<Button variant='link' className='p-2 mr-4'>
							<ArrowLeft className='text-black w-5 h-5' />
						</Button>
					)}
				</div>
				<div>
					<div>{title}</div>
					{description && <div className='text-gray-500 text-sm'>{description}</div>}
				</div>
			</div>
			<div className='flex gap-6'>
				<Button variant='link' className='py-2 px-0'>
					<Image src={SettingIcon} alt='Settings' width={20} height={20} />
				</Button>
				<Button variant='link' className='py-2 px-0'>
					<Image src={BellIcon} alt='Settings' width={20} height={20} />
				</Button>
			</div>
		</div>
	);
}
