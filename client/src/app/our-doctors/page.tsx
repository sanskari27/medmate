/* eslint-disable @next/next/no-img-element */
'use client';

import PageCover from '@/components/elements/PageCover';
import StartJourneyCTA from '@/components/elements/StartJourneyCTA';
import { useState } from 'react';

// blogs data removed (unused)

type Doctor = {
	name: string;
	speciality: string;
	region: string;
	image: string;
	hospital: string;
	department: string;
	gender: string;
	experience: string;
};

const doctors: Doctor[] = [
	{
		name: 'Dr. Aarav Sharma',
		speciality: 'Cardiology',
		region: 'New Delhi',
		image: 'https://images.unsplash.com/photo-1550831107-1553da8c8464',
		hospital: 'Fortis Escorts Heart Institute',
		department: 'Cardiology',
		gender: 'Male',
		experience: '15 years',
	},
	{
		name: 'Dr. Nisha Patel',
		speciality: 'Dermatology',
		region: 'Mumbai',
		image: 'https://images.unsplash.com/photo-1550831107-1553da8c8464',
		hospital: 'Lilavati Hospital',
		department: 'Dermatology',
		gender: 'Female',
		experience: '10 years',
	},
	{
		name: 'Dr. Rohan Mehta',
		speciality: 'Orthopedics',
		region: 'Bengaluru',
		image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e',
		hospital: 'Manipal Hospital',
		department: 'Orthopedics',
		gender: 'Male',
		experience: '12 years',
	},
	{
		name: 'Dr. Sneha Iyer',
		speciality: 'Pediatrics',
		region: 'Chennai',
		image: 'https://images.unsplash.com/photo-1594824476967-48c8b9642737',
		hospital: "Apollo Children's Hospital",
		department: 'Pediatrics',
		gender: 'Female',
		experience: '9 years',
	},
	{
		name: 'Dr. Aditya Verma',
		speciality: 'Neurology',
		region: 'Hyderabad',
		image: 'https://images.unsplash.com/photo-1588776814546-ec6e2e2f73ec',
		hospital: 'Yashoda Hospitals',
		department: 'Neurology',
		gender: 'Male',
		experience: '14 years',
	},
	{
		name: 'Dr. Priya Nair',
		speciality: 'Gynecology',
		region: 'Kochi',
		image: 'https://images.unsplash.com/photo-1584515933487-779824d29309',
		hospital: 'Aster Medcity',
		department: 'Gynecology',
		gender: 'Female',
		experience: '11 years',
	},
	{
		name: 'Dr. Manish Bansal',
		speciality: 'Oncology',
		region: 'Gurugram',
		image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d',
		hospital: 'Medanta The Medicity',
		department: 'Oncology',
		gender: 'Male',
		experience: '16 years',
	},
	{
		name: 'Dr. Kavita Reddy',
		speciality: 'Ophthalmology',
		region: 'Pune',
		image: 'https://images.unsplash.com/photo-1600959907703-1596e3844a5c',
		hospital: 'Sankara Eye Hospital',
		department: 'Ophthalmology',
		gender: 'Female',
		experience: '8 years',
	},
	{
		name: 'Dr. Rahul Sinha',
		speciality: 'ENT',
		region: 'Kolkata',
		image: 'https://images.unsplash.com/photo-1583912268181-6b3b88bde5e1',
		hospital: 'AMRI Hospital',
		department: 'ENT',
		gender: 'Male',
		experience: '10 years',
	},
	{
		name: 'Dr. Aditi Chatterjee',
		speciality: 'Psychiatry',
		region: 'New Delhi',
		image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e',
		hospital: 'AIIMS',
		department: 'Psychiatry',
		gender: 'Female',
		experience: '13 years',
	},
	{
		name: 'Dr. Arjun Menon',
		speciality: 'Pulmonology',
		region: 'Bengaluru',
		image: 'https://images.unsplash.com/photo-1550831107-1553da8c8464',
		hospital: 'Columbia Asia Hospital',
		department: 'Pulmonology',
		gender: 'Male',
		experience: '9 years',
	},
	{
		name: 'Dr. Reema Kapoor',
		speciality: 'Endocrinology',
		region: 'Mumbai',
		image: 'https://images.unsplash.com/photo-1584515933487-779824d29309',
		hospital: 'Hinduja Hospital',
		department: 'Endocrinology',
		gender: 'Female',
		experience: '12 years',
	},
	{
		name: 'Dr. Saurabh Ghosh',
		speciality: 'Gastroenterology',
		region: 'Kolkata',
		image: 'https://images.unsplash.com/photo-1606813902775-9a91c9e51b1b',
		hospital: 'Apollo Gleneagles Hospital',
		department: 'Gastroenterology',
		gender: 'Male',
		experience: '14 years',
	},
	{
		name: 'Dr. Tanya Malhotra',
		speciality: 'Internal Medicine',
		region: 'New Delhi',
		image: 'https://images.unsplash.com/photo-1600959907703-1596e3844a5c',
		hospital: 'Max Super Specialty Hospital',
		department: 'Internal Medicine',
		gender: 'Female',
		experience: '10 years',
	},
	{
		name: 'Dr. Harish Rao',
		speciality: 'Urology',
		region: 'Hyderabad',
		image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d',
		hospital: 'KIMS Hospital',
		department: 'Urology',
		gender: 'Male',
		experience: '13 years',
	},
	{
		name: 'Dr. Meena D’Souza',
		speciality: 'Nephrology',
		region: 'Mangalore',
		image: 'https://images.unsplash.com/photo-1594824476967-48c8b9642737',
		hospital: 'Father Muller Medical College',
		department: 'Nephrology',
		gender: 'Female',
		experience: '11 years',
	},
	{
		name: 'Dr. Vikas Singh',
		speciality: 'Radiology',
		region: 'Lucknow',
		image: 'https://images.unsplash.com/photo-1588776814546-ec6e2e2f73ec',
		hospital: 'Sahara Hospital',
		department: 'Radiology',
		gender: 'Male',
		experience: '9 years',
	},
	{
		name: 'Dr. Ananya Joshi',
		speciality: 'Obstetrics',
		region: 'Pune',
		image: 'https://images.unsplash.com/photo-1606813902775-9a91c9e51b1b',
		hospital: 'Jehangir Hospital',
		department: 'Obstetrics',
		gender: 'Female',
		experience: '8 years',
	},
	{
		name: 'Dr. Ritesh Chauhan',
		speciality: 'Anesthesiology',
		region: 'Gurugram',
		image: 'https://images.unsplash.com/photo-1584515933487-779824d29309',
		hospital: 'Artemis Hospital',
		department: 'Anesthesiology',
		gender: 'Male',
		experience: '15 years',
	},
	{
		name: 'Dr. Charu Bajaj',
		speciality: 'Rheumatology',
		region: 'New Delhi',
		image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e',
		hospital: 'BLK Super Specialty Hospital',
		department: 'Rheumatology',
		gender: 'Female',
		experience: '12 years',
	},
	// ... continue up to 50 entries
];

export default function OurDoctorsPage() {
	const [viewAll, setViewAll] = useState(false);

	const doctorsToShow = viewAll ? doctors : doctors.slice(0, 8);

	return (
		<>
			<PageCover
				className='bg-image before:bg-our-doctors'
				title='Our Doctors – Caring Hands, Expert Minds'
				description='Because every patient deserves medical care that feels personal, safe, and right at home.'
			/>
			<div className='py-20 bg-slate-50'>
				<h1 className='text-3xl font-medium text-slate-800 text-center'>
					Meet the Experts Who Care
				</h1>
				<p className='text-slate-500 text-center'>
					The people behind the product, passionate about what they do.
				</p>
				<div className='px-[5%] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 justify-center gap-6 mt-12'>
					{doctorsToShow.map((doctor) => (
						<DoctorsCard key={doctor.name} doctor={doctor} />
					))}
				</div>
				{doctorsToShow.length < doctors.length && (
					<button
						type='button'
						className='flex mx-auto items-center gap-2.5 border border-gray-500/30 px-4 py-2 text-sm text-gray-800 rounded bg-white hover:text-blue-400 hover:bg-blue-400/10 hover:border-blue-400/30 active:scale-95 transition mt-6'
						onClick={() => setViewAll(!viewAll)}
					>
						<svg
							width='16'
							height='16'
							viewBox='0 0 16 16'
							fill='none'
							xmlns='http://www.w3.org/2000/svg'
						>
							<path
								d='M3.5 12.5V1.003S3.5.5 4 .5h11s.5.002.5.502v13s0 1.498-1.5 1.498H2s-1.5.002-1.5-1.998v-7.5S.5 5.5 1 5.5h1m4.5-2H9m-2.5 2h6m-6 2h6m-6 2h6m-6 2h6'
								stroke='#60A5FA'
								strokeWidth='1.2'
								strokeLinecap='round'
								strokeLinejoin='round'
							/>
						</svg>
						View All
					</button>
				)}
			</div>
			<StartJourneyCTA />
		</>
	);
}

const DoctorsCard = ({ doctor }: { doctor: Doctor }) => (
	<div className='w-full bg-black text-white rounded-2xl'>
		<div className='relative -mt-px overflow-hidden rounded-2xl'>
			<img
				src={doctor.image}
				alt=''
				className='h-[270px] w-full rounded-2xl hover:scale-105 transition-all duration-300 object-cover object-top'
			/>
			<div className='absolute bottom-0 z-10 h-60 w-full bg-gradient-to-t pointer-events-none from-black to-transparent'></div>
		</div>
		<div className='px-4 pb-6 text-center'>
			<p className='mt-4 text-lg'>{doctor.name}</p>
			<p className='text-sm font-medium bg-gradient-to-r from-[#8B5CF6] via-[#9938CA] to-[#E0724A] text-transparent bg-clip-text'>
				{doctor.speciality}
			</p>
		</div>
	</div>
);
