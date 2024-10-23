CREATE EXTENSION postgis;

CREATE TABLE placenames (
   name TEXT PRIMARY KEY,
   unique(name)
);

CREATE TABLE points (
   location GEOMETRY(Point, 4326),
   name TEXT REFERENCES placenames(name)
);

-- Grid generation query
CREATE OR REPLACE VIEW grid
AS
SELECT
   ST_AsText((ST_Dump(geom)).geom, 4326) AS os_geometry,
   ST_AsText(ST_Transform((ST_Dump(geom)).geom, 4326)) AS wgs84_geometry
FROM
   ST_SquareGrid(
       100000,
       ST_MakeEnvelope(0, 0, 700000, 1300000, 27700)
   )
;


CREATE OR REPLACE FUNCTION get_tile(z int, x int, y int)
RETURNS bytea
LANGUAGE plpgsql
AS $$
DECLARE
   bbox geometry;
   tile bytea;
BEGIN
   -- Calculate the bounding box for the requested tile
   WITH bounds AS (
       SELECT ST_TileEnvelope(z, x, y) AS geom
   )
   SELECT ST_Transform(geom, 4326) INTO bbox FROM bounds;

-- Generate the MVT
WITH mvt_data AS (
   SELECT name,
          ST_AsMVTGeom(
              ST_Transform(p.location, 3857),  -- Transform to Web Mercator
              ST_Transform(bbox, 3857),        -- Transform bbox to Web Mercator
              4096,   -- Tile extent
              64,     -- Buffer
              true    -- Clip geometry
          ) AS geom
   FROM points p
   WHERE ST_Intersects(p.location, ST_Transform(bbox, 4326))
)
SELECT ST_AsMVT(mvt_data.*, 'points', 4096, 'geom')
INTO tile
FROM mvt_data;

   -- Return the tile
   RETURN tile;
END;
$$;

CREATE PROCEDURE insert_point(lon float, lat float, placename text)
LANGUAGE sql
BEGIN ATOMIC
   INSERT INTO placenames (name)
   VALUES (placename)
   ON CONFLICT (name) DO NOTHING;

   INSERT INTO points
   VALUES (
           ST_SetSRID(ST_MakePoint(lon, lat), 4326),
           placename
          );
END;









-- INSERT INTO placenames
-- VALUES ('london');

-- INSERT INTO points
-- VALUES (POINT(1,1), 'london');

-- DROP TABLE points;

-- CREATE TABLE points (
--    location point,
--    name TEXT references placenames(name)
-- );


-- SELECT ST_X(location::geometry), ST_Y(location::geometry), name FROM points LIMIT 1;

-- INSERT INTO placenames
-- VALUES ('test');

-- INSERT INTO points (location, name)
-- SELECT (ST_Dump(ST_GeneratePoints(
--    ST_GeomFromText('POLYGON((-180 -90, -180 90, 180 90, 180 -90, -180 -90))', 4326),
--    10000))).geom, 'test';


-- CALL insert_point(-0.127647, 51.507322, 'london');

-- WITH
-- tile_bounds AS (
--    SELECT ST_Transform(ST_TileEnvelope(0, 0, 0), 4326) AS bbox
-- ),
-- intersecting_points AS (
--    SELECT
--        p.name,
--        ST_X(p.location::geometry) AS lon,
--        ST_Y(p.location::geometry) AS lat,
--        p.location
--    FROM points p, tile_bounds
--    WHERE ST_Intersects(p.location, tile_bounds.bbox)
-- )
-- SELECT
--    name,
--    lon,
--    lat,
--    ST_AsText(location) AS point_wkt,
--    ST_AsText(tile_bounds.bbox) AS tile_bbox_wkt
-- FROM intersecting_points, tile_bounds;

-- DELETE FROM points *;
