import { supabase } from './config.js';

export async function saveRoomLog(logData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Akses ditolak: Silakan login terlebih dahulu.");

    const { data, error } = await supabase
        .from('room_logs')
        .insert([{
            user_id: user.id,
            roomboy_name: logData.roomboy,
            work_date: logData.date,
            shift: logData.shift,
            room_number: logData.roomNumber,
            room_type: logData.roomType,
            pax: logData.pax,
            initial_status: logData.initialStatus,
            final_status: logData.finalStatus,
            time_in: logData.timeIn,
            time_out: logData.timeOut,
            notes: logData.notes,
            linen_usage: logData.linen,
            amenities_usage: logData.amenities
        }]);

    if (error) throw error;
    return data;
}

export async function fetchRoomLogs(startDate, endDate, roomboy = 'ALL') {
    let query = supabase
        .from('room_logs')
        .select('*')
        .gte('work_date', startDate)
        .lte('work_date', endDate)
        .order('created_at', { ascending: false });

    if (roomboy !== 'ALL') {
        query = query.eq('roomboy_name', roomboy);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

export async function deleteRoomLogs(logIds) {
    const { data, error } = await supabase
        .from('room_logs')
        .delete()
        .in('id', logIds);

    if (error) throw error;
    return data;
}