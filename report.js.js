export function exportToPDF(elementId, fileName) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: fileName || 'Laporan_Room_Boy.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
}