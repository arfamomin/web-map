// import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = "pk.eyJ1IjoiYXJmYW1vbWluIiwiYSI6ImNscGwwYzZlMDAxaHgyanA1cWUzY2ExN3YifQ.z5jXdp6__K-B2oj1rpNOJw";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/arfamomin/cmhs5blt0002r01s21t5p4dfh",
  center: [110.2995, 22.1670],
  zoom: 1.5,
  projection: "globe",
});

const outlineTop = document.getElementById("outline-top");
const outlineBottom = document.getElementById("outline-bottom");

const targetWidth = 2560;
const targetHeight = 1664;
const tolerance = 0.15;

function screenMatches() {
  return (
    window.screen.width >= targetWidth * (1 - tolerance) &&
    window.screen.width <= targetWidth * (1 + tolerance) &&
    window.screen.height >= targetHeight * (1 - tolerance) &&
    window.screen.height <= targetHeight * (1 + tolerance)
  );
}

function updateOutlineVisibility() {
  const zoom = map.getZoom();
  if (outlineTop && outlineBottom) {
    if (screenMatches() && zoom >= 1.5 && zoom <= 1.8) {
      outlineTop.style.display = "block";
      outlineBottom.style.display = "block";
    } else {
      outlineTop.style.display = "none";
      outlineBottom.style.display = "none";
    }
  }
}

// run on zoom events
map.on("zoom", updateOutlineVisibility);
map.on("moveend", updateOutlineVisibility);
window.addEventListener("resize", updateOutlineVisibility);

map.on('style.load', () => {
  map.setFog({
    color: 'rgb(186, 210, 235)',
    'high-color': 'rgb(36, 92, 223)',
    'horizon-blend': 0.02, 
    'space-color': 'rgba(255, 255, 255, 1)', 
    'star-intensity': 0 // no stars
  });
});

let currentMagnitude = 2.0;

// JS function that performs shake when button is clicked
function shake(magnitude) {
  const mapElement = document.getElementById('map');
  const shakeBtn = document.getElementById('shake-button');
  
  shakeBtn.disabled = true;
  
  const duration = magnitude * 1000;
  mapElement.classList.add('shaking');
  
  setTimeout(() => {
    mapElement.classList.remove('shaking');
    shakeBtn.disabled = false;
  }, duration);
}

map.on("load", () => {

  map.addSource("earthquakes__1", {
    type: "geojson",
    data: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_month.geojson",
  });

  map.setPaintProperty("background", "background-color", "#ffffff");

  map.addLayer({
    id: "earthquakes__1",
    source: "earthquakes__1",
    type: "circle",
    paint: {
      "circle-color": "#44090c",
      "circle-radius": 3,
      "circle-opacity": 0.75,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1,
    },
  });

  // ring layer
  map.addLayer({
    id: "earthquake-rings",
    source: "earthquakes__1",
    type: "circle",
    paint: {
      "circle-radius": 0,
      "circle-color": "transparent",
      "circle-stroke-color": "#44090c",
      "circle-stroke-width": 1,
      "circle-stroke-opacity": 0,
    },
  });

  const earthquakeOffsets = new Map();
  
  map.on('data', (e) => {
    if (e.sourceId === 'earthquakes__1' && e.isSourceLoaded) {
      const features = map.querySourceFeatures('earthquakes__1');
      features.forEach(feature => {
        if (!earthquakeOffsets.has(feature.id)) {
          earthquakeOffsets.set(feature.id, Math.random() * Math.PI * 2);
        }
      });
    }
  });

  let phase = 0;

  // JS function that calculates and updates ring radius and opacity
  const animateRings = () => {
    phase += 0.04;
    const randomOffset = ["*", 100, ["-", ["/", ["%", ["*", ["+", ["get", "time"], ["*", ["get", "mag"], 1000]], 9999], 10000], 10000], 0.5]];

    map.setPaintProperty("earthquake-rings", "circle-radius", [
      "*",
      [
        "interpolate",
        ["linear"],
        ["get", "mag"],
        2.5, 4,      // small earthquakes
        4.0, 6,     // medium
        5.0, 8,     // large
        6.5, 20      // very large
      ],
      ["+", 0.5, ["*", 0.5, ["sin", ["+", phase, randomOffset]]]]]
    );
    
     map.setPaintProperty("earthquake-rings", "circle-stroke-opacity", 
      ["*", 0.5, ["max", 0, ["sin", ["+", phase, randomOffset]]]]
    );

    requestAnimationFrame(animateRings);
  };
  
  animateRings();

  const popupPanel = document.getElementById("popup-panel");

  map.on("click", "earthquake-rings", (e) => {
    const feature = e.features[0];
    const props = feature.properties;

    const magnitude = props.mag ? props.mag.toFixed(1) : "N/A";
    const place = props.place || "Unknown location";
    const date = new Date(props.time);
    const dateString = date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short"
    });
    currentMagnitude = props.mag || 4.3;


    const url = props.url ? `<a href="${props.url}" target="_blank" style="color:#fff; text-decoration:underline;">USGS Event Page</a>` : "";

    popupPanel.innerHTML = `
      <h2>${place}</h2>
      <p><strong>Magnitude:</strong> ${magnitude}</p>
      <p><strong>Date/Time:</strong> ${dateString}</p>
      ${url}
    `;

    popupPanel.classList.add("visible");
  });

  map.on("click", (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ["earthquakes__1"] });
    if (!features.length) popupPanel.classList.remove("visible");
  });

  const shakeBtn = document.getElementById('shake-button');
  shakeBtn.addEventListener('click', () => {
    shake(currentMagnitude);
  });
});