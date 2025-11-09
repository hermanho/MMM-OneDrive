declare function createIntervalRunner(render: (() => Promise<unknown>), interval: number): {
    skipToNext: () => void;
    stop: () => void;
    resume: () => void;
    state: () => {
        stopped: boolean;
        running: boolean;
    };
};
type IntervalRunner = ReturnType<typeof createIntervalRunner>;

declare class DiskCaching {
    readonly dir: string;
    readonly cleanupRunner: IntervalRunner;
    readonly fileList: string[];
    constructor(dir: string, interval?: number);
    stop(): void;
    resume(): void;
    private cleanup;
    removeAll(): Promise<void>;
    push(filePath: string): void;
}

export { DiskCaching };
