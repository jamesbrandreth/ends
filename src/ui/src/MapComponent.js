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
import { toStringHDMS } from "ol/coordinate";

function MapComponent() {
  const [placeName, setPlaceName] = useState("");
  const [currentCoordinate, setCurrentCoordinate] = useState(null);
  const popupRef = useRef(null);
  const popupContentRef = useRef(null);
  const popupCloserRef = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);

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
        body: JSON.stringify({
          name: placeName,
          lat: lat,
          lon: lon,
        }),
      });

      if (response.ok) {
        // Clear the form and close popup on success
        setPlaceName("");
        overlayRef.current.setPosition(undefined);
      } else {
        console.error("Failed to add point");
      }
    } catch (error) {
      console.error("Error submitting point:", error);
    }
  };

  // Initialize map and overlay once
  useEffect(() => {
    // Create the overlay first
    overlayRef.current = new Overlay({
      element: popupRef.current,
      autoPan: {
        animation: {
          duration: 250,
        },
      },
    });

    // Set up popup closer
    if (popupCloserRef.current) {
      popupCloserRef.current.onclick = function () {
        overlayRef.current.setPosition(undefined);
        popupCloserRef.current.blur();
        setPlaceName("");
        setCurrentCoordinate(null);
        return false;
      };
    }

    // Create point style
    const pointStyle = new Style({
      image: new Circle({
        radius: 12,
        fill: new Fill({ color: "red" }),
        stroke: new Stroke({ color: "black", width: 2 }),
      }),
    });

    // Create tile source
    const tileSource = new VectorTileSource({
      format: new MVT(),
      url: "/tiles/{z}/{x}/{y}",
      maxzoom: 14,
    });

    // Create map instance
    mapRef.current = new Map({
      target: "map",
      layers: [
        new TileLayer({
          preload: Infinity,
          source: new OSM(),
        }),
        new VectorTileLayer({
          source: tileSource,
          style: pointStyle,
        }),
      ],
      view: new View({
        center: [0, 0],
        zoom: 0,
      }),
      overlays: [overlayRef.current],
    });

    // Add click handler
    mapRef.current.on("singleclick", function (evt) {
      const coordinate = evt.coordinate;
      setCurrentCoordinate(coordinate);
      overlayRef.current.setPosition(coordinate);
    });

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(null);
      }
    };
  }, []); // Empty dependency array - only run once

  return (
    <>
      <div
        style={{ height: "100vh", width: "100%" }}
        id="map"
        className="map-container"
      />
      <div ref={popupRef} className="ol-popup">
        <a href="#" ref={popupCloserRef} className="ol-popup-closer"></a>
        <div ref={popupContentRef}>
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
            {currentCoordinate && (
              <div className="text-sm mb-4">
                <p>Coordinates: {toStringHDMS(toLonLat(currentCoordinate))}</p>
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
            >
              Save Location
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default MapComponent;
