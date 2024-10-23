// MapComponent.js
import React, { useState, useEffect, useRef } from "react";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import "ol/ol.css";

function MapComponent() {
  useEffect(() => {
    const map = new Map({
      target: "map",
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: [0, 0],
        zoom: 0,
      }),
    });
  });

  return (
    <div
      style={{ height: "100vh", width: "100%" }}
      id="map"
      className="map-container"
    />
  );
}

export default MapComponent;
