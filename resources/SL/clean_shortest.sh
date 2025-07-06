#!/bin/bash

BASE_DIR="."  # Since you're already inside SL

if ! command -v ffprobe &> /dev/null; then
    echo "❌ ffprobe not found. Please install ffmpeg (from https://ffmpeg.org/ or via Chocolatey)."
    read -rp "Press ENTER to exit..."
    exit 1
fi

for folder in "$BASE_DIR"/*; do
    if [ -d "$folder" ]; then
        echo "📂 Processing: $folder"

        shortest_file=""
        shortest_duration=999999999

        for video in "$folder"/*.mp4; do
            [ -e "$video" ] || continue
            duration=$(ffprobe -v error -select_streams v:0 -show_entries stream=duration -of csv=p=0 "$video")
            duration=${duration%.*}
            if [[ "$duration" =~ ^[0-9]+$ ]] && [ "$duration" -lt "$shortest_duration" ]; then
                shortest_duration=$duration
                shortest_file="$video"
            fi
        done

        if [ -n "$shortest_file" ]; then
            new_path="$folder/shortest.mp4"

            if [ "$(realpath "$shortest_file")" != "$(realpath "$new_path")" ]; then
                echo "➡️ Renaming: $(basename "$shortest_file") → shortest.mp4"
                mv "$shortest_file" "$new_path"
            fi

            for video in "$folder"/*.mp4; do
                if [ "$(realpath "$video")" != "$(realpath "$new_path")" ]; then
                    echo "🗑 Deleting: $(basename "$video")"
                    rm "$video"
                fi
            done
        fi
    fi
done

echo "✅ All folders processed."
read -rp "Press ENTER to exit..."
