export const useImageURL = (url: string): HTMLImageElement => {
  const img = new Image();
  img.src = url;
  return img;
};
