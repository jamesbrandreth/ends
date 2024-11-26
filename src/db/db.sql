CREATE EXTENSION postgis;

CREATE TABLE places (
   name TEXT PRIMARY KEY,
   colour INTEGER,
   unique(name)
);

CREATE TABLE points (
   location GEOMETRY(Point, 4326),
   name TEXT REFERENCES places(name)
);

-- Grid generation query
CREATE OR REPLACE VIEW grid
AS
SELECT
   ST_Transform((ST_Dump(geom)).geom, 4326) AS wgs84_geometry
FROM
   ST_SquareGrid(
       125,
       ST_MakeEnvelope(503000, 155000, 560000, 200000, 27700)
   )
;


CREATE OR REPLACE FUNCTION get_tile_points(z int, x int, y int)
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
   SELECT points.name, to_hex(places.colour) as colour,
          ST_AsMVTGeom(
              ST_Transform(points.location, 3857),  -- Transform to Web Mercator
              ST_Transform(bbox, 3857),        -- Transform bbox to Web Mercator
              4096,   -- Tile extent
              64,     -- Buffer
              true    -- Clip geometry
          ) AS geom
   FROM points LEFT JOIN places ON points.name=places.name
   WHERE ST_Intersects(points.location, ST_Transform(bbox, 4326))
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
   INSERT INTO places (name, colour)
   VALUES (LOWER(placename), (floor(random() * 16777216)::int))
   ON CONFLICT (name) DO NOTHING;

   INSERT INTO points
   VALUES (
           ST_SetSRID(ST_MakePoint(lon, lat), 4326),
           LOWER(placename)
          );
END;

CREATE OR REPLACE FUNCTION get_squares_geojson()
RETURNS jsonb
LANGUAGE sql
AS $$
SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', json_agg(ST_AsGeoJSON(squares.*)::json)
)
FROM (
    SELECT DISTINCT points.name, to_hex(places.colour) as colour, grid.wgs84_geometry
    FROM points LEFT JOIN grid
    ON ST_Contains(grid.wgs84_geometry, points.location)
    JOIN places ON points.name = places.name
)
AS squares
$$;
