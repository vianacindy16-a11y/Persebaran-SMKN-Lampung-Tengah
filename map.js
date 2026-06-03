// ================================================
//  WebGIS SMKN Lampung Tengah — map.js
//  Simpan di: Assets/JS_Map/map.js
// ================================================


// ── 1. Inisialisasi Peta ──
var map = L.map('map', {
  center: [-4.8200, 105.1800],
  zoom: 10,
  zoomControl: false
});

L.control.zoom({ position: 'bottomright' }).addTo(map);
L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);


// ── 2. Basemap ──
var basemaps = {
  street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', maxZoom: 19
  }),
  satelit: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri', maxZoom: 19
  }),
  topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenTopoMap', maxZoom: 17
  })
};

basemaps.street.addTo(map);
var layerAktif = 'street';


// ── 3. Ganti basemap ──
document.querySelectorAll('.map-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var pilihan = btn.dataset.layer;
    if (pilihan === layerAktif) return;
    map.removeLayer(basemaps[layerAktif]);
    basemaps[pilihan].addTo(map);
    layerAktif = pilihan;
    document.querySelectorAll('.map-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
  });
});


// ── 4. Custom Marker ──
function buatMarker(warna) {
  return L.divIcon({
    className: '',
    html:
      '<div style="' +
        'width:28px;height:28px;' +
        'background:' + warna + ';' +
        'border:3px solid white;' +
        'border-radius:50% 50% 50% 0;' +
        'transform:rotate(-45deg);' +
        'box-shadow:0 2px 8px rgba(0,0,0,0.35);' +
      '"></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30]
  });
}


// ── 5. Variabel ──
var semuaMarker = [];
var markerAktif = null;
var MAX_SISWA   = 2000;


// ── 6. Panel detail ──
function tampilPanel(props) {
  var panel   = document.getElementById('detail-panel');
  var content = document.getElementById('panel-content');

  // Ambil nilai dari berbagai kemungkinan nama field GeoJSON
  var nama      = props.NAMA        || props.nama        || props.NAME        || 'Nama tidak tersedia';
  var kecamatan = props.KECAMATAN   || props.kecamatan   || props.KEC         || '-';
  var alamat    = props.ALAMAT      || props.alamat      || props.ADDRESS     || '-';
  var kepsek    = props.KEPALA_SEK  || props.kepala_sekolah || props.KEPSEK   || '-';
  var akreditasi= props.AKREDITASI  || props.akreditasi  || '-';
  var jurusan   = props.JURUSAN     || props.jurusan     || '-';
  var jmlSiswa  = props.JML_SISWA   || props.jumlah_siswa || props.JUMLAH_SISWA || '-';
  var pct = jmlSiswa !== '-' ? Math.min(Math.round((jmlSiswa / MAX_SISWA) * 100), 100) : 0;

  content.innerHTML =
    '<div class="panel-header">' +
      '<div class="p-icon">🏫</div>' +
      '<div class="p-nama">' + nama + '</div>' +
      '<div class="p-kec">📍 Kec. ' + kecamatan + '</div>' +
    '</div>' +
    '<div class="info-baris"><span class="lbl">Alamat</span><span class="val">' + alamat + '</span></div>' +
    '<div class="info-baris"><span class="lbl">Kepala Sekolah</span><span class="val">' + kepsek + '</span></div>' +
    '<div class="info-baris"><span class="lbl">Akreditasi</span><span class="val">' + akreditasi + '</span></div>' +
    '<div class="info-baris"><span class="lbl">Jurusan</span><span class="val">' + jurusan + '</span></div>' +
    '<div class="bar-wrap">' +
      '<div class="bar-label"><span>Jumlah Siswa</span><strong>' + (jmlSiswa !== '-' ? Number(jmlSiswa).toLocaleString('id-ID') : '-') + ' siswa</strong></div>' +
      '<div class="bar-track"><div class="bar-isi" id="bar-isi" style="width:0%"></div></div>' +
    '</div>';

  panel.classList.remove('hidden');
  setTimeout(function() {
    var bar = document.getElementById('bar-isi');
    if (bar) bar.style.width = pct + '%';
  }, 60);
}


// ── 7. Load GeoJSON ──
//
// Sesuaikan nama file dengan GeoJSON milikmu!
// Nama file kamu: SMK_Negeri_Lampung_Tengah.geojson
//
fetch('Data/SMK_Negeri_Lampung_Tengah.geojson')
  .then(function(res) {
    if (!res.ok) throw new Error('File tidak ditemukan');
    return res.json();
  })
  .then(function(geojson) {

    var totalSiswa = 0;
    var listEl = document.getElementById('school-list');
    document.getElementById('total-sekolah').textContent = geojson.features.length;

    geojson.features.forEach(function(feature, index) {
      var props  = feature.properties;
      var coords = feature.geometry.coordinates;

      // GeoJSON: [longitude, latitude] → Leaflet butuh: [latitude, longitude]
      var latlng = [coords[1], coords[0]];

      var nama      = props.NAMA      || props.nama      || props.NAME      || 'SMKN';
      var kecamatan = props.KECAMATAN || props.kecamatan || props.KEC       || '-';
      var jmlSiswa  = props.JML_SISWA || props.jumlah_siswa || 0;
      if (typeof jmlSiswa === 'number') totalSiswa += jmlSiswa;

      // Buat marker
      var marker = L.marker(latlng, { icon: buatMarker('#1a73c8') })
        .addTo(map)
        .bindPopup(
          '<div class="isi-popup">' +
            '<strong>🏫 ' + nama + '</strong>' +
            '<span>Kec. ' + kecamatan + '</span>' +
          '</div>'
        );

      // Klik marker
      marker.on('click', function() {
        semuaMarker.forEach(function(m) { m.setIcon(buatMarker('#1a73c8')); });
        marker.setIcon(buatMarker('#f59e0b'));
        markerAktif = marker;

        document.querySelectorAll('#school-list li').forEach(function(li) { li.classList.remove('aktif'); });
        var liAktif = document.querySelector('#school-list li[data-index="' + index + '"]');
        if (liAktif) { liAktif.classList.add('aktif'); liAktif.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }

        tampilPanel(props);
      });

      semuaMarker.push(marker);

      // Tambah ke sidebar
      var li = document.createElement('li');
      li.dataset.index = index;
      li.innerHTML = '🏫 ' + nama + '<span class="nama-kec">Kec. ' + kecamatan + '</span>';
      li.addEventListener('click', function() {
        map.setView(latlng, 15);
        marker.openPopup();
        marker.fire('click');
      });
      listEl.appendChild(li);
    });

    document.getElementById('total-siswa').textContent =
      totalSiswa > 0 ? totalSiswa.toLocaleString('id-ID') : '-';

    if (semuaMarker.length > 0) {
      var group = new L.featureGroup(semuaMarker);
      map.fitBounds(group.getBounds().pad(0.15));
    }
  })
  .catch(function(err) {
    console.error('ERROR GeoJSON:', err);
    document.getElementById('school-list').innerHTML =
      '<li style="color:red;padding:.5rem;font-size:.82rem;">' +
      '⚠️ Gagal memuat data.<br>Pastikan:<br>' +
      '1. Pakai Live Server<br>' +
      '2. File GeoJSON ada di folder Data/<br>' +
      '3. Nama file sudah benar</li>';
  });


// ── 8. Tutup panel ──
document.getElementById('close-panel').addEventListener('click', function() {
  document.getElementById('detail-panel').classList.add('hidden');
  if (markerAktif) { markerAktif.setIcon(buatMarker('#1a73c8')); markerAktif = null; }
  document.querySelectorAll('#school-list li').forEach(function(li) { li.classList.remove('aktif'); });
});


// ── 9. Pencarian ──
document.getElementById('search-input').addEventListener('input', function() {
  var keyword = this.value.toLowerCase();
  document.querySelectorAll('#school-list li').forEach(function(li) {
    li.classList.toggle('tersembunyi', !li.textContent.toLowerCase().includes(keyword));
  });
});


// ── 10. Koordinat saat klik peta ──
map.on('click', function(e) {
  document.getElementById('koordinat-bar').textContent =
    '📌 Lat: ' + e.latlng.lat.toFixed(5) + ' | Lng: ' + e.latlng.lng.toFixed(5);
});
