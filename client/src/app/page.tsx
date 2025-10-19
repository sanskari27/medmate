/* eslint-disable @next/next/no-img-element */
import FAQSection from '@/components/elements/FAQSection';
import {
	BACK_IN_TIME_IMAGE,
	COSTUMER_IMAGE,
	EXCITED_WOMAN_IMAGE,
	FOLLOW_UP_IMAGE,
	GROUP_IMAGE_1,
	HOUR_SERVICE_IMAGE,
	MEDICAL_TEAM_IMAGE,
	NO_TRAVEL_IMAGE,
	RATE_IMAGE,
	VERIFIED_PHYSICIANS_IMAGE,
} from '@/lib/consts';
import Image from 'next/image';
import Link from 'next/link';

const iconCardData = [
	{
		image: '/images/weakness.svg',
	},
	{
		image: '/images/weakness.svg',
	},
	{
		image: '/images/weakness.svg',
	},
	{
		image: '/images/weakness.svg',
	},
	{
		image: '/images/weakness.svg',
	},
	{
		image: '/images/weakness.svg',
	},
	{
		image: '/images/weakness.svg',
	},
	{
		image: '/images/weakness.svg',
	},
	{
		image: '/images/weakness.svg',
	},
	{
		image: '/images/weakness.svg',
	},
	{
		image: '/images/weakness.svg',
	},
	{
		image: '/images/weakness.svg',
	},
];

export default async function Home() {
	return (
		<>
			<div
				className={`relative flex flex-col items-center justify-center text-sm px-[5%] md:px-16 lg:px-24 xl:px-32 bg-hero-image-blurred text-white min-h-screen`}
			>
				<div className='absolute top-28 -z-1 left-1/4 size-40 md:size-72 bg-blue-600 blur-[300px]'></div>
				<div className='flex items-center flex-col md:flex-row'>
					<div className='flex -space-x-2 pr-3'>
						<img
							src='https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200'
							alt='image'
							className='size-7 rounded-full border-2 border-white hover:-translate-y-0.5 transition z-1'
						/>
						<img
							src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200'
							alt='image'
							className='size-7 rounded-full border-2 border-white hover:-translate-y-0.5 transition z-[2]'
						/>
						<img
							src='https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&h=200&auto=format&fit=crop'
							alt='image'
							className='size-7 rounded-full border-2 border-white hover:-translate-y-0.5 transition z-[3]'
						/>
						<img
							src='https://randomuser.me/api/portraits/men/75.jpg'
							alt='image'
							className='size-7 rounded-full border-2 border-white hover:-translate-y-0.5 transition z-[4]'
						/>
					</div>
					<div className='flex flex-col items-center md:items-start'>
						<svg
							width='79'
							height='16'
							viewBox='0 0 79 16'
							fill='none'
							xmlns='http://www.w3.org/2000/svg'
						>
							<path
								d='M7.06923 1.47645C7.21819 1.0143 7.87205 1.0143 8.02101 1.47645L9.12739 4.90897C9.19397 5.11555 9.38623 5.25558 9.60328 5.25558H13.1921C13.6755 5.25558 13.8775 5.87334 13.4875 6.15896L10.5772 8.29045C10.4034 8.41777 10.3307 8.64213 10.3968 8.84722L11.5068 12.291C11.6555 12.7523 11.1265 13.1342 10.7354 12.8477L7.84056 10.7275C7.66466 10.5987 7.42558 10.5987 7.24968 10.7275L4.3548 12.8477C3.96374 13.1342 3.43477 12.7523 3.58348 12.291L4.69347 8.84722C4.75958 8.64213 4.68686 8.41777 4.51302 8.29045L1.60274 6.15896C1.21276 5.87334 1.41479 5.25558 1.89818 5.25558H5.48696C5.70401 5.25558 5.89627 5.11555 5.96285 4.90897L7.06923 1.47645Z'
								fill='#2563eb'
							/>
							<path
								d='M23.0536 1.47645C23.2026 1.0143 23.8564 1.0143 24.0054 1.47645L25.1118 4.90897C25.1783 5.11555 25.3706 5.25558 25.5877 5.25558H29.1764C29.6598 5.25558 29.8619 5.87334 29.4719 6.15896L26.5616 8.29045C26.3878 8.41777 26.315 8.64213 26.3811 8.84722L27.4911 12.291C27.6398 12.7523 27.1109 13.1342 26.7198 12.8477L23.8249 10.7275C23.649 10.5987 23.41 10.5987 23.2341 10.7275L20.3392 12.8477C19.9481 13.1342 19.4191 12.7523 19.5679 12.291L20.6778 8.84722C20.744 8.64213 20.6712 8.41777 20.4974 8.29045L17.5871 6.15896C17.1971 5.87334 17.3992 5.25558 17.8826 5.25558H21.4713C21.6884 5.25558 21.8806 5.11555 21.9472 4.90897L23.0536 1.47645Z'
								fill='#2563eb'
							/>
							<path
								d='M39.0224 1.47645C39.1713 1.0143 39.8252 1.0143 39.9741 1.47645L41.0805 4.90897C41.1471 5.11555 41.3394 5.25558 41.5564 5.25558H45.1452C45.6286 5.25558 45.8306 5.87334 45.4406 6.15896L42.5303 8.29045C42.3565 8.41777 42.2838 8.64213 42.3499 8.84722L43.4599 12.291C43.6086 12.7523 43.0796 13.1342 42.6886 12.8477L39.7937 10.7275C39.6178 10.5987 39.3787 10.5987 39.2028 10.7275L36.3079 12.8477C35.9169 13.1342 35.3879 12.7523 35.5366 12.291L36.6466 8.84722C36.7127 8.64213 36.64 8.41777 36.4661 8.29045L33.5559 6.15896C33.1659 5.87334 33.3679 5.25558 33.8513 5.25558H37.4401C37.6571 5.25558 37.8494 5.11555 37.916 4.90897L39.0224 1.47645Z'
								fill='#2563eb'
							/>
							<path
								d='M55.0067 1.47645C55.1557 1.0143 55.8096 1.0143 55.9585 1.47645L57.0649 4.90897C57.1315 5.11555 57.3237 5.25558 57.5408 5.25558H61.1296C61.613 5.25558 61.815 5.87334 61.425 6.15896L58.5147 8.29045C58.3409 8.41777 58.2682 8.64213 58.3343 8.84722L59.4443 12.291C59.593 12.7523 59.064 13.1342 58.6729 12.8477L55.7781 10.7275C55.6022 10.5987 55.3631 10.5987 55.1872 10.7275L52.2923 12.8477C51.9012 13.1342 51.3723 12.7523 51.521 12.291L52.631 8.84722C52.6971 8.64213 52.6244 8.41777 52.4505 8.29045L49.5402 6.15896C49.1503 5.87334 49.3523 5.25558 49.8357 5.25558H53.4245C53.6415 5.25558 53.8338 5.11555 53.9004 4.90897L55.0067 1.47645Z'
								fill='#2563eb'
							/>
							<path
								d='M70.9794 1.47645C71.1283 1.0143 71.7822 1.0143 71.9312 1.47645L73.0375 4.90897C73.1041 5.11555 73.2964 5.25558 73.5134 5.25558H77.1022C77.5856 5.25558 77.7876 5.87334 77.3977 6.15896L74.4874 8.29045C74.3135 8.41777 74.2408 8.64213 74.3069 8.84722L75.4169 12.291C75.5656 12.7523 75.0367 13.1342 74.6456 12.8477L71.7507 10.7275C71.5748 10.5987 71.3357 10.5987 71.1598 10.7275L68.265 12.8477C67.8739 13.1342 67.3449 12.7523 67.4936 12.291L68.6036 8.84722C68.6697 8.64213 68.597 8.41777 68.4232 8.29045L65.5129 6.15896C65.1229 5.87334 65.3249 5.25558 65.8083 5.25558H69.3971C69.6142 5.25558 69.8064 5.11555 69.873 4.90897L70.9794 1.47645Z'
								fill='#2563eb'
							/>
						</svg>
						<p className='text-sm text-gray-300'>
							Trusted by over <span className='font-medium text-white'>1,000+</span> satisfied
							patients
						</p>
					</div>
				</div>
				<h1 className='text-4xl leading-[56px] md:text-6xl md:leading-[84px] font-medium max-w-3xl text-center'>
					Quality Healthcare,
					<br /> Delivered to Your Doorstep
				</h1>
				<p className='text-base text-center text-slate-200 max-w-lg'>
					Book a doctor visit at your home within 20 minutes <br />— fast, reliable, and
					hassle-free.
				</p>
				<div className='flex items-center gap-4 mt-8'>
					<Link href='/book-appointment?appointment_type=home-visit'>
						<button className='blue-600 hover:blue-700 text-white rounded-full px-7 h-11'>
							Book Home Visit
						</button>
					</Link>
				</div>
			</div>

			<div className='py-24 px-[5%] slate-50 text-black'>
				<h1 className='text-3xl md:text-5xl font-semibold text-center mx-auto'>
					Our Health, Handled by Trusted Professionals
				</h1>
				<p className='text-lg md:text-xl text-slate-500 text-center mt-2 max-w-3xl mx-auto'>
					Our network of licensed doctors is available to help with everyday health issues <br /> —
					anytime, anywhere.
				</p>

				<div className='flex flex-wrap items-center justify-center gap-8 pt-4'>
					<div className='marquee-row w-full mx-auto max-w-[80%] overflow-hidden relative'>
						<div className='marquee-inner flex transform-gpu min-w-[200%] pt-10 pb-5'>
							{[...iconCardData, ...iconCardData, ...iconCardData].map((card, index) => (
								<IconCard key={index} card={card} />
							))}
						</div>
					</div>
				</div>
			</div>

			<div className='py-20 bg-primary'>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center max-w-[80%] mx-auto'>
					<div className='flex flex-col items-center justify-center max-w-80'>
						<div className='p-6 aspect-square bg-green-100 rounded-full'>
							<img src={COSTUMER_IMAGE} alt='Customer' width={28} height={28} />
						</div>
						<div className='mt-5 space-y-2 text-center'>
							<h3 className='text-3xl font-bold text-slate-100'>500 +</h3>
							<p className='text-lg md:text-xl font-semibold text-slate-200'>Families Cared For</p>
						</div>
					</div>

					<div className='flex flex-col items-center justify-center max-w-80'>
						<div className='p-6 aspect-square bg-orange-100 rounded-full'>
							<img src={MEDICAL_TEAM_IMAGE} alt='Medical Team' width={28} height={28} />
						</div>
						<div className='mt-5 space-y-2 text-center'>
							<h3 className='text-3xl font-bold text-slate-100'>50 +</h3>
							<p className='text-lg md:text-xl font-semibold text-slate-200'>
								Certified Physicians
							</p>
						</div>
					</div>
					<div className='flex flex-col items-center justify-center max-w-80'>
						<div className='p-6 aspect-square bg-violet-100 rounded-full'>
							<img src={BACK_IN_TIME_IMAGE} alt='Back in Time' width={28} height={28} />
						</div>
						<div className='mt-5 space-y-2 text-center'>
							<h3 className='text-3xl font-bold text-slate-100'>30 Minutes</h3>
							<p className='text-lg md:text-xl font-semibold text-slate-200'>Avg. Consult Time</p>
						</div>
					</div>
					<div className='flex flex-col items-center justify-center max-w-80'>
						<div className='p-6 aspect-square bg-orange-100 rounded-full'>
							<img src={RATE_IMAGE} alt='Rate' width={28} height={28} />
						</div>
						<div className='mt-5 space-y-2 text-center'>
							<h3 className='text-3xl font-bold text-slate-100'>4.9</h3>
							<p className='text-lg md:text-xl font-semibold text-slate-200'>Google Review Score</p>
						</div>
					</div>
				</div>
			</div>

			<div className='py-20 px-[5%] bg-slate-50 text-black'>
				<h1 className='text-3xl md:text-5xl font-semibold text-center mx-auto'>
					Why Choose <span className='text-primary'>MedMate</span>?
				</h1>
				<p className='text-lg md:text-xl text-slate-500 text-center mt-2 max-w-3xl mx-auto'>
					Delivering trusted, in-home medical care to 1,000+ families — and counting.
				</p>
				<div className='flex flex-col md:flex-row items-center justify-center'>
					<Image
						className='max-w-2xl w-full xl:-ml-32'
						src={GROUP_IMAGE_1}
						alt=''
						width={700}
						height={700}
					/>
					<div className='px-4 md:px-0'>
						<div className={'flex items-center justify-center gap-6 max-w-md group cursor-pointer'}>
							<div
								className={`p-6 group-hover:bg-violet-100 border border-transparent group-hover:border-violet-300  flex gap-4 rounded-xl transition-colors`}
							>
								<Image
									src={HOUR_SERVICE_IMAGE}
									alt='Hour Service'
									width={28}
									height={28}
									className='size-8 object-contain'
								/>
								<div className='space-y-2'>
									<h3 className='text-base font-semibold text-slate-700'>Available 24/7</h3>
									<p className='text-sm text-slate-600 max-w-xs'>
										24/7 medical care — expert help whenever you need it, wherever you are.
									</p>
								</div>
							</div>
						</div>
						<div className='flex items-center justify-center gap-6 max-w-md group cursor-pointer'>
							<div className='p-6 group-hover:bg-green-100 border border-transparent group-hover:border-green-300 flex gap-4 rounded-xl transition-colors'>
								<Image
									src={FOLLOW_UP_IMAGE}
									alt='Follow Up'
									width={28}
									height={28}
									className='size-8 object-contain'
								/>
								<div className='space-y-2'>
									<h3 className='text-base font-semibold text-slate-700'>Follow-Up Every 2 Days</h3>
									<p className='text-sm text-slate-600 max-w-xs'>
										We check in, so you don’t have to worry. Continue your care until you feel
										better.
									</p>
								</div>
							</div>
						</div>
						<div className='flex items-center justify-center gap-6 max-w-md group cursor-pointer'>
							<div className='p-6 group-hover:bg-orange-100 border border-transparent group-hover:border-orange-300 flex gap-4 rounded-xl transition-colors'>
								<Image
									src={NO_TRAVEL_IMAGE}
									alt='No Travel'
									width={28}
									height={28}
									className='size-8 object-contain'
								/>
								<div className='space-y-2'>
									<h3 className='text-base font-semibold text-slate-700'>No Travel or Waiting</h3>
									<p className='text-sm text-slate-600 max-w-xs'>
										Skip traffic and clinic queues. Care comes to your door, on time.
									</p>
								</div>
							</div>
						</div>
						<div className='flex items-center justify-center gap-6 max-w-md group cursor-pointer'>
							<div className='p-6 group-hover:bg-green-100 border border-transparent group-hover:border-green-300 flex gap-4 rounded-xl transition-colors'>
								<Image
									src={VERIFIED_PHYSICIANS_IMAGE}
									alt='Verified Physicians'
									width={28}
									height={28}
									className='size-8 object-contain'
								/>
								<div className='space-y-2'>
									<h3 className='text-base font-semibold text-slate-700'>Verified Physicians</h3>
									<p className='text-sm text-slate-600 max-w-xs'>
										Experienced doctors from Medanta, Fortis, and more — professionals you can
										trust.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className='flex items-center gap-4 md:-mt-12 mx-auto justify-center'>
					<Link href='/about'>
						<button
							type='button'
							className='w-40 py-3 active:scale-95 transition text-sm text-white rounded-full bg-slate-700'
						>
							<p className='mb-0.5'>Know More</p>
						</button>
					</Link>
				</div>
			</div>

			<div className='py-20 px-[5%] bg-slate-50 text-black'>
				<div className='flex items-center justify-center'>
					<div className='flex flex-col md:flex-row items-center justify-around text-sm border border-gray-200 rounded-2xl m-2 p-2 md:max-w-[80%] w-full bg-white'>
						<div className='flex flex-col text-center md:text-left items-center md:items-start pt-14 md:p-10'>
							<h2 className='md:text-4xl text-2xl font-bold text-gray-800'>
								Transparent Pricing for Quality Care
							</h2>
							<p className='text-slate-500 text-lg'>
								Affordable, clear, and upfront — starting at{' '}
								<span className='font-bold text-black'>₹2,499</span> for a consultation.
							</p>

							<div className='flex items-center gap-4 mt-6'>
								<div className='flex items-center gap-4 mt-8'>
									<Link href='/book-appointment?appointment_type=home-visit'>
										<button className='bg-blue-600 hover:bg-blue-700 text-white rounded-full px-7 h-11'>
											Book Home Visit
										</button>
									</Link>
								</div>
							</div>
						</div>

						<Image
							className='max-w-[375px] pt-10 md:p-0'
							src={EXCITED_WOMAN_IMAGE}
							alt='Excited Woman'
							width={375}
							height={375}
						/>
					</div>
				</div>
			</div>

			<div className='py-20 px-[5%] bg-black text-white'>
				<div className='flex flex-col items-center justify-center max-w-[80%] mx-auto'>
					<div className=''>
						<h1 className='text-3xl md:text-5xl font-semibold text-center mx-auto'>
							How <span className='text-primary'>MedMate</span> Works?
						</h1>
						<p className='text-lg md:text-xl text-slate-500 text-center mt-2 mx-auto'>
							Simple, reliable healthcare in four easy steps — from booking to recovery, all at your
							doorstep.
						</p>
					</div>
					<div className='relative flex flex-col items-center mt-36'>
						<div
							data-orientation='horizontal'
							className='bg-zinc-800 shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px absolute -top-6 left-0 hidden md:block'
						></div>
						<div className='grid gap-4 md:grid-cols-4'>
							<HowItWorksCard
								title='Schedule an Appointment'
								description='Book your visit easily through our app, call center, or website — whenever it suits you.'
								index={1}
							/>
							<HowItWorksCard
								title='Confirm Your Visit'
								description='Receive instant confirmation and details about your upcoming doctor’s visit.'
								index={2}
							/>
							<HowItWorksCard
								title='Detailed Consultation'
								description='Thorough checkups with precise prescriptions and home-delivered medicines.'
								index={3}
							/>
							<HowItWorksCard
								title='Convenient Follow-Ups'
								description='Effortless follow-ups ensuring your health improves smoothly and fully.'
								index={4}
							/>
						</div>
					</div>
				</div>
			</div>

			<div className='py-20 px-[5%] bg-slate-50 text-black'>
				<h1 className='text-3xl md:text-5xl font-semibold text-center mx-auto'>
					Frequently Asked Questions
				</h1>
				<p className='text-lg md:text-xl text-slate-500 text-center mt-2 max-w-3xl mx-auto'>
					Clear answers to help you understand how MedMate delivers trusted healthcare.
				</p>
				<FAQSection />
			</div>

			<div className='py-20 px-[5%] bg-slate-50 text-black'>
				<section className='flex flex-col items-center justify-center mx-auto px-4 md:px-0 max-w-5xl w-full text-center rounded-2xl py-20 md:py-24 bg-start-journey-bg bg-cover bg-center bg-no-repeat'>
					<h1 className='text-3xl md:text-4xl font-medium text-white max-w-4xl'>
						Start your journey to easier, better healthcare today.
					</h1>
					<div className='h-[3px] w-64 my-1 bg-gradient-to-l from-transparent to-white'></div>
					<p className='text-sm md:text-base text-white max-w-xl mt-6'>
						Experience personalized healthcare designed for your convenience — expert care,
						effortless access, and doorstep service whenever you need it. Skip the wait, embrace
						comfort, and stay confidently cared for.
					</p>
					<button className='px-10 py-3 mt-4 text-sm bg-white hover:scale-105 transition duration-300 rounded-full'>
						Book Home Visit
					</button>
				</section>
			</div>
		</>
	);
}

const HowItWorksCard = ({
	title,
	description,
	index,
}: {
	title: string;
	description: string;
	index: number;
}) => (
	<div className='relative p-4 shadow space-y-2 bg-linear-180 outline outline-zinc-800 from-zinc-800 to-zinc-900 rounded-xl'>
		<div
			data-orientation='vertical'
			role='none'
			data-slot='separator-root'
			className='shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px absolute top-6 left-0 block md:hidden'
		></div>
		<div className='absolute top-0 -left-[9px] z-10 flex size-8 items-center justify-center rounded-full bg-zinc-800 p-1 md:-top-12 md:left-0'>
			<span className='text-sm font-medium text-white'>{index}</span>
		</div>
		<div className='pl-7 md:pl-0 py-6'>
			<h3 className='text-base font-semibold tracking-tight text-white'>{title}</h3>
			<p className='text-sm text-zinc-400 lg:text-balance'>{description}</p>
		</div>
	</div>
);

const IconCard = ({ card }: { card: { image: string } }) => (
	<div className='py-4 px-0 md:px-4  mx-auto w-52 md:w-64 shrink-0'>
		<div className='flex gap-2 items-center justify-center'>
			<img className='' src={card.image} alt='User Image' />
		</div>
	</div>
);
