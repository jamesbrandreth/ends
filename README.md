# Ends
Ends is a mapping project aimed at finding out what locals actually call places in London.

The names on maps are often a bit prescriptive - sometimes set by local government, property developers, or mapping organisations. But those names are often not the names used in real life. In London, places often move (take Holborn for eexample), and tube station names are often used as place names.

I was inspired by the [New York Times's map of New York Neighbourhoods](https://www.nytimes.com/interactive/2023/upshot/extremely-detailed-nyc-neighborhood-map.html) to try to collect the names as used by locals in real life.

## The Data
Ends stores points, labelled with a place name. Although these points are stored, they are not made available on the map (displaying the points themselves seems a little too identifiable).

The map displays a grid of regular 125m squares based on the OS nantional grid, where each square is coloured based on how many points within it have a given place name.

## The Code
I've tried to keep this program as simple as possible. The frontend is react, and the backend is in Rust, using [axum](https://github.com/tokio-rs/axum). The `build` directory of the frontend app is included in the server binary, and the server serves the frontend as well as the API.

The database is a Postgres DB using PostGIS.

## Contributing
I'm anything but an expert web developer - so contributions are very welcome! I'll try to look at any PRs. I'd especially like to make the database/api a bit more efficient.

If you have an idea to expand the scope of the project - open an issue or tweet (bsky/𝕏) at me.

## Running Ends
Requirements:
- Rust & Cargo
- npm
- postgres
- postgis

Run `src/scripts/initialise-db.sh` then `src/scripts/create-db.sh` to make the postgres cluster and the ends database.

The commands to run Ends are found in `mprocs.yaml` - see [mrpocs](https://github.com/pvolok/mprocs) to run these together automatically.
