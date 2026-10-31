# Lumina Player

Standalone black-and-gold React player intended to run on its own domain and be embedded in the main Lumina website.

## Run locally
```bash
npm install
npm run dev
```

Root `/` is a player preview using the SABC1 HLS test URL supplied in the conversation.

## Embed routes
- Movie: `/embed/movie/:tmdbId`
- TV episode: `/embed/tv/:tmdbId/:season/:episode`

The current build is a player prototype. It does not scrape or resolve CB Providers sources. Replace the demo source with a backend endpoint that returns streams you are authorized to use.

## Main site iframe
```jsx
<div className="lumina-frame">
  <iframe
    src={`https://YOUR-PLAYER-DOMAIN/embed/movie/${tmdbId}`}
    title="Lumina Player"
    allow="autoplay; fullscreen; picture-in-picture"
    allowFullScreen
  />
</div>
```
```css
.lumina-frame { width:100%; aspect-ratio:16/9; background:#000; overflow:hidden; border-radius:12px; }
.lumina-frame iframe { width:100%; height:100%; border:0; }
```

## Render Static Site
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Add a rewrite rule: `/*` -> `/index.html` (Rewrite), so direct embed URLs load the React app.

## Future API contract
The player can be connected to an authorized stream service returning:
```json
{"title":"Example","sources":[{"label":"1080p","url":"https://media.example/master.m3u8","type":"application/vnd.apple.mpegurl"}]}
```
Do not put private API keys in frontend code.
