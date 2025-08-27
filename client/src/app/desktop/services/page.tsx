import Each from '@/components/containers/each';
import { HighlightSection } from '@/components/elements/HighlightSection';
import {
	SERVICE_1_IMAGE,
	SERVICE_2_IMAGE,
	SERVICE_3_IMAGE,
	SERVICE_4_IMAGE,
	SERVICE_5_IMAGE,
	SERVICE_6_IMAGE,
} from '@/lib/consts';
import ServiceContainer from './_components/service-container';

const services: { title: string; description: string; items: string[]; image: string }[] = [
	{
		title: 'Doctor at Home',
		description:
			'No need to visit a clinic when youre unwell. With Medmate, a qualified doctor comes to your home to check you, give treatment, and provide prescriptions — all without you stepping out.',
		items: [
			'Get expert care at home for common health issues',
			'Doctor visits you quickly when you need help',
			'Prescription and advice right from your home',
		],
		image: SERVICE_1_IMAGE,
	},
	{
		title: 'Nursing Care at Home',
		description:
			'Need help recovering after surgery or managing a health condition? Our trained nurses come to your home to take care of you with kindness and skill — just like family, but with medical experience.',
		items: [
			'Get expert care at home for common health issues',
			'Special care for long-term or serious conditions',
			'Safe and comfortable recovery at home',
		],
		image: SERVICE_2_IMAGE,
	},
	{
		title: 'Physiotherapy at Home',
		description:
			'Need help with pain, injury, or mobility? Our physiotherapists will come to your home and guide you through exercises to help you feel stronger and move better.',
		items: [
			'Personal sessions for pain relief and better movement',
			'Helpful after surgery, injury, or for chronic pain',
			'All care happens in your home, at your pace',
		],
		image: SERVICE_3_IMAGE,
	},
	{
		title: 'Lab Test at Home',
		description:
			'Need a blood test or other health check? Skip the lab visit. Our staff will come to your home, collect your sample safely, and send the results to you quickly.',
		items: [
			'Safe sample collection at your doorstep',
			'Safe sample collection at your doorstep',
			'No travel, no waiting in line',
		],
		image: SERVICE_4_IMAGE,
	},
	{
		title: 'Medicine Delivery',
		description:
			'Running out of medicines? Don’t worry. We’ll bring them to your home quickly. Just share your prescription and relax — we’ll handle the rest.',
		items: [
			'Fast and easy medicine delivery at home',
			'No need to step out to find a pharmacy',
			'Reliable service across Bengaluru',
		],
		image: SERVICE_5_IMAGE,
	},
	{
		title: 'Ambulance Booking',
		description:
			'In an emergency or when you need to go to the hospital, we’ll help you book a trusted ambulance fast. Our team makes sure you get help on time.',
		items: [
			'Quick ambulance service when you need it most',
			'For emergencies or planned hospital visits',
			'Safe and comfortable transport across Bengaluru',
		],
		image: SERVICE_6_IMAGE,
	},
];

export default function Services() {
	return (
		<div className='relative pt-[5%] px-[5%] md:px-[7%]'>
			<div className='flex flex-col gap-4'>
				<div className='flex flex-col gap-6 relative pb-12 md:pb-24'>
					<HighlightSection
						nonHighlightedText='Expert Care, Right At Your'
						highlightedText='Doorstep'
					/>
					<div className='text-sm text-center text-muted-foreground max-w-2xl mx-auto '>
						Choose from a range of healthcare services designed for your comfort and convenience.
						Whether at home or clinic, get timely access to trusted medical professionals.
					</div>
				</div>
				<div className='grid grid-cols-1 gap-6'>
					<Each
						items={services}
						render={(service, index) => (
							<ServiceContainer
								title={service.title}
								description={service.description}
								items={service.items}
								image={service.image}
								className={`${index % 2 === 0 ? 'md:!flex-row-reverse' : ''}`}
							/>
						)}
					/>
				</div>
			</div>
		</div>
	);
}
