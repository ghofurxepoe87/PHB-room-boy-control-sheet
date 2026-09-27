import { supabase } from './config.js';

export async function loginUser(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    return data;
}

export async function registerUser(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) throw error;

    if (data.user) {
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: data.user.id, full_name: fullName }]);
        
        if (profileError) console.error("Error profil:", profileError);
    }

    return data;
}

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

    return { ...user, fullName: profile?.full_name || user.email };
}

export async function logoutUser() {
    await supabase.auth.signOut();
    window.location.reload();
}
