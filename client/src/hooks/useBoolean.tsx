'use client';
import { useState } from 'react';

interface UseBooleanReturn {
	value: boolean;
	on: () => void;
	off: () => void;
	toggle: () => void;
	set: (newValue: boolean) => void;
}

export default function useBoolean(defaultValue = false): UseBooleanReturn {
	const [value, setValue] = useState(defaultValue);

	const on = () => setValue(true);
	const off = () => setValue(false);
	const toggle = () => setValue((prev) => !prev);
	const setValueTo = (newValue: boolean) => setValue(newValue);

	return { value, on, off, toggle, set: setValueTo };
}
