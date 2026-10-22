import type { LayoutServerLoad } from './$types';

// Dipakai layout untuk memutuskan menu tampil atau tidak
export const load: LayoutServerLoad = ({ locals }) => ({ loggedIn: !!locals.token });
