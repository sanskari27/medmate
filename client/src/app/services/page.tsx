// app/services/page.tsx
import {
	Activity,
	Ambulance,
	Apple,
	Baby,
	Bone,
	Brain,
	ClipboardList,
	Ear,
	Eye,
	FlaskConical,
	Heart,
	HeartPulse,
	Home,
	Hospital,
	Image,
	PhoneCall,
	Smile,
	Stethoscope,
	Sun,
	Syringe,
} from 'lucide-react';

const services = [
	{ id: 1, title: 'General Consultation', icon: Stethoscope },
	{ id: 2, title: 'Dental Care', icon: Smile },
	{ id: 3, title: 'Eye Checkup', icon: Eye },
	{ id: 4, title: 'On-Call Doctor', icon: PhoneCall },
	{ id: 5, title: 'In-Person Visit', icon: Hospital },
	{ id: 6, title: 'Pediatrics', icon: Baby },
	{ id: 7, title: 'Cardiology', icon: Heart },
	{ id: 8, title: 'Orthopedics', icon: Bone },
	{ id: 9, title: 'Dermatology', icon: Sun },
	{ id: 10, title: 'ENT Specialist', icon: Ear },
	{ id: 11, title: 'Physiotherapy', icon: Activity },
	{ id: 12, title: 'Psychiatry', icon: Brain },
	{ id: 13, title: 'Gynecology', icon: HeartPulse },
	{ id: 14, title: 'Pathology Tests', icon: FlaskConical },
	{ id: 15, title: 'Radiology', icon: Image },
	{ id: 16, title: 'Vaccination', icon: Syringe },
	{ id: 17, title: 'Emergency Care', icon: Ambulance },
	{ id: 18, title: 'Nutrition', icon: Apple },
	{ id: 19, title: 'Chronic Care', icon: ClipboardList },
	{ id: 20, title: 'Home Visit', icon: Home },
];

export default function ServicesPage() {
	return (
		<div className='min-h-screen bg-gray-50'>
			<div className='px-12 py-4 font-semibold text-3xl'>Services</div>
			<div className='flex justify-center items-center '>
				<div className='grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-10 px-10 mb-20'>
					{services.map(({ id, title, icon: Icon }) => (
						<div key={id} className='flex flex-col items-center group cursor-pointer'>
							{/* Icon Button */}
							<div className='w-20 h-20 flex items-center justify-center rounded-2xl bg-white shadow-md group-hover:bg-blue-100 transition'>
								<Icon
									size={36}
									className='text-blue-600 group-hover:scale-110 transition-transform'
								/>
							</div>
							{/* Title Below */}
							<span className='mt-3 text-sm font-medium text-gray-800 text-center group-hover:text-blue-700'>
								{title}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
