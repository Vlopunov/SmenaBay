/**
 * Expo config plugin: patches the iOS Podfile so all targets build with
 * CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES.
 *
 * Why we need it: @react-native-firebase/app (v22+) ships static-framework
 * pods that #include React-Core headers (RCTBridgeModule.h, RCTConvert.h,
 * RCTEventEmitter.h). When useFrameworks: 'static' is enabled, those
 * headers are non-modular and Xcode treats the include as an error
 * (-Werror,-Wnon-modular-include-in-framework-module). Allowing
 * non-modular includes in framework modules makes the build succeed.
 *
 * Reference: react-native-firebase issues #8222, #8044.
 */
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const POST_INSTALL_HOOK = `
    # ── Allow non-modular includes (required for @react-native-firebase
    #    when used together with useFrameworks: 'static') ────────────
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end
`.trimEnd();

const MARKER = 'CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES';

module.exports = function withNonModularIncludes(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      if (!fs.existsSync(podfile)) {
        // eslint-disable-next-line no-console
        console.warn('[with-non-modular-includes] Podfile not found, skipping');
        return cfg;
      }
      let body = fs.readFileSync(podfile, 'utf8');
      if (body.includes(MARKER)) return cfg; // already patched

      // Inject into existing post_install block, or append a new one.
      if (/post_install do \|installer\|/.test(body)) {
        body = body.replace(
          /post_install do \|installer\|/,
          (match) => `${match}\n${POST_INSTALL_HOOK}\n`
        );
      } else {
        body += `\n\npost_install do |installer|\n${POST_INSTALL_HOOK}\nend\n`;
      }
      fs.writeFileSync(podfile, body);
      // eslint-disable-next-line no-console
      console.log('[with-non-modular-includes] Patched Podfile');
      return cfg;
    },
  ]);
};
