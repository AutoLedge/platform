 # Backend

This project uses [uv](https://docs.astral.sh/uv/) to manage its Python environment and dependencies. The `backend` script is defined in `pyproject.toml`.

## Install uv with Scoop

Install [Scoop](https://scoop.sh/) if it is not already available, then run this in PowerShell:

```powershell
scoop install uv
```

Verify the installation:

```powershell
uv --version
```

## Python version

The required Python version is specified in the `.python-version` file. `uv` reads this file and will download and install that version automatically when needed while running project commands. To install it explicitly beforehand, run:

```powershell
uv python install
```

## Run the backend

From this directory, run the project script with:

```powershell
uv run backend
```

`uv run` creates or updates the project environment and installs the dependencies declared by the project as needed before running the `backend` script.
