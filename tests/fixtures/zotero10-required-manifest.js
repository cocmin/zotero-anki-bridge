// Extracted from Zotero 10.0.5's modules/Extension.sys.mjs, parseManifest().
// SPDX-License-Identifier: MPL-2.0
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
// See LICENSES/MPL-2.0.txt and THIRD_PARTY_NOTICES.md for provenance.
// Checks required Zotero properties after WebExtension schema normalization.
    if (this.type == "extension") {
      if (!manifest.applications?.zotero?.id) {
        this.manifestError("applications.zotero.id not provided");
      }
      if (!manifest.applications?.zotero?.update_url) {
        this.manifestError("applications.zotero.update_url not provided");
      }
      if (!manifest.applications?.zotero?.strict_max_version) {
        this.manifestError("applications.zotero.strict_max_version not provided");
      }
    }

