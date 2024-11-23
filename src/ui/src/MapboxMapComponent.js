import { useRef, useEffect, useState } from "react";

import mapboxgl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Source } from "ol/source";

const INITIAL_CENTRE = [-0.1257, 51.5082];
const INITIAL_ZOOM = 9;

function MapComponent() {
  const mapRef = useRef();
  const mapContainerRef = useRef();

  const [centre, setCentre] = useState(INITIAL_CENTRE);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);

  useEffect(() => {
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
          },
          points: {
            type: "vector",
            tiles: ["http://localhost:4000/tiles/{z}/{x}/{y}"],
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
          {
            id: "points",
            type: "circle",
            source: "points",
            "source-layer": "points",
            paint: {
              "circle-radius": 10,
              "circle-color": [
                "case",
                ["has", "colour"],
                ["concat", "#", ["get", "colour"]],
                "#FF0000",
              ],
              "circle-opacity": 1,
            },
          },
        ],
      },
      center: centre,
      zoom: zoom,
    });

    mapRef.current.on("move", () => {
      const mapCentre = mapRef.current.getCenter();
      const mapZoom = mapRef.current.getZoom();
      setCentre([mapCentre.lng, mapCentre.lat]);
      setZoom(mapZoom);
    });

    return () => {
      mapRef.current.remove();
    };
  }, []);

  return (
    <>
      <div className="sidebar">
        Longitude: {centre[0].toFixed(4)} | Latitude: {centre[1].toFixed(4)}
      </div>
      <div
        id="map-container"
        ref={mapContainerRef}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ zIndex: "1", pointerEvents: "none" }}>
          <svg viewBox="0 0 24 24" width="24" height="24">
            <line
              x1="12"
              y1="2"
              x2="12"
              y2="22"
              stroke="black"
              stroke-width="1"
            />
            <line
              x1="2"
              y1="12"
              x2="22"
              y2="12"
              stroke="black"
              stroke-width="1"
            />
          </svg>
        </div>
      </div>
    </>
  );
}

export default MapComponent;
