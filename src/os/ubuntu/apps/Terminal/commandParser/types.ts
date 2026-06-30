export interface ParsedCommand {
  name: string;
  args: string[];
  raw: string;
}

export interface CommandResult {
  output: string[];
  isError?: boolean;
}

/**
 * Result of parsing a command's argument tokens into structured
 * flags, key-value options, and positional operands.
 */
export interface ParsedArgs {
  /** Boolean flags, e.g. { r: true, f: true, all: true } */
  flags: Record<string, boolean>;
  /** Key-value options, e.g. { n: "10" } for `head -n 10` */
  options: Record<string, string>;
  /** Non-flag tokens in original order, e.g. ["myfile.txt"] */
  positional: string[];
}
