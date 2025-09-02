export interface UserProfile {
	id: number;
	nome: string;
}

export interface User {
	id: string;
	email: string;
	nome: string;
	role: number;
	tenant_id: number;
	super_admin: boolean;
	perfil: UserProfile;
}
