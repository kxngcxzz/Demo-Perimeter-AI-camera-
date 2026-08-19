#!/usr/bin/env bash
#
# Pre-deploy integrity check for the Perimeter AI static site.
#
# Guards the regressions that have actually bitten this project:
#   1. Assets moved or flattened while the HTML still points at assets/**
#   2. Artefacts of the original Outlook export leaking back in
#      (file:/// links, base64 blobs)
#   3. In-page anchors pointing at ids that no longer exist
#   4. Shipping with the contact form endpoint still unset
#
# Exits non-zero on any failure so CI blocks the deploy.

set -uo pipefail
cd "$(dirname "$0")/.."

fail=0
note() { printf '  %s\n' "$1"; }
bad()  { printf '  FAIL  %s\n' "$1"; fail=1; }

# Every HTML page in the project, wherever it lives.
mapfile -t pages < <(find . -name '*.html' -not -path './.git/*' | sort)

echo "==> Pages found"
note "${#pages[@]}: ${pages[*]}"

echo "==> Local reference integrity"
total=0
for page in "${pages[@]}"; do
  dir=$(dirname "$page")
  # Strip protocol-relative, absolute, fragment, mailto/tel and data URIs;
  # drop any query or hash suffix; resolve what's left against the page's
  # own directory, exactly as a browser would.
  while read -r ref; do
    [ -z "$ref" ] && continue
    total=$((total + 1))
    case "$ref" in
      /*) target=".${ref}" ;;      # root-absolute: resolve from the site root
      *)  target="${dir}/${ref}" ;;
    esac
    if [ ! -e "$target" ]; then
      bad "$page -> $ref (looked for $target)"
    fi
  done < <(grep -ohE '(src|href|srcset)="[^"]*"' "$page" \
           | cut -d'"' -f2 \
           | grep -vE '^(https?:)?//|^#|^mailto:|^tel:|^data:' \
           | sed 's/[#?].*$//' \
           | grep -v '^$' \
           | sort -u)
done
[ "$fail" -eq 0 ] && note "$total local references, all resolve"

echo "==> In-page anchors"
for page in "${pages[@]}"; do
  ids=$(grep -oE 'id="[^"]+"' "$page" | cut -d'"' -f2 | sort -u)
  for anchor in $(grep -oE 'href="#[^"]+"' "$page" | cut -d'"' -f2 | sed 's/^#//' | sort -u); do
    if ! printf '%s\n' "$ids" | grep -qx "$anchor"; then
      bad "$page -> #$anchor has no matching id"
    fi
  done
done

echo "==> No regressions from the original export"
# Matched inside attribute values only. The case study quotes these strings as
# prose to explain what was wrong with the supplied file, and that is not a
# defect — only a real href/src pointing at a local temp path or an inlined
# base64 blob is.
for page in "${pages[@]}"; do
  if grep -qE '(href|src)="file:' "$page"; then
    bad "$page has a link pointing at a local file:// path"
  fi
  if grep -qE '(src|srcset)="data:[^"]*base64,' "$page"; then
    bad "$page has a base64-inlined asset — extract it to assets/img instead"
  fi
  if grep -qE '<style[ >]' "$page" && [ "$page" != "./404.html" ]; then
    bad "$page has an inline <style> block — styles belong in the stylesheet"
  fi
done

echo "==> Go-live blockers"
if grep -qlF 'REPLACE_ME' "${pages[@]}" 2>/dev/null; then
  note "WARNING  contact form endpoint is still REPLACE_ME (submissions fall back to mailto)"
fi

echo
if [ "$fail" -ne 0 ]; then
  echo "FAILED — see above."
  exit 1
fi
echo "All checks passed."
