// MapComponent.js
import React, { useState, useEffect, useRef } from "react";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import "ol/ol.css";
import { Style, Circle, Fill, Stroke } from "ol/style";
import VectorTileLayer from "ol/layer/VectorTile";
import VectorTileSource from "ol/source/VectorTile";
import MVT from "ol/format/MVT";

function MapComponent() {
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

    const map = new Map({
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
    });
    return () => map.setTarget(null);
  }, []);

  return (
    <div
      style={{ height: "100vh", width: "100%" }}
      id="map"
      className="map-container"
    />
  );
}

export default MapComponent;
