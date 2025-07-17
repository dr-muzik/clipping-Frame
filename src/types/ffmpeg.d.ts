declare module "@ffmpeg/ffmpeg" {
  export function createFFmpeg(options?: { log?: boolean }): any;
  export function fetchFile(path: string | File | Blob): Promise<Uint8Array>;
}
