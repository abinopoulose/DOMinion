export interface ParsedCommand {
  name: string;
  args: string[];
  raw: string;
}

export interface CommandResult {
  output: string[];
  isError?: boolean;
}
