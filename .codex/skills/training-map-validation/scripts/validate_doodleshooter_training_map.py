#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    raise SystemExit(1)


def check_contains(text: str, pattern: str, message: str) -> None:
    if not re.search(pattern, text):
        fail(message)


def check_not_contains(text: str, pattern: str, message: str) -> None:
    if re.search(pattern, text):
        fail(message)


def main() -> int:
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd()
    training = root / 'src' / 'levels' / 'training.js'
    manager = root / 'src' / 'training.js'
    test = root / 'test' / 'training-map-targets.test.mjs'

    for path in (training, manager, test):
        if not path.exists():
            fail(f"missing required file: {path}")

    level_src = training.read_text(encoding='utf-8')
    manager_src = manager.read_text(encoding='utf-8')

    check_contains(level_src, r"L\.trainingTargets\s*=\s*\[", 'training map must declare L.trainingTargets')
    check_not_contains(level_src, r"SphereGeometry", 'training map should not contain floating sphere decorations')
    check_not_contains(level_src, r"ring\(x, y \+ 4, z, 'y'\)", 'moving target lane should not keep floating grapple rings')
    check_not_contains(level_src, r"for \(const \[x, y, z, w, d\] of \[\[24, 1\.8, -26", 'moving target lane should not keep floating platform loop')
    check_contains(level_src, r"doubleSided:\s*true", 'ring targets must be explicitly double-sided')
    check_contains(level_src, r"\[1, 5, 4, 7\.2\]", 'second-floor south wall should have a door opening')
    check_contains(level_src, r"\[2, 6, 4, 7\.2\]", 'upper stair arrival should have a door opening')
    check_contains(level_src, r"slab\(-9, -12, 13, 12, 4, 0\.4\)", 'second floor should stay solid because the lower stair is outside')
    check_not_contains(level_src, r"slab\(-9, -12, 13, 12, 8, 0\.4\)", 'roof floor should not be a solid slab without a stair opening')
    check_contains(level_src, r"floorWithOpening\(-9, -12, 13, 12, 8, 0\.4, \[1\.5, -9\.4, 11\.5, -6\.6\]\)", 'roof floor should leave an opening for the upper stair')
    check_not_contains(level_src, r"stairs\(-7, 0, (0|1[34]), '\+x'", 'lower stair should not be inside the house or block the back doorway')
    check_contains(level_src, r"wallZ\(-12, 12, 13, 0, 8, 0\.4, \[\[-8, -4, 4\.8, 6\.6\], \[1, 5, 4\.8, 6\.6\], \[6, 10, 4, 7\.2\]\]\)", 'east wall should have a second-floor doorway for the outside stair')
    check_contains(level_src, r"slab\(13, 6, 17, 10, 4, 0\.4", 'lower outside stair should connect to a supported second-floor landing')
    check_contains(level_src, r"box\(16, 0, 7, 0\.5, 4, 0\.5", 'lower outside stair landing support A must reach the ground')
    check_contains(level_src, r"box\(16, 0, 9, 0\.5, 4, 0\.5", 'lower outside stair landing support B must reach the ground')
    check_not_contains(level_src, r"stairs\(24, 0, 8, '-x'", 'lower outside stair should not cut across the right-side training space')
    check_contains(level_src, r"stairs\(15, 0, -3, '\+z', 18, 2\.2, \{ rise: 4 / 18, run: 0\.5 \}\)", 'lower outside stair should run along the east wall')
    check_not_contains(level_src, r"stairs\(11, 4, -14, '-x'", 'upper stair should not start outside the training house')
    check_contains(level_src, r"stairs\(11, 4, -8, '-x', 18, 2\.2, \{ rise: 4 / 18, run: 0\.5 \}\)", 'upper stair should be inside the second-floor slab footprint')
    check_contains(level_src, r"box\(1\.5, 7\.6, -8, 3, 0\.4, 2\.8, \{ ink: INK\.ORANGE \}\)", 'upper stair should have a widened landing that closes with the roof floor')
    check_contains(level_src, r"wallZ\(-10, 10, 2, 0, 4, 0\.35, \[\[-2, 2, 0, 3\.2\]\]", 'training house should have an interior divider wall with a door opening')
    check_contains(level_src, r"slab\(2, 18, 14, 30, 4, 0\.4", 'training house should have a supported grapple practice platform behind it')
    for x, z in ((3, 19), (13, 19), (3, 29), (13, 29)):
        check_contains(level_src, rf"box\({x}, 0, {z}, 0\.5, 4, 0\.5", f'grapple platform support must reach the ground: {x},{z}')
    check_not_contains(level_src, r"stairs\(10, 0, 9, '\+z'", 'grapple platform stairs should not enter from the training house back wall')
    check_contains(level_src, r"slab\(14, 22, 17, 26, 4, 0\.4", 'grapple platform should have a supported side landing for stairs')
    check_contains(level_src, r"box\(16, 0, 23, 0\.5, 4, 0\.5", 'grapple platform side landing support A must reach the ground')
    check_contains(level_src, r"box\(16, 0, 25, 0\.5, 4, 0\.5", 'grapple platform side landing support B must reach the ground')
    check_contains(level_src, r"stairs\(25, 0, 24, '-x', 18, 2\.2, \{ rise: 4 / 18, run: 0\.5 \}\)", 'grapple platform stairs should enter from outside the building wall')
    check_contains(level_src, r"rail\(2, 18, 14, 18, 4\)", 'grapple platform front rail should be closed when stairs enter from the side')
    check_contains(level_src, r"ring\(8, 7, 24, 'y'\)", 'grapple practice ring should be part of the supported platform route')

    dummy_count = len(re.findall(r"type:\s*'dummy'", level_src))
    if dummy_count < 5:
        fail(f'training house should have at least 5 dummy targets, found {dummy_count}')
    check_not_contains(level_src, r"pos:\s*\[-2, 0, 13\.2\]", 'doorway dummy should not be inside the front stair footprint')
    check_not_contains(level_src, r"pos:\s*\[13\.4, 4\.2, 2\]", 'window dummy should not hang outside the east wall')
    check_contains(level_src, r"name:\s*'窗口假人', pos:\s*\[12, 4\.2, 2\]", 'window dummy should stand inside the second-floor room')

    check_contains(manager_src, r"const RING_FACE_OFFSET\s*=\s*0\.08", 'ring faces need a clear front/back offset')
    check_contains(manager_src, r"for \(const side of \[1, -1\]\)", 'ring target geometry should generate front and back faces')
    check_contains(manager_src, r"target\.group\.visible\s*=\s*false", 'dead targets should hide before respawn')
    check_not_contains(manager_src, r"rotation\.z\s*=\s*Math\.min", 'dead target behavior should not rely on support rotation')

    print('OK: doodleshooter training map validation passed')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
