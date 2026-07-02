declare module "mind-ar/dist/mindar-image.prod.js" {
  export class Compiler {
    compileImageTargets(
      images: (HTMLImageElement | HTMLCanvasElement)[],
      onProgress?: (progress: number) => void
    ): Promise<unknown[]>;
    exportData(): Promise<ArrayBuffer>;
  }
}

declare module "mind-ar/dist/mindar-image-three.prod.js" {
  import type { Camera, Group, Scene, WebGLRenderer } from "three";

  export class MindARThree {
    constructor(options: {
      container: HTMLElement;
      imageTargetSrc: string;
      maxTrack?: number;
      filterMinCF?: number;
      filterBeta?: number;
    });
    renderer: WebGLRenderer;
    scene: Scene;
    camera: Camera;
    addAnchor(targetIndex: number): {
      group: Group;
      onTargetFound?: () => void;
      onTargetLost?: () => void;
    };
    start(): Promise<void>;
    stop(): void;
  }
}
