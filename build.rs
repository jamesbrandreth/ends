use std::process::Command;

fn main() {
    Command::new("npm")
        .args(["--prefix", "src/ui", "run", "build"])
        .output()
        .expect("UI build failed");
}
