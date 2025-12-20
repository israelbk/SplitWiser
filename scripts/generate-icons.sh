#!/bin/bash

# Generate PWA icons from source image using macOS sips
# Usage: ./scripts/generate-icons.sh [path/to/source-image.png]

SOURCE_IMAGE="${1:-public/logo-source.png}"
ICONS_DIR="public/icons"

if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "❌ Error: Source image not found at $SOURCE_IMAGE"
    echo ""
    echo "Please save your logo image first:"
    echo "  1. Right-click the image and 'Save Image As...'"
    echo "  2. Save it to: public/logo-source.png"
    echo "  3. Run this script again"
    exit 1
fi

echo "🥑 Generating SplitWiser icons from $SOURCE_IMAGE..."

# Create icons directory
mkdir -p "$ICONS_DIR"

# Function to resize image using sips (macOS built-in)
resize_image() {
    local src="$1"
    local dst="$2"
    local size="$3"
    
    cp "$src" "$dst"
    sips -z "$size" "$size" "$dst" --out "$dst" > /dev/null 2>&1
}

# Generate standard icons
echo "  Creating icon-192.png..."
resize_image "$SOURCE_IMAGE" "$ICONS_DIR/icon-192.png" 192

echo "  Creating icon-512.png..."
resize_image "$SOURCE_IMAGE" "$ICONS_DIR/icon-512.png" 512

echo "  Creating apple-touch-icon.png..."
resize_image "$SOURCE_IMAGE" "$ICONS_DIR/apple-touch-icon.png" 180

# For maskable icons, use the same images (user should provide properly padded versions if needed)
echo "  Creating maskable icons..."
cp "$ICONS_DIR/icon-192.png" "$ICONS_DIR/icon-maskable-192.png"
cp "$ICONS_DIR/icon-512.png" "$ICONS_DIR/icon-maskable-512.png"

# Generate favicon (32x32)
echo "  Creating favicon.ico..."
resize_image "$SOURCE_IMAGE" "public/favicon.png" 32
# Convert to ICO format if possible, otherwise keep as PNG
if command -v convert &> /dev/null; then
    convert "public/favicon.png" "public/favicon.ico"
    rm "public/favicon.png"
else
    # Keep as PNG and rename - browsers accept PNG favicons
    mv "public/favicon.png" "public/favicon.ico"
fi

echo ""
echo "✅ Icons generated successfully!"
echo ""
echo "Generated files:"
ls -la "$ICONS_DIR/"
echo ""
ls -la "public/favicon.ico"
echo ""
echo "🚀 You can now install the app on mobile devices!"
