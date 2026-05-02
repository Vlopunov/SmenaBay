/**
 * Expo config plugin: copies android-assets/adi-registration.properties into
 * the compiled Android APK's assets folder so Google ADI package name
 * registration can verify ownership.
 *
 * Google Play's package-name registration flow requires the APK to contain
 * a file at `assets/adi-registration.properties` signed with the keystore
 * whose SHA-256 fingerprint matches the one Google displays.
 */
const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const withAdiRegistration = (config) => {
  return withDangerousMod(config, [
    "android",
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const platformRoot = cfg.modRequest.platformProjectRoot;
      const source = path.join(projectRoot, "android-assets", "adi-registration.properties");
      const targetDir = path.join(platformRoot, "app", "src", "main", "assets");
      const target = path.join(targetDir, "adi-registration.properties");

      if (!fs.existsSync(source)) {
        throw new Error(
          `[with-adi-registration] source file not found: ${source}`
        );
      }

      fs.mkdirSync(targetDir, { recursive: true });
      fs.copyFileSync(source, target);
      // eslint-disable-next-line no-console
      console.log(
        `[with-adi-registration] copied adi-registration.properties → ${target}`
      );
      return cfg;
    },
  ]);
};

module.exports = withAdiRegistration;
