import { useRef, useEffect, useState } from "react";

import mapboxgl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const INITIAL_CENTRE = [-0.1257, 51.5082];
const INITIAL_ZOOM = 9;

function MapComponent() {
  const mapRef = useRef();
  const mapContainerRef = useRef();

  const [placeName, setPlaceName] = useState(null);

  const [editMode, setEditMode] = useState(false);

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
            tiles: [`http://localhost:4000/tiles/points/{z}/{x}/{y}`],
          },
          polygons: {
            type: "vector",
            tiles: [`http://localhost:4000/tiles/polygons/{z}/{x}/{y}`],
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
          {
            id: "polygons",
            type: "line",
            source: "polygons",
            "source-layer": "polygon",
            paint: {
              "line-color": "#000",
              "line-width": 1,
            },
            filter: ["==", "$type", "Polygon"],
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

    mapRef.current.addControl(
      new mapboxgl.AttributionControl({
        customAttribution: "© OpenStreetMap contributors",
      }),
    );

    return () => {
      mapRef.current.remove();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!placeName) return;
    const [lon, lat] = [centre[0], centre[1]];

    try {
      const response = await fetch(`http://localhost:4000/add_point`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: placeName, lat, lon }),
      });
    } catch (error) {
      console.error("Error submitting point:", error);
    }
  };

  return (
    <>
      <div className="topbar">
        {/* EDIT MODE TOGGLE */}
        <button
          className="topbar-item"
          onClick={() => {
            setEditMode(!editMode);
          }}
        >
          {editMode ? "View" : "Edit"}
        </button>
        {/* NAME ENTRY */}
        {editMode && (
          <div className="topbar-item">
            <form onSubmit={handleSubmit}>
              <input
                Style={{ display: "inline-block" }}
                id="placeName"
                type="text"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                placeholder="Enter place name"
                required
              />
              <button Style={{ display: "inline-block" }} type="submit">
                Save Name
              </button>
            </form>
          </div>
        )}
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
        {editMode && (
          <div style={{ zIndex: "1", pointerEvents: "none" }}>
            <svg viewBox="0 0 48 48" width="48" height="48">
              <line
                x1="24"
                y1="4"
                x2="24"
                y2="44"
                stroke="black"
                stroke-width="2"
              />
              <line
                x1="4"
                y1="24"
                x2="44"
                y2="24"
                stroke="black"
                stroke-width="2"
              />
            </svg>
          </div>
        )}
      </div>
    </>
  );
}

export default MapComponent;
