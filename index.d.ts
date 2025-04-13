declare namespace AppConfig {
  type Platform = "android" | "ios" | "android,ios";

  type FileType = "android" | "ios" | "appResource" | "wgt";

  type VersionMode = "custom" | "date" | "auto-increment";

  type AndroidChannel =
    | "google"
    | "yyb"
    | "360"
    | "huawei"
    | "xiaomi"
    | "oppo"
    | "vivo";

  interface PackConfig {
    project?: string;
    platform?: Platform | string;
    iscustom?: boolean;
    safemode?: boolean;
    android?: {
      packagename?: string;
      androidpacktype?: number | string;
      certalias?: string;
      certfile?: string;
      certpassword?: string;
      channels?: AndroidChannel | string;
      [key: string]: any;
    };
    ios?: {
      bundle?: string;
      supporteddevice?: string;
      isprisonbreak?: boolean;
      profile?: string;
      certfile?: string;
      certpassword?: string;
      [key: string]: any;
    };
    isconfusion?: boolean;
    splashads?: boolean;
    rpads?: boolean;
    pushads?: boolean;
    exchange?: boolean;
    [key: string]: any;
  }

  interface ManifestConfig {
    [key: string]: any;
  }

  interface VersionConfig {
    mode?: VersionMode;
    customVersion?: (versionArr: string[]) => string;
  }

  interface Configuration {
    packConfig: () => PackConfig;

    mergeManifestConfig?: () => Partial<ManifestConfig>;

    createEnv?: () => any;

    version?: VersionConfig;
    upload?: (filePath: string, fileType: FileType) => Promise<void>;
  }
}

// declare function defineConfig(info: AppConfig.Configuration): void;

// CommonJS 导出方式
// export = defineConfig;
export = AppConfig.Configuration;
