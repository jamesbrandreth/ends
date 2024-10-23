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
  const popupRef = useRef(null);
  const popupCloserRef = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const vectorTileSourceRef = useRef(null);

  const refreshVectorTiles = () => {
    if (vectorTileSourceRef.current) {
      vectorTileSourceRef.current.clear();
      vectorTileSourceRef.current.refresh();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentCoordinate || !placeName) return;

    const [lon, lat] = toLonLat(currentCoordinate);

    try {
      const response = await fetch("/add_point", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: placeName, lat, lon }),
      });

      if (response.ok) {
        setPlaceName("");
        overlayRef.current.setPosition(undefined);
        refreshVectorTiles();
      }
    } catch (error) {
      console.error("Error submitting point:", error);
    }
  };

  useEffect(() => {
    overlayRef.current = new Overlay({
      element: popupRef.current,
      autoPan: {
        animation: { duration: 250 },
      },
    });

    if (popupCloserRef.current) {
      popupCloserRef.current.onclick = () => {
        overlayRef.current.setPosition(undefined);
        popupCloserRef.current.blur();
        setPlaceName("");
        setCurrentCoordinate(null);
        return false;
      };
    }

    const pointStyle = new Style({
      image: new Circle({
        radius: 12,
        fill: new Fill({ color: "red" }),
        stroke: new Stroke({ color: "black", width: 2 }),
      }),
    });

    vectorTileSourceRef.current = new VectorTileSource({
      format: new MVT(),
      url: "/tiles/{z}/{x}/{y}",
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
          style: pointStyle,
        }),
      ],
      view: new View({
        center: [0, 0],
        zoom: 0,
      }),
      overlays: [overlayRef.current],
    });

    mapRef.current.on("singleclick", (evt) => {
      setCurrentCoordinate(evt.coordinate);
      overlayRef.current.setPosition(evt.coordinate);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(null);
      }
    };
  }, []);

  return (
    <>
      <div
        id="map"
        className="map-container"
        style={{ height: "100vh", width: "100%" }}
      />
      <div ref={popupRef} className="ol-popup">
        <a href="#" ref={popupCloserRef} className="ol-popup-closer" />
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Name this place:
            </label>
            <input
              type="text"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter place name"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
          >
            Save Location
          </button>
        </form>
      </div>
    </>
  );
}

export default MapComponent;
