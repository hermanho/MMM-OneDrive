export type AutoInfoPositionFunction = boolean | ((album: string, target: string) => (number | string)[]) | null;
export type Config = {
  albums: (string | RegExp)[];
  updateInterval: number;
  sort: 'new' | 'old' | 'random';
  condition: {
    fromDate: string | null;
    toDate: string | null;
    minWidth: number | null;
    maxWidth: number | null;
    minHeight: number | null;
    maxHeight: number | null;
    minWHRatio: number | null;
    maxWHRatio: number | null;
  };
  showWidth: number;
  showHeight: number;
  timeFormat: string;
  forceAuthInteractive: boolean;
  autoInfoPosition: boolean | ((album: string, target: string) => [number | string]) | null;
};

export type ConfigTransformed = Omit<Config, "albums"> & {
  albums: (string | {
    source: string,
    flags: string,
  })[];
};
