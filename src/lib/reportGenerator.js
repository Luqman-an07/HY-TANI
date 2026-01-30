import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ============================================================================
// 1. GENERATOR LAPORAN REKAPITULASI (BULK / TABEL)
// ============================================================================
export const generatePDFReport = (farms, userProfile) => {
  const doc = new jsPDF();

  // --- A. SETUP DATA & LOGIKA WILAYAH ---
  const officerName = userProfile?.full_name || userProfile?.nama_lengkap || "Komunikator Lapangan";
  
  // Ambil data lokasi dari profile (mendukung struktur JSON baru)
  const vData = userProfile?.villageData || {};
  
  // Ekstrak sesuai key JSON: { regency, province, subDistrict, villageName }
  const province = vData.province || "";
  const regency = vData.regency || "";
  const subDistrict = vData.subDistrict || ""; // Kecamatan
  const villageName = vData.villageName || ""; // Desa/Kelurahan

  let regionText = "Wilayah Binaan";

  // Logika Penyusunan Nama Wilayah (Auto-Format)
  if (villageName && subDistrict && regency && province) {
      // Cek apakah ada prefix "DESA" atau "KEL", jika tidak ada tambahkan "DESA"
      const desStr = (villageName.toUpperCase().includes('DESA') || villageName.toUpperCase().includes('KEL')) 
          ? villageName 
          : `DESA ${villageName}`;
      
      // Cek apakah ada prefix "KEC", jika tidak ada tambahkan "KEC."
      const kecStr = subDistrict.toUpperCase().includes('KEC') 
          ? subDistrict 
          : `KEC. ${subDistrict}`;
      
      regionText = `${desStr}, ${kecStr}, ${regency}, ${province}`;
  } else if (vData.name) {
      // Fallback ke properti 'name' manual jika JSON detail kosong
      regionText = vData.name;
  }

  const date = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  // --- B. HEADER LAPORAN (KOP SURAT) ---
  doc.setFillColor(6, 78, 59); // Emerald 900
  doc.rect(0, 0, 210, 25, 'F'); 

  // Logo Text
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("HY-TANI", 14, 16);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(209, 250, 229); // Emerald 100
  doc.text("Laporan Monitoring & Evaluasi Lahan Pertanian", 14, 22);

  // Info Petugas
  doc.setFontSize(9);
  doc.text(`Dicetak Oleh:`, 196, 12, { align: 'right' });
  doc.setFont("helvetica", "bold");
  doc.text(officerName, 196, 17, { align: 'right' });
  
  // --- C. JUDUL & INFO WILAYAH ---
  doc.setTextColor(0, 0, 0); 
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("REKAPITULASI DATA PETANI & LAHAN", 14, 40);

  // Box Info Wilayah
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(14, 45, 182, 25, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100);
  doc.text("WILAYAH KERJA:", 20, 52);
  
  doc.setFontSize(11);
  doc.setTextColor(30);
  // splitTextToSize agar teks panjang turun ke bawah otomatis
  const splitRegion = doc.splitTextToSize(regionText.toUpperCase(), 170);
  doc.text(splitRegion, 20, 58);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Tanggal Laporan: ${date}`, 20, 66);

  // --- D. RINGKASAN STATISTIK ---
  const totalArea = farms.reduce((sum, f) => sum + parseFloat(f.size || 0), 0).toFixed(2);
  const totalFarmers = farms.length;
  const harvestReady = farms.filter(f => f.status === 'sehat').length;
  const alertCount = farms.filter(f => f.status === 'bahaya').length;

  const statY = 80;
  
  const drawStatBox = (x, colorBg, colorText, label, value) => {
      doc.setFillColor(...colorBg);
      doc.roundedRect(x, statY, 40, 20, 2, 2, 'F');
      doc.setFontSize(8); doc.setTextColor(...colorText);
      doc.text(label, x + 20, statY + 6, { align: 'center' });
      doc.setFontSize(12); doc.setFont("helvetica", "bold");
      doc.text(value, x + 20, statY + 14, { align: 'center' });
  };

  drawStatBox(14, [236, 253, 245], [6, 95, 70], "Total Luas", `${totalArea} Ha`); // Emerald
  drawStatBox(60, [239, 246, 255], [30, 64, 175], "Total Petani", `${totalFarmers}`); // Blue
  drawStatBox(106, [240, 253, 244], [21, 128, 61], "Lahan Sehat", `${harvestReady}`); // Green
  drawStatBox(152, [254, 242, 242], [185, 28, 28], "Perlu Pantau", `${alertCount}`); // Red

  // --- E. TABEL DATA ---
  const tableColumn = ["No", "Nama Petani", "Lokasi Blok", "Luas (Ha)", "Status", "Prediksi", "Jadwal Visit"];
  const tableRows = [];

  farms.forEach((farm, index) => {
    const farmData = [
      index + 1,
      farm.farmer,
      farm.name,
      farm.size,
      farm.status.toUpperCase(),
      farm.prediction,
      farm.nextVisit ? new Date(farm.nextVisit).toLocaleDateString('id-ID') : '-'
    ];
    tableRows.push(farmData);
  });

  autoTable(doc, {
    startY: 110,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [6, 78, 59], textColor: 255, fontStyle: 'bold', halign: 'center' },
    styles: { fontSize: 8, cellPadding: 3, valign: 'middle' },
    columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        3: { halign: 'center' },
        4: { halign: 'center', fontStyle: 'bold' },
        6: { halign: 'right' }
    },
    didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 4) {
            const status = data.cell.raw;
            if (status === 'SEHAT') data.cell.styles.textColor = [22, 163, 74];
            if (status === 'WASPADA') data.cell.styles.textColor = [217, 119, 6];
            if (status === 'BAHAYA') data.cell.styles.textColor = [220, 38, 38];
        }
    }
  });

  // --- F. FOOTER ---
  const pageCount = doc.internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Dokumen ini dicetak otomatis melalui Aplikasi HY-TANI`, 14, 285);
      doc.text(`Hal ${i} dari ${pageCount}`, 196, 285, { align: 'right' });
  }

  // Nama file: Laporan_GUPIT_2024-xx-xx.pdf
  const regionSlug = villageName ? villageName.replace(/[^a-zA-Z0-9]/g, '_') : 'Wilayah';
  const fileName = `Laporan_${regionSlug}_${new Date().toISOString().slice(0,10)}.pdf`;
  
  doc.save(fileName);
};


// ============================================================================
// 2. GENERATOR LAPORAN DETAIL INDIVIDU (SATUAN)
// ============================================================================
export const generateFarmerReport = (farm, userProfile) => {
  const doc = new jsPDF();
  const officerName = userProfile?.full_name || "Komunikator Lapangan";
  const date = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  // --- HEADER ---
  doc.setFillColor(6, 78, 59);
  doc.rect(0, 0, 210, 30, 'F');
  
  doc.setFontSize(20); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold");
  doc.text("HY-TANI", 14, 18);
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text("Laporan Detail Lahan Pertanian", 14, 24);

  // --- IDENTITAS PETANI ---
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.text(farm.farmer.toUpperCase(), 14, 45);
  
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(100);
  doc.text(`ID Lahan: ${farm.id}`, 14, 52);
  doc.text(`Lokasi: ${farm.name}`, 14, 57);
  doc.text(`Kontak: ${farm.contact || '-'}`, 14, 62);

  // --- STATUS (BADGE WARNA) ---
  const statusColor = farm.status === 'sehat' ? [22, 163, 74] : farm.status === 'waspada' ? [217, 119, 6] : [220, 38, 38];
  doc.setFillColor(...statusColor);
  doc.roundedRect(140, 40, 56, 24, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8); doc.text("STATUS KESEHATAN", 168, 46, { align: 'center' });
  doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text(farm.status.toUpperCase(), 168, 55, { align: 'center' });

  // --- METRIK UTAMA ---
  doc.setTextColor(0);
  const startY = 75;
  
  const drawMetric = (x, label, value) => {
      doc.setFillColor(248, 250, 252); doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, startY, 40, 20, 2, 2, 'FD');
      doc.setFontSize(8); doc.setTextColor(100); doc.text(label, x+20, startY+6, {align:'center'});
      doc.setFontSize(11); doc.setTextColor(0); doc.setFont("helvetica", "bold"); doc.text(value, x+20, startY+14, {align:'center'});
  };

  drawMetric(14, "Luas Lahan", `${farm.size} Ha`);
  drawMetric(60, "Prediksi Panen", `${farm.prediction}`);
  drawMetric(106, "Nilai NDVI", `${farm.ndvi}`);
  drawMetric(152, "Estimasi Nilai", `${farm.value}`);

  // --- TABEL PARAMETER FISIK ---
  doc.setFontSize(12); doc.setTextColor(6, 78, 59); doc.text("KONDISI FISIK TERAKHIR", 14, 110);
  
  const paramData = [
      ["Parameter", "Kondisi", "Skor"],
      ["Ketersediaan Air", farm.waterScore > 70 ? "Cukup" : "Kurang", `${farm.waterScore}/100`],
      ["Nutrisi / Pupuk", farm.fertScore > 70 ? "Optimal" : "Perlu Tambah", `${farm.fertScore}/100`],
      ["Serangan Hama", farm.pestScore > 80 ? "Nihil / Aman" : "Waspada", `${farm.pestScore}/100`]
  ];

  autoTable(doc, {
      startY: 115,
      head: [paramData[0]],
      body: paramData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [6, 78, 59] },
      styles: { fontSize: 10, cellPadding: 3 }
  });

  // --- TABEL RIWAYAT KUNJUNGAN ---
  const historyY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(12); doc.setTextColor(6, 78, 59); doc.text("RIWAYAT KUNJUNGAN", 14, historyY);

  const historyRows = (farm.visitHistory || []).map(log => [
      new Date(log.visited_at || log.completedDate).toLocaleDateString('id-ID'),
      log.officer_name || officerName,
      log.note || log.notes || "-"
  ]);

  if (historyRows.length > 0) {
      autoTable(doc, {
          startY: historyY + 5,
          head: [["Tanggal", "Petugas", "Catatan Lapangan"]],
          body: historyRows,
          theme: 'striped',
          headStyles: { fillColor: [51, 65, 85] },
          styles: { fontSize: 9 }
      });
  } else {
      doc.setFontSize(10); doc.setTextColor(150); doc.setFont("helvetica", "italic");
      doc.text("Belum ada riwayat kunjungan tercatat.", 14, historyY + 10);
  }

  // --- FOOTER ---
  doc.setFontSize(8); doc.setTextColor(150); doc.setFont("helvetica", "normal");
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 285);
  doc.text(`Petugas: ${officerName}`, 196, 285, { align: 'right' });

  const fileNameIndividu = `Laporan_${farm.farmer.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileNameIndividu);
};