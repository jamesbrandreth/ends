import React, { useEffect, useRef, useState } from "react";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import "ol/ol.css";
import { Style, Circle, Fill, Stroke } from "ol/style";
import VectorTileLayer from "ol/layer/VectorTile";
import VectorTileSource from "ol/source/VectorTile";
import MVT from "ol/format/MVT";
import Overlay from "ol/Overlay";
import { toLonLat } from "ol/proj";

function MapComponent() {
  const [placeName, setPlaceName] = useState("");
  const [currentCoordinate, setCurrentCoordinate] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const vectorTileSourceRef = useRef(null);

  const refreshVectorTiles = () => {
    if (vectorTileSourceRef.current) {
      vectorTileSourceRef.current.clear();
      vectorTileSourceRef.current.refresh();
    }
  };

  useEffect(() => {
    overlayRef.current = new Overlay({
      autoPan: {
        animation: { duration: 250 },
      },
    });

    const pointStyleFunction = (feature) => {
      console.log(feature);
      const colour = feature.get("colour");
      return new Style({
        image: new Circle({
          radius: 12,
          fill: new Fill({ color: `#${colour}` }),
          stroke: new Stroke({ color: "black", width: 2 }),
        }),
      });
    };

    vectorTileSourceRef.current = new VectorTileSource({
      format: new MVT(),
      url: "tiles/{z}/{x}/{y}",
      maxzoom: 14,
    });

    mapRef.current = new Map({
      target: "map",
      layers: [
        new TileLayer({
          preload: Infinity,
          source: new OSM(),
        }),
        new VectorTileLayer({
          source: vectorTileSourceRef.current,
          style: pointStyleFunction,
        }),
      ],
      view: new View({
        center: [0, 0],
        zoom: 0,
      }),
      overlays: [overlayRef.current],
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(null);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!placeName) return;
    const [lon, lat] = toLonLat(mapRef.current.getView().getCenter());

    try {
      const response = await fetch("add_point", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: placeName, lat, lon }),
      });

      if (response.ok) {
        refreshVectorTiles();
      }
    } catch (error) {
      console.error("Error submitting point:", error);
    }
  };
  var panelHeight = 3;

  return (
    <>
      <div
        id="map"
        style={{ width: "100%", height: `calc(100vh - ${panelHeight}em)` }}
      />
      <div
        id="panel"
        style={{
          width: "100%",
          height: `${panelHeight}em`,
          display: "inline-block",
        }}
      >
        {" "}
        {editMode ? (
          <>
            <button
              Style={{ display: "inline-block" }}
              onClick={() => {
                setEditMode(!editMode);
              }}
            >
              View
            </button>
            <div Style={{ display: "inline-block" }}>
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
          </>
        ) : (
          <button
            onClick={() => {
              setEditMode(!editMode);
            }}
          >
            Edit
          </button>
        )}
      </div>
    </>
  );
}

export default MapComponent;
