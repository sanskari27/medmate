import FAQ from '@/components/elements/faq';
import { HighlightSection } from '@/components/elements/HighlightSection';
import { FAQ_IMG } from '@/lib/consts';
import { slugify } from '@/lib/utils';
import { consultationFaqs } from '@/mock/faq';
import { DoctorType } from '@/types/doctor';
import Image from 'next/image';
import DoctorsGrid from '../../../components/elements/DoctorsGrid';
import { DoctorsList } from '../../../components/elements/DoctorsList';
import ConsultationFilters from '../../../components/elements/Filters';
import { DOCTORS_MOCKED_DATA } from '../../../mock/mockedData';

const getDoctors = async (searchParams: {
	location?: string;
	hospital?: string;
	department?: string;
	gender?: string;
	experience?: string;
}) => {
	const filteredDoctors = DOCTORS_MOCKED_DATA.filter((doctor) => {
		if (searchParams.location && slugify(doctor.region) !== slugify(searchParams.location))
			return false;
		if (searchParams.hospital && slugify(doctor.hospital) !== slugify(searchParams.hospital))
			return false;
		if (searchParams.department && slugify(doctor.department) !== slugify(searchParams.department))
			return false;
		if (searchParams.gender && slugify(doctor.gender) !== slugify(searchParams.gender))
			return false;
		if (searchParams.experience && slugify(doctor.experience) !== slugify(searchParams.experience))
			return false;
		return true;
	});
	return filteredDoctors as DoctorType[];
};

export default async function Consultation({
	searchParams,
}: {
	searchParams: {
		location?: string;
		hospital?: string;
		department?: string;
		gender?: string;
		experience?: string;
	};
}) {
	const isFiltered = Object.values(searchParams).some((value) => value !== undefined);

	const doctors = await getDoctors(searchParams);

	return (
		<div className='relative pt-[5%] px-[5%] md:px-[7%]'>
			<div className='flex flex-col gap-4'>
				<div className='flex flex-col gap-2 relative'>
					<HighlightSection nonHighlightedText='Healthcare at Your' highlightedText='Doorstep' />
					<div className='text-2xl font-bold text-center text-primary'>
						Find Your Perfect Doctor
					</div>
					<div className='text-sm text-center text-muted-foreground'>
						Easily schedule in-clinic consultations with trusted doctors near you.{' '}
					</div>
					<div>
						<ConsultationFilters />
					</div>
				</div>
				<div>
					<div>
						{!isFiltered ? (
							<div className='mt-6 relative'>
								<DoctorsGrid doctors={doctors.slice(0, 4)} />
							</div>
						) : (
							<div className='mt-6 relative'>
								<DoctorsList doctors={doctors} appointmentType='home-visit' />
							</div>
						)}
					</div>
				</div>
				<section
					id='faq'
					className='w-full min-h-screen flex flex-col items-center justify-center gap-0 my-24'
				>
					<p className='text-center text-3xl font-medium'>Frequently Asked Questions</p>
					<div className='flex flex-row-reverse items-center justify-center gap-8 w-full'>
						<div>
							<Image
								src={FAQ_IMG}
								alt='FAQ'
								width={500}
								height={300}
								className='mb-8 hidden lg:block'
							/>
						</div>

						<div className='mt-[5%]'>
							<div>
								<div className='p-8'>
									<FAQ items={consultationFaqs} />
								</div>
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
