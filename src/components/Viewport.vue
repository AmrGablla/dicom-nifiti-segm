<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  RenderingEngine,
  Enums,
  type Types,
  volumeLoader,
  cornerstoneStreamingImageVolumeLoader,
} from '@cornerstonejs/core';
import { init as csRenderInit } from '@cornerstonejs/core';
import { init as csToolsInit } from '@cornerstonejs/tools';
import * as cornerstoneTools from "@cornerstonejs/tools";

const { MouseBindings } = cornerstoneTools.Enums;
;
import { init as dicomImageLoaderInit } from '@cornerstonejs/dicom-image-loader';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';

volumeLoader.registerUnknownVolumeLoader(cornerstoneStreamingImageVolumeLoader);

const elementRef = ref<HTMLDivElement | null>(null);
const running = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

async function setup() {
  if (running.value) {
    return;
  }
  running.value = true;

  await csRenderInit();
  await csToolsInit();
  dicomImageLoaderInit({ maxWebWorkers: 1 });

  cornerstoneTools.addTool(cornerstoneTools.StackScrollTool);
  const toolGroup = cornerstoneTools.ToolGroupManager.createToolGroup("toolGroupId");
  toolGroup.addTool(cornerstoneTools.StackScrollTool.toolName);

  toolGroup.setToolActive(cornerstoneTools.StackScrollTool.toolName, {
    bindings: [{ mouseButton: MouseBindings.Wheel }],
  });
  
  const renderingEngineId = 'myRenderingEngine';
  const renderingEngine = new RenderingEngine(renderingEngineId);
  const viewportId = 'CT_STACK';

  const viewportInput = {
    viewportId,
    type: Enums.ViewportType.STACK,
    element: elementRef.value,
    defaultOptions: {
      orientation: Enums.OrientationAxis.SAGITTAL,
    },
  };

  renderingEngine.enableElement(viewportInput);

  const viewport = renderingEngine.getViewport(viewportId);

  function loadAndViewImages(files: FileList) {
    const imageIds: string[] = [];

    for (const file of files) {
      const imageId = cornerstoneDICOMImageLoader.wadouri.fileManager.add(file);
      imageIds.push(imageId);
    }

    // Set the stack on the viewport with multiple imageIds
    viewport.setStack(imageIds).then(() => {
      viewport.render();
    });
  }

  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      loadAndViewImages(target.files);
    }
  }

  fileInputRef.value?.addEventListener('change', handleFileChange);
  toolGroup.addViewport(viewportId, renderingEngineId);
}

onMounted(() => {
  setup();
});
</script>

<template>
  <div>
    <input type="file" ref="fileInputRef" accept=".dcm" multiple />
    <div ref="elementRef" style="width: 512px; height: 512px; background-color: #000"></div>
  </div>
</template>
