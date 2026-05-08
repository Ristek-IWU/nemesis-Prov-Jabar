<<<<<<< HEAD
=======
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

>>>>>>> main
window['AuditMap'] = (() => {
  const SOURCE = 'audit-areas';
  const FILL_LAYER = 'audit-fill';
  const LINE_LAYER = 'audit-line';
  const HOVER_FILL = 'audit-fill-hover';
  const HOVER_LINE = 'audit-line-hover';
  const SELECTED_LINE = 'audit-line-selected';

  let map = null;
  let popup = null;
  let hoveredId = null;
  let selectedId = null;
  let _isProvinceView = false;
  let _onAreaClick = null;
  let _getPopupHtml = null;

  function getFeatureAreaKey(props) {
    return _isProvinceView ? props.provinceKey : props.regionKey;
  }

  function buildStyledGeo(geo, getFeatureStyle) {
    return {
      type: 'FeatureCollection',
      features: geo.features.map((f) => ({
        type: 'Feature',
        geometry: f.geometry,
        properties: { ...f.properties, ...getFeatureStyle(f) },
      })),
    };
  }

  function walkCoords(geometry, fn) {
    const c = geometry.coordinates;
    if (geometry.type === 'Point') {
      fn(c[0], c[1]);
    } else if (geometry.type === 'LineString' || geometry.type === 'MultiPoint') {
      c.forEach((p) => fn(p[0], p[1]));
    } else if (geometry.type === 'Polygon' || geometry.type === 'MultiLineString') {
      c.forEach((ring) => ring.forEach((p) => fn(p[0], p[1])));
    } else if (geometry.type === 'MultiPolygon') {
      c.forEach((poly) => poly.forEach((ring) => ring.forEach((p) => fn(p[0], p[1]))));
    }
  }

<<<<<<< HEAD
  function computeBounds(geo, areaKey) {
=======
  function computeBounds(geo) {
>>>>>>> main
    let minLng = Infinity,
      minLat = Infinity,
      maxLng = -Infinity,
      maxLat = -Infinity;
    let hasCoords = false;
    geo.features.forEach((f) => {
<<<<<<< HEAD
      if (areaKey) {
        const fKey = f.properties.regionKey || f.properties.provinceKey;
        if (fKey !== areaKey) return;
      }
=======
>>>>>>> main
      if (!f.geometry) return;
      walkCoords(f.geometry, (lng, lat) => {
        hasCoords = true;
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
      });
    });
    return hasCoords
      ? [
          [minLng, minLat],
          [maxLng, maxLat],
        ]
      : null;
    // Kita kunci koordinatnya khusus buat Sumedang
    const sumedangBounds = [
      [107.7241, -7.0392], // Titik Barat Daya
      [108.1364, -6.6575]  // Titik Timur Laut
    ];
    
    return sumedangBounds;
  }
// ganti kode berikut dengan kode yang sudah diperbarui
// di ganti oleh kelompok 7

  function ensureMap(container) {
    if (map) return;
<<<<<<< HEAD
    map = new window['maplibregl'].Map({
      container,
      // Default awal ke Garut sebelum fitBounds jalan
      center: [107.9087, -7.2279], 
      zoom: 9,
=======
    map = new maplibregl.Map({
      container,
      center: [108.2207, -7.3506],
      zoom: 10,
>>>>>>> main
      center: [107.60, -6.90],
      zoom: 7.5,
      minZoom: 4,
      maxZoom: 12,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    });
  }
 function ensureMap(container) {
  if (map) return;

  map = new window['maplibregl'].Map({
    container,
    center: [118, -2.5],
    zoom: 5,
    minZoom: 4,
    maxZoom: 12,
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  });

  // Marker Purwakarta
  const purwakartaMarker = new window['maplibregl'].Marker({
    color: '#ff0000'
  })
    .setLngLat([107.443, -6.556])
    .setPopup(
  new window['maplibregl'].Popup().setHTML(
    `
      <h3 style="color: purple; margin-bottom: 5px;">
        Purwakarta
      </h3>

      <p style="color: purple; font-weight: bold;">
        Wilayah Fokus Kelompok 7
      </p>
    `
  )
)
    .addTo(map);
}

<<<<<<< HEAD
=======
      // Titik tengah Kabupaten Sumedang
      center: [107.9189, -6.8589], 
      // Zoom level 10 biar pas satu kabupaten kelihatan semua
      zoom: 10,
      minZoom: 8, 
      maxZoom: 15,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    });
  }
  function closePopup() {
    if (popup) {
      popup.remove();
      popup = null;
    }
  }

>>>>>>> main
  function clearHover() {
    if (hoveredId !== null) {
      try {
        map.setFeatureState({ source: SOURCE, id: hoveredId }, { hover: false });
      } catch (e) {
        console.warn('Failed to clear hover state:', e);
      }
      hoveredId = null;
    }
<<<<<<< HEAD
    if (popup) {
      popup.remove();
      popup = null;
    }
=======
    closePopup();
>>>>>>> main
  }

  function addLayers() {
    map.addSource(SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      generateId: true,
    });

    map.addLayer({
      id: FILL_LAYER,
      type: 'fill',
      source: SOURCE,
      paint: {
        'fill-color': ['coalesce', ['get', 'fillColor'], '#243155'],
        'fill-opacity': ['coalesce', ['get', 'fillOpacity'], 0.08],
      },
    });

    map.addLayer({
      id: LINE_LAYER,
      type: 'line',
      source: SOURCE,
      paint: {
        'line-color': ['coalesce', ['get', 'strokeColor'], '#b5a882'],
        'line-width': ['coalesce', ['get', 'strokeWidth'], 0.8],
        'line-opacity': ['coalesce', ['get', 'strokeOpacity'], 0.17],
      },
    });

<<<<<<< HEAD
=======
    // Hover highlight layers driven by feature-state
>>>>>>> main
    map.addLayer({
      id: HOVER_FILL,
      type: 'fill',
      source: SOURCE,
      paint: {
        'fill-color': ['coalesce', ['get', 'fillColor'], '#243155'],
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          ['min', ['+', ['coalesce', ['get', 'fillOpacity'], 0.08], 0.16], 0.85],
          0,
        ],
      },
    });

    map.addLayer({
      id: HOVER_LINE,
      type: 'line',
      source: SOURCE,
      paint: {
        'line-color': '#f0d8a8',
        'line-width': 1.8,
        'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0],
      },
    });

    map.addLayer({
      id: SELECTED_LINE,
      type: 'line',
      source: SOURCE,
      paint: {
        'line-color': '#f0d8a8',
        'line-width': 3,
        'line-opacity': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          1,
          0
        ],
      },
    });

    map.on('mousemove', FILL_LAYER, (e) => {
      if (!e.features.length) return;
<<<<<<< HEAD
=======

>>>>>>> main
      map.getCanvas().style.cursor = 'pointer';
      const feature = e.features[0];
      const id = feature.id;
      const props = feature.properties;

      // <<< UBAH DI SINI: Logika pengecekan Cimahi yang lebih fleksibel
      const isCimahi = (props.KADMKK && props.KADMKK.toUpperCase().includes("CIMAHI")) || 
                       (props.regionKey && props.regionKey.toLowerCase().includes("cimahi"));

      if (_getPopupHtml && feature.properties) {
        const areaKey = getFeatureAreaKey(feature.properties);
        const html = _getPopupHtml(areaKey);
        if (html) {
          if (!popup) {
<<<<<<< HEAD
            popup = new window['maplibregl'].Popup({
=======
            popup = new maplibregl.Popup({
>>>>>>> main
              closeButton: false,
              closeOnClick: false,
              maxWidth: '320px',
              className: 'audit-popup',
              offset: 12,
            });
          }
          popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
      if (isCimahi) {
        map.getCanvas().style.cursor = 'pointer';
        if (hoveredId !== null && hoveredId !== id) {
          map.setFeatureState({ source: SOURCE, id: hoveredId }, { hover: false });
        }
        hoveredId = id;
        map.setFeatureState({ source: SOURCE, id: id }, { hover: true });

        if (_getPopupHtml && props) {
          const areaKey = getFeatureAreaKey(props);
          const html = _getPopupHtml(areaKey);
          if (html) {
            if (!popup) {
              popup = new window['maplibregl'].Popup({
                closeButton: false,
                closeOnClick: false,
                maxWidth: '320px',
                className: 'audit-popup',
                offset: 12,
              });
            }
            popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
          }
        }
      } else {
        map.getCanvas().style.cursor = '';
        clearHover();
      }
    });

    map.on('mouseleave', FILL_LAYER, () => {
      map.getCanvas().style.cursor = '';
      clearHover();
    });

    map.on('click', FILL_LAYER, (e) => {
      if (!e.features.length) return;
      const feature = e.features[0];
      const props = feature.properties;

      // <<< UBAH DI SINI: Samakan logika klik dengan mousemove
      const isCimahi = (props.KADMKK && props.KADMKK.toUpperCase().includes("CIMAHI")) || 
                       (props.regionKey && props.regionKey.toLowerCase().includes("cimahi"));

      if (isCimahi) {
        const id = feature.id;
        if (selectedId !== null) {
          map.setFeatureState({ source: SOURCE, id: selectedId }, { selected: false });
        }
        selectedId = id;
        map.setFeatureState({ source: SOURCE, id: id }, { selected: true });

        const areaKey = getFeatureAreaKey(props);
        if (_onAreaClick) _onAreaClick(areaKey);
      }
    });
  }

  function render(container, geo, options, onReady) {
    _isProvinceView = options.isProvinceView;
    _onAreaClick = options.onAreaClick;
    _getPopupHtml = options.getPopupHtml;

    ensureMap(container);

    const apply = () => {
      if (!map.getSource(SOURCE)) {
        addLayers();
      }

      clearHover();

      const styledGeo = buildStyledGeo(geo, options.getFeatureStyle);
      map.getSource(SOURCE).setData(styledGeo);
      // Tambahkan di baris 212 (di bawah setData)
// Tambahkan di baris 213-219 (di dalam blok if !options.isProvinceView)
if (!options.isProvinceView) {
    // Membuat popup dengan gaya kustom
    const popup = new window['maplibregl'].Popup({ offset: 25, closeButton: false })
        .setHTML('<b style="color: #fd599d; font-size: 15px;">Kota Bekasi</b><br><span style="color: #fd599d;">Wilayah Fokus Kelompok 8</span>');

<<<<<<< HEAD
      // OTOMATIS ZOOM KE GARUT
    // Menambahkan marker merah dan menempelkan popup-nya
    new window['maplibregl'].Marker({ color: '#FF0000' })
        .setLngLat([106.9924, -6.2383])
        .setPopup(popup)
        .addTo(map)
        .togglePopup(); // Agar langsung terbuka otomatis
}
      if (options.fitBounds) {
        const bounds = computeBounds(geo, options.focusAreaKey);
        if (bounds) {
          map.fitBounds(bounds, {
            padding: 50,
            duration: 2000, // Durasi zoom in 2 detik
            essential: true
        const cimahiOnly = {
          ...geo,
          features: geo.features.filter((f) => {
            const p = f.properties;
            // <<< UBAH DI SINI: Agar zoom otomatis (fitBounds) juga bekerja
            return (p.KADMKK && p.KADMKK.toUpperCase().includes("CIMAHI")) || 
                   (p.regionKey && p.regionKey.toLowerCase().includes("cimahi"));
          }),
        };

        const bounds = computeBounds(cimahiOnly);
        if (bounds) {
          map.fitBounds(bounds, {
            padding: 100,
            duration: 1000,
          });
        }
      }
=======
      // if (options.fitBounds) {
      //   const bounds = computeBounds(geo);
      //   if (bounds) {
      //     map.fitBounds(bounds, {
      //       padding: options.isProvinceView ? 80 : 50,
      //       duration: 300,
      //     });
      //   }
      // }
>>>>>>> main

      if (onReady) onReady();
    };

    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once('load', apply);
    }
  }

  function refresh(geo, getFeatureStyle) {
    if (!map?.getSource(SOURCE)) return;
    clearHover();
    map.getSource(SOURCE).setData(buildStyledGeo(geo, getFeatureStyle));
  }

  return { render, refresh, closePopup: clearHover };
})();

<<<<<<< HEAD
export {};
=======
export {};
>>>>>>> main
export {};