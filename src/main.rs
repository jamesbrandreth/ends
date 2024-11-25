use include_dir::{include_dir, Dir};
use tower_serve_static::ServeDir;

use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
    Router,
};
use bytes::Bytes;
use sqlx::PgPool;
use sqlx::{postgres::PgPoolOptions, types::JsonValue};

use serde::{Deserialize, Serialize};

#[tokio::main]
async fn main() {
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool: PgPool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .unwrap();

    static CLIENT_DIR: Dir<'static> = include_dir!("$CARGO_MANIFEST_DIR/src/ui/build");
    let ui = ServeDir::new(&CLIENT_DIR);

    let app = Router::new()
        .nest_service("/", ui)
        .route("/tiles/points/:z/:x/:y", get(tile_points))
        .with_state(pool.clone())
        .route("/squares", get(squares))
        .with_state(pool.clone())
        .route("/add_point", post(add_point))
        .with_state(pool.clone())
        .route("/get_placenames", get(get_placenames))
        .with_state(pool.clone());

    let listener = tokio::net::TcpListener::bind("127.0.0.1:4000")
        .await
        .unwrap();
    println!("listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}

async fn tile_points(
    Path((z, x, y)): Path<(i32, i32, i32)>,
    State(pool): State<PgPool>,
) -> Result<impl IntoResponse, StatusCode> {
    let tile_data: Vec<u8> =
        sqlx::query_scalar!("SELECT get_tile_points($1, $2, $3) as tile", z, x, y)
            .fetch_one(&pool)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
            .expect("DB PROBLEM");

    Ok(TileResponse(tile_data))
}

struct TileResponse(Vec<u8>);

impl IntoResponse for TileResponse {
    fn into_response(self) -> Response {
        let mut res = Response::new(Bytes::from(self.0).into());
        res.headers_mut().insert(
            axum::http::header::CONTENT_TYPE,
            "application/x-protobuf".parse().unwrap(),
        );
        res.headers_mut().insert(
            axum::http::header::ACCESS_CONTROL_ALLOW_ORIGIN,
            "*".parse().unwrap(),
        );
        res
    }
}

#[derive(Serialize, Deserialize)]
struct Point {
    name: String,
    lat: f64,
    lon: f64,
}

async fn add_point(
    State(pool): State<PgPool>,
    Json(point): Json<Point>,
) -> Result<Json<()>, StatusCode> {
    println!("{} {} {}", point.name, point.lat, point.lon);

    sqlx::query("CALL insert_point($1, $2, $3)")
        .bind(point.lon)
        .bind(point.lat)
        .bind(point.name)
        .execute(&pool)
        .await
        .map(|_| Json(()))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn get_placenames(State(pool): State<PgPool>) -> Result<Json<Vec<String>>, StatusCode> {
    let rows: Vec<String> = sqlx::query_scalar::<_, String>(r#"SELECT name FROM places"#)
        .fetch_all(&pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(rows))
}

async fn squares(State(pool): State<PgPool>) -> Result<Json<JsonValue>, (StatusCode, String)> {
    sqlx::query_scalar!("SELECT get_squares_geojson()")
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Database error: {}", e),
            )
        })?
        .ok_or((
            StatusCode::INTERNAL_SERVER_ERROR,
            "No GeoJSON data returned".to_string(),
        ))
        .map(Json)
}
