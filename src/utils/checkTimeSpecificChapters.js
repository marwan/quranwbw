import { __timeSpecificChapters } from '$utils/stores';

export function checkTimeSpecificChapters() {
	const currentHour = new Date().getHours();
	const isNightTime = currentHour < 4 || currentHour > 19;
	const isFridayToday = new Date().getDay() === 5;

	__timeSpecificChapters.set({
		isFriday: isFridayToday,
		isNight: isNightTime
	});
}
