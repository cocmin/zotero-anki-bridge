"""Build the installable plugin and editable source archive, using stdlib only."""
from pathlib import Path
import argparse
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parent


def write_archive(target, files, base, extras=None):
    with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for source in sorted(files):
            info = zipfile.ZipInfo(source.relative_to(base).as_posix(), (2026, 10, 5, 12, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, source.read_bytes())
        for name, source in (extras or {}).items():
            info = zipfile.ZipInfo(name, (2026, 10, 5, 12, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, source.read_bytes())
    with zipfile.ZipFile(target) as archive:
        assert archive.testzip() is None, f"Corrupt archive: {target}"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "dist")
    args = parser.parse_args()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((ROOT / "addon" / "manifest.json").read_text(encoding="utf-8"))
    version = manifest["version"]
    plugin = output / f"zotero-anki-bridge-v{version}.xpi"
    addon_files = [p for p in (ROOT / "addon").rglob("*") if p.is_file()]
    write_archive(plugin, addon_files, ROOT / "addon", {
        "LICENSE": ROOT / "LICENSE", "NOTICE": ROOT / "NOTICE"})
    source_zip = output / f"zotero-anki-bridge-source-v{version}.zip"
    source_files = addon_files + [p for p in (ROOT / "tests").rglob("*") if p.is_file()]
    source_files += [ROOT / name for name in (
        "README.md", "LICENSE", "NOTICE", "ACKNOWLEDGEMENTS.md", "THIRD_PARTY_NOTICES.md",
        "CHANGELOG.md", "CONTRIBUTING.md", ".gitignore", ".gitattributes",
        "package.json", "build.py", "verify_package.py")]
    for folder in ("docs", "LICENSES", ".github"):
        source_files += [p for p in (ROOT / folder).rglob("*") if p.is_file()]
    write_archive(source_zip, source_files, ROOT)
    result = []
    for artifact in (plugin, source_zip):
        with zipfile.ZipFile(artifact) as archive:
            assert archive.testzip() is None
        result.append({"name": artifact.name, "bytes": artifact.stat().st_size,
                       "sha256": hashlib.sha256(artifact.read_bytes()).hexdigest()})
    checksums = "".join(f"{item['sha256']}  {item['name']}\n" for item in result)
    (output / "SHA256SUMS.txt").write_text(checksums, encoding="utf-8", newline="\n")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
