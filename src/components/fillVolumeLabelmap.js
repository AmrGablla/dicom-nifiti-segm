export function fillVolumeLabelmapWithMockData({
  volumeId: segVolumeId,
  niftivolumeId,
  cornerstone,
}) {
  const segmentationVolume = cornerstone.cache.getVolume(segVolumeId);
  const { voxelManager } = segmentationVolume;

  // Use the pixel data directly instead of getting it from cache
  const pixelData = niftivolumeId;
  console.log(voxelManager)

  if (!pixelData) {
    throw new Error('No pixel data provided from NIfTI file');
  }

  // Iterate through the pixel data and set voxel values
  for (let i = 0; i < pixelData.length; i++) {
    const maskValue = pixelData[i];
    if (maskValue !== 0) {
      voxelManager.setAtIndex(i, maskValue);
      // console.log("changed")
    }
  }
  console.log(voxelManager)
  console.log("changed")
}