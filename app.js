import { supabase } from './config.js';

let allLogs = [];

document.addEventListener('DOMContentLoaded', () => {
    // Set default tanggal hari ini
    const today = new Date().toISOString().split('T')[0];
    const entryDateInput = document.getElementById('entryDate');
    if (entryDateInput) entryDateInput.value = today;

    // Set default jam masuk sekarang
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const timeInInput = document.getElementById('timeIn');
    if (timeInInput) timeInInput.value = currentTime;

    // Muat data awal
    fetchLogs();

    // Event Submit Form
    const form = document.getElementById('roomLogForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // Event Filter & Search
    document.getElementById('searchRoom')?.addEventListener('input', applyFilters);
    document.getElementById('filterStatus')?.addEventListener('change', applyFilters);
    document.getElementById('filterShift')?.addEventListener('change', applyFilters);
    document.getElementById('btnReload')?.addEventListener('click', fetchLogs);

    // Event Export Excel
    document.getElementById('btnExportExcel')?.addEventListener('click', exportToExcel);

    // Event Export PDF
    document.getElementById('btnExportPDF')?.addEventListener('click', exportToPDF);

    // Event Kirim ke WhatsApp
    document.getElementById('btnShareWA')?.addEventListener('click', shareToWhatsApp);
});

// 1. Ambil Data dari Supabase
async function fetchLogs() {
    const tbody = document.getElementById('logTableBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-slate-400">⏳ Mengambil data terbaru...</td></tr>`;
    }

    try {
        const { data, error } = await supabase
            .from('room_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allLogs = data || [];
        updateStatistics(allLogs);
        renderTable(allLogs);
    } catch (err) {
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-red-500 font-bold">Gagal memuat data: ${err.message}</td></tr>`;
        }
    }
}

// 2. Simpan Data Baru
async function handleFormSubmit(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btnSubmit');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<span>⏳ Menyimpan...</span>`;

    // Ambil checklist linen
    const linens = [];
    if (document.getElementById('linenSheet')?.checked) linens.push('Sheet');
    if (document.getElementById('linenDuvet')?.checked) linens.push('Duvet');
    if (document.getElementById('linenTowel')?.checked) linens.push('Towel');
    if (document.getElementById('linenMat')?.checked) linens.push('Mat');

    const newLog = {
        date: document.getElementById('entryDate').value,
        shift: document.getElementById('entryShift').value,
        room_number: document.getElementById('roomNumber').value.trim(),
        floor: document.getElementById('roomFloor').value.trim() || '-',
        room_type: document.getElementById('roomType').value,
        status: document.getElementById('roomStatus').value,
        room_boy: document.getElementById('roomBoyName').value.trim(),
        time_in: document.getElementById('timeIn').value || '-',
        time_out: document.getElementById('timeOut').value || '-',
        linen_change: linens.join(', ') || '-',
        maintenance: document.getElementById('roomMaintenance').value.trim() || '-',
        remarks: document.getElementById('roomRemarks').value.trim() || '-',
        created_at: new Date().toISOString()
    };

    try {
        const { error } = await supabase.from('room_logs').insert([newLog]);
        if (error) throw error;

        // Reset sebagian input form agar mudah input kamar berikutnya
        document.getElementById('roomNumber').value = '';
        document.getElementById('roomRemarks').value = '';
        document.getElementById('roomMaintenance').value = '';
        document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
        
        fetchLogs();
    } catch (err) {
        alert("Gagal menyimpan data: " + err.message);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<span>💾 Simpan Log Kamar</span>`;
    }
}

// 3. Render Tabel
function renderTable(logs) {
    const tbody = document.getElementById('logTableBody');
    if (!tbody) return;

    if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-slate-400">Tidak ada catatan kamar yang cocok.</td></tr>`;
        return;
    }

    tbody.innerHTML = logs.map(item => {
        const dateStr = item.date || (item.created_at ? item.created_at.slice(0, 10) : '-');
        const badgeColor = getStatusBadge(item.status);

        return `
            <tr class="hover:bg-slate-50 border-b border-slate-100 transition">
                <td class="p-2.5 font-medium text-slate-600">
                    <div class="font-bold text-slate-800">${dateStr}</div>
                    <span class="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">${item.shift || 'Pagi'}</span>
                </td>
                <td class="p-2.5">
                    <span class="text-sm font-black text-slate-900 block">${item.room_number || '-'}</span>
                    <span class="text-[10px] text-slate-400">${item.floor || ''} • ${item.room_type || ''}</span>
                </td>
                <td class="p-2.5">
                    <span class="px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase ${badgeColor}">
                        ${item.status || '-'}
                    </span>
                </td>
                <td class="p-2.5 font-semibold text-slate-700">${item.room_boy || '-'}</td>
                <td class="p-2.5 font-mono text-[11px] text-slate-500">${item.time_in || '-'} - ${item.time_out || '-'}</td>
                <td class="p-2.5 text-[11px] text-slate-600 max-w-[120px] truncate" title="${item.linen_change}">${item.linen_change || '-'}</td>
                <td class="p-2.5 text-[11px] text-slate-600 max-w-[150px]">
                    ${item.maintenance && item.maintenance !== '-' ? `<span class="text-rose-600 font-bold block">⚠️ ${item.maintenance}</span>` : ''}
                    <span>${item.remarks || '-'}</span>
                </td>
                <td class="p-2.5 text-center action-col">
                    <div class="flex items-center justify-center gap-1.5">
                        <button onclick="quickSetClean('${item.id}')" title="Tandai Selesai Bersih" class="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 p-1.5 rounded text-[11px] font-bold">
                            ✅ VC
                        </button>
                        <button onclick="deleteLog('${item.id}')" title="Hapus Data" class="bg-rose-100 hover:bg-rose-200 text-rose-800 p-1.5 rounded text-[11px] font-bold">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// 4. Perhitungan Metrik Kartu Atas
function updateStatistics(logs) {
    document.getElementById('statTotal').innerText = logs.length;
    document.getElementById('statVC').innerText = logs.filter(l => l.status === 'VC').length;
    document.getElementById('statVD').innerText = logs.filter(l => l.status === 'VD').length;
    document.getElementById('statOccupied').innerText = logs.filter(l => l.status === 'OC' || l.status === 'OD').length;
    document.getElementById('statDND').innerText = logs.filter(l => l.status === 'DND' || l.status === 'SO').length;
    document.getElementById('statOOO').innerText = logs.filter(l => l.status === 'OOO').length;
}

// 5. Fitur Filter & Search
function applyFilters() {
    const q = document.getElementById('searchRoom').value.toLowerCase();
    const status = document.getElementById('filterStatus').value;
    const shift = document.getElementById('filterShift').value;

    const filtered = allLogs.filter(item => {
        const matchQ = (item.room_number && item.room_number.toLowerCase().includes(q)) ||
                       (item.room_boy && item.room_boy.toLowerCase().includes(q));
        const matchStatus = !status || item.status === status;
        const matchShift = !shift || item.shift === shift;
        return matchQ && matchStatus && matchShift;
    });

    renderTable(filtered);
}

// 6. Badge Warna Status Kamar
function getStatusBadge(status) {
    switch (status) {
        case 'VC': return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
        case 'VD': return 'bg-rose-100 text-rose-800 border border-rose-300';
        case 'OC': return 'bg-blue-100 text-blue-800 border border-blue-300';
        case 'OD': return 'bg-amber-100 text-amber-800 border border-amber-300';
        case 'DND': return 'bg-orange-100 text-orange-800 border border-orange-300';
        case 'OOO': return 'bg-purple-100 text-purple-800 border border-purple-300';
        case 'SO': return 'bg-slate-200 text-slate-800 border border-slate-300';
        default: return 'bg-slate-100 text-slate-700';
    }
}

// 7. Aksi Cepat: Ubah Status jadi VC (Clean)
window.quickSetClean = async function(id) {
    const nowTime = new Date().toTimeString().slice(0, 5);
    try {
        const { error } = await supabase
            .from('room_logs')
            .update({ status: 'VC', time_out: nowTime })
            .eq('id', id);

        if (error) throw error;
        fetchLogs();
    } catch (err) {
        alert("Gagal update status: " + err.message);
    }
};

// 8. Hapus Data Log
window.deleteLog = async function(id) {
    if (!confirm('Hapus baris log kamar ini?')) return;
    try {
        const { error } = await supabase.from('room_logs').delete().eq('id', id);
        if (error) throw error;
        fetchLogs();
    } catch (err) {
        alert("Gagal menghapus: " + err.message);
    }
};

// 9. EXPORT KE EXCEL (.XLSX)
function exportToExcel() {
    if (allLogs.length === 0) {
        alert("Tidak ada data untuk diekspor!");
        return;
    }

    const excelRows = allLogs.map((item, idx) => ({
        "No": idx + 1,
        "Tanggal": item.date || item.created_at?.slice(0, 10) || '',
        "Shift": item.shift || 'Pagi',
        "Lantai": item.floor || '',
        "No Kamar": item.room_number || '',
        "Tipe Kamar": item.room_type || '',
        "Status": item.status || '',
        "Room Boy": item.room_boy || '',
        "Jam Masuk": item.time_in || '',
        "Jam Keluar": item.time_out || '',
        "Ganti Linen": item.linen_change || '',
        "Kerusakan / Maintenance": item.maintenance || '',
        "Catatan (Remarks)": item.remarks || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Room_Control_Sheet");

    // Auto set lebar kolom
    const colWidths = [
        { wch: 5 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 10 },
        { wch: 14 }, { wch: 8 }, { wch: 18 }, { wch: 10 }, { wch: 10 },
        { wch: 20 }, { wch: 25 }, { wch: 25 }
    ];
    worksheet['!cols'] = colWidths;

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Room_Boy_Control_Sheet_PHB_${dateStr}.xlsx`);
}

// 10. EXPORT KE PDF RESMI HOTEL
function exportToPDF() {
    const printArea = document.getElementById('printArea');
    const pdfHeader = document.getElementById('pdfHeader');
    const pdfSubheader = document.getElementById('pdfSubheader');
    
    // Tampilkan header formal khusus cetak
    pdfHeader.classList.remove('hidden');
    pdfSubheader.innerText = `Laporan Tanggal: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`;

    // Sembunyikan kolom tombol aksi saat diexport
    document.querySelectorAll('.action-col').forEach(el => el.style.display = 'none');

    const opt = {
        margin:       [0.3, 0.3, 0.3, 0.3],
        filename:     `Room_Boy_Control_Sheet_${new Date().toISOString().slice(0,10)}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(printArea).save().then(() => {
        // Kembalikan tampilan semula
        pdfHeader.classList.add('hidden');
        document.querySelectorAll('.action-col').forEach(el => el.style.display = '');
    });
}

// 11. KIRIM RINGKASAN KE WHATSAPP
function shareToWhatsApp() {
    if (allLogs.length === 0) {
        alert("Belum ada data untuk dikirim ke WhatsApp!");
        return;
    }

    const todayStr = new Date().toLocaleDateString('id-ID', { dateStyle: 'full' });
    const total = allLogs.length;
    const vc = allLogs.filter(l => l.status === 'VC').length;
    const vd = allLogs.filter(l => l.status === 'VD').length;
    const occ = allLogs.filter(l => l.status === 'OC' || l.status === 'OD').length;
    const ooo = allLogs.filter(l => l.status === 'OOO').length;

    // Catatan kerusakan jika ada
    const maintList = allLogs
        .filter(l => l.maintenance && l.maintenance !== '-')
        .map(l => `• Kamar ${l.room_number}: ${l.maintenance}`)
        .join('%0A');

    const waText = 
`*LAPORAN HOUSEKEEPING - ROOM BOY CONTROL SHEET*%0A` +
`*Platinum Hotel & Convention Hall*%0A` +
`----------------------------------------%0A` +
`📅 Tanggal: ${encodeURIComponent(todayStr)}%0A` +
`🏨 Total Kamar Terdata: *${total}*%0A` +
`✅ Vacant Clean (VC): *${vc}*%0A` +
`🧹 Vacant Dirty (VD): *${vd}*%0A` +
`🛌 Occupied (OC/OD): *${occ}*%0A` +
`⚠️ Maintenance/OOO: *${ooo}*%0A` +
`----------------------------------------%0A` +
(maintList ? `*Catatan Kerusakan Engineering:*%0A${maintList}%0A----------------------------------------%0A` : '') +
`_Laporan dihasilkan otomatis via Housekeeping Digital System_`;

    window.open(`https://wa.me/?text=${waText}`, '_blank');
}
