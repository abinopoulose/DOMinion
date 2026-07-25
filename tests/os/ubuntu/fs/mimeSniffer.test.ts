import { describe, it, expect } from 'vitest';
import { sniffMimeType } from '../../../../src/os/ubuntu/fs/mimeSniffer';

describe('Mime Sniffer', () => {
  it('identifies PNG', async () => {
    const data = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x00]);
    const blob = new Blob([data]);
    expect(await sniffMimeType(blob)).toBe('image/png');
  });

  it('identifies GIF', async () => {
    const data = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x00]);
    const blob = new Blob([data]);
    expect(await sniffMimeType(blob)).toBe('image/gif');
  });

  it('identifies PDF', async () => {
    const data = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x00]);
    const blob = new Blob([data]);
    expect(await sniffMimeType(blob)).toBe('application/pdf');
  });

  it('identifies JPEG', async () => {
    const data = new Uint8Array([0xFF, 0xD8, 0x00]);
    const blob = new Blob([data]);
    expect(await sniffMimeType(blob)).toBe('image/jpeg');
  });

  it('falls back to blob type', async () => {
    const data = new Uint8Array([0x01, 0x02, 0x03]);
    const blob = new Blob([data], { type: 'text/plain' });
    expect(await sniffMimeType(blob)).toBe('text/plain');
  });

  it('falls back to generic stream if no blob type', async () => {
    const data = new Uint8Array([0x01, 0x02, 0x03]);
    const blob = new Blob([data]);
    expect(await sniffMimeType(blob)).toBe('application/octet-stream');
  });
});
