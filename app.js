import { supabase } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    fetchLogs();

    const form = document.getElementById('roomLogForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btnSubmit = document.getElementById('btnSubmit');
            btnSubmit.disabled = true;
            btnSubmit.innerText = "⏳ Menyimpan...";

            const roomNumber = document.getElementById('roomNumber').value;
            const roomStatus = document.getElementById('roomStatus').value;
            const roomBoyName = document.getElementById('roomBoyName').value;
            const roomRemarks = document.getElementById('roomRemarks').value;

            try {
                const { error } = await supabase
                    .from('room_logs')
                    .insert([
                        {
                            room_number: roomNumber,
                            status: roomStatus,
                            room_boy: roomBoyName,
                            remarks: roomRemarks,
                            created_at: new Date().toISOString()
                        }
                    ]);

                if (error) throw error;

                form.reset();
                fetchLogs();
            } catch (err) {
                alert("Gagal menyimpan data: " + err.message);
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerText = "➕ Simpan Data Log";
            }
        });
    }

    const btnPrint = document.getElementById('btnPrint');
    if (btnPrint) {
        btnPrint.addEventListener('click', () => {
            const element = document.getElementById('printArea');
            const opt = {
                margin:       0.5,
                filename:     `Room_Boy_Control_Sheet_${new Date().toISOString().slice(0,10)}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2 },
                jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
            };
            html2pdf().set(opt).from(element).save();
        });
    }
});

async function fetchLogs() {
    const tbody = document.getElementById('logTableBody');
    if (!tbody) return;

    try {
        const { data, error } = await supabase
            .from('room_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400">Belum ada data log kamar.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(item => {
            const time = item.created_at ? new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
            return `
                <tr class="hover:bg-slate-50 border-b border-slate-100">
                    <td class="p-2.5 font-mono text-slate-500">${time}</td>
                    <td class="p-2.5 font-bold text-slate-800">${item.room_number || '-'}</td>
                    <td class="p-2.5">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${getStatusColor(item.status)}">
                            ${item.status || '-'}
                        </span>
                    </td>
                    <td class="p-2.5 text-slate-700">${item.room_boy || '-'}</td>
                    <td class="p-2.5 text-slate-500">${item.remarks || '-'}</td>
                    <td class="p-2.5 text-center action-col">
                        <button onclick="deleteLog('${item.id}')" class="text-red-500 hover:text-red-700 text-xs font-bold">🗑️ Hapus</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">Gagal memuat data: ${err.message}</td></tr>`;
    }
}

function getStatusColor(status) {
    switch (status) {
        case 'VC': return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
        case 'VD': return 'bg-rose-100 text-rose-800 border border-rose-300';
        case 'OC': return 'bg-blue-100 text-blue-800 border border-blue-300';
        case 'OD': return 'bg-amber-100 text-amber-800 border border-amber-300';
        default: return 'bg-slate-100 text-slate-700';
    }
}

window.deleteLog = async function(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus log ini?')) return;
    try {
        const { error } = await supabase.from('room_logs').delete().eq('id', id);
        if (error) throw error;
        fetchLogs();
    } catch (err) {
        alert("Gagal menghapus: " + err.message);
    }
};
