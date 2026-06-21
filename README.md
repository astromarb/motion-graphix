# Motion Graphix

Static prototype of a motion graphics editor inspired by creator-built motion tooling and the existing Narwhal/cosmic design language.

## Run Locally

Open `motion-lab.html` directly in a browser, or serve the folder:

```bash
python -m http.server 4173 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:4173/motion-lab.html`.

## Test

```bash
npm test
```

## Deploy

This is a static site. Vercel can deploy it without a build step. `vercel.json` rewrites `/` to `/motion-lab.html`.
