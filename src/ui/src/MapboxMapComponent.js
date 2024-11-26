import { useRef, useEffect, useState } from "react";
import mapboxgl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const INITIAL_CENTRE = [-0.1257, 51.5082];
const INITIAL_ZOOM = 9;

function MapComponent() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [placeName, setPlaceName] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [centre, setCentre] = useState(INITIAL_CENTRE);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map
    const map = new mapboxgl.Map({
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
            layout: {
              visibility: "none",
            },
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

    // Store map instance
    mapRef.current = map;

    // Wait for map to load before adding sources and layers
    map.on("load", async () => {
      try {
        const response = await fetch("http://localhost:4000/squares");
        const geojsonData = await response.json();

        // Add GeoJSON source
        map.addSource("squares", {
          type: "geojson",
          data: geojsonData,
        });

        // Add squares layer
        map.addLayer({
          id: "squares",
          type: "fill",
          source: "squares",
          paint: {
            "fill-color": [
              "case",
              ["has", "colour"],
              ["concat", "#", ["get", "colour"]],
              "#FF0000",
            ],
            "fill-opacity": 0.9,
          },
        });
      } catch (err) {
        console.error("Error loading GeoJSON:", err);
      }
    });

    // Add move handler
    map.on("move", () => {
      if (!map) return;
      const mapCentre = map.getCenter();
      const mapZoom = map.getZoom();
      setCentre([mapCentre.lng, mapCentre.lat]);
      setZoom(mapZoom);
    });

    map.on("moveend", () => {
      const features = map.queryRenderedFeatures({ layers: ["squares"] });
      render_visible_places(
        Array.from(new Set(features.map((x) => x.properties.name))),
      );
    });

    // Add attribution control
    map.addControl(
      new mapboxgl.AttributionControl({
        customAttribution: "© OpenStreetMap contributors",
      }),
    );

    // Cleanup
    return () => {
      if (map) map.remove();
    };
  }, []); // Only run on mount

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

  const render_visible_places = (names) => {
    document.getElementById("placename_list").innerHTML = "";
    for (const name of names) {
      const label = document.createElement("div");
      label.innerHTML = name;
      label.className = "topbar-item";
      document.getElementById("placename_list").appendChild(label);
    }
  };

  return (
    <>
      <div className="topbar">
        <button
          className="topbar-item"
          onClick={() => {
            setEditMode(!editMode);
          }}
        >
          {editMode ? "View" : "Edit"}
        </button>
        {editMode && (
          <>
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
            <div className="topbar-item">
              Pan the map to centre on your place, then name it.
            </div>
          </>
        )}
        {!editMode && (
          <div id="placename_list" className="placename-list"></div>
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
                strokeWidth="2"
              />
              <line
                x1="4"
                y1="24"
                x2="44"
                y2="24"
                stroke="black"
                strokeWidth="2"
              />
            </svg>
          </div>
        )}
      </div>
    </>
  );
}

export default MapComponent;
