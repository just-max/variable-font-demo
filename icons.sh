#!/bin/bash

# adapted from https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs

set -e -u -o pipefail

for w in 16 32 140 192 512; do
  inkscape "$1" --export-width=$w --export-filename="./icon-$w.png"
done

convert ./icon-32.png ./icon-16.png ./favicon.ico
convert icon-140.png -bordercolor transparent -border 20 apple-touch-icon.png

cat <<'EOF'
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="favicon.ico" sizes="any">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
EOF

cat > ./manifest.webmanifest <<'EOF'
{
  "name": "Variable Font Demo",
  "icons": [
    { "src": "icon-192.png", "type": "image/png", "sizes": "192x192" },
    { "src": "icon-512.png", "type": "image/png", "sizes": "512x512" }
  ]
}
EOF
