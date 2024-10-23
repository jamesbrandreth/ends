import React, { useEffect, useRef } from "react";
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
  // Create refs for popup elements
  const popupRef = useRef(null);
  const popupContentRef = useRef(null);
  const popupCloserRef = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);

  // Initialize overlay
  useEffect(() => {
    if (popupRef.current) {
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
          return false;
        };
      }
    }
  }, []); // Run once after initial render

  // Initialize map
  useEffect(() => {
    const pointStyle = new Style({
      image: new Circle({
        radius: 12,
        fill: new Fill({ color: "red" }),
        stroke: new Stroke({ color: "black", width: 2 }),
      }),
    });

    const tileSource = new VectorTileSource({
      format: new MVT(),
      url: "/tiles/{z}/{x}/{y}",
      maxzoom: 14,
    });

    // Initialize map only if overlay is ready
    if (overlayRef.current) {
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
        const lonlat = toLonLat(coordinate);
        const hdms = toStringHDMS(lonlat);
        if (popupContentRef.current) {
          popupContentRef.current.innerHTML =
            "<p>Name this place:</p>" + "<code>" + hdms + "</code>";
        }
        overlayRef.current.setPosition(coordinate);
      });
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(null);
      }
    };
  }, [overlayRef.current]); // Run when overlay is initialized

  return (
    <>
      <div
        style={{ height: "100vh", width: "100%" }}
        id="map"
        className="map-container"
      />
      <div ref={popupRef} className="ol-popup">
        <a href="#" ref={popupCloserRef} className="ol-popup-closer"></a>
        <div ref={popupContentRef}></div>
      </div>
    </>
  );
}

export default MapComponent;
