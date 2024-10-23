use axum::{response::Html, routing::get, Router};
use include_dir::{include_dir, Dir};
use tower_serve_static::ServeDir;

#[tokio::main]
async fn main() {
    static CLIENT_DIR: Dir<'static> = include_dir!("$CARGO_MANIFEST_DIR/src/ui/build");
    let ui = ServeDir::new(&CLIENT_DIR);

    // build our application with a route
    let app = Router::new().nest_service("/", ui);

    // run it
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000")
        .await
        .unwrap();
    println!("listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}
