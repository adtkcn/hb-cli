declare namespace AppConfig {
  type Platform = "android" | "ios" | "android,ios";

  type VersionMode = "custom" | "date" | "auto-increment";

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
      channels?:  string;
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
  interface AppConfig {
    output?: string;
    create?: () => any;
  }
  interface VersionConfig {
    mode?: VersionMode;
    customVersion?: (versionArr: string[]) => string;
  }

  interface Configuration {
    packConfig: () => PackConfig;

    mergeManifestConfig?: () => Partial<ManifestConfig>;

    appConfig?: AppConfig;

    version?: VersionConfig;
    onPackEnd?: (filePath: string, fileType: string) => Promise<void>;
  }
}

export = AppConfig.Configuration;
