export type AppConfig = {
  nodeEnv: string;
  name: string;
  url: string;
  port: number;
  debug: boolean;
  apiPrefix: string;
  logLevel: string;
  logService: string;
  corsOrigin: boolean | string | RegExp | (string | RegExp)[];
};
