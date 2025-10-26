{
  description = "FastAPI app dev shell (flake + local venv)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          name = "fastapi-dev";
          packages = [
            pkgs.python3
            pkgs.python3Packages.pip
            pkgs.pkg-config
            pkgs.openssl
            pkgs.zlib
            pkgs.sqlite
            pkgs.gcc
          ];

          shellHook = ''
            export PIP_DISABLE_PIP_VERSION_CHECK=1
            export VENV_DIR=".venv"
            if [ ! -d "$VENV_DIR" ]; then
              python -m venv "$VENV_DIR"
            fi
            . "$VENV_DIR/bin/activate"

            if [ -f requirements.txt ]; then
              # install only if not yet done for this hash
              REQ_HASH=$(sha256sum requirements.txt | cut -d" " -f1)
              if [ ! -f "$VENV_DIR/.req-hash" ] || [ "$(cat $VENV_DIR/.req-hash)" != "$REQ_HASH" ]; then
                python -m pip install --upgrade pip wheel
                pip install -r requirements.txt
                echo "$REQ_HASH" > "$VENV_DIR/.req-hash"
              fi
            fi

            : "${ACCOUNTS_DB_PATH:=${PWD}/accounts.db}"
            export ACCOUNTS_DB_PATH

            echo "venv active. Run: uvicorn app:app --reload --port 8001"
            echo "SQLite DB: $ACCOUNTS_DB_PATH"
          '';
        };
      });
}
