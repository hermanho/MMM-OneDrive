type CommonJsLoad = (uri: string, parent: unknown, isMain: boolean) => unknown;
type CommonJsModule = { _load: CommonJsLoad };

/** Registers a CommonJS require() stub and returns its cleanup function. */
export async function mockCommonJsModule(mockedUri: string, stub: unknown) {
  const { Module } = await import("node:module");
  const commonJsModule = Module as unknown as CommonJsModule;
  const originalLoad = commonJsModule._load;

  commonJsModule._load = (uri, parent, isMain) => (
    uri === mockedUri ? stub : originalLoad(uri, parent, isMain)
  );
}
