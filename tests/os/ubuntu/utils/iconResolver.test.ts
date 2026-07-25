import { describe, it, expect } from 'vitest';
import { getIconForFile, getFolderIconUrl, getSpecialFolderIconUrl } from '../../../../src/os/ubuntu/utils/iconResolver';

describe('Icon Resolver', () => {
  it('returns generic folder icon', () => {
    expect(getFolderIconUrl()).toBe('/ubuntu/icons/folder.png');
  });

  it('returns special folder icons', () => {
    expect(getSpecialFolderIconUrl('home')).toBe('/ubuntu/icons/user-home.png');
    expect(getSpecialFolderIconUrl('desktop')).toBe('/ubuntu/icons/user-desktop.png');
    expect(getSpecialFolderIconUrl('unknown')).toBe('/ubuntu/icons/folder.png');
  });

  it('resolves directories based on name', () => {
    expect(getIconForFile('Documents', true)).toBe('/ubuntu/icons/folder-documents.png');
    expect(getIconForFile('RandomFolder', true)).toBe('/ubuntu/icons/folder.png');
  });

  it('resolves file extensions correctly', () => {
    expect(getIconForFile('image.png', false)).toBe('/ubuntu/icons/image-x-generic.png');
    expect(getIconForFile('video.mp4', false)).toBe('/ubuntu/icons/video-x-generic.png');
    expect(getIconForFile('audio.mp3', false)).toBe('/ubuntu/icons/audio-x-generic.png');
    expect(getIconForFile('doc.pdf', false)).toBe('/ubuntu/icons/application-pdf.png');
    expect(getIconForFile('archive.zip', false)).toBe('/ubuntu/icons/application-x-zip.png');
    expect(getIconForFile('script.js', false)).toBe('/ubuntu/icons/text-x-generic.png');
    expect(getIconForFile('unknown.xyz', false)).toBe('/ubuntu/icons/text-x-generic.png'); // default
  });
});
