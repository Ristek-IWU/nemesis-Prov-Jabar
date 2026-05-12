import { useState, useEffect, useRef } from 'preact/hooks';
// import lagu from './assets/audio/lagu.mp3';
const lagu = '/lagu.mp3';

import { Moon, Sun, Volume2, VolumeX, Activity, Calendar, FileText } from 'lucide-preact';

export function App() {
  /* =========================
     MUSIC SYSTEM
  ========================= */
  const audioRef = useRef(null);
  const [musicPlaying, setMusicPlaying] = useState(false);

  useEffect(() => {
    audioRef.current = new Audio(lagu);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.25;

    const savedMusic = localStorage.getItem('music');
    if (savedMusic === 'on') {
      audioRef.current.play().catch(e => {
        console.warn("Autoplay blocked", e);
        setMusicPlaying(false);
      });
      setMusicPlaying(true);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(lagu);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.25;
    }
    
    if (audioRef.current.paused) {
      audioRef.current.play().then(() => {
        localStorage.setItem('music', 'on');
        setMusicPlaying(true);
      }).catch(e => {
        console.error("Music play failed:", e);
      });
    } else {
      audioRef.current.pause();
      localStorage.setItem('music', 'off');
      setMusicPlaying(false);
    }
  };

  useEffect(() => {
    document.body.classList.add('light-mode');
    localStorage.setItem('theme', 'light');
  }, []);

  /* =========================
     LOAD LEGACY JS
  ========================= */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await import('./assets/js/map.js');
      if (cancelled) return;
      await import('./assets/js/app.js');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div id="preact-wrapper">
      {/* HEADER */}
      <div className="hdr">
        <div className="hdr-l">
          <img className="logo" src="/nemesis-prov-jabar.svg" alt="NEMESIS Logo" />
          <div className="hdr-t">
            <h1>NEMESIS &middot; Provinsi Jawa Barat</h1>
            <span>
              Digital Audit & Analytics &middot; TA 2026 &middot; West Java Province
            </span>
          </div>
        </div>

        <div className="hdr-r">
          {/* DARK MODE BUTTON (REMOVED) */}

          {/* MUSIC BUTTON */}
          <button
            className="theme-toggle"
            onClick={toggleMusic}
            title={musicPlaying ? 'Mute Music' : 'Play Music'}
          >
            {musicPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>Audio</span>
          </button>

          <div className="ll">
            <Activity size={12} className="ldot-icon lpulse" />
            LIVE ANALYTICS
          </div>


          <div className="yr">
            <Calendar size={12} style={{ marginRight: '6px' }} />
            TA 2026
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="kpi" id="kpi"></div>

      {/* MAIN LAYOUT */}
      <div className="ml">
        {/* MAP */}
        <div className="mc">
          <div id="map"></div>
          <div className="moc" id="mf"></div>
          <div className="mlb" id="legend"></div>
        </div>

        {/* SIDEBAR */}
        <div className="sb">
          <div
            className="sbh"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div className="sbt" id="tabs"></div>
            <button
              className="stb"
              id="toggleMapBtn"
              onClick={() =>
                window['dashboardActions'] &&
                window['dashboardActions'].toggleMap()
              }
            >
              &#128506; Sembunyikan Peta
            </button>
          </div>
          <div className="sbc" id="sbc"></div>
        </div>
      </div>

      {/* DATA NOTES */}
      <div className="data-notes" id="dataNotes">
        <div className="data-notes-inner">
          <div className="data-note-card">
            <div className="data-note-title">Keterangan Sumber Data & Parameter Anomali</div>
            <div className="data-note-grid">
              <div className="data-note-block">
                <div className="data-note-subtitle">Sumber Data</div>
                <div className="data-note-body">
                  <div><strong>Asal:</strong> Sistem NEMESIS &middot; Pemerintah Provinsi Jawa Barat</div>
                  <div><strong>Tanggal diambil:</strong> 12 Mei 2026</div>
                  <div><strong>Ringkas:</strong> Ringkasan data pengadaan: lokasi, pemilik, dan tanda risiko.</div>
                </div>
              </div>
              <div className="data-note-block">
                <div className="data-note-subtitle">Parameter Tingkat Anomali</div>
                <div className="data-note-body">
                  <div><strong>Absurd:</strong> Sangat berisiko, perlu dicek segera.</div>
                  <div><strong>High:</strong> Berisiko tinggi, perlu perhatian.</div>
                  <div><strong>Medium:</strong> Berisiko sedang, perlu dicek.</div>
                  <div><strong>Low:</strong> Berisiko rendah.</div>
                  <div><strong>Normal:</strong> Aman, tidak ada masalah berarti.</div>
                </div>
              </div>
              <div className="data-note-block">
                <div className="data-note-subtitle">Klaster Kategorisasi</div>
                <div className="data-note-body">
                  <div><strong>Absurd:</strong> Pola sangat berbeda dari kebanyakan.</div>
                  <div><strong>High:</strong> Pola cukup berbeda.</div>
                  <div><strong>Medium:</strong> Pola agak berbeda.</div>
                  <div><strong>Low:</strong> Pola normal, beda tipis.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <div className="modal-overlay" id="rupModal">
        <div className="modal">
          <div className="modal-top" id="modalTop"></div>
          <div className="modal-body" id="modalBody"></div>
          <div className="modal-footer">
            <strong>Keterangan Parameter Data:</strong><br/>
            &middot; <strong>Tingkatan:</strong> Provinsi (Pemerintah Provinsi Jabar) &amp; Kab/Kota (Pemerintah Kabupaten/Kota se-Jabar)<br/>
            &middot; <strong>Potensi Pemborosan:</strong> Estimasi nilai pemborosan dari anomali paket pengadaan.<br/>
            &middot; <strong>Paket Prioritas:</strong> Paket dengan tingkat risiko tinggi (Severity: High/Absurd) yang direkomendasikan untuk audit.
          </div>
        </div>
      </div>
    </div>
  );
}