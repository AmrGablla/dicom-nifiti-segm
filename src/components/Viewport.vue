<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  RenderingEngine,
  Enums,
  volumeLoader,
  imageLoader,
  setVolumesForViewports,
  cornerstoneStreamingImageVolumeLoader,
} from "@cornerstonejs/core";
import { init as csRenderInit } from "@cornerstonejs/core";
import * as cornerstone from "@cornerstonejs/core";
import { init as csToolsInit } from "@cornerstonejs/tools";
import * as cornerstoneTools from "@cornerstonejs/tools";
import * as cornerstoneAdapters from "@cornerstonejs/adapters";
import { prefetchMetadataInformation } from "../helpers/convertMultiframeImageIds.js";
import {
  Enums as NiftiEnums,
  cornerstoneNiftiImageLoader,
  createNiftiImageIdsAndCacheMetadata,
} from '@cornerstonejs/nifti-volume-loader';

const { MouseBindings } = cornerstoneTools.Enums;
import { init as dicomImageLoaderInit } from "@cornerstonejs/dicom-image-loader";
import cornerstoneDICOMImageLoader from "@cornerstonejs/dicom-image-loader";
import * as nifti from 'nifti-reader-js';
import { fillVolumeLabelmapWithMockData } from './fillVolumeLabelmap.js';

import {
  // init as cornerstoneToolsInit,
  // ToolGroupManager,
  Enums as csToolsEnums,
  // addTool,
  // BidirectionalTool,
  // BrushTool,
  segmentation,
} from '@cornerstonejs/tools';

const {
    Enums: csEnums,
    cache,
    eventTarget,
    imageLoader,
    metaData,
    utilities: csUtilities
} = cornerstone;
const {
    // Enums: csToolsEnums,
    ToolGroupManager,
    segmentation: csToolsSegmentation,
    utilities: csToolsUtilities
} = cornerstoneTools;
const { adaptersSEG, helpers } = cornerstoneAdapters;
const { Cornerstone3D } = adaptersSEG;

let imageIds: string[] = [];


volumeLoader.registerUnknownVolumeLoader(cornerstoneStreamingImageVolumeLoader);

const elementRef = ref<HTMLDivElement | null>(null);
const running = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const loadNifti = ref<HTMLInputElement | null>(null);


const volumeId = "cornerstoneStreamingImageVolume:CT_VOLUME_ID";

const segmentationId = 'MY_SEGMENTATION_ID';

const volumeLoaderScheme = 'cornerstoneStreamingImageVolume'; // Loader id which defines which volume loader to use
// NIfTI mask URL
const niftiMaskURL = 'https://aigeneralassets.s3.us-east-1.amazonaws.com/brainMask/HGE_004_int16.nii?response-content-disposition=inline&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEJP%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIFQLMjomwLPPUcI%2BR4byBiS70sMXIE9KdbJxkpwCh96VAiBUCY3bIUxoBbCjb5JzDmmZ4tTuGhNHcFbWWQ5O0lsa6SrtAwiM%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAMaDDM5OTc3NjMxOTQ5NSIM9R8hSM6vYivpgrNFKsEDwvdbGRVFcACDAqtrveT1CT5fYgVRxmAs3u50jkdh4%2BtbgBUzXWN%2Fmo5Q5PTP4SMqzE6h7FCeesMsJVCLI%2BSttf1Os40rdnszYMNoVRvR%2FYYIQxlCgR%2BdkvjN8eoMGHVkrqWvzIdUnSCO32opFK6rZps%2Fsfp3V2qTIWzTB4QP2NcdAeqN4zsY4viTlrA72gTaXjrNCRK0thjkNOFolNSnXu7igY9%2Bb9GABYy8qQVnir94Xk11bMUmbaQsPAYQ6UYlan4KieMwWkXwkOrNJ4o1I%2F87pusOmc1sbg2qu0S9PavFRyuz0P4qyN2ruhxS%2F6%2BWMBZInGSDoqvswZ7ae2pSVUJYYTG%2FlkHT9Eqw%2BojmhdvGhmdcZ7xH2NEJXu0wOj2gIRlawb64NOppQ2zRE0rKvQaHlfGsNhKlCof8ZDiqB4ZyBtDSiA8q7RqLAqNp4Lg7fPU3Ov%2B0%2BWIJsiq5EWid%2FlyjzGQV0aLVEMpqgVAFvFXkjfTSaDkmJWsO%2Fspj51dcizixZ2I9ay8n8PH1UgeHIRw4BHeRLwUCqsu5cDi8N120PIe8to%2FhOWEBkYOq4zZwE8OWnhd6BYAcY2pvgbCfltcwqLWzvAY65QLE1ASDmkAsh%2B50763K4VszAdnLEDMmtOLLOGPuprSJH8VNXMh1HnKYD30V0otR7U04XA4W7Si%2Bn0wKMOcrn2cUPNpDNZzSwDXFCrx%2Fo3uFVVS95XZW7B0VmiUwfHslIEyVw2MYZVvxpQk%2FyJnWYNEoqhaRXrAD%2BFtkj%2FT4UTNtVJvjVPaoH7dk87CIR96L3PWMLGiokQMvMNMEQY7HGo64UM9VvTmcrxXbG%2Fey0tu6AJutbXRO09Ehr5mIExZyZbrNYfKwJ8noTCMaRnVT8f40ZPhMcr5BdjlUcC8exfyEQ1HXnUs5fYqmluYExqND3RPJ3lt%2FappLYvNPuHk6ReRsHnKE5KCDKLbb%2BxOEoi0A7%2BE%2FBsnI1PaGiL2LAGCvRTgQni57LlDxKQAjYI33oZXhKmpdfhigm9bjgj0pgG2IfjBgJtux0v6hIM3%2FWQAc7PuomfQ1rePPjJhfZwyZVBNY5aS8Q4Y%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAV2FEGRAD5KQOFWEE%2F20250119%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250119T105900Z&X-Amz-Expires=43200&X-Amz-SignedHeaders=host&X-Amz-Signature=be520981cd019c5a0c94d9990cee0c59629c011490fdbe6166c4fbfcb055f46d'

const niftiVolumeId = `${volumeLoaderScheme}:${niftiMaskURL}`;


async function setup() {
  if (running.value) {
    return;
  }
  running.value = true;

  imageLoader.registerImageLoader('nifti', cornerstoneNiftiImageLoader);

  await csRenderInit();
  await csToolsInit();
  dicomImageLoaderInit({ maxWebWorkers: 1 });

  cornerstoneTools.addTool(cornerstoneTools.StackScrollTool);
  const toolGroup = cornerstoneTools.ToolGroupManager.createToolGroup("toolGroupId");
  toolGroup.addTool(cornerstoneTools.StackScrollTool.toolName);
  toolGroup.setToolActive(cornerstoneTools.StackScrollTool.toolName, {
  bindings: [{ mouseButton: MouseBindings.Wheel }],
});

  const renderingEngineId = "myRenderingEngine";
  const renderingEngine = new RenderingEngine(renderingEngineId);
  
  const viewportId = "CT_ORTHOGRAPHIC";

  const viewportInputArray = [{
    viewportId,
    type: Enums.ViewportType.ORTHOGRAPHIC,
    element: elementRef.value,
    defaultOptions: {
      orientation: Enums.OrientationAxis.AXIAL,
    },
  }];
  renderingEngine.setViewports(viewportInputArray);
  toolGroup.addViewport(viewportId, renderingEngineId);

  async function loadAndViewNiftiMask() {
    console.log("Loading NIfTI mask...");

    // Create and cache the volume for rendering
    const niftiImageIds = await createNiftiImageIdsAndCacheMetadata({ url: niftiMaskURL });
    const niftiVolume = await volumeLoader.createAndCacheVolume(niftiVolumeId, {
      imageIds: niftiImageIds,
    });

    // Explicitly create a derived labelmap volume
    
    await volumeLoader.createAndCacheDerivedLabelmapVolume(niftiVolumeId, {
      volumeId: segmentationId,
    });
    console.log("NIfTI mask loaded and displayed successfully.");

console.log(niftiVolume,"niftiVolume");

      
    async function fetchNiftiAndExtractPixelData(niftiMaskURL) {
        try {
          // Fetch the NIfTI file as an ArrayBuffer
          const response = await fetch(niftiMaskURL);
          if (!response.ok) {
            throw new Error(`Failed to fetch NIfTI file: ${response.statusText}`);
          }
          const arrayBuffer = await response.arrayBuffer();
      

          if (!nifti || !nifti.isNIFTI) {
            throw new Error('nifti.isNIFTI is not available. Check the library import.');
          }
      
          if (!nifti.isNIFTI(arrayBuffer)) {
            throw new Error('The provided file is not a valid NIfTI file.');
          }
          const niftiHeader = nifti.readHeader(arrayBuffer);
          const niftiImage = nifti.readImage(niftiHeader, arrayBuffer);
      
      
          // Access pixel data
          const pixelData = new Uint16Array(niftiImage);
      
          console.log('NIfTI Header:', niftiHeader);
          console.log('Pixel Data:', pixelData);
      
          return pixelData;
        } catch (error) {
          console.error('Error fetching or processing NIfTI file:', error);
          return null;
        }
      }
    // Start loading the volume
    niftiVolume.load();


    // Fetch the NIfTI file and extract pixel data
    const pixelData = await fetchNiftiAndExtractPixelData(niftiMaskURL);

    if (!pixelData) {
      throw new Error("Failed to extract pixel data from NIfTI file.");
    }

    // Log for debugging
    console.log("NIfTI Volume (loaded):", niftiVolume);
    console.log("Pixel Data:", pixelData);

    // Call the fill function after the volume is loaded
    fillVolumeLabelmapWithMockData({
      volumeId: segmentationId,
      niftivolumeId: pixelData,
      cornerstone,
    });
    
  // Add the segmentations to state
  segmentation.addSegmentations([
    {
      segmentationId,
      representation: {
        type: csToolsEnums.SegmentationRepresentations.Labelmap,
        data: {
          volumeId: segmentationId,
        },
      },
    },
  ]);

  // Add segmentation to viewports
  await segmentation.addLabelmapRepresentationToViewportMap({
    [viewportId]: [{ segmentationId }]
  });
  // Render all viewports
  renderingEngine.renderViewport(viewportId);



  // Set up event listener for segmentation rendering
  cornerstone.eventTarget.addEventListener(
    csToolsEnums.Events.SEGMENTATION_RENDERED,
    (evt) => {
      console.log('Segmentation rendered:', evt);
    }
  );
  const segmentationVolume = cornerstone.cache.getVolume(niftiVolumeId);
  console.log("segmentationVolume",segmentationVolume)
  // const segmentationVolume2 = cornerstone.cache.getVolume(niftiVolumeId);
  // console.log("segmentationVolume2",segmentationVolume2)
    // Trigger segmentation modification event
    segmentation.triggerSegmentationEvents.triggerSegmentationDataModified(
      segmentationId
    );

    console.log("finished")
};

  // Load and view DICOM images
  async function loadAndViewImages(files: FileList) {
    // const imageIds: string[] = [];
    for (const file of files) {
      const imageId = cornerstoneDICOMImageLoader.wadouri.fileManager.add(file);
      imageIds.push(imageId);
    }
    await prefetchMetadataInformation(imageIds);
    const volume = await volumeLoader.createAndCacheVolume(volumeId, {
      imageIds: imageIds,
    });
    volume.load();
    setVolumesForViewports(renderingEngine,
     [{ volumeId: volumeId }], 
    viewportInputArray.map((v) => v.viewportId)
  );
  renderingEngine.render();
    // renderingEngine.renderViewport(viewportId);    
  }

  // Handle file change for DICOM images
  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      loadAndViewImages(target.files);
    }
  }

  // Set up file change listener for DICOM
  fileInputRef.value?.addEventListener("change", handleFileChange);
  loadNifti.value?.addEventListener("click", loadAndViewNiftiMask);


  toolGroup.addViewport(viewportId, renderingEngineId);

  // Load NIfTI mask after setup
};

onMounted(() => {
  setup();
});
</script>

<template>
  <div>
    <input type="file" ref="fileInputRef" accept=".dcm" multiple />
    <button @click="loadAndViewNiftiMask" ref="loadNifti">Load NIfTI Mask</button>
    <div
      ref="elementRef"
      style="width: 512px; height: 512px; background-color: #000"
    ></div>
  </div>
</template>