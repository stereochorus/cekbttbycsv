// CEK Tracing - Main Application JavaScript
// Security: External script file to comply with strict CSP

let resultsData = [];

// Security: HTML escape function to prevent XSS
function escapeHtml(unsafe) {
    if (!unsafe) return '-';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Security: Validate BTT format
function validateBTT(btt) {
    if (!btt || typeof btt !== 'string') return false;
    if (btt.length > 50) return false;
    // Only allow alphanumeric and common separators
    return /^[a-zA-Z0-9\-_]+$/.test(btt);
}

async function processCSV() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];

    if (!file) {
        alert('Silakan pilih file CSV terlebih dahulu!');
        return;
    }

    if (!file.name.endsWith('.csv')) {
        alert('File harus berformat CSV!');
        return;
    }

    // Security: File size validation (5MB max)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
        alert('File terlalu besar! Maksimum 5MB.');
        return;
    }

    // Reset
    resultsData = [];
    document.getElementById('tableBody').innerHTML = '';
    document.getElementById('resultTable').style.display = 'none';
    document.getElementById('exportSection').style.display = 'none';

    // Show progress
    document.getElementById('progressSection').style.display = 'block';
    document.getElementById('uploadBtn').disabled = true;

    try {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');

        // Remove header if exists
        const startIndex = lines[0].toLowerCase().includes('btt') || lines[0].toLowerCase().includes('no') ? 1 : 0;
        const dataLines = lines.slice(startIndex);

        if (dataLines.length === 0) {
            throw new Error('File CSV kosong atau tidak ada data!');
        }

        // Security: Limit number of lines (max 1000)
        const MAX_LINES = 1000;
        if (dataLines.length > MAX_LINES) {
            throw new Error(`Terlalu banyak data! Maksimum ${MAX_LINES} baris.`);
        }

        document.getElementById('statusMessage').textContent = `Memproses ${dataLines.length} BTT...`;

        // Show table
        document.getElementById('resultTable').style.display = 'table';

        // Process each line
        for (let i = 0; i < dataLines.length; i++) {
            const line = dataLines[i].trim();
            if (!line) continue;

            // Extract BTT (could be first column or the entire line)
            let btt = line.split(',')[0].trim().replace(/['"]/g, '');

            // Security: Validate BTT format
            if (!validateBTT(btt)) {
                console.warn(`Invalid BTT format: ${btt}`);
                continue; // Skip invalid BTT
            }

            // Update progress
            const progress = Math.round(((i + 1) / dataLines.length) * 100);
            document.getElementById('progressFill').style.width = progress + '%';
            document.getElementById('progressFill').textContent = progress + '%';
            document.getElementById('statusMessage').textContent = `Memproses ${i + 1}/${dataLines.length}: ${escapeHtml(btt)}`;

            // Add temporary row - Using textContent for security
            const tempRow = document.getElementById('tableBody').insertRow();
            const cell1 = tempRow.insertCell(0);
            const cell2 = tempRow.insertCell(1);
            const cell3 = tempRow.insertCell(2);

            cell1.textContent = i + 1;
            cell2.textContent = btt;
            cell3.colSpan = 4;
            cell3.innerHTML = '<div class="loading"></div> Mengambil data...';

            try {
                // Call API through Node.js proxy
                const response = await fetch(`/api/trace?b=${encodeURIComponent(btt)}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                let tanggal = '-';
                let keterangan = '-';
                let posisi = '-';
                let status = '-';
                let statusClass = 'status-error';

                if (data && data.detail) {
                    tanggal = data.detail.tanggal || '-';
                    keterangan = data.detail.keterangan || '-';
                    posisi = data.detail.posisi || '-';
                    status = data.detail.status || '-';

                    if (status.toLowerCase() === 'delivered') {
                        statusClass = 'status-delivered';
                    } else if (status !== '-') {
                        statusClass = 'status-onprocess';
                    }
                }

                // Store result
                resultsData.push({
                    no: i + 1,
                    btt: btt,
                    tanggal: tanggal,
                    keterangan: keterangan,
                    posisi: posisi,
                    status: status
                });

                // Security: Update row using textContent to prevent XSS
                tempRow.innerHTML = ''; // Clear first
                const c1 = tempRow.insertCell(0);
                const c2 = tempRow.insertCell(1);
                const c3 = tempRow.insertCell(2);
                const c4 = tempRow.insertCell(3);
                const c5 = tempRow.insertCell(4);
                const c6 = tempRow.insertCell(5);

                c1.textContent = i + 1;
                c2.textContent = btt;
                c3.textContent = tanggal;
                c4.textContent = keterangan;
                c5.textContent = posisi;

                // Status badge with safe HTML
                const badge = document.createElement('span');
                badge.className = `status-badge ${statusClass}`;
                badge.textContent = status;
                c6.appendChild(badge);

            } catch (error) {
                console.error(`Error processing ${btt}:`, error);

                // Store error result
                resultsData.push({
                    no: i + 1,
                    btt: btt,
                    tanggal: '-',
                    keterangan: 'Error: ' + error.message,
                    posisi: '-',
                    status: 'ERROR'
                });

                // Security: Update row with error using textContent
                tempRow.innerHTML = ''; // Clear first
                const e1 = tempRow.insertCell(0);
                const e2 = tempRow.insertCell(1);
                const e3 = tempRow.insertCell(2);
                const e4 = tempRow.insertCell(3);
                const e5 = tempRow.insertCell(4);
                const e6 = tempRow.insertCell(5);

                e1.textContent = i + 1;
                e2.textContent = btt;
                e3.textContent = '-';
                e4.textContent = 'Error: ' + error.message;
                e5.textContent = '-';

                const errorBadge = document.createElement('span');
                errorBadge.className = 'status-badge status-error';
                errorBadge.textContent = 'ERROR';
                e6.appendChild(errorBadge);
            }

            // Small delay to prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Complete
        document.getElementById('statusMessage').className = 'status-message success';
        document.getElementById('statusMessage').textContent = `Selesai! ${dataLines.length} BTT berhasil diproses.`;
        document.getElementById('exportSection').style.display = 'block';

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('statusMessage').className = 'status-message error';
        document.getElementById('statusMessage').textContent = 'Error: ' + error.message;
    } finally {
        document.getElementById('uploadBtn').disabled = false;
    }
}

function exportToCSV() {
    if (resultsData.length === 0) {
        alert('Tidak ada data untuk di-export!');
        return;
    }

    // Create CSV content
    let csvContent = 'NO,BTT,TANGGAL HISTORY,KETERANGAN,POSISI,STATUS\n';

    resultsData.forEach(row => {
        csvContent += `${row.no},"${row.btt}","${row.tanggal}","${row.keterangan}","${row.posisi}","${row.status}"\n`;
    });

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `tracking_results_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Security: Attach event listeners instead of inline onclick
// This prevents CSP violations
document.addEventListener('DOMContentLoaded', function() {
    // Upload button
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', processCSV);
    }

    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToCSV);
    }
});
