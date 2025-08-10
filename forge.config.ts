import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: 'assets/icons/icon',
    name: 'PopMartAuto',
    executableName: 'popmart-auto',
    win32metadata: {
      CompanyName: 'Pillrock',
      FileDescription: 'PopMart Auto Restock Application',
      OriginalFilename: 'PopMartAuto.exe',
      ProductName: 'PopMart Auto',
      InternalName: 'PopMartAuto',
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'PopmartAuto',
      authors: 'Pillrock',
      description: 'Auto restock product for PopMart',
      setupIcon: path.resolve(__dirname, 'assets/icons/icon.ico'),
      noMsi: true, // Không tạo file MSI
      setupExe: 'PopMartAuto-Setup.exe',shortcutName: 'PopMart Auto',
	  createDesktopShortcut: true,
	  createStartMenuShortcut: true,
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  hooks: {
    generateAssets: async () => {
      // Đọc .env
      const env = dotenv.config().parsed;

      // Ghi ra file JSON để app có thể dùng ở runtime
      fs.writeFileSync(
        './env.json',
        JSON.stringify(
          {
            githubRepo: env.GITHUB_REPO,
            mailUser: env.MAIL_USER,
            mailPass: env.MAIL_PASS,
          },
          null,
          2
        )
      );
    },
  },
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
