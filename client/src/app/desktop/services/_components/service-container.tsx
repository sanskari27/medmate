'use client';
import Each from '@/components/containers/each';
import { Button } from '@/components/ui/button';
import { HOME_VISIT_IMAGE } from '@/lib/consts';
import { cn } from '@/lib/utils';
import { CircleCheckBig } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function ServiceContainer({
	title,
	description,
	items,
	image,
	className = '',
}: {
	title: string;
	description: string;
	items: string[];
	image: string;
	className?: string;
}) {
	return (
		<div
			className={cn(
				'gap-4 md:gap-12 flex justify-between flex-col-reverse md:flex-row shadow-lg rounded-lg p-6 bg-white dark:bg-gray-800 items-center',
				className
			)}
		>
			<div className='flex flex-col gap-4'>
				<div className='text-2xl font-medium'>{title}</div>
				<div>{description}</div>
				<div className='flex flex-col'>
					<Each
						items={items}
						render={(item) => (
							<div className='inline-flex items-start gap-2'>
								<CircleCheckBig className='w-4 h-4 text-primary mt-1' />
								<div className=''>{item}</div>
							</div>
						)}
					/>
				</div>
				<Link href='/book-appointment?appointment_type=home-visit'>
					<Button className='w-min'>Book Now</Button>
				</Link>
			</div>
			<div>
				<Image
					width={540}
					height={540}
					src={image || HOME_VISIT_IMAGE}
					alt='Service Image'
					className='max-w-sm rounded-lg'
				/>
			</div>
		</div>
	);
}
