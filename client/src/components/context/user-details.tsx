'use client';

import * as React from 'react';

export type UserDetailsType = {
	name: string;
	email: string;
	phone: string;
};

export type UserDetailsProfile = {
	name: string;
	email: string;
	phone: string;
};

const DEFAULT_VALUES = {
	name: '',
	email: '',
	phone: '',
};

const UserDetailsContext = React.createContext<{
	profile: UserDetailsType;
	setProfile: (details: Partial<UserDetailsType>) => void;
	isLoaded: boolean;
	refreshProfile: () => void;
}>({
	profile: DEFAULT_VALUES,
	setProfile: () => {},
	isLoaded: false,
	refreshProfile: () => {},
});

export function UserDetailsProvider({
	children,
	data,
}: {
	children: React.ReactNode;
	data: UserDetailsType;
}) {
	const [userDetails, setUserDetails] = React.useState<UserDetailsType>(DEFAULT_VALUES);
	const [isLoaded, setLoaded] = React.useState(false);

	const setProfile = (details: Partial<UserDetailsType>) => {
		setUserDetails((prev) => {
			return {
				...prev,
				...details,
			};
		});
	};

	React.useEffect(() => {
		setUserDetails(data);
		setLoaded(true);
	}, [data]);

	const refreshProfile = async () => {};

	return (
		<UserDetailsContext.Provider
			value={{
				profile: userDetails,
				setProfile,
				isLoaded,
				refreshProfile,
			}}
		>
			{children}
		</UserDetailsContext.Provider>
	);
}

export const useUserDetails = () => {
	const { profile, isLoaded, refreshProfile } = React.useContext(UserDetailsContext);
	return { ...profile, isProfileLoaded: isLoaded, reloadProfileData: refreshProfile };
};
