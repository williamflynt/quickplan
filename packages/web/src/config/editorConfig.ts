import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';

export const SAMPLE_CODE = `# My Project
buy_paint
buy_brush
set_up_easel
buy_paint, buy_brush > set_up_easel > paint_picture
paint_picture ! paint_landscape, paint_foreground
paint_landscape, paint_foreground > %picture_done
@setup_tasks: buy_paint, buy_brush, set_up_easel
@paint_tasks: paint_landscape, paint_foreground
$me > buy_paint, buy_brush, set_up_easel, paint_landscape
$my_helper > paint_foreground
`

export const configureMonacoWorkers = () => {
  useWorkerFactory({
    ignoreMapping: true,
    workerLoaders: {
      editorWorkerService: () => new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' })
    }
  });
};
