-- 1. Buat Tabel Profil Pengguna
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'roomboy',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Buat Tabel Control Sheet & Log Kamar
CREATE TABLE IF NOT EXISTS room_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE SET NULL,
    roomboy_name TEXT NOT NULL,
    work_date DATE NOT NULL,
    shift TEXT NOT NULL,
    room_number TEXT NOT NULL,
    room_type TEXT NOT NULL,
    pax INT DEFAULT 1,
    initial_status TEXT NOT NULL,
    final_status TEXT NOT NULL,
    time_in TIME NOT NULL,
    time_out TIME NOT NULL,
    notes TEXT,
    linen_usage JSONB DEFAULT '[]'::jsonb,
    amenities_usage JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Aktifkan Keamanan Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_logs ENABLE ROW LEVEL SECURITY;

-- 4. Policy Akses Tabel
CREATE POLICY "Public profiles are readable by authenticated users" 
ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read room_logs" 
ON room_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert room_logs" 
ON room_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated delete room_logs" 
ON room_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
