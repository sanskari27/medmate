export const LOGO = '/images/medmate.webp';
export const WEAKNESS_IMAGE = '/images/weakness.svg';
export const BACK_IN_TIME_IMAGE = '/images/back-in-time.png';
export const COSTUMER_IMAGE = '/images/costumer.png';
export const MEDICAL_TEAM_IMAGE = '/images/medical-team.png';
export const RATE_IMAGE = '/images/rate.png';
export const HOUR_SERVICE_IMAGE = '/images/24-hour-service.png';
export const FOLLOW_UP_IMAGE = '/images/medical-report.png';
export const NO_TRAVEL_IMAGE = '/images/happy-hour.png';
export const VERIFIED_PHYSICIANS_IMAGE = '/images/badge.png';
export const GROUP_IMAGE_1 = '/images/group-image-1.webp';
export const EXCITED_WOMAN_IMAGE = '/images/excited-women.webp';
export const START_JOURNEY_BUTTON = '/images/start-journey-bg.webp';
export const TEAM_IMAGE = '/images/doctors.webp';
export const NOT_FOUND_IMAGE = '/images/not-found.svg';

export const Paths = {
	LANDING: '/',
	SERVICES: '/services',
	ABOUT: '/about',
	BLOG: '/blog',
	CONTACT: '/contact',
};

export const COLORS = {
	A: { name: 'Army Green', hex: '#4B5320' },
	B: { name: 'Burgundy', hex: '#800020' },
	C: { name: 'Chocolate', hex: '#7B3F00' },
	D: { name: 'Dark Olive Green', hex: '#556B2F' },
	E: { name: 'Eggplant', hex: '#614051' },
	F: { name: 'Feldgrau', hex: '#4D5D53' },
	G: { name: 'Granite Gray', hex: '#676767' },
	H: { name: 'Heliotrope Gray', hex: '#AA98A9' },
	I: { name: 'Independence', hex: '#4C516D' },
	J: { name: 'Juniper', hex: '#6D9292' },
	K: { name: 'Kombu Green', hex: '#354230' },
	L: { name: 'Liver', hex: '#534B4F' },
	M: { name: 'Midnight Green', hex: '#004953' },
	N: { name: 'Night Blue', hex: '#2A2D3B' },
	O: { name: 'Outer Space', hex: '#414A4C' },
	P: { name: "Payne's Gray", hex: '#536878' },
	Q: { name: 'Quartz', hex: '#51484F' },
	R: { name: 'Royal Brown', hex: '#523B35' },
	S: { name: 'Shadow', hex: '#8A795D' },
	T: { name: 'Taupe', hex: '#483C32' },
	U: { name: 'UCLA Blue', hex: '#0033A0' },
	V: { name: 'Vandyke Brown', hex: '#664228' },
	W: { name: 'Warm Black', hex: '#004242' },
	X: { name: 'Xanadu', hex: '#738678' },
	Y: { name: 'Yale Blue', hex: '#0F4D92' },
	Z: { name: 'Zinnwaldite Brown', hex: '#2C1608' },
};

export const REVALIDATE_TAGS = {
	PAGE: 'page',
};

export const JWT_SECRET = process.env.JWT_SECRET || 'medmate-secret-key';

export const GOOGLE_CLIENT_ID =
	(process.env.GOOGLE_CLIENT_ID! as string) ||
	(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID! as string);
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET! as string;
