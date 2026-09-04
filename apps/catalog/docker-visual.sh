#!/usr/bin/env bash
#
# Run the visual regression suite inside the same container CI uses.
#
# This is the whole platform story. A screenshot taken on Windows and one taken
# on Linux are not identical: fonts rasterise differently, and a one or two
# pixel difference appears that is not a change to anything. There are three
# ways out — tolerate a pixel budget, keep one baseline per platform, or make
# every machine the same machine. This is the third, and the only one that lets
# the tolerance stay at zero.
#
# Zero tolerance matters because a budget large enough to absorb the platform
# difference is also large enough to absorb real one-pixel drift, and that
# drift is exactly what visual regression exists to catch.
#
# Usage, from the repository root:
#   pnpm visual          # compare against the baselines
#   pnpm visual:update   # accept the current appearance as correct
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# The leading double slash is not a typo.
#
# Git Bash on Windows rewrites anything that looks like a Unix path into a
# Windows one before the argument reaches Docker, so a plain /work arrives as
# "C:/Program Files/Git/work" and the daemon rejects it. A doubled slash opts
# out of that rewriting, and Docker treats //work and /work as the same
# directory. Harmless on Linux and macOS, where nothing rewrites anything.
CONTAINER_DIR="//work"

# The HOST side of the mount needs a Windows path when Docker Desktop is the
# daemon, and Git Bash reports /c/Users/... instead. cygpath translates it
# where it exists, and is absent everywhere it is not needed.
HOST_DIR="${REPO_ROOT}"
if command -v cygpath >/dev/null 2>&1; then
  HOST_DIR="$(cygpath -w "${REPO_ROOT}")"
fi

# Pinned to the Playwright version in this workspace. An image that drifts from
# the installed browser produces baselines nobody can reproduce.
IMAGE="mcr.microsoft.com/playwright:v1.62.1-noble"

echo "Running visual regression in ${IMAGE}"
echo "Repository: ${HOST_DIR}"

# No -it: that flag needs a real terminal, and this runs from CI and from
# tool-driven shells as often as from a prompt.
docker run --rm \
  -v "${HOST_DIR}:${CONTAINER_DIR}" \
  -w "${CONTAINER_DIR}" \
  --ipc=host \
  -e CI=1 \
  "${IMAGE}" \
  bash -c "
    set -euo pipefail
    corepack enable
    # A store INSIDE the mounted repo would be written as root and then
    # break the host installation, which is exactly what happened once.
    pnpm config set store-dir /tmp/pnpm-store --global
    # --frozen-lockfile, so the container installs exactly what is committed.
    pnpm install --frozen-lockfile
    pnpm --filter blackborne build
    pnpm --filter catalog exec playwright test e2e/visual.spec.ts $*
  "
