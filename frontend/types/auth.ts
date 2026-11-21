export type User = {
    sub: string;
    email: string;
    exp: string;
    iat: string;
    name: string;
}

export type AuthContextValue = {
    user: User | null;
    guest: boolean;
    loading: boolean;
    refreshUser: () => Promise<void>;
    logout: () => Promise<void>;
}