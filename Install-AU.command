#!/bin/zsh
set -eu
ROOT="${0:A:h}"
SOURCE="$ROOT/Native/CORTEX 65.component"
if [[ ! -d "$SOURCE" ]]; then
  SOURCE="$ROOT/native/build/Cortex65_artefacts/Release/AU/CORTEX 65.component"
fi
if [[ ! -d "$SOURCE" ]]; then
  print 'The built CORTEX 65.component is missing. See README.md for the build command.'
  exit 1
fi
/usr/bin/codesign --verify --deep --strict "$SOURCE"
DEST="$HOME/Library/Audio/Plug-Ins/Components"
/bin/mkdir -p "$DEST"
if [[ -e "$DEST/CORTEX 65.component" ]]; then
  BACKUP="$HOME/Library/Audio/Plug-Ins/CORTEX-65-Backups/$(date +%Y%m%d-%H%M%S)"
  /bin/mkdir -p "$BACKUP"
  /bin/mv "$DEST/CORTEX 65.component" "$BACKUP/"
fi
/usr/bin/ditto "$SOURCE" "$DEST/CORTEX 65.component"
/usr/bin/codesign --verify --deep --strict "$DEST/CORTEX 65.component"
print 'Installed CORTEX 65. Rescan Audio Units in your DAW if needed.'
