"""`uv run dev` and `uv run prod` (see [project.scripts] in pyproject.toml).

Each sets APP_ENV before uvicorn imports the app, so settings load the
matching env file. The script name decides the environment: `uv run dev`
is always development, even if APP_ENV is set in the shell.
"""

import os

import uvicorn


def dev() -> None:
    os.environ["APP_ENV"] = "development"
    uvicorn.run(
        "autoledge.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )


def prod() -> None:
    os.environ["APP_ENV"] = "production"
    uvicorn.run(
        "autoledge.main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8000")),
        reload=False,
    )
