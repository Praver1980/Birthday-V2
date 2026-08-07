#!/usr/bin/env python3
"""Create square, face-focused images for the birthday memory cube.

The script finds face encodings with ``face_recognition``, selects the person
appearing in the most input images (or the person in --reference), and writes
consistent 1200 × 1200 crops. Files without that person are skipped rather
than silently putting a different face in the cube.
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

import face_recognition
import numpy as np
from PIL import Image, ImageOps

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MATCH_DISTANCE = 0.50
OUTPUT_SIZE = 1200


def load_faces(path: Path) -> list[tuple[np.ndarray, tuple[int, int, int, int]]]:
    image = face_recognition.load_image_file(path)
    locations = face_recognition.face_locations(image, model="hog")
    return list(zip(face_recognition.face_encodings(image, locations), locations))


def largest_face(faces):
    return max(faces, key=lambda item: (item[1][2] - item[1][0]) * (item[1][1] - item[1][3]))


def choose_identity(faces_by_file, reference: Path | None) -> np.ndarray:
    if reference:
        reference_faces = faces_by_file.get(reference, [])
        if not reference_faces:
            raise ValueError(f"No face found in reference image: {reference}")
        return largest_face(reference_faces)[0]
    candidates = [encoding for faces in faces_by_file.values() for encoding, _ in faces]
    if not candidates:
        raise ValueError("No faces were found in the supplied images.")
    best_candidate, best_score = candidates[0], (-1, float("-inf"))
    for candidate in candidates:
        distances = []
        for faces in faces_by_file.values():
            nearest = min((face_recognition.face_distance([candidate], encoding)[0] for encoding, _ in faces), default=float("inf"))
            if nearest <= MATCH_DISTANCE:
                distances.append(nearest)
        score = (len(distances), -float(np.mean(distances))) if distances else (0, float("-inf"))
        if score > best_score:
            best_candidate, best_score = candidate, score
    return best_candidate


def face_for_identity(faces, identity):
    matches = [(face_recognition.face_distance([identity], encoding)[0], location) for encoding, location in faces]
    distance, location = min(matches, default=(float("inf"), None), key=lambda item: item[0])
    return location if distance <= MATCH_DISTANCE else None


def make_focus_crop(source: Path, location, destination: Path) -> None:
    top, right, bottom, left = location
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")
    width, height = image.size
    face_width, face_height = right - left, bottom - top
    # Keep generous headroom: detectors often stop at the forehead.
    crop_side = min(max(max(face_width, face_height) / 0.32, min(width, height) * 0.42), min(width, height))
    center_x = (left + right) / 2
    center_y = (top + bottom) / 2 + face_height * 0.18
    # Keep the square fully inside the original photograph: shift it rather
    # than filling an out-of-bounds edge with a blank-colored strip.
    crop_left = round(max(0, min(width - crop_side, center_x - crop_side / 2)))
    crop_top = round(max(0, min(height - crop_side, center_y - crop_side / 2)))
    crop_right, crop_bottom = crop_left + round(crop_side), crop_top + round(crop_side)
    crop = image.crop((crop_left, crop_top, crop_right, crop_bottom)).resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.Resampling.LANCZOS)
    destination.parent.mkdir(parents=True, exist_ok=True)
    crop.save(destination, "JPEG", quality=90, optimize=True, progressive=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="Create consistent, face-focused cube photos.")
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--reference", type=Path, help="Known target-person photo; recommended for group pictures")
    args = parser.parse_args()
    files = [path for path in sorted(args.source.iterdir()) if path.suffix.lower() in IMAGE_EXTENSIONS and args.output not in path.parents]
    if not files:
        print("No supported image files found.", file=sys.stderr)
        return 2
    faces_by_file = {path: load_faces(path) for path in files}
    identity = choose_identity(faces_by_file, args.reference)
    processed = skipped = 0
    for source in files:
        location = face_for_identity(faces_by_file[source], identity)
        if location is None:
            print(f"SKIPPED (target face not found): {source.name}")
            skipped += 1
            continue
        destination = args.output / f"{source.stem}.jpg"
        make_focus_crop(source, location, destination)
        print(f"CREATED: {destination}")
        processed += 1
    print(f"Finished: {processed} face-focused image(s), {skipped} skipped.")
    return 0 if processed else 1


if __name__ == "__main__":
    raise SystemExit(main())
