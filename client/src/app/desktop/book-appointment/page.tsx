import { HighlightSection } from '@/components/elements/HighlightSection';
import { DOCTOR_ON_CALL_IMAGE } from '@/lib/consts';
import { cn } from '@/lib/utils';
import { DOCTORS_MOCKED_DATA } from '@/mock/mockedData';
import { DoctorType } from '@/types/doctor';
import { MapPin } from 'lucide-react';
import Image from 'next/image';
import BookingForm from './_components/booking-form';

const getDoctors = async (id?: string) => {
	const filteredDoctors = DOCTORS_MOCKED_DATA.find((doctor) => {
		if (id && doctor.id !== id) return false;
		return true;
	});
	return filteredDoctors as DoctorType;
};

export default async function BookAppointment({
	searchParams,
}: {
	searchParams: { appointment_type?: string; doctor_id?: string };
}) {
	const doctor = await getDoctors(searchParams.doctor_id);

	return (
		<div className='relative pt-[5%] px-[5%] md:px-[7%]'>
			<div className='flex flex-col gap-4'>
				<div className='flex flex-col gap-6 relative pb-12 md:pb-24'>
					<HighlightSection nonHighlightedText='Book' highlightedText='Now' />
					<div className='text-sm text-center text-muted-foreground max-w-2xl mx-auto '>
						Choose from a range of healthcare services designed for your comfort and convenience.
						Whether at home or clinic, get timely access to trusted medical professionals.
					</div>
				</div>
			</div>
			<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
				{searchParams.doctor_id ? (
					<div>
						<div
							className={cn(
								'gap-2 flex justify-start flex-col shadow-lg rounded-lg p-6 bg-white dark:bg-gray-800 items-start w-full'
							)}
						>
							<div className='w-full'>
								{doctor.image ? (
									<Image
										width={580}
										height={580}
										src={doctor.image}
										alt='Service Image'
										className='w-full aspect-auto rounded-lg'
									/>
								) : null}
							</div>
							<div className='flex flex-col h-min'>
								<div className='text-2xl font-medium mb-4'>{doctor.name}</div>
								<div className='font-medium'>{doctor.education}</div>
								<div>{doctor.experience}</div>
								<div className='text-primary '>Rs. {doctor.price} Consultation fees</div>
								<div className='inline-flex items-center gap-2 text-sm text-muted-foreground'>
									<MapPin className='' />
									{doctor.region}
								</div>
							</div>
						</div>
					</div>
				) : (
					<div>
						<Image
							src={DOCTOR_ON_CALL_IMAGE}
							alt='Doctor on Call'
							width={540}
							height={540}
							// className='max-w-sm rounded-lg'
						/>
					</div>
				)}
				<BookingForm />
			</div>
		</div>
	);
}
