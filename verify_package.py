"""Validate archives against this checkout, optionally compare a second build."""
from pathlib import Path
import argparse
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parent


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dist", type=Path, default=ROOT / "dist")
    parser.add_argument("--compare", type=Path)
    args = parser.parse_args()
    output = args.dist.resolve()
    manifest = json.loads((ROOT / "addon/manifest.json").read_text(encoding="utf-8"))
    version = manifest["version"]
    metadata = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    assert metadata["version"] == version, "Version mismatch"
    zotero = manifest["applications"]["zotero"]
    for field in ("id", "update_url", "strict_max_version"):
        assert zotero.get(field), f"Missing Zotero field: {field}"
    assert zotero["update_url"].startswith("https:")
    assert zotero["strict_min_version"] == "10.0"
    assert zotero["strict_max_version"] == "10.0.*"

    plugin_name = f"zotero-anki-bridge-v{version}.xpi"
    source_name = f"zotero-anki-bridge-source-v{version}.zip"
    expected = {p.relative_to(ROOT / "addon").as_posix(): p
                for p in (ROOT / "addon").rglob("*") if p.is_file()}
    expected.update({name: ROOT / name for name in ("LICENSE", "NOTICE")})
    with zipfile.ZipFile(output / plugin_name) as archive:
        assert archive.testzip() is None
        assert len(archive.namelist()) == len(set(archive.namelist()))
        assert set(archive.namelist()) == set(expected)
        for name, source in expected.items():
            assert archive.read(name) == source.read_bytes(), name
            assert "\ufffd" not in archive.read(name).decode("utf-8"), name
        assert not any(name.startswith("tests/") for name in archive.namelist())

    required = {"README.md", "LICENSE", "NOTICE", "ACKNOWLEDGEMENTS.md",
                "THIRD_PARTY_NOTICES.md", "LICENSES/MPL-2.0.txt",
                ".github/workflows/ci.yml", "docs/PUBLISHING.md", "docs/VERIFICATION.md",
                "tests/manifest.test.cjs", "tests/fixtures/zotero10-required-manifest.js"}
    with zipfile.ZipFile(output / source_name) as archive:
        assert archive.testzip() is None
        assert required <= set(archive.namelist())
        assert len(archive.namelist()) == len(set(archive.namelist()))
        for name in archive.namelist():
            assert not name.startswith("/") and ".." not in Path(name).parts, name
            assert archive.read(name) == (ROOT / name).read_bytes(), name
            assert "\ufffd" not in archive.read(name).decode("utf-8"), name
        assert not any(name.startswith(("dist/", "dist-check/", ".git/"))
                       for name in archive.namelist())

    actual_lines = []
    for name in (plugin_name, source_name):
        data = (output / name).read_bytes()
        digest = hashlib.sha256(data).hexdigest()
        actual_lines.append(f"{digest}  {name}")
        if args.compare:
            assert data == (args.compare.resolve() / name).read_bytes(), name
    assert (output / "SHA256SUMS.txt").read_text(encoding="utf-8").splitlines() == actual_lines
    print(json.dumps({"archiveIntegrity": "pass", "sourceMatchesPackage": "pass",
                      "licenseAndNotices": "pass", "checksums": "pass",
                      "reproducibleBuild": "pass" if args.compare else "not requested"},
                     indent=2))


if __name__ == "__main__":
    main()
