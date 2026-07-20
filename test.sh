#!/bin/bash
echo "Testing script"
if [ -z "$1" ]; then
  echo "No arg 1"
else
  echo "Arg 1 is $1"
fi
for i in 1 2 3; do
  echo "Count $i"
done
greet() {
  echo "Hello $1"
}
greet "World"
