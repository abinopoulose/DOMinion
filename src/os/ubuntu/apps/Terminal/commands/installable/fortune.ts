import { CommandHandler } from '../types';

const quotes = [
  "A bug in the hand is better than one as yet undetected.",
  "Any given program, when running, is obsolete.",
  "If debugging is the process of removing software bugs, then programming must be the process of putting them in.",
  "Measuring programming progress by lines of code is like measuring airplane building progress by weight.",
  "Nine people can't make a baby in a month.",
  "The best way to get a project done faster is to start sooner.",
  "There are two ways to write error-free programs; only the third one works.",
  "To err is human, but to really foul things up you need a computer.",
  "Weeks of coding can save you hours of planning.",
  "It works on my machine.",
  "I have not failed. I've just found 10,000 ways that won't work.",
  "Talk is cheap. Show me the code.",
  "Software and cathedrals are much the same - first we build them, then we pray."
];

export const fortune: CommandHandler = (args, env, streams) => {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  streams.stdout.writeLine(quote);
  return 0;
};
