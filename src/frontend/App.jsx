import { useState, useEffect, useRef } from 'preact/hooks';


// For this strictly structural integration phase, we wrap the vanilla mount
// without altering the UI or logic to maintain identical CSS and user paths.

export function App() {

  /* =========================
     MUSIC SYSTEM
  ========================= */

  const audioRef = useRef(null);

  const [musicPlaying, setMusicPlaying] = useState(false);

  useEffect(() => {
   audioRef.current = new Audio('/lagu.mp3');

    audioRef.current.loop = true;
    audioRef.current.volume = 0.25;

    const savedMusic = localStorage.getItem('music');

    if (savedMusic === 'on') {
      audioRef.current.play();
      setMusicPlaying(true);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      audioRef.current.play();
      localStorage.setItem('music', 'on');
      setMusicPlaying(true);
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
  // Load map.js first so window.AuditMap is defined before app.js runs.
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
            <h1>Audit Pengadaan Kabupaten Sumedang</h1>

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