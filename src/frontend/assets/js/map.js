import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

window['AuditMap'] = (() => {
  const SOURCE = 'audit-areas';
  const FILL_LAYER = 'audit-fill';
  const LINE_LAYER = 'audit-line';
  const HOVER_FILL = 'audit-fill-hover';
  const HOVER_LINE = 'audit-line-hover';
  const SELECTED_LINE = 'audit-line-selected';
  
  // New Special Layer for West Java Highlight
  const JABAR_GLOW_LAYER = 'jabar-glow';
  const JABAR_LINE_LAYER = 'jabar-line-bold';

  let map = null;
  let popup = null;
  let hoveredId = null;
  let selectedId = null;
  let _isProvinceView = false;
  let _onAreaClick = null;
  let _getPopupHtml = null;
  let _geo = null;
  let _resizeHandler = null;

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

  function computeBounds(geo, areaKey) {
    let minLng = Infinity,
      minLat = Infinity,
      maxLng = -Infinity,
      maxLat = -Infinity;
    let hasCoords = false;

    geo.features.forEach((f) => {
      if (areaKey) {
        const fKey = f.properties.regionKey || f.properties.provinceKey;
        if (fKey !== areaKey) return;
      }
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
  }

  function ensureMap(container) {
    if (map) return;

    map = new maplibregl.Map({
      container,
      // Default center to West Java
      center: [107.7098, -6.9175],
      zoom: 7.8,
      minZoom: 6,
      maxZoom: 14,
      maxBounds: [[105.5, -8.5], [109.5, -5.0]], // West Java max bounds
      pitch: 40, // Add some perspective
      bearing: -10,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      antialias: true
    });

    _resizeHandler = () => {
      if (map) {
        map.resize();
      }
    };

    window.addEventListener('resize', _resizeHandler);
    window.addEventListener('orientationchange', _resizeHandler);

    map.on('load', () => {
      if (map) {
        map.resize();
      }
    });
  }

  function closePopup() {
    if (popup) {
      popup.remove();
      popup = null;
    }
  }

  function clearHover() {
    if (hoveredId !== null) {
      try {
        map.setFeatureState({ source: SOURCE, id: hoveredId }, { hover: false });
      } catch (e) {
        console.warn('Failed to clear hover state:', e);
      }
      hoveredId = null;
    }
    closePopup();
  }

  function addLayers() {
    map.addSource(SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      generateId: true,
    });

    // Base Fill
    map.addLayer({
      id: FILL_LAYER,
      type: 'fill',
      source: SOURCE,
      paint: {
        'fill-color': ['coalesce', ['get', 'fillColor'], '#dcfce7'],
        'fill-opacity': ['coalesce', ['get', 'fillOpacity'], 0.4],
      },
    });

    // Base Borders
    map.addLayer({
      id: LINE_LAYER,
      type: 'line',
      source: SOURCE,
      paint: {
        'line-color': ['coalesce', ['get', 'strokeColor'], '#22c55e'],
        'line-width': ['coalesce', ['get', 'strokeWidth'], 0.8],
        'line-opacity': ['coalesce', ['get', 'strokeOpacity'], 0.6],
      },
    });

    // West Java Special Highlight (Glow)
    map.addLayer({
      id: JABAR_GLOW_LAYER,
      type: 'fill',
      source: SOURCE,
      filter: ['any', 
        ['==', ['get', 'provinceKey'], 'jawabarat'],
        ['==', ['get', 'provinceName'], 'Jawa Barat']
      ],
      paint: {
        'fill-color': '#16a34a',
        'fill-opacity': 0.1,
      },
    });

    map.addLayer({
      id: JABAR_LINE_LAYER,
      type: 'line',
      source: SOURCE,
      filter: ['any', 
        ['==', ['get', 'provinceKey'], 'jawabarat'],
        ['==', ['get', 'provinceName'], 'Jawa Barat']
      ],
      paint: {
        'line-color': '#16a34a',
        'line-width': 1.5,
        'line-opacity': 0.8,
      },
    });

    // Hover State
    map.addLayer({
      id: HOVER_FILL,
      type: 'fill',
      source: SOURCE,
      paint: {
        'fill-color': '#15803d',
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          0.3,
          0,
        ],
      },
    });

    map.addLayer({
      id: HOVER_LINE,
      type: 'line',
      source: SOURCE,
      paint: {
        'line-color': '#15803d',
        'line-width': 2,
        'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0],
      },
    });

    // Selected State
    map.addLayer({
      id: SELECTED_LINE,
      type: 'line',
      source: SOURCE,
      paint: {
        'line-color': '#ca8a04',
        'line-width': 3,
        'line-opacity': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          1,
          0
        ],
      },
    });

    // Event Handlers
    map.on('mousemove', FILL_LAYER, (e) => {
      if (!e.features.length) return;

      map.getCanvas().style.cursor = 'pointer';
      const feature = e.features[0];
      const id = feature.id;
      const props = feature.properties;

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
            popup = new maplibregl.Popup({
              closeButton: false,
              closeOnClick: false,
              maxWidth: '280px',
              className: 'audit-popup',
              offset: 12,
              anchor: 'bottom',
            });
          }

          // Anchor to the center of the feature's bounds instead of the cursor
          const bounds = computeBounds(_geo, areaKey);
          if (bounds) {
            const center = [
              (bounds[0][0] + bounds[1][0]) / 2,
              (bounds[0][1] + bounds[1][1]) / 2
            ];
            popup.setLngLat(center).setHTML(html).addTo(map);
          }
        }
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

      const id = feature.id;
      if (selectedId !== null) {
        map.setFeatureState({ source: SOURCE, id: selectedId }, { selected: false });
      }
      selectedId = id;
      map.setFeatureState({ source: SOURCE, id: id }, { selected: true });

      const areaKey = getFeatureAreaKey(props);
      if (_onAreaClick) _onAreaClick(areaKey);
    });
  }

  function render(container, geo, options, onReady) {
    _isProvinceView = options.isProvinceView;
    _onAreaClick = options.onAreaClick;
    _getPopupHtml = options.getPopupHtml;
    _geo = geo;

    ensureMap(container);

    const apply = () => {
      if (!map.getSource(SOURCE)) {
        addLayers();
      }

      clearHover();

      const styledGeo = buildStyledGeo(geo, options.getFeatureStyle);
      map.getSource(SOURCE).setData(styledGeo);

      if (options.fitBounds) {
        const bounds = computeBounds(geo, options.focusAreaKey);
        if (bounds) {
          map.fitBounds(bounds, {
            padding: options.isProvinceView ? 100 : 60,
            duration: 1500,
            essential: true
          });
        }
      }

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

  const FOCUS_SOURCE = 'focus-zone';
  const FOCUS_FILL_LAYER = 'focus-zone-fill';
  const FOCUS_LINE_LAYER = 'focus-zone-line';

  let _focusMarker = null;
  let _focusMarkerPopup = null;

  function ensureFocusLayers() {
    if (map.getSource(FOCUS_SOURCE)) return;
    map.addSource(FOCUS_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    
    map.addLayer({
      id: FOCUS_FILL_LAYER,
      type: 'fill',
      source: FOCUS_SOURCE,
      paint: {
        'fill-color': '#ca8a04',
        'fill-opacity': 0.2,
      },
    });
    
    map.addLayer({
      id: FOCUS_LINE_LAYER,
      type: 'line',
      source: FOCUS_SOURCE,
      paint: {
        'line-color': '#ca8a04',
        'line-width': 3,
        'line-opacity': 0.9,
        'line-dasharray': [2, 1],
      },
    });
  }

  function setFocusZone(geoFeatures) {
    if (!map) return;
    const applyZone = () => {
      ensureFocusLayers();
      map.getSource(FOCUS_SOURCE).setData({
        type: 'FeatureCollection',
        features: geoFeatures,
      });
    };
    if (map.isStyleLoaded()) {
      applyZone();
    } else {
      map.once('load', applyZone);
    }
  }

  function clearFocusZone() {
    if (!map || !map.getSource(FOCUS_SOURCE)) return;
    map.getSource(FOCUS_SOURCE).setData({ type: 'FeatureCollection', features: [] });
  }

  function addFocusMarker(lngLat, title, subtitle, onClickZoom) {
    if (_focusMarker) { _focusMarker.remove(); _focusMarker = null; }
    if (_focusMarkerPopup) { _focusMarkerPopup.remove(); _focusMarkerPopup = null; }
    if (!map) return;

    const el = document.createElement('div');
    el.className = 'focus-marker';
    el.style.cssText = [
      'width:40px',
      'height:40px',
      'cursor:pointer',
      'position:relative',
      'display:flex',
      'align-items:center',
      'justify-content:center',
    ].join(';');

    const ring = document.createElement('div');
    ring.style.cssText = [
      'width:100%',
      'height:100%',
      'border-radius:50%',
      'border:3px solid #16a34a',
      'box-shadow:0 0 15px #16a34a',
      'animation: marker-pulse 2s infinite',
      'position:absolute',
    ].join(';');

    const dot = document.createElement('div');
    dot.style.cssText = [
      'width:12px',
      'height:12px',
      'background:#16a34a',
      'border-radius:50%',
      'box-shadow:0 0 10px #16a34a',
    ].join(';');

    el.appendChild(ring);
    el.appendChild(dot);

    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes marker-pulse {
        0% { transform: scale(0.5); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    _focusMarker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat(lngLat)
      .addTo(map);

    _focusMarkerPopup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: '240px',
      className: 'audit-popup focus-popup',
      offset: [0, -20],
    })
      .setLngLat(lngLat)
      .setHTML(
        '<div style="font-weight:800;font-size:14px;color:#fff;margin-bottom:4px">' + title + '</div>' +
        '<div style="font-size:11px;color:#94a3b8;margin-bottom:8px">' + (subtitle || '') + '</div>' +
        '<div style="font-size:11px;color:#00f2ff;cursor:pointer;font-weight:700;padding:6px 0;text-transform:uppercase;letter-spacing:1px" id="focusZoomBtn">Zoom Ke Wilayah</div>'
      )
      .addTo(map);

    if (onClickZoom) {
      setTimeout(() => {
        const btn = document.getElementById('focusZoomBtn');
        if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); onClickZoom(); });
      }, 50);
    }

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (onClickZoom) onClickZoom();
    });
  }

  function zoomToFeatures(features, padding) {
    if (!map || !features.length) return;
    const geo = { type: 'FeatureCollection', features };
    const bounds = computeBounds(geo);
    if (bounds) {
      map.fitBounds(bounds, { padding: padding || 80, duration: 1500 });
    }
  }

  function flyToBandungFallback() {
    if (!map) return;
    map.flyTo({ center: [107.5732, -7.0397], zoom: 11, duration: 1500 });
  }

  return { render, refresh, closePopup: clearHover, addFocusMarker, setFocusZone, clearFocusZone, zoomToFeatures, flyToBandungFallback };
})();

export {};