#!/bin/sh
# Build and publish dist/ to the gh-pages branch (GitHub Pages: Deploy from branch → gh-pages). Run from the project folder.
set -e
npm run build
cd dist && touch .nojekyll && rm -rf .git && git init -q -b gh-pages && git add -A && git commit -q -m "deploy $(date +%F_%H%M)" \
  && git push -f "$(git -C .. remote get-url origin)" gh-pages && rm -rf .git
