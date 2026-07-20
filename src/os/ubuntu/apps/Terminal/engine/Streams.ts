type StreamListener = (data: string) => void;

export class StandardStream {
  private listeners: Set<StreamListener> = new Set();
  private isTTY: boolean;

  private buffer: string = '';

  constructor(isTTY = false) {
    this.isTTY = isTTY;
  }

  write(data: string) {
    this.appendToBuffer(data);
    for (const listener of this.listeners) {
      listener(data);
    }
  }

  writeLine(data: string) {
    this.write(data + (this.isTTY ? '\r\n' : '\n'));
  }

  appendToBuffer(data: string) {
    this.buffer += data;
  }

  readAll(): string {
    return this.buffer;
  }

  readLines(): string[] {
    return this.buffer.split('\n').filter(l => l.length > 0);
  }

  onData(listener: StreamListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  clearListeners() {
    this.listeners.clear();
  }
}

export interface StandardStreams {
  stdin: StandardStream;
  stdout: StandardStream;
  stderr: StandardStream;
}
