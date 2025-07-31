import { Context, Effect, Layer } from "effect";

export interface RendererService {
  readonly draw: (callback: (ctx: CanvasRenderingContext2D) => void) => Effect.Effect<void>;
  readonly clear: () => Effect.Effect<void>;
  readonly getCanvas: () => Effect.Effect<HTMLCanvasElement>;
}

export const RendererService = Context.GenericTag<RendererService>("RendererService");

export const RendererLive = Layer.effect(
  RendererService,
  Effect.gen(function* () {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      yield* Effect.promise(() => new Promise(resolve => {
        document.addEventListener("DOMContentLoaded", resolve);
      }));
    }

    const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
    
    if (!canvas) {
      console.error("Canvas element 'game-canvas' not found in DOM");
      return yield* Effect.fail(new Error("Canvas element not found"));
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return yield* Effect.fail(new Error("Could not get 2D context"));
    }

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;
    
    console.log("Canvas initialized:", canvas.width, "x", canvas.height);

    return RendererService.of({
      draw: (callback) =>
        Effect.sync(() => {
          callback(ctx);
        }),

      clear: () =>
        Effect.sync(() => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }),

      getCanvas: () => Effect.succeed(canvas),
    });
  })
);