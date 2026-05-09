import { useState, useEffect, useRef } from 'preact/hooks';
// import lagu from './assets/audio/lagu.mp3';
const lagu = '/lagu.mp3';

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

  /* =========================
     DARK MODE
  ========================= */
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

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
          <div className="logo">AUD</div>
          <div className="hdr-t">
            <h1>Audit Pengadaan Provinsi Jawa Barat</h1>
            <span>
              Artifact hasil analyze &middot; LKPP / SiRUP &middot; Tahun Anggaran 2026
            </span>
          </div>
        </div>

        <div
          className="hdr-r"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          {/* DARK MODE BUTTON */}
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>

          {/* MUSIC BUTTON */}
          <button
            className="theme-toggle"
            onClick={toggleMusic}
          >
            {musicPlaying ? '🔊 Music' : '🎵 Music'}
          </button>

          <div className="ll">
            <span className="ldot"></span> LIVE
          </div>

          <div className="yr">TA 2026</div>
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

      {/* MODAL */}
      <div className="modal-overlay" id="rupModal">
        <div className="modal">
          <div className="modal-top" id="modalTop"></div>
          <div className="modal-body" id="modalBody"></div>
          <div className="modal-footer">
            Map memakai agregasi penuh untuk paket multi-lokasi &middot; KPI nasional tidak menduplikasi paket multi-lokasi
          </div>
        </div>
      </div>
    </div>
  );
}