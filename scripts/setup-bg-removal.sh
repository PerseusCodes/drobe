#!/bin/bash
mkdir -p public/bg-removal
cp -r node_modules/@imgly/background-removal/dist/* public/bg-removal/
echo "Background removal assets copied to public/bg-removal/"
