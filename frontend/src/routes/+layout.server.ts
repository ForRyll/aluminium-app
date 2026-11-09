import type { LayoutServerLoad } from './$types';

// Dipakai layout untuk memutuskan menu tampil dan pengingat backup muncul
export const load: LayoutServerLoad = ({ locals, cookies }) => {
	// Berapa hari sejak backup lengkap terakhir diunduh. null = belum pernah.
	const last = cookies.get('lastBackup');
	let backupDays: number | null = null;
	if (last) {
		const t = Date.parse(last);
		if (!isNaN(t)) backupDays = Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
	}

	return { loggedIn: !!locals.token, backupDays };
};